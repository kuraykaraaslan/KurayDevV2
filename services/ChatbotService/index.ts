import redis from '@/libs/redis'
import { AIService } from '@/services/AIServices'
import Logger from '@/libs/logger'
import ChatbotMessages from '@/messages/ChatbotMessages'
import wsManager from '@/libs/websocket/WSManager'
import { StoredChatMessage, ChatbotSource } from '@/dtos/ChatbotDTO'
import { RAGContext } from '@/types/features/ChatbotTypes'
import ChatSessionService from './ChatSessionService'
import ChatbotRAGService from './ChatbotRAGService'
import ChatbotModerationService from './ChatbotModerationService'
import { ACTIVE_SESSIONS, BROWSER_SESSION, SESSION_TTL, ADMIN_TAKEOVER_SENTINEL, makeMessageId } from './constants'

export default class ChatbotService {
    // ── Private helpers ───────────────────────────────────────────────

    /**
     * Steps 4-6: RAG retrieval + history compression + prompt assembly.
     * Shared between chat() and chatStream() to eliminate duplication.
     */
    private static async _buildRagPipeline(
        chatSessionId: string,
        message: string,
        provider: string | undefined,
        model: string | undefined,
        pageContext: string | undefined,
    ): Promise<{ fullPrompt: string; ragContext: RAGContext[] }> {
        // ── 4. RAG retrieval ──────────────────────────────────────────
        const [ragContext, datasetContext, faqContext] = await Promise.all([
            ChatbotRAGService.retrieveContext(message),
            ChatbotRAGService.retrieveDatasetContext(message),
            ChatbotRAGService.retrieveFaqContext(message),
        ])

        // ── 4b. History compression (Phase 13) ────────────────────────
        const aiProviderForCompression = AIService.getProvider(provider)
        const sessionSummary = await ChatbotRAGService.compressHistory(
            chatSessionId,
            (prompt, model) => aiProviderForCompression.generateText(prompt, model).then((r) => r ?? ''),
            model,
        )
        const latestSession = await ChatSessionService.getSession(chatSessionId)

        // ── 5. Build prompt ────────────────────────────────────────────
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

        // ── 6. Assemble flat prompt string ────────────────────────────
        const fullPrompt = promptMessages
            .map((m) => `${m.role === 'system' ? '[System]' : m.role === 'user' ? '[User]' : '[Assistant]'}: ${m.content}`)
            .join('\n\n')

        return { fullPrompt, ragContext }
    }

    /**
     * Steps 7-8: Build sources list and persist the AI reply message.
     * Returns the persisted message and sources so callers can broadcast via WS.
     */
    private static async _persistAiMessage(
        chatSessionId: string,
        reply: string,
        ragContext: RAGContext[],
    ): Promise<{ aiMsg: StoredChatMessage; sources: ChatbotSource[] }> {
        // ── 7. Build sources ──────────────────────────────────────────
        const sources: ChatbotSource[] = ragContext.map((ctx) => ({
            postId: ctx.postId,
            title: ctx.title,
            slug: ctx.slug,
            categorySlug: ctx.categorySlug,
            score: ctx.score,
        }))

        // ── 8. Persist AI message ─────────────────────────────────────
        const aiMsg: StoredChatMessage = {
            id: makeMessageId(),
            role: 'assistant',
            content: reply,
            sources: sources.length > 0 ? sources : undefined,
            createdAt: new Date().toISOString(),
        }
        await ChatSessionService.addMessage(chatSessionId, aiMsg)

        return { aiMsg, sources }
    }

    // ─────────────────────────── Chat (user) ──────────────────────────

