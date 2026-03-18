import { loadAllChatbotDatasetsToRedis, flushChatbotDatasetsFromRedis } from '../jobs/loadAllChatbotDatasetsToRedis'

export const bootJobs: Array<{ name: string; handler: () => Promise<void> }> = [
    { name: 'flushChatbotDatasetsFromRedis', handler: flushChatbotDatasetsFromRedis },
    { name: 'loadAllChatbotDatasetsToRedis', handler: loadAllChatbotDatasetsToRedis },
]