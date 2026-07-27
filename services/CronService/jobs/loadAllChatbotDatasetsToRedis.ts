import redis from '@/libs/redis'
import { tryRequireJson, datasetDocText, faqItemText } from '@/services/ChatbotService/ChatbotRAGService'
import LocalEmbedService from '@/services/PostService/LocalEmbedService'
import Logger from '@/libs/logger'
import { DatasetDocument, FaqItem } from '@/types/features/ChatbotTypes'

const RAG_DATASET_KEY = 'rag:dataset'
const FAQ_DATASET_KEY = 'faq:dataset'
const POLICY_DATASET_KEY = 'policy:dataset'
const SYSTEM_PROMPT_KEY = 'system:prompt'

/**
 * Datasets klasöründeki dosyaları Redis'e yükler.
 * Dataset ve FAQ dökümanlarının embedding'leri burada bir kez hesaplanır, böylece
 * chatbot her mesajda tüm dataset'i yeniden embed etmek yerine yalnızca sorguyu embed eder.
 */
export async function loadAllChatbotDatasetsToRedis() {
  const ragDatasetRaw = tryRequireJson('./datasets/rag-dataset.json', { documents: [] })
  const faqDatasetRaw = tryRequireJson('./datasets/faq-dataset.json', { items: [] })
  const policyDatasetRaw = tryRequireJson('./datasets/policy-dataset.json', { policies: [] })
  const systemPromptDataRaw = tryRequireJson('./datasets/system-prompt.json', { intro: '', rules: [] })

  const documents: DatasetDocument[] = ragDatasetRaw.documents || []
  const faqItems: FaqItem[] = faqDatasetRaw.items || []

  try {
    if (documents.length > 0) {
      const embeddings = await LocalEmbedService.embed(documents.map(datasetDocText))
      documents.forEach((d, i) => { d.embedding = embeddings[i] })
    }
    if (faqItems.length > 0) {
      const embeddings = await LocalEmbedService.embed(faqItems.map(faqItemText))
      faqItems.forEach((f, i) => { f.embedding = embeddings[i] })
    }
  } catch (err) {
    // Non-fatal: datasets still load without embeddings; retrieval lazily backfills them.
    Logger.warn(`[Chatbot] Dataset embedding pre-compute failed: ${err}`)
  }

  await redis.set(RAG_DATASET_KEY, JSON.stringify(documents))
  await redis.set(FAQ_DATASET_KEY, JSON.stringify(faqItems))
  await redis.set(POLICY_DATASET_KEY, JSON.stringify(policyDatasetRaw.policies || []))
  await redis.set(SYSTEM_PROMPT_KEY, JSON.stringify(systemPromptDataRaw))
}


export async function flushChatbotDatasetsFromRedis() {
  await redis.del(RAG_DATASET_KEY)
  await redis.del(FAQ_DATASET_KEY)
  await redis.del(POLICY_DATASET_KEY)
  await redis.del(SYSTEM_PROMPT_KEY)
}