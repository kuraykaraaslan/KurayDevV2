import redis from '@/libs/redis'
import { AIService } from '@/services/AIServices'
import Logger from '@/libs/logger'
import ChatbotMessages from '@/messages/ChatbotMessages'
import wsManager from '@/libs/websocket/WSManager'
import { StoredChatMessage, StoredChatSession, ChatbotSource } from '@/dtos/ChatbotDTO'
import { RAGContext } from '@/types/features/ChatbotTypes'
import ChatSessionService from './ChatSessionService'
import ChatbotRAGService from './ChatbotRAGService'
import ChatbotModerationService from './ChatbotModerationService'
import { ACTIVE_SESSIONS, BROWSER_SESSION, SESSION_TTL_SECONDS, ADMIN_TAKEOVER_SENTINEL } from './constants'
import { generateMessageId } from './utils'

export default class ChatbotService {

  private static async _resolveSession({
    chatSessionId,
    userId,
    userEmail,
    browserId,
  }: {
    chatSessionId?: string
    userId: string
    userEmail?: string
    browserId?: string
  }): Promise<StoredChatSession> {
    if (await ChatbotModerationService.isUserBanned(userId)) {
      throw new Error(ChatbotMessages.USER_BANNED)
    }

    if (!(await ChatbotModerationService.checkUserRateLimit(userId))) {
      throw new Error(ChatbotMessages.RATE_LIMIT_EXCEEDED)
    }

    const isGuest = userId.startsWith('guest:')

    let session = chatSessionId
      ? await ChatSessionService.getSession(chatSessionId)
      : undefined

    // Verify ownership for existing session
    if (session && session.userId !== userId) {
      session = undefined
    }

    if (!session && browserId) {
      const browserSessionId = await redis.get(BROWSER_SESSION(browserId))
      if (browserSessionId) {
        const s = await ChatSessionService.getSession(browserSessionId)
        if (s && s.userId === userId && s.status !== 'CLOSED') session = s
        // For guests, also match by browserId
        if (!session && isGuest && s && s.browserId === browserId && s.status !== 'CLOSED') session = s
      }
    }

    if (!session || session.status === 'CLOSED') {
      session = await ChatSessionService.createSession(userId, userEmail, browserId)
    }

    if (browserId && session.chatSessionId) {
      await redis.set(BROWSER_SESSION(browserId), session.chatSessionId, 'EX', SESSION_TTL_SECONDS)
    }

    return session
  }

  private static async _persistUserMessage(
    session: StoredChatSession,
    message: string,
  ): Promise<StoredChatMessage> {
    const userMsg: StoredChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    }
    await ChatSessionService.addMessage(session.chatSessionId, userMsg)

    if (!session.title) {
      session.title = message.slice(0, 80)
      await ChatSessionService.updateSession(session)
    }

    await redis.zadd(ACTIVE_SESSIONS, Date.now(), session.chatSessionId)

