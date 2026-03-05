import redis from '@/libs/redis'
import LocalEmbedService from '@/services/PostService/LocalEmbedService'
import { cosine } from '@/helpers/Cosine'
import PostService from '@/services/PostService'
import { AIService } from '@/services/AIServices'
import Logger from '@/libs/logger'
import ChatbotMessages from '@/messages/ChatbotMessages'
import SettingService from '@/services/SettingService'
import {
    StoredChatMessage,
    StoredChatSession,
    ChatbotSource,
    ChatSessionStatus,
} from '@/dtos/ChatbotDTO'
import { KnowledgeGraphNode } from '@/types/content/BlogTypes'
import {
    RAGContext,
    DatasetDocument,
    FaqItem,
    PolicyItem,
    SystemPromptData,
} from '@/types/features/ChatbotTypes'

// ── Static datasets (optional — gracefully degrade if missing) ──────
import path from 'path'
import fs from 'fs'

const DATASETS_DIR = path.join(__dirname, 'datasets')

function loadJson<T>(filename: string, fallback: T): T {
    try {
        const filePath = path.join(DATASETS_DIR, filename)
        if (!fs.existsSync(filePath)) return fallback
        const raw = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(raw) as T
    } catch {
        return fallback
    }
}

const ragDataset = loadJson<{ documents: DatasetDocument[] }>('rag-dataset.json', { documents: [] })
const faqDataset = loadJson<{ items: FaqItem[] }>('faq-dataset.json', { items: [] })
const policyDataset = loadJson<{ policies: PolicyItem[] }>('policy-dataset.json', { policies: [] })
const systemPromptData = loadJson<SystemPromptData>('system-prompt.json', { intro: '', rules: [] })

// ── Redis key patterns ──────────────────────────────────────────────
const SESSION_KEY = (id: string) => `chatbot:session:${id}`
const MESSAGES_KEY = (id: string) => `chatbot:messages:${id}`
const ACTIVE_SESSIONS = 'chatbot:sessions:active' // Sorted set (score = timestamp)
const USER_SESSIONS = (userId: string) => `chatbot:sessions:user:${userId}`
const BAN_KEY = (userId: string) => `chatbot:ban:${userId}`

const SESSION_TTL = 60 * 60 * 24 * 7 // 7 days
const BAN_TTL = 60 * 60 // 1 hour
const KG_NODES_KEY = 'kg:nodes'
const RAG_TOP_K = 5
const RAG_THRESHOLD = 0.15
const DATASET_TOP_K = 3
const DATASET_THRESHOLD = 0.25
const FAQ_TOP_K = 3
const FAQ_THRESHOLD = 0.35

export default class ChatbotService {
    // ─────────────────────────── Session CRUD ─────────────────────────

    /**
     * Create a new chat session in Redis.
     */
    static async createSession(userId: string, userEmail?: string): Promise<StoredChatSession> {
        const chatSessionId = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        const now = new Date().toISOString()

        const session: StoredChatSession = {
            chatSessionId,
            userId,
            userEmail,
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now,
        }

        const pipeline = redis.pipeline()
        pipeline.set(SESSION_KEY(chatSessionId), JSON.stringify(session), 'EX', SESSION_TTL)
        pipeline.zadd(ACTIVE_SESSIONS, Date.now(), chatSessionId)
        pipeline.sadd(USER_SESSIONS(userId), chatSessionId)
        pipeline.expire(USER_SESSIONS(userId), SESSION_TTL)
        await pipeline.exec()

        Logger.info(`[ChatbotService] Session ${chatSessionId} created for user ${userId}`)
        return session
    }

    /**
     * Get a session by ID.
     */
    static async getSession(chatSessionId: string): Promise<StoredChatSession | undefined> {
        const raw = await redis.get(SESSION_KEY(chatSessionId))
        if (!raw) return undefined
        return JSON.parse(raw) as StoredChatSession
    }

    /**
     * Update session metadata in Redis.
     */
    private static async updateSession(session: StoredChatSession): Promise<void> {
        session.updatedAt = new Date().toISOString()
        await redis.set(SESSION_KEY(session.chatSessionId), JSON.stringify(session), 'EX', SESSION_TTL)
    }

    /**
     * Add a message to a session's message list.
     */
    private static async addMessage(
        chatSessionId: string,
        msg: StoredChatMessage
    ): Promise<void> {
        await redis.rpush(MESSAGES_KEY(chatSessionId), JSON.stringify(msg))
        await redis.expire(MESSAGES_KEY(chatSessionId), SESSION_TTL)
    }

