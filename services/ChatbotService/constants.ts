export const SESSION_KEY = (id: string) => `chatbot:session:${id}`
export const MESSAGES_KEY = (id: string) => `chatbot:messages:${id}`
export const ACTIVE_SESSIONS = 'chatbot:sessions:active'
export const USER_SESSIONS = (userId: string) => `chatbot:sessions:user:${userId}`
export const BAN_KEY = (userId: string) => `chatbot:ban:${userId}`
export const RATE_LIMIT_KEY = (userId: string) => `chatbot:ratelimit:${userId}`
export const BROWSER_SESSION = (browserId: string) => `chatbot:browser:${browserId}`
export const DISCONNECT_KEY = (browserId: string) => `chatbot:disconnect:${browserId}`
export const KG_NODES_KEY = 'kg:nodes'

export const SESSION_TTL_SECONDS = parseInt(process.env.CHATBOT_SESSION_TTL_SECONDS || `${60 * 60 * 24 * 7}`)
export const SESSION_CLOSE_TIMEOUT_SECONDS = parseInt(process.env.CHATBOT_SESSION_CLOSE_TIMEOUT_SECONDS || `${60 * 5}`)

if (isNaN(SESSION_TTL_SECONDS) || isNaN(SESSION_CLOSE_TIMEOUT_SECONDS)) {
  throw new Error('Invalid chatbot session TTL value in environment variables.')
}

export const BAN_TTL_SECONDS = parseInt(process.env.CHATBOT_BAN_TTL_SECONDS || `${60 * 60}`)
export const USER_RATE_LIMIT_MAX = parseInt(process.env.CHATBOT_USER_RATE_LIMIT_MAX || '10')
export const USER_RATE_WINDOW_SECONDS = parseInt(process.env.CHATBOT_USER_RATE_WINDOW_SECONDS || '60')

if (isNaN(BAN_TTL_SECONDS) || isNaN(USER_RATE_LIMIT_MAX) || isNaN(USER_RATE_WINDOW_SECONDS)) {
  throw new Error('Invalid chatbot moderation value in environment variables.')
}

export const RAG_TOP_K = parseInt(process.env.CHATBOT_RAG_TOP_K || '5')
export const RAG_THRESHOLD = parseFloat(process.env.CHATBOT_RAG_THRESHOLD || '0.15')
export const DATASET_TOP_K = parseInt(process.env.CHATBOT_DATASET_TOP_K || '3')
export const DATASET_THRESHOLD = parseFloat(process.env.CHATBOT_DATASET_THRESHOLD || '0.25')
export const FAQ_TOP_K = parseInt(process.env.CHATBOT_FAQ_TOP_K || '3')
export const FAQ_THRESHOLD = parseFloat(process.env.CHATBOT_FAQ_THRESHOLD || '0.35')

export const HISTORY_COMPRESS_THRESHOLD = parseInt(process.env.CHATBOT_HISTORY_COMPRESS_THRESHOLD || '20')
export const HISTORY_KEEP_LAST = parseInt(process.env.CHATBOT_HISTORY_KEEP_LAST || '10')

export const ADMIN_TAKEOVER_SENTINEL = '__ADMIN_TAKEOVER__'