    return userMsg
  }

  private static async _buildRagPipeline(
    chatSessionId: string,
    message: string,
    provider: string | undefined,
    model: string | undefined,
    pageContext: string | undefined,
  ): Promise<{ fullPrompt: string; ragContext: RAGContext[] }> {
        const [ragContext, datasetContext, faqContext] = await Promise.all([
            ChatbotRAGService.retrieveContext(message),
            ChatbotRAGService.retrieveDatasetContext(message),
            ChatbotRAGService.retrieveFaqContext(message),
        ])

        const aiProviderForCompression = AIService.getProvider(provider)
        const sessionSummary = await ChatbotRAGService.compressHistory(
            chatSessionId,
            (prompt, model) => aiProviderForCompression.generateText(prompt, model).then((r) => r ?? ''),
            model,
        )
        const latestSession = await ChatSessionService.getSession(chatSessionId)

        const history = await ChatSessionService.getMessages(chatSessionId)
        const mergedContext = [...ragContext]
        for (const doc of datasetContext) {
            mergedContext.push({ postId: doc.id, title: doc.title, slug: '', categorySlug: doc.type, score: doc.score, snippet: doc.text })
        }
        for (const faq of faqContext) {
            mergedContext.push({ postId: faq.id, title: faq.question, slug: '', categorySlug: 'faq', score: faq.score, snippet: `Q: ${faq.question}\nA: ${faq.answer}` })
        }

        const previousMessages = history.slice(0, -1)
        const systemPrompt = await ChatbotRAGService.buildSystemPrompt(mergedContext)
        const activeSummary = sessionSummary ?? latestSession?.summary
        const promptMessages = ChatbotRAGService.buildMessages(
            systemPrompt, previousMessages, message, activeSummary, pageContext
        )

        const fullPrompt = promptMessages
            .map((m) => `${m.role === 'system' ? '[System]' : m.role === 'user' ? '[User]' : '[Assistant]'}: ${m.content}`)
            .join('\n\n')

        return { fullPrompt, ragContext }
    }

  private static async _persistAiMessage(
    chatSessionId: string,
    reply: string,
    ragContext: RAGContext[],
  ): Promise<{ aiMsg: StoredChatMessage; sources: ChatbotSource[] }> {
        const sources: ChatbotSource[] = ragContext.map((ctx) => ({
            postId: ctx.postId,
            title: ctx.title,
            slug: ctx.slug,
            categorySlug: ctx.categorySlug,
            score: ctx.score,
        }))

        const aiMsg: StoredChatMessage = {
            id: generateMessageId(),
            role: 'assistant',
            content: reply,
            sources: sources.length > 0 ? sources : undefined,
            createdAt: new Date().toISOString(),
        }
        await ChatSessionService.addMessage(chatSessionId, aiMsg)

        return { aiMsg, sources }
    }


  static async *chatStream({
    message,
    chatSessionId,
    userId,
    userEmail,
    browserId,
    provider,
    model,
    pageContext,
  }: {
    message: string
    chatSessionId?: string
    userId: string
    userEmail?: string
    browserId?: string
    provider?: string
    model?: string
    pageContext?: string
  }): AsyncGenerator<string, void, unknown> {
    let session: StoredChatSession
    try {
      session = await ChatbotService._resolveSession({ chatSessionId, userId, userEmail, browserId })
    } catch (err) {
      yield `data: ${JSON.stringify({ type: 'error', error: err instanceof Error ? err.message : ChatbotMessages.CHATBOT_RESPONSE_FAILED })}\n\n`
      return
    }

    yield `data: ${JSON.stringify({ type: 'meta', chatSessionId: session.chatSessionId })}\n\n`

    yield `data: ${JSON.stringify({ type: 'typing', role: 'assistant' })}\n\n`

    const userMsg = await ChatbotService._persistUserMessage(session, message)

    wsManager.publish('chatbot', session.chatSessionId, {
      ns: 'chatbot',
      type: 'new_message',
      chatSessionId: session.chatSessionId,
      message: { id: userMsg.id, role: 'user', content: userMsg.content, createdAt: userMsg.createdAt },
    })

    if (session.status === 'TAKEN_OVER') {
      const waitingMsg: StoredChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: ADMIN_TAKEOVER_SENTINEL,
        createdAt: new Date().toISOString(),
      }
      await ChatSessionService.addMessage(session.chatSessionId, waitingMsg)
      yield `data: ${JSON.stringify({ type: 'chunk', content: ADMIN_TAKEOVER_SENTINEL })}\n\n`
      yield `data: ${JSON.stringify({ type: 'done' })}\n\n`
      return
    }

    const { fullPrompt, ragContext } = await ChatbotService._buildRagPipeline(
      session.chatSessionId, message, provider, model, pageContext
    )

    const aiProvider = AIService.getProvider(provider)
    let fullReply = ''

    try {
      for await (const chunk of aiProvider.streamText(fullPrompt, model)) {
        fullReply += chunk
        yield `data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`
      }
    } catch (err) {
      Logger.error(`[ChatbotService] Stream error: ${err}`)
      yield `data: ${JSON.stringify({ type: 'error', error: ChatbotMessages.CHATBOT_RESPONSE_FAILED })}\n\n`
      return
    }

    if (!fullReply) {
      yield `data: ${JSON.stringify({ type: 'error', error: ChatbotMessages.CHATBOT_RESPONSE_FAILED })}\n\n`
      return
    }

    const { aiMsg, sources } = await ChatbotService._persistAiMessage(
      session.chatSessionId, fullReply, ragContext
    )

    wsManager.publish('chatbot', session.chatSessionId, {
      ns: 'chatbot',
      type: 'new_message',
      chatSessionId: session.chatSessionId,
      message: { id: aiMsg.id, role: 'assistant', content: aiMsg.content, sources: aiMsg.sources, createdAt: aiMsg.createdAt },
    })

    if (sources.length > 0) {
      yield `data: ${JSON.stringify({ type: 'sources', sources })}\n\n`
    }
    yield `data: ${JSON.stringify({ type: 'done' })}\n\n`

    Logger.info(`[ChatbotService] Session ${session.chatSessionId}: stream completed (${sources.length} sources)`)
  }
}