    /**
     * Get all messages for a session.
     */
    static async getMessages(chatSessionId: string): Promise<StoredChatMessage[]> {
        const raw = await redis.lrange(MESSAGES_KEY(chatSessionId), 0, -1)
        return raw.map((r) => JSON.parse(r) as StoredChatMessage)
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
    }: {
        message: string
        chatSessionId?: string
        userId: string
        userEmail?: string
        provider?: string
        model?: string
    }): Promise<{
        reply: string
        sources: ChatbotSource[]
        chatSessionId: string
    }> {
        // ── 0. Check if user is banned ─────────────────────────────────
        const banned = await ChatbotService.isUserBanned(userId)
        if (banned) {
            throw new Error(ChatbotMessages.USER_BANNED)
        }

        // ── 1. Resolve or create session ───────────────────────────────
        let session: StoredChatSession | undefined

        if (chatSessionId) {
            session = await ChatbotService.getSession(chatSessionId)
        }

        if (!session) {
            session = await ChatbotService.createSession(userId, userEmail)
        }

        // If session is closed, create a new one
        if (session.status === 'CLOSED') {
            session = await ChatbotService.createSession(userId, userEmail)
        }

        // ── 2. Persist user message ────────────────────────────────────
        const userMsg: StoredChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            role: 'user',
            content: message,
            createdAt: new Date().toISOString(),
        }
        await ChatbotService.addMessage(session.chatSessionId, userMsg)

        // Auto-title from first message
        if (!session.title) {
            session.title = message.slice(0, 80)
            await ChatbotService.updateSession(session)
        }

        // Update sorted set score (latest activity)
        await redis.zadd(ACTIVE_SESSIONS, Date.now(), session.chatSessionId)

        // ── 3. If TAKEN_OVER by admin, skip AI — wait for admin reply ──
        if (session.status === 'TAKEN_OVER') {
            const waitingMsg: StoredChatMessage = {
                id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                role: 'assistant',
                content: '__ADMIN_TAKEOVER__', // Marker — frontend shows "an admin is replying"
                createdAt: new Date().toISOString(),
            }
            await ChatbotService.addMessage(session.chatSessionId, waitingMsg)
            return {
                reply: '__ADMIN_TAKEOVER__',
                sources: [],
                chatSessionId: session.chatSessionId,
            }
        }

        // ── 4. RAG retrieval (blog + dataset + FAQ) ────────────────────
        const [ragContext, datasetContext, faqContext] = await Promise.all([
            ChatbotService.retrieveContext(message),
            ChatbotService.retrieveDatasetContext(message),
            ChatbotService.retrieveFaqContext(message),
        ])

        // ── 5. Build prompt ────────────────────────────────────────────
        const history = await ChatbotService.getMessages(session.chatSessionId)
        // Merge dataset + FAQ hits into ragContext for prompt building
        const mergedContext = [...ragContext]
        for (const doc of datasetContext) {
            mergedContext.push({
                postId: doc.id,
                title: doc.title,
                slug: '',
                categorySlug: doc.type,
                score: doc.score,
                snippet: doc.text,
            })
        }
        for (const faq of faqContext) {
            mergedContext.push({
                postId: faq.id,
                title: faq.question,
                slug: '',
                categorySlug: 'faq',
                score: faq.score,
                snippet: `Q: ${faq.question}\nA: ${faq.answer}`,
            })
        }
        // Exclude the just-added user message (it's at the end)
        const previousMessages = history.slice(0, -1)

        const systemPrompt = await ChatbotService.buildSystemPrompt(mergedContext)
        const promptMessages = ChatbotService.buildMessages(systemPrompt, previousMessages, message)

        // ── 6. Call AI ─────────────────────────────────────────────────
        const aiProvider = AIService.getProvider(provider)
        const fullPrompt = promptMessages
            .map((m) =>
                `${m.role === 'system' ? '[System]' : m.role === 'user' ? '[User]' : '[Assistant]'}: ${m.content}`
            )
            .join('\n\n')

        const reply = await aiProvider.generateText(fullPrompt, model)

        if (!reply) {
            throw new Error(ChatbotMessages.CHATBOT_RESPONSE_FAILED)
        }

        // ── 7. Build sources ───────────────────────────────────────────
        const sources: ChatbotSource[] = ragContext.map((ctx) => ({
            postId: ctx.postId,
            title: ctx.title,
            slug: ctx.slug,
            categorySlug: ctx.categorySlug,
            score: ctx.score,
        }))

        // ── 8. Persist AI message ──────────────────────────────────────
        const aiMsg: StoredChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            role: 'assistant',
            content: reply,
            sources: sources.length > 0 ? sources : undefined,
            createdAt: new Date().toISOString(),
        }
        await ChatbotService.addMessage(session.chatSessionId, aiMsg)

        Logger.info(
            `[ChatbotService] Session ${session.chatSessionId}: reply generated (${sources.length} sources)`
        )

        return { reply, sources, chatSessionId: session.chatSessionId }
    }

    // ─────────────────────── Admin operations ─────────────────────────

    /**
     * List all chat sessions (for admin panel). Sorted by most recent activity.
     */
    static async listSessions(options?: {
        status?: ChatSessionStatus
        page?: number
        pageSize?: number
    }): Promise<{ sessions: StoredChatSession[]; total: number }> {
        const page = options?.page ?? 0
        const pageSize = options?.pageSize ?? 20

        // Get all session IDs from sorted set (newest first)
        const allIds = await redis.zrevrange(ACTIVE_SESSIONS, 0, -1)

        // Fetch all session data
        const sessions: StoredChatSession[] = []
        for (const id of allIds) {
            const s = await ChatbotService.getSession(id)
            if (!s) {
                // Clean up stale entry
                await redis.zrem(ACTIVE_SESSIONS, id)
                continue
            }
            if (options?.status && s.status !== options.status) continue
            sessions.push(s)
        }

        const total = sessions.length
        const paginated = sessions.slice(page * pageSize, (page + 1) * pageSize)

        return { sessions: paginated, total }
    }

    /**
     * Admin takes over a session — AI stops responding, admin writes manually.
     */
    static async takeoverSession(chatSessionId: string, adminUserId: string): Promise<void> {
        const session = await ChatbotService.getSession(chatSessionId)
        if (!session) throw new Error(ChatbotMessages.SESSION_NOT_FOUND)

        session.status = 'TAKEN_OVER'
        session.takenOverBy = adminUserId
        await ChatbotService.updateSession(session)

        Logger.info(`[ChatbotService] Session ${chatSessionId} taken over by admin ${adminUserId}`)
    }

    /**
     * Admin releases a session back to AI.
     */
    static async releaseSession(chatSessionId: string): Promise<void> {
        const session = await ChatbotService.getSession(chatSessionId)
        if (!session) throw new Error(ChatbotMessages.SESSION_NOT_FOUND)

        session.status = 'ACTIVE'
        session.takenOverBy = undefined
        await ChatbotService.updateSession(session)

        Logger.info(`[ChatbotService] Session ${chatSessionId} released back to AI`)
    }

    /**
     * Admin closes a session.
     */
    static async closeSession(chatSessionId: string): Promise<void> {
        const session = await ChatbotService.getSession(chatSessionId)
        if (!session) throw new Error(ChatbotMessages.SESSION_NOT_FOUND)

        session.status = 'CLOSED'
        await ChatbotService.updateSession(session)

        Logger.info(`[ChatbotService] Session ${chatSessionId} closed`)
    }

    /**
     * Admin sends a message in a session (appears as "admin" role in the chat).
     */
    static async adminReply({
        chatSessionId,
        message,
        adminUserId,
    }: {
        chatSessionId: string
        message: string
        adminUserId: string
    }): Promise<StoredChatMessage> {
        const session = await ChatbotService.getSession(chatSessionId)
        if (!session) throw new Error(ChatbotMessages.SESSION_NOT_FOUND)

        const msg: StoredChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            role: 'admin',
            content: message,
            adminUserId,
            createdAt: new Date().toISOString(),
        }

        await ChatbotService.addMessage(chatSessionId, msg)
        await redis.zadd(ACTIVE_SESSIONS, Date.now(), chatSessionId)

        // Auto-takeover if not already
        if (session.status === 'ACTIVE') {
            session.status = 'TAKEN_OVER'
            session.takenOverBy = adminUserId
            await ChatbotService.updateSession(session)
        }

        Logger.info(`[ChatbotService] Admin ${adminUserId} replied in session ${chatSessionId}`)
        return msg
    }

    // ────────────────────────── Ban management ─────────────────────

    /**
     * Ban a user from chatbot for 1 hour.
     */
    static async banUser(userId: string): Promise<void> {
        await redis.set(BAN_KEY(userId), '1', 'EX', BAN_TTL)
        Logger.info(`[ChatbotService] User ${userId} banned from chatbot for 1 hour`)
    }

    /**
     * Unban a user from chatbot.
     */
    static async unbanUser(userId: string): Promise<void> {
        await redis.del(BAN_KEY(userId))
        Logger.info(`[ChatbotService] User ${userId} unbanned from chatbot`)
    }

    /**
     * Check if a user is currently banned.
     */
    static async isUserBanned(userId: string): Promise<boolean> {
        const val = await redis.get(BAN_KEY(userId))
        return val !== null
    }

    /**
     * Get remaining ban time in seconds (0 if not banned).
     */
    static async getBanTTL(userId: string): Promise<number> {
        const ttl = await redis.ttl(BAN_KEY(userId))
        return ttl > 0 ? ttl : 0
    }

    /**
     * Get user sessions (for a specific user).
     */
    static async getUserSessions(userId: string): Promise<StoredChatSession[]> {
        const ids = await redis.smembers(USER_SESSIONS(userId))
        const sessions: StoredChatSession[] = []
        for (const id of ids) {
            const s = await ChatbotService.getSession(id)
            if (s) sessions.push(s)
        }
        return sessions.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
    }

    // ─────────────────────── RAG internals ────────────────────────────

    /**
     * Retrieve relevant posts from the knowledge graph based on the user query.
     */
    private static async retrieveContext(query: string): Promise<RAGContext[]> {
        try {
            const nodesRaw = await redis.get(KG_NODES_KEY)
            if (!nodesRaw) {
                Logger.warn('[ChatbotService] No knowledge graph nodes found in Redis')
                return []
            }

            const nodes: Record<string, KnowledgeGraphNode> = JSON.parse(nodesRaw)
            const nodeEntries = Object.entries(nodes)
            if (nodeEntries.length === 0) return []

            const [queryEmbedding] = await LocalEmbedService.embed([query])

            const similarities = nodeEntries
                .map(([id, node]) => ({
                    id,
                    node,
                    score: cosine(queryEmbedding, node.embedding),
                }))
                .filter((item) => item.score >= RAG_THRESHOLD)
                .sort((a, b) => b.score - a.score)
                .slice(0, RAG_TOP_K)

            if (similarities.length === 0) return []

            const contextResults: RAGContext[] = []

            for (const sim of similarities) {
                try {
                    const { posts } = await PostService.getAllPosts({
                        page: 0,
                        pageSize: 1,
                        postId: sim.id,
                        status: 'PUBLISHED',
                    })

                    if (posts[0]) {
                        const post = posts[0]
                        const plainContent = ChatbotService.stripHtml(post.content || '')
                        const snippet = plainContent.slice(0, 800)

                        contextResults.push({
                            postId: post.postId,
                            title: post.title,
                            slug: post.slug,
                            categorySlug: post.category?.slug ?? 'general',
                            score: sim.score,
                            snippet,
                        })
                    }
                } catch (err) {
                    Logger.warn(`[ChatbotService] Failed to fetch post ${sim.id}: ${err}`)
                }
            }

            return contextResults
        } catch (err) {
            Logger.error(`[ChatbotService] RAG retrieval failed: ${err}`)
            return []
        }
    }

    /**
     * Retrieve relevant documents from rag-dataset.json using embedding similarity.
     */
    private static async retrieveDatasetContext(
        query: string
    ): Promise<(DatasetDocument & { score: number })[]> {
        try {
            const documents = ragDataset.documents as DatasetDocument[]
            if (!documents || documents.length === 0) return []

            const texts = documents.map((d) => `${d.title} ${d.text}`)
            const [queryEmbedding, ...docEmbeddings] = await LocalEmbedService.embed([query, ...texts])

            return docEmbeddings
                .map((emb, i) => ({
                    ...documents[i],
                    score: cosine(queryEmbedding, emb),
                }))
                .filter((item) => item.score >= DATASET_THRESHOLD)
                .sort((a, b) => b.score - a.score)
                .slice(0, DATASET_TOP_K)
        } catch (err) {
            Logger.error(`[ChatbotService] Dataset retrieval failed: ${err}`)
            return []
        }
    }

    /**
     * Retrieve relevant FAQ entries from faq-dataset.json using embedding similarity.
     */
    private static async retrieveFaqContext(
        query: string
    ): Promise<(FaqItem & { score: number })[]> {
        try {
            const items = faqDataset.items as FaqItem[]
            if (!items || items.length === 0) return []

            const texts = items.map((f) => `${f.question} ${f.answer}`)
            const [queryEmbedding, ...faqEmbeddings] = await LocalEmbedService.embed([query, ...texts])

            return faqEmbeddings
                .map((emb, i) => ({
                    ...items[i],
                    score: cosine(queryEmbedding, emb),
                }))
                .filter((item) => item.score >= FAQ_THRESHOLD)
                .sort((a, b) => b.score - a.score)
                .slice(0, FAQ_TOP_K)
        } catch (err) {
            Logger.error(`[ChatbotService] FAQ retrieval failed: ${err}`)
            return []
        }
    }

    /**
     * Build the system prompt with RAG context injected.
     * Uses CHATBOT_SYSTEM_PROMPT and CHATBOT_MAX_TOKENS from admin settings.
     */
    private static async buildSystemPrompt(context: RAGContext[]): Promise<string> {
        // Fetch custom prompt and max tokens from settings
        const [promptSetting, maxTokensSetting] = await Promise.all([
            SettingService.getSettingByKey('CHATBOT_SYSTEM_PROMPT'),
            SettingService.getSettingByKey('CHATBOT_MAX_TOKENS'),
        ])

        // Build default prompt from system-prompt.json (graceful fallback if missing)
        let defaultPrompt = ''
        if (systemPromptData.intro || systemPromptData.rules.length > 0) {
            const rulesBlock = systemPromptData.rules
                .map((r) => `${r.id}. ${r.name}: ${r.rule}`)
                .join('\n')
            defaultPrompt = `${systemPromptData.intro}\n\n=== MANDATORY RULES (NEVER VIOLATE) ===\n\n${rulesBlock}`
        } else {
            // Minimal hardcoded fallback when system-prompt.json is missing
            defaultPrompt =
                'You are a helpful, friendly AI assistant on this blog. ' +
                'Answer questions based on the provided context. ' +
                'Be concise, accurate, and conversational. Never fabricate information.'
        }

        const basePrompt = promptSetting?.value?.trim() || defaultPrompt

        // Build policy block from policy-dataset.json (skip if empty)
        const policyBlock = policyDataset.policies
            .map((p) => `- [${p.severity.toUpperCase()}] ${p.title}: ${p.rule}`)
            .join('\n')

        const maxTokens = parseInt(maxTokensSetting?.value || '0', 10)
        const tokenInstruction = maxTokens > 0
            ? `\n\nIMPORTANT: Keep your response under ${maxTokens} tokens.`
            : ''

        const policySection = policyBlock
            ? `\n\n=== ENFORCED POLICIES ===\n${policyBlock}`
            : ''

        if (context.length === 0) {
            return `${basePrompt}${policySection}${tokenInstruction}\n\nYou couldn't find a matching article for this question. Be honest about it — say something like "Hmm, I don't have a specific article about that" in a warm, conversational tone. If it's loosely related to tech, share a brief thought and gently suggest they browse the blog — they might find something interesting. Never sound robotic or use phrases like "feel free to ask" or "if you have any questions". Talk like a real person.`
        }

        const contextBlock = context
            .map(
                (ctx, i) =>
                    `--- Article ${i + 1}: "${ctx.title}" (category: ${ctx.categorySlug}) ---\n${ctx.snippet}\n---`
            )
            .join('\n\n')

        return `${basePrompt}${policySection}${tokenInstruction}\n\nRelevant blog content for context:\n\n${contextBlock}`
    }

    /**
     * Build the full message array for the AI provider.
     */
    private static buildMessages(
        systemPrompt: string,
        history: StoredChatMessage[],
        currentMessage: string
    ): { role: 'system' | 'user' | 'assistant'; content: string }[] {
        const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system', content: systemPrompt },
        ]

        // Add recent history (last 10 messages, map admin→assistant for AI context)
        const recent = history.slice(-10)
        for (const msg of recent) {
            if (msg.content === '__ADMIN_TAKEOVER__') continue
            const role = msg.role === 'admin' ? 'assistant' : msg.role === 'user' ? 'user' : 'assistant'
            messages.push({ role, content: msg.content })
        }

        messages.push({ role: 'user', content: currentMessage })
        return messages
    }

    /**
     * Strip HTML tags from a string.
     */
    private static stripHtml(html: string): string {
        return html
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim()
    }
}
