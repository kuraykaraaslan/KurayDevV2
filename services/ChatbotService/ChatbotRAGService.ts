import redis from '@/libs/redis'
import LocalEmbedService from '@/services/PostService/LocalEmbedService'
import { cosine } from '@/helpers/Cosine'
import PostService from '@/services/PostService'
import Logger from '@/libs/logger'
import SettingService from '@/services/SettingService'
import { StoredChatMessage } from '@/dtos/ChatbotDTO'
import { KnowledgeGraphNode } from '@/types/content/BlogTypes'
import {
    RAGContext,
    DatasetDocument,
    FaqItem,
    PolicyItem,
    SystemPromptData,
} from '@/types/features/ChatbotTypes'
function tryRequireJson<T>(path: string, fallback: T): T {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require(path) as T
    } catch {
        return fallback
    }
}

const ragDatasetRaw      = tryRequireJson('./datasets/rag-dataset.json',    { documents: [] })
const faqDatasetRaw      = tryRequireJson('./datasets/faq-dataset.json',    { items: [] })
const policyDatasetRaw   = tryRequireJson('./datasets/policy-dataset.json', { policies: [] })
const systemPromptDataRaw = tryRequireJson('./datasets/system-prompt.json', { intro: '', rules: [] })

import {
  KG_NODES_KEY,
  RAG_TOP_K,
  RAG_THRESHOLD,
  DATASET_TOP_K,
  DATASET_THRESHOLD,
  FAQ_TOP_K,
  FAQ_THRESHOLD,
  MESSAGES_KEY,
  SESSION_TTL_SECONDS,
  HISTORY_COMPRESS_THRESHOLD,
  HISTORY_KEEP_LAST,
  ADMIN_TAKEOVER_SENTINEL,
} from './constants'
import ChatSessionService from './ChatSessionService'

const ragDataset = ragDatasetRaw as { documents: DatasetDocument[] }
const faqDataset = faqDatasetRaw as { items: FaqItem[] }
const policyDataset = policyDatasetRaw as { policies: PolicyItem[] }
const systemPromptData = systemPromptDataRaw as SystemPromptData

export default class ChatbotRAGService {
    static async retrieveContext(query: string): Promise<RAGContext[]> {
        try {
            const nodesRaw = await redis.get(KG_NODES_KEY)
            if (!nodesRaw) {
                Logger.warn('[ChatbotRAGService] No knowledge graph nodes found in Redis')
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
                        const plainContent = ChatbotRAGService.stripHtml(post.content || '')
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
                    Logger.warn(`[ChatbotRAGService] Failed to fetch post ${sim.id}: ${err}`)
                }
            }

            return contextResults
        } catch (err) {
            Logger.error(`[ChatbotRAGService] RAG retrieval failed: ${err}`)
            return []
        }
    }

    static async retrieveDatasetContext(
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
            Logger.error(`[ChatbotRAGService] Dataset retrieval failed: ${err}`)
            return []
        }
    }

    static async retrieveFaqContext(
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
            Logger.error(`[ChatbotRAGService] FAQ retrieval failed: ${err}`)
            return []
        }
    }

    static async buildSystemPrompt(context: RAGContext[]): Promise<string> {
        const [promptSetting, maxTokensSetting] = await Promise.all([
            SettingService.getSettingByKey('CHATBOT_SYSTEM_PROMPT'),
            SettingService.getSettingByKey('CHATBOT_MAX_TOKENS'),
        ])

        let defaultPrompt = ''
        if (systemPromptData.intro || systemPromptData.rules.length > 0) {
            const rulesBlock = systemPromptData.rules
                .map((r) => `${r.id}. ${r.name}: ${r.rule}`)
                .join('\n')
            defaultPrompt = `${systemPromptData.intro}\n\n=== MANDATORY RULES (NEVER VIOLATE) ===\n\n${rulesBlock}`
        } else {
            defaultPrompt =
                'You are a helpful, friendly AI assistant on this blog. ' +
                'Answer questions based on the provided context. ' +
                'Be concise, accurate, and conversational. Never fabricate information.'
        }

        const basePrompt = promptSetting?.value?.trim() || defaultPrompt

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

    static buildMessages(
        systemPrompt: string,
        history: StoredChatMessage[],
        currentMessage: string,
        summary?: string,
        pageContext?: string,
    ): { role: 'system' | 'user' | 'assistant'; content: string }[] {
        const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system', content: systemPrompt },
        ]

        if (summary) {
            messages.push({
                role: 'system',
                content: `[Earlier conversation summary]: ${summary}`,
            })
        }

        const recent = history.slice(-10)
        for (const msg of recent) {
            if (msg.content === ADMIN_TAKEOVER_SENTINEL) continue
            // Convert to lowercase for AI provider APIs
            const roleLower = msg.role.toLowerCase()
            const role = (roleLower === 'admin' ? 'assistant' : roleLower) as 'system' | 'user' | 'assistant'
            messages.push({ role, content: msg.content })
        }

        const enrichedMessage = pageContext
            ? `[Page context: "${pageContext}"]\n${currentMessage}`
            : currentMessage
        messages.push({ role: 'user', content: enrichedMessage })
        return messages
    }

    static async compressHistory(
        chatSessionId: string,
        generateSummary: (prompt: string, model?: string) => Promise<string>,
        model?: string,
    ): Promise<string | undefined> {
        const messages = await ChatSessionService.getMessages(chatSessionId)
        if (messages.length <= HISTORY_COMPRESS_THRESHOLD) return undefined

        const toCompress = messages.slice(0, messages.length - HISTORY_KEEP_LAST)
        const keepTail = messages.slice(messages.length - HISTORY_KEEP_LAST)

        const conversationText = toCompress
            .filter((m) => m.content !== ADMIN_TAKEOVER_SENTINEL)
            .map((m) => `${m.role}: ${m.content}`)
            .join('\n')

        const summaryPrompt =
            'Summarise the following chat conversation in 2-3 concise sentences, ' +
            'capturing the key topics and any important context:\n\n' +
            conversationText

        let summary: string
        try {
            summary = await generateSummary(summaryPrompt, model)
            if (!summary) return undefined
        } catch (err) {
            Logger.warn(`[ChatbotRAGService] History compression failed: ${err}`)
            return undefined
        }

        const session = await ChatSessionService.getSession(chatSessionId)
        if (session) {
            session.summary = summary
            await ChatSessionService.updateSession(session)
        }

        await redis.del(MESSAGES_KEY(chatSessionId))
        for (const msg of keepTail) {
            await redis.rpush(MESSAGES_KEY(chatSessionId), JSON.stringify(msg))
        }
        await redis.expire(MESSAGES_KEY(chatSessionId), SESSION_TTL_SECONDS)

        Logger.info(
            `[ChatbotRAGService] Session ${chatSessionId}: compressed ${toCompress.length} messages → summary`
        )
        return summary
    }

    static stripHtml(html: string): string {
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
