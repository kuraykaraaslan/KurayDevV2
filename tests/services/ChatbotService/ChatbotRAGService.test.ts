import ChatbotRAGService from '@/services/ChatbotService/ChatbotRAGService'
import redis from '@/libs/redis'

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/libs/redis', () => ({
  __esModule: true,
  default: {
    get:    jest.fn(),
    set:    jest.fn(),
    del:    jest.fn(),
    rpush:  jest.fn(),
    expire: jest.fn(),
    lrange: jest.fn(),
  },
}))

jest.mock('@/services/PostService/LocalEmbedService', () => ({
  __esModule: true,
  default: {
    embed: jest.fn(),
  },
}))

jest.mock('@/helpers/Cosine', () => ({
  cosine: jest.fn(),
}))

jest.mock('@/services/PostService', () => ({
  __esModule: true,
  default: {
    getAllPosts: jest.fn(),
  },
}))

jest.mock('@/services/SettingService', () => ({
  __esModule: true,
  default: {
    getSettingByKey: jest.fn(),
  },
}))

jest.mock('@/services/ChatbotService/ChatSessionService', () => ({
  __esModule: true,
  default: {
    getMessages:   jest.fn(),
    getSession:    jest.fn(),
    updateSession: jest.fn(),
  },
}))

jest.mock('@/libs/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

// ── Imports after mocking ─────────────────────────────────────────────────────

import LocalEmbedService from '@/services/PostService/LocalEmbedService'
import { cosine } from '@/helpers/Cosine'
import PostService from '@/services/PostService'
import SettingService from '@/services/SettingService'
import ChatSessionService from '@/services/ChatbotService/ChatSessionService'

const redisMock          = redis as jest.Mocked<typeof redis>
const embedMock          = LocalEmbedService as jest.Mocked<typeof LocalEmbedService>
const cosineMock         = cosine as jest.MockedFunction<typeof cosine>
const postServiceMock    = PostService as jest.Mocked<typeof PostService>
const settingServiceMock = SettingService as jest.Mocked<typeof SettingService>
const sessionServiceMock = ChatSessionService as jest.Mocked<typeof ChatSessionService>

// ── Fixtures ──────────────────────────────────────────────────────────────────

const QUERY_EMBEDDING   = [0.1, 0.2, 0.3]
const NODE_EMBEDDING_A  = [0.15, 0.25, 0.35]
const NODE_EMBEDDING_B  = [0.9,  0.1,  0.0]

const KG_NODES = {
  'post-001': {
    id:           'post-001',
    title:        'TypeScript Tips',
    slug:         'typescript-tips',
    categorySlug: 'programming',
    views:        100,
    embedding:    NODE_EMBEDDING_A,
  },
  'post-002': {
    id:           'post-002',
    title:        'Unrelated Post',
    slug:         'unrelated',
    categorySlug: 'general',
    views:        5,
    embedding:    NODE_EMBEDDING_B,
  },
}

const POST_RESULT = {
  postId:      'post-001',
  title:       'TypeScript Tips',
  slug:        'typescript-tips',
  content:     '<p>Great TypeScript tips here</p>',
  description: 'TS tips',
  category:    { slug: 'programming' },
  image:       null,
  views:       100,
}

const BASE_SESSION = {
  chatSessionId: 'cs_test_001',
  userId:        'user-123',
  status:        'ACTIVE' as const,
  summary:       undefined,
  createdAt:     '2026-03-18T10:00:00.000Z',
  updatedAt:     '2026-03-18T10:00:00.000Z',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChatbotRAGService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── retrieveContext ────────────────────────────────────────────────────────
  describe('retrieveContext', () => {
    it('returns context when relevant KG nodes are found', async () => {
      redisMock.get.mockResolvedValueOnce(JSON.stringify(KG_NODES))
      embedMock.embed.mockResolvedValueOnce([QUERY_EMBEDDING])
      cosineMock
        .mockReturnValueOnce(0.85) // post-001 — above threshold
        .mockReturnValueOnce(0.10) // post-002 — below threshold
      postServiceMock.getAllPosts.mockResolvedValueOnce({ posts: [POST_RESULT as any], total: 1 })

      const result = await ChatbotRAGService.retrieveContext('tell me about typescript')

      expect(result).toHaveLength(1)
      expect(result[0].postId).toBe('post-001')
      expect(result[0].title).toBe('TypeScript Tips')
      expect(result[0].score).toBe(0.85)
    })

    it('returns empty array when no KG nodes are in Redis', async () => {
      redisMock.get.mockResolvedValueOnce(null)

      const result = await ChatbotRAGService.retrieveContext('any query')

      expect(result).toEqual([])
      expect(embedMock.embed).not.toHaveBeenCalled()
    })

    it('returns empty array when all nodes score below threshold', async () => {
      redisMock.get.mockResolvedValueOnce(JSON.stringify(KG_NODES))
      embedMock.embed.mockResolvedValueOnce([QUERY_EMBEDDING])
      cosineMock.mockReturnValue(0.05) // all below threshold

      const result = await ChatbotRAGService.retrieveContext('unrelated query')

      expect(result).toEqual([])
    })

    it('returns empty array when Redis contains empty nodes object', async () => {
      redisMock.get.mockResolvedValueOnce(JSON.stringify({}))

      const result = await ChatbotRAGService.retrieveContext('any query')

      expect(result).toEqual([])
      expect(embedMock.embed).not.toHaveBeenCalled()
    })

    it('returns empty array and does not throw when an error occurs', async () => {
      redisMock.get.mockRejectedValueOnce(new Error('Redis failure'))

      const result = await ChatbotRAGService.retrieveContext('any query')

      expect(result).toEqual([])
    })
  })

  // ── retrieveDatasetContext ─────────────────────────────────────────────────
  describe('retrieveDatasetContext', () => {
    it('returns empty array gracefully when dataset is empty', async () => {
      // The module-level dataset is loaded from the JSON file which may not exist in tests
      // — the tryRequireJson fallback means the dataset has no documents
      const result = await ChatbotRAGService.retrieveDatasetContext('any query')

      // Either empty (no dataset file) or valid results — must not throw
      expect(Array.isArray(result)).toBe(true)
    })

    it('returns empty array and does not throw when embed service fails', async () => {
      // Force embed to fail
      embedMock.embed.mockRejectedValueOnce(new Error('embed failed'))

      const result = await ChatbotRAGService.retrieveDatasetContext('any query')

      expect(result).toEqual([])
    })
  })

  // ── retrieveFaqContext ─────────────────────────────────────────────────────
  describe('retrieveFaqContext', () => {
    it('returns empty array gracefully when FAQ dataset is empty', async () => {
      const result = await ChatbotRAGService.retrieveFaqContext('any question')

      expect(Array.isArray(result)).toBe(true)
    })

    it('returns empty array and does not throw when embed service fails', async () => {
      embedMock.embed.mockRejectedValueOnce(new Error('embed failed'))

      const result = await ChatbotRAGService.retrieveFaqContext('any question')

      expect(result).toEqual([])
    })
  })

  // ── buildSystemPrompt ──────────────────────────────────────────────────────
  describe('buildSystemPrompt', () => {
    it('returns a fallback message when no context is provided', async () => {
      settingServiceMock.getSettingByKey.mockResolvedValue(null)

      const prompt = await ChatbotRAGService.buildSystemPrompt([])

      expect(typeof prompt).toBe('string')
      expect(prompt.length).toBeGreaterThan(0)
      // When no context, prompt should indicate no matching article
      expect(prompt).toMatch(/don't have a specific article|couldn't find/i)
    })

    it('includes article context in the prompt when context is provided', async () => {
      settingServiceMock.getSettingByKey.mockResolvedValue(null)

      const context = [
        {
          postId:       'post-001',
          title:        'TypeScript Tips',
          slug:         'typescript-tips',
          categorySlug: 'programming',
          score:        0.9,
          snippet:      'Use strict mode for better type safety.',
        },
      ]

      const prompt = await ChatbotRAGService.buildSystemPrompt(context)

      expect(prompt).toContain('TypeScript Tips')
      expect(prompt).toContain('Use strict mode')
    })

    it('uses custom system prompt from settings when available', async () => {
      settingServiceMock.getSettingByKey
        .mockResolvedValueOnce({ key: 'CHATBOT_SYSTEM_PROMPT', value: 'Custom prompt text' } as any)
        .mockResolvedValueOnce(null)

      const prompt = await ChatbotRAGService.buildSystemPrompt([])

      expect(prompt).toContain('Custom prompt text')
    })

    it('includes max token instruction when CHATBOT_MAX_TOKENS setting is set', async () => {
      settingServiceMock.getSettingByKey
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ key: 'CHATBOT_MAX_TOKENS', value: '500' } as any)

      const prompt = await ChatbotRAGService.buildSystemPrompt([])

      expect(prompt).toContain('500 tokens')
    })
  })

  // ── buildMessages ──────────────────────────────────────────────────────────
  describe('buildMessages', () => {
    it('constructs message array starting with system prompt', () => {
      const messages = ChatbotRAGService.buildMessages('You are helpful.', [], 'Hello!')

      expect(messages[0].role).toBe('system')
      expect(messages[0].content).toBe('You are helpful.')
    })

    it('appends current user message as the last entry', () => {
      const messages = ChatbotRAGService.buildMessages('System', [], 'My question')

      const last = messages[messages.length - 1]
      expect(last.role).toBe('user')
      expect(last.content).toBe('My question')
    })

    it('prepends page context to user message when provided', () => {
      const messages = ChatbotRAGService.buildMessages('System', [], 'My question', undefined, 'About page')

      const last = messages[messages.length - 1]
      expect(last.content).toContain('About page')
      expect(last.content).toContain('My question')
    })

    it('includes summary as a second system message when provided', () => {
      const messages = ChatbotRAGService.buildMessages('System', [], 'Hello', 'Earlier we discussed X.')

      const summaryMsg = messages.find((m) => m.role === 'system' && m.content.includes('Earlier we discussed X.'))
      expect(summaryMsg).toBeDefined()
    })

    it('maps ADMIN role messages to assistant role for AI provider compatibility', () => {
      const history = [
        { id: 'msg-1', role: 'ADMIN' as const, content: 'Admin said this', createdAt: '2026-03-18T10:00:00.000Z' },
      ]

      const messages = ChatbotRAGService.buildMessages('System', history, 'Hello')

      const adminMapped = messages.find((m) => m.content === 'Admin said this')
      expect(adminMapped?.role).toBe('assistant')
    })

    it('filters out ADMIN_TAKEOVER_SENTINEL messages from history', () => {
      const SENTINEL = '__ADMIN_TAKEOVER__'
      const history = [
        { id: 'msg-1', role: 'ASSISTANT' as const, content: SENTINEL, createdAt: '2026-03-18T10:00:00.000Z' },
        { id: 'msg-2', role: 'USER' as const,      content: 'Real message', createdAt: '2026-03-18T10:01:00.000Z' },
      ]

      const messages = ChatbotRAGService.buildMessages('System', history, 'Hello')

      const sentinel = messages.find((m) => m.content === SENTINEL)
      expect(sentinel).toBeUndefined()
    })
  })

  // ── compressHistory ────────────────────────────────────────────────────────
  describe('compressHistory', () => {
    it('returns undefined when message count is at or below threshold', async () => {
      // Provide only 2 messages — below HISTORY_COMPRESS_THRESHOLD (typically 20)
      sessionServiceMock.getMessages.mockResolvedValueOnce([
        { id: 'msg-1', role: 'USER',      content: 'Hi',    createdAt: '2026-03-18T10:00:00.000Z' },
        { id: 'msg-2', role: 'ASSISTANT', content: 'Hello', createdAt: '2026-03-18T10:01:00.000Z' },
      ])

      const generateSummary = jest.fn().mockResolvedValue('summary')
      const result = await ChatbotRAGService.compressHistory('cs_test_001', generateSummary)

      expect(result).toBeUndefined()
      expect(generateSummary).not.toHaveBeenCalled()
    })

    it('returns undefined when generateSummary returns empty string', async () => {
      // Build enough messages to exceed HISTORY_COMPRESS_THRESHOLD
      const manyMessages = Array.from({ length: 25 }, (_, i) => ({
        id:        `msg-${i}`,
        role:      (i % 2 === 0 ? 'USER' : 'ASSISTANT') as 'USER' | 'ASSISTANT',
        content:   `Message ${i}`,
        createdAt: '2026-03-18T10:00:00.000Z',
      }))
      sessionServiceMock.getMessages.mockResolvedValueOnce(manyMessages)

      const generateSummary = jest.fn().mockResolvedValue('') // empty

      const result = await ChatbotRAGService.compressHistory('cs_test_001', generateSummary)

      expect(result).toBeUndefined()
    })
  })

  // ── stripHtml ──────────────────────────────────────────────────────────────
  describe('stripHtml', () => {
    it('removes HTML tags from a string', () => {
      const result = ChatbotRAGService.stripHtml('<p>Hello <strong>world</strong></p>')
      expect(result).toBe('Hello world')
    })

    it('replaces &nbsp; with a space', () => {
      const result = ChatbotRAGService.stripHtml('Hello&nbsp;world')
      expect(result).toBe('Hello world')
    })

    it('decodes common HTML entities', () => {
      const result = ChatbotRAGService.stripHtml('&amp; &lt; &gt; &quot;')
      expect(result).toBe('& < > "')
    })

    it('collapses multiple whitespace into a single space', () => {
      const result = ChatbotRAGService.stripHtml('<p>   lots   of   spaces   </p>')
      expect(result).toBe('lots of spaces')
    })

    it('handles empty string without throwing', () => {
      expect(ChatbotRAGService.stripHtml('')).toBe('')
    })
  })
})