    /**
     * Process a user message through the RAG pipeline.
     * Creates or reuses a session, persists messages, returns AI reply.
     */
    static async chat({
        message,
        chatSessionId,
        userId,
        userEmail,
        provider,
        model,
        pageContext,
    }: {
        message: string
        chatSessionId?: string
        userId: string
        userEmail?: string
        provider?: string
        model?: string
        /** Optional page title for proactive trigger enrichment (Phase 13). */
        pageContext?: string
    }): Promise<{
        reply: string
        sources: ChatbotSource[]
        chatSessionId: string
    }> {
        // ── 0a. Ban check ─────────────────────────────────────────────
        if (await ChatbotModerationService.isUserBanned(userId)) {
            throw new Error(ChatbotMessages.USER_BANNED)
        }

        // ── 0b. Rate limit ────────────────────────────────────────────
        if (!(await ChatbotModerationService.checkUserRateLimit(userId))) {
            throw new Error(ChatbotMessages.RATE_LIMIT_EXCEEDED)
        }

        // ── 1. Resolve or create session ──────────────────────────────
        let session = chatSessionId
            ? await ChatSessionService.getSession(chatSessionId)
            : undefined

        if (!session || session.status === 'CLOSED') {
            session = await ChatSessionService.createSession(userId, userEmail)
        }

        // ── 2. Persist user message ───────────────────────────────────
        const userMsg: StoredChatMessage = {
            id: makeMessageId(),
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

        // ── 3. Admin takeover guard ───────────────────────────────────
        if (session.status === 'TAKEN_OVER') {
            const waitingMsg: StoredChatMessage = {
                id: makeMessageId(),
                role: 'assistant',
                content: ADMIN_TAKEOVER_SENTINEL,
                createdAt: new Date().toISOString(),
            }
            await ChatSessionService.addMessage(session.chatSessionId, waitingMsg)
            return { reply: ADMIN_TAKEOVER_SENTINEL, sources: [], chatSessionId: session.chatSessionId }
        }

        // ── 4-6. RAG pipeline ─────────────────────────────────────────
        const { fullPrompt, ragContext } = await ChatbotService._buildRagPipeline(
            session.chatSessionId, message, provider, model, pageContext
        )

        // ── 6b. Call AI ───────────────────────────────────────────────
        const aiProvider = AIService.getProvider(provider)
        const reply = await aiProvider.generateText(fullPrompt, model)
        if (!reply) throw new Error(ChatbotMessages.CHATBOT_RESPONSE_FAILED)

        // ── 7-8. Persist AI message ───────────────────────────────────
        const { sources } = await ChatbotService._persistAiMessage(
            session.chatSessionId, reply, ragContext
        )

        Logger.info(`[ChatbotService] Session ${session.chatSessionId}: reply generated (${sources.length} sources)`)

        return { reply, sources, chatSessionId: session.chatSessionId }
    }

    // ─────────────────────── Chat Stream (SSE) ────────────────────────

    /**
     * Stream a chatbot response via SSE.
     * Yields JSON-encoded SSE events: { type: 'meta' | 'chunk' | 'sources' | 'done' | 'error' }
     */
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
        /** Optional page title for proactive trigger enrichment (Phase 13). */
        pageContext?: string
    }): AsyncGenerator<string, void, unknown> {
        // ── 0a. Ban check ─────────────────────────────────────────────
        if (await ChatbotModerationService.isUserBanned(userId)) {
            yield `data: ${JSON.stringify({ type: 'error', error: ChatbotMessages.USER_BANNED })}\n\n`
            return
        }

        // ── 0b. Rate limit ────────────────────────────────────────────
        if (!(await ChatbotModerationService.checkUserRateLimit(userId))) {
            yield `data: ${JSON.stringify({ type: 'error', error: ChatbotMessages.RATE_LIMIT_EXCEEDED })}\n\n`
            return
        }

        // ── 1. Resolve or create session ──────────────────────────────
        let session = chatSessionId
            ? await ChatSessionService.getSession(chatSessionId)
            : undefined

        // Try browser → session mapping if no explicit chatSessionId
        if (!session && browserId) {
            const browserSessionId = await redis.get(BROWSER_SESSION(browserId))
            if (browserSessionId) {
                const s = await ChatSessionService.getSession(browserSessionId)
                if (s && s.userId === userId && s.status !== 'CLOSED') session = s
            }
        }

        if (!session || session.status === 'CLOSED') {
            session = await ChatSessionService.createSession(userId, userEmail, browserId)
        }

        // Keep browser → session mapping fresh
        if (browserId && session.chatSessionId) {
            await redis.set(BROWSER_SESSION(browserId), session.chatSessionId, 'EX', SESSION_TTL)
        }

        yield `data: ${JSON.stringify({ type: 'meta', chatSessionId: session.chatSessionId })}\n\n`

        // Typing indicator: notify user AI is now processing (Phase 13)
        yield `data: ${JSON.stringify({ type: 'typing', role: 'assistant' })}\n\n`

        // ── 2. Persist user message ───────────────────────────────────
        const userMsg: StoredChatMessage = {
            id: makeMessageId(),
            role: 'user',
            content: message,
            createdAt: new Date().toISOString(),
        }
        await ChatSessionService.addMessage(session.chatSessionId, userMsg)

        wsManager.publish('chatbot', session.chatSessionId, {
            ns: 'chatbot',
            type: 'new_message',
            chatSessionId: session.chatSessionId,
            message: { id: userMsg.id, role: 'user', content: userMsg.content, createdAt: userMsg.createdAt },
        })

        if (!session.title) {
            session.title = message.slice(0, 80)
            await ChatSessionService.updateSession(session)
        }

        await redis.zadd(ACTIVE_SESSIONS, Date.now(), session.chatSessionId)

        // ── 3. Admin takeover guard ───────────────────────────────────
        if (session.status === 'TAKEN_OVER') {
            const waitingMsg: StoredChatMessage = {
                id: makeMessageId(),
                role: 'assistant',
                content: ADMIN_TAKEOVER_SENTINEL,
                createdAt: new Date().toISOString(),
            }
            await ChatSessionService.addMessage(session.chatSessionId, waitingMsg)
            yield `data: ${JSON.stringify({ type: 'chunk', content: ADMIN_TAKEOVER_SENTINEL })}\n\n`
            yield `data: ${JSON.stringify({ type: 'done' })}\n\n`
            return
        }

        // ── 4-6. RAG pipeline ─────────────────────────────────────────
        const { fullPrompt, ragContext } = await ChatbotService._buildRagPipeline(
            session.chatSessionId, message, provider, model, pageContext
        )

        // ── 6b. Stream AI response ────────────────────────────────────
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

        // ── 7-8. Persist AI message ───────────────────────────────────
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
