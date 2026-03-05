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
import path from 'path'
import fs from 'fs'
import {
    KG_NODES_KEY,
    RAG_TOP_K,
    RAG_THRESHOLD,
    DATASET_TOP_K,
    DATASET_THRESHOLD,
    FAQ_TOP_K,
    FAQ_THRESHOLD,
} from './constants'

// ── Static datasets (gracefully degrade if missing) ─────────────────
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

export default class ChatbotRAGService {
    /**
     * Retrieve relevant posts from the knowledge graph based on user query.
     */
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

    /**
     * Retrieve relevant documents from rag-dataset.json using embedding similarity.
     */
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

    /**
     * Retrieve relevant FAQ entries from faq-dataset.json using embedding similarity.
     */
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

    /**
     * Build the system prompt with RAG context injected.
     * Uses CHATBOT_SYSTEM_PROMPT and CHATBOT_MAX_TOKENS from admin settings.
     */
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

    /**
     * Build the full message array for the AI provider.
     */
    static buildMessages(
        systemPrompt: string,
        history: StoredChatMessage[],
        currentMessage: string
    ): { role: 'system' | 'user' | 'assistant'; content: string }[] {
        const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
            { role: 'system', content: systemPrompt },
        ]

        const recent = history.slice(-10)
        for (const msg of recent) {
            if (msg.content === '__ADMIN_TAKEOVER__') continue
            const role =
                msg.role === 'admin' ? 'assistant' : msg.role === 'user' ? 'user' : 'assistant'
            messages.push({ role, content: msg.content })
        }

        messages.push({ role: 'user', content: currentMessage })
        return messages
    }

    /**
     * Strip HTML tags from a string.
     */
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
