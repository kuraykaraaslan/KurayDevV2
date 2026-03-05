// ── Redis key patterns ──────────────────────────────────────────────
export const SESSION_KEY = (id: string) => `chatbot:session:${id}`
export const MESSAGES_KEY = (id: string) => `chatbot:messages:${id}`
export const ACTIVE_SESSIONS = 'chatbot:sessions:active' // Sorted set (score = timestamp)
export const USER_SESSIONS = (userId: string) => `chatbot:sessions:user:${userId}`
export const BAN_KEY = (userId: string) => `chatbot:ban:${userId}`
export const RATE_LIMIT_KEY = (userId: string) => `chatbot:ratelimit:${userId}`
export const BROWSER_SESSION = (browserId: string) => `chatbot:browser:${browserId}`
export const DISCONNECT_KEY = (browserId: string) => `chatbot:disconnect:${browserId}`

// ── TTL / limit constants ───────────────────────────────────────────
export const SESSION_TTL = 60 * 60 * 24 * 7    // 7 days
export const SESSION_CLOSE_TIMEOUT = 60 * 5     // 5 minutes — auto-close after browser disconnect
export const BAN_TTL = 60 * 60                  // 1 hour
export const USER_RATE_LIMIT = 10               // max messages per window
export const USER_RATE_WINDOW = 60              // 60 seconds

// ── RAG tuning constants ────────────────────────────────────────────
export const KG_NODES_KEY = 'kg:nodes'
export const RAG_TOP_K = 5
export const RAG_THRESHOLD = 0.15
export const DATASET_TOP_K = 3
export const DATASET_THRESHOLD = 0.25
export const FAQ_TOP_K = 3
export const FAQ_THRESHOLD = 0.35
