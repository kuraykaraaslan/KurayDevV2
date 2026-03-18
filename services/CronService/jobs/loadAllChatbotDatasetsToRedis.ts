import redis from '@/libs/redis'
import { tryRequireJson } from '@/services/ChatbotService/ChatbotRAGService'

const RAG_DATASET_KEY = 'rag:dataset'
const FAQ_DATASET_KEY = 'faq:dataset'
const POLICY_DATASET_KEY = 'policy:dataset'
const SYSTEM_PROMPT_KEY = 'system:prompt'

/**
 * Datasets klasöründeki dosyaları Redis'e yükler.
 */
export async function loadAllChatbotDatasetsToRedis() {
  const ragDatasetRaw = tryRequireJson('./datasets/rag-dataset.json', { documents: [] })
  const faqDatasetRaw = tryRequireJson('./datasets/faq-dataset.json', { items: [] })
  const policyDatasetRaw = tryRequireJson('./datasets/policy-dataset.json', { policies: [] })
  const systemPromptDataRaw = tryRequireJson('./datasets/system-prompt.json', { intro: '', rules: [] })

  await redis.set(RAG_DATASET_KEY, JSON.stringify(ragDatasetRaw.documents || []))
  await redis.set(FAQ_DATASET_KEY, JSON.stringify(faqDatasetRaw.items || []))
  await redis.set(POLICY_DATASET_KEY, JSON.stringify(policyDatasetRaw.policies || []))
  await redis.set(SYSTEM_PROMPT_KEY, JSON.stringify(systemPromptDataRaw))
}


export async function flushChatbotDatasetsFromRedis() {
  await redis.del(RAG_DATASET_KEY)
  await redis.del(FAQ_DATASET_KEY)
  await redis.del(POLICY_DATASET_KEY)
  await redis.del(SYSTEM_PROMPT_KEY)
}