/**
 * Tests for ChatbotService (services/ChatbotService/index.ts)
 *
 * Strategy: all tests drive the service through the public chatStream()
 * async-generator method and collect yielded SSE strings using collectStream().
 * Every internal dependency is mocked at module level.
 */

import ChatbotService from '@/services/ChatbotService'
import ChatSessionService from '@/services/ChatbotService/ChatSessionService'
import ChatbotRAGService from '@/services/ChatbotService/ChatbotRAGService'
import ChatbotModerationService from '@/services/ChatbotService/ChatbotModerationService'
import { AIService } from '@/services/AIServices'
import redis from '@/libs/redis'
import { ADMIN_TAKEOVER_SENTINEL } from '@/services/ChatbotService/constants'
import ChatbotMessages from '@/messages/ChatbotMessages'

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock('@/libs/redis', () => ({
  __esModule: true,
  default: {
    get:      jest.fn(),
    set:      jest.fn(),
    setex:    jest.fn(),
    del:      jest.fn(),
    zadd:     jest.fn(),
    sadd:     jest.fn(),
    smembers: jest.fn().mockResolvedValue([]),
    incr:     jest.fn(),
    expire:   jest.fn(),
    rpush:    jest.fn(),
    lrange:   jest.fn().mockResolvedValue([]),
    pipeline: jest.fn(),
  },
}))

jest.mock('@/services/ChatbotService/ChatSessionService', () => ({
  __esModule: true,
  default: {
    getSession:    jest.fn(),
    createSession: jest.fn(),
    updateSession: jest.fn(),
    addMessage:    jest.fn(),
    getMessages:   jest.fn(),
  },
}))

jest.mock('@/services/ChatbotService/ChatbotRAGService', () => ({
  __esModule: true,
  default: {
    retrieveContext:        jest.fn(),
    retrieveDatasetContext: jest.fn(),
    retrieveFaqContext:     jest.fn(),
    compressHistory:        jest.fn(),
    buildSystemPrompt:      jest.fn(),
    buildMessages:          jest.fn(),
  },
}))

jest.mock('@/services/ChatbotService/ChatbotModerationService', () => ({
  __esModule: true,
  default: {
    isUserBanned:       jest.fn(),
    checkUserRateLimit: jest.fn(),
  },
}))

jest.mock('@/services/AIServices', () => ({
  __esModule: true,
  AIService: {
    getProvider: jest.fn(),
  },
}))

// wsManager publish is a side-effect we don't need to assert; mock it away.
jest.mock('@/libs/websocket/WSManager', () => ({
  __esModule: true,
  default: {
    publish: jest.fn(),
  },
}))

// ── Typed mock helpers ────────────────────────────────────────────────────────

const redisMock          = redis           as jest.Mocked<typeof redis>
const sessionSvcMock     = ChatSessionService     as jest.Mocked<typeof ChatSessionService>
const ragSvcMock         = ChatbotRAGService      as jest.Mocked<typeof ChatbotRAGService>
const moderationMock     = ChatbotModerationService as jest.Mocked<typeof ChatbotModerationService>
const aiServiceMock      = AIService              as jest.Mocked<typeof AIService>

// ── Utility ───────────────────────────────────────────────────────────────────

async function collectStream(gen: AsyncGenerator<string>): Promise<string[]> {
  const results: string[] = []
  for await (const item of gen) {
    results.push(item)
  }
  return results
}

/** Parse the JSON payload from a single SSE data line. */
function parseEvent(raw: string): Record<string, unknown> {
  const jsonPart = raw.replace(/^data: /, '').replace(/\n\n$/, '')
  return JSON.parse(jsonPart)
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_SESSION = {
  chatSessionId: 'cs_test_001',
  userId:        'user-123',
  userEmail:     'user@example.com',
  browserId:     'browser-abc',
  status:        'ACTIVE' as const,
  title:         undefined,
  takenOverBy:   undefined,
  summary:       undefined,
  createdAt:     new Date().toISOString(),
  updatedAt:     new Date().toISOString(),
}

const BASE_STREAM_ARGS = {
  message:       'Hello chatbot',
  chatSessionId: 'cs_test_001',
  userId:        'user-123',
  userEmail:     'user@example.com',
  browserId:     'browser-abc',
  provider:      'OPENAI',
  model:         'gpt-4o',
}

/** Build a mock AI provider that emits the given chunks via streamText. */
function makeAIProvider(chunks: string[] = ['Hello', ' world']) {
  return {
    streamText: jest.fn().mockImplementation(async function* () {
      for (const chunk of chunks) yield chunk
    }),
    generateText: jest.fn().mockResolvedValue('summary'),
    provider: 'OPENAI',
  }
}

/** Set up the RAG pipeline mocks to return sensible defaults. */
function setupRAGMocks(ragContext: unknown[] = []) {
  ragSvcMock.retrieveContext.mockResolvedValue(ragContext as any)
  ragSvcMock.retrieveDatasetContext.mockResolvedValue([])
  ragSvcMock.retrieveFaqContext.mockResolvedValue([])
  ragSvcMock.compressHistory.mockResolvedValue(undefined)
  ragSvcMock.buildSystemPrompt.mockResolvedValue('system prompt')
  ragSvcMock.buildMessages.mockReturnValue([
    { role: 'system',    content: 'system prompt' },
    { role: 'user',      content: 'Hello chatbot' },
  ] as any)
  sessionSvcMock.getSession.mockResolvedValue(BASE_SESSION as any)
  sessionSvcMock.getMessages.mockResolvedValue([])
}

// ── Setup/teardown ────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()

  // Defaults: user is not banned, not rate-limited
  moderationMock.isUserBanned.mockResolvedValue(false)
  moderationMock.checkUserRateLimit.mockResolvedValue(true)

  // addMessage succeeds silently
  sessionSvcMock.addMessage.mockResolvedValue(undefined)
  sessionSvcMock.updateSession.mockResolvedValue(undefined)

  // redis.set / zadd succeed silently
  redisMock.set.mockResolvedValue('OK')
  redisMock.zadd.mockResolvedValue(1 as any)
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChatbotService.chatStream()', () => {

  // 1. Banned user
  it('yields a single error event and stops when the user is banned', async () => {
    moderationMock.isUserBanned.mockResolvedValue(true)

    const events = await collectStream(ChatbotService.chatStream(BASE_STREAM_ARGS))

    expect(events).toHaveLength(1)
    const evt = parseEvent(events[0])
    expect(evt.type).toBe('error')
    expect(evt.error).toBe(ChatbotMessages.USER_BANNED)
  })

  // 2. Rate-limited user
  it('yields a single error event and stops when the user is rate-limited', async () => {
    moderationMock.isUserBanned.mockResolvedValue(false)
    moderationMock.checkUserRateLimit.mockResolvedValue(false)

    const events = await collectStream(ChatbotService.chatStream(BASE_STREAM_ARGS))

    expect(events).toHaveLength(1)
    const evt = parseEvent(events[0])
    expect(evt.type).toBe('error')
    expect(evt.error).toBe(ChatbotMessages.RATE_LIMIT_EXCEEDED)
  })

  // 3. Normal flow – meta and typing events
  it('yields meta and typing events before streaming AI chunks', async () => {
    setupRAGMocks()
    const provider = makeAIProvider(['Hi'])
    aiServiceMock.getProvider.mockReturnValue(provider as any)

    const events = await collectStream(ChatbotService.chatStream(BASE_STREAM_ARGS))

    const types = events.map((e) => parseEvent(e).type)
    expect(types).toContain('meta')
    expect(types).toContain('typing')
    // meta must appear before typing
    expect(types.indexOf('meta')).toBeLessThan(types.indexOf('typing'))
  })

  // 4. meta event carries the chatSessionId
  it('meta event contains the resolved chatSessionId', async () => {
    setupRAGMocks()
    const provider = makeAIProvider(['chunk'])
    aiServiceMock.getProvider.mockReturnValue(provider as any)

    const events = await collectStream(ChatbotService.chatStream(BASE_STREAM_ARGS))
    const metaEvt = events.map(parseEvent).find((e) => e.type === 'meta')

    expect(metaEvt).toBeDefined()
    expect(metaEvt!.chatSessionId).toBe('cs_test_001')
  })

  // 5. AI chunks are streamed through
  it('yields one chunk event per AI token and a done event at the end', async () => {
    setupRAGMocks()
    const provider = makeAIProvider(['Hello', ' ', 'world'])
    aiServiceMock.getProvider.mockReturnValue(provider as any)

    const events = await collectStream(ChatbotService.chatStream(BASE_STREAM_ARGS))
    const parsed = events.map(parseEvent)

    const chunks = parsed.filter((e) => e.type === 'chunk')
    expect(chunks.map((c) => c.content)).toEqual(['Hello', ' ', 'world'])

    const done = parsed.find((e) => e.type === 'done')
    expect(done).toBeDefined()
  })

  // 6. TAKEN_OVER session
  it('yields chunk with ADMIN_TAKEOVER_SENTINEL and done when session is TAKEN_OVER', async () => {
    const takenSession = { ...BASE_SESSION, status: 'TAKEN_OVER' as const }
    sessionSvcMock.getSession.mockResolvedValue(takenSession as any)

    const events = await collectStream(ChatbotService.chatStream(BASE_STREAM_ARGS))
    const parsed = events.map(parseEvent)

    const chunkEvt = parsed.find((e) => e.type === 'chunk')
    expect(chunkEvt).toBeDefined()
    expect(chunkEvt!.content).toBe(ADMIN_TAKEOVER_SENTINEL)

    const doneEvt = parsed.find((e) => e.type === 'done')
    expect(doneEvt).toBeDefined()

    // AI provider must NOT be called for a taken-over session
    expect(aiServiceMock.getProvider).not.toHaveBeenCalled()
  })

  // 7. Empty AI reply
  it('yields an error event when the AI returns an empty reply', async () => {
    setupRAGMocks()
    const provider = makeAIProvider([]) // no chunks → fullReply stays ''
    aiServiceMock.getProvider.mockReturnValue(provider as any)

    const events = await collectStream(ChatbotService.chatStream(BASE_STREAM_ARGS))
    const parsed = events.map(parseEvent)

    const errEvt = parsed.find((e) => e.type === 'error')
    expect(errEvt).toBeDefined()
    expect(errEvt!.error).toBe(ChatbotMessages.CHATBOT_RESPONSE_FAILED)

    // done must NOT be yielded after an empty reply error
    const doneEvt = parsed.find((e) => e.type === 'done')
    expect(doneEvt).toBeUndefined()
  })

  // 8. AI stream throws
  it('yields an error event and stops when the AI streamText throws', async () => {
    setupRAGMocks()
    const provider = {
      streamText: jest.fn().mockImplementation(async function* () {
        yield 'partial'
        throw new Error('AI network error')
      }),
      generateText: jest.fn().mockResolvedValue('summary'),
      provider: 'OPENAI',
    }
    aiServiceMock.getProvider.mockReturnValue(provider as any)

    const events = await collectStream(ChatbotService.chatStream(BASE_STREAM_ARGS))
    const parsed = events.map(parseEvent)

    const errEvt = parsed.find((e) => e.type === 'error')
    expect(errEvt).toBeDefined()
    expect(errEvt!.error).toBe(ChatbotMessages.CHATBOT_RESPONSE_FAILED)
  })

  // 9. Session creation for a new user (no existing session)
  it('creates a new session when no existing session is found', async () => {
    // No pre-existing session; browserId lookup also returns nothing
    sessionSvcMock.getSession.mockResolvedValue(undefined)
    redisMock.get.mockResolvedValue(null)

    const newSession = { ...BASE_SESSION, chatSessionId: 'cs_new_001' }
    sessionSvcMock.createSession.mockResolvedValue(newSession as any)

    setupRAGMocks()
    // Re-stub getSession so RAG pipeline calls after creation work too
    sessionSvcMock.getSession.mockResolvedValue(newSession as any)

    const provider = makeAIProvider(['ok'])
    aiServiceMock.getProvider.mockReturnValue(provider as any)

    const events = await collectStream(
      ChatbotService.chatStream({
        ...BASE_STREAM_ARGS,
        chatSessionId: undefined, // explicitly no session ID
      })
    )

    expect(sessionSvcMock.createSession).toHaveBeenCalledWith(
      BASE_STREAM_ARGS.userId,
      BASE_STREAM_ARGS.userEmail,
      BASE_STREAM_ARGS.browserId,
    )

    const metaEvt = events.map(parseEvent).find((e) => e.type === 'meta')
    expect(metaEvt!.chatSessionId).toBe('cs_new_001')
  })

  // 10. Sources are yielded when RAG context is non-empty
  it('yields a sources event before done when RAG context is present', async () => {
    const ragCtx = [
      {
        postId:       'post-1',
        title:        'Test Post',
        slug:         'test-post',
        categorySlug: 'blog',
        score:        0.9,
        snippet:      'snippet text',
      },
    ]
    setupRAGMocks(ragCtx)
    const provider = makeAIProvider(['answer'])
    aiServiceMock.getProvider.mockReturnValue(provider as any)

    const events = await collectStream(ChatbotService.chatStream(BASE_STREAM_ARGS))
    const parsed = events.map(parseEvent)

    const sourcesEvt = parsed.find((e) => e.type === 'sources')
    expect(sourcesEvt).toBeDefined()
    expect(Array.isArray(sourcesEvt!.sources)).toBe(true)
    expect((sourcesEvt!.sources as any[]).length).toBeGreaterThan(0)

    // done should follow sources
    const doneIdx  = parsed.findIndex((e) => e.type === 'done')
    const srcIdx   = parsed.findIndex((e) => e.type === 'sources')
    expect(srcIdx).toBeLessThan(doneIdx)
  })

  // 11. No sources event when RAG context is empty
  it('does NOT yield a sources event when there is no RAG context', async () => {
    setupRAGMocks([]) // empty context
    const provider = makeAIProvider(['ok'])
    aiServiceMock.getProvider.mockReturnValue(provider as any)

    const events = await collectStream(ChatbotService.chatStream(BASE_STREAM_ARGS))
    const parsed = events.map(parseEvent)

    const sourcesEvt = parsed.find((e) => e.type === 'sources')
    expect(sourcesEvt).toBeUndefined()
  })

  // 12. Session title is set from the first message when it is absent
  it('updates the session title from the message when the session has no title', async () => {
    const sessionWithoutTitle = { ...BASE_SESSION, title: undefined }

    // Set up mocks individually to avoid setupRAGMocks() overwriting getSession
    sessionSvcMock.getSession.mockResolvedValue(sessionWithoutTitle as any)
    ragSvcMock.retrieveContext.mockResolvedValue([])
    ragSvcMock.retrieveDatasetContext.mockResolvedValue([])
    ragSvcMock.retrieveFaqContext.mockResolvedValue([])
    ragSvcMock.compressHistory.mockResolvedValue(undefined)
    ragSvcMock.buildSystemPrompt.mockResolvedValue('system prompt')
    ragSvcMock.buildMessages.mockReturnValue([
      { role: 'system', content: 'system prompt' },
      { role: 'user',   content: 'What is the meaning of life?' },
    ] as any)
    sessionSvcMock.getMessages.mockResolvedValue([])

    const provider = makeAIProvider(['reply'])
    aiServiceMock.getProvider.mockReturnValue(provider as any)

    await collectStream(
      ChatbotService.chatStream({
        ...BASE_STREAM_ARGS,
        message: 'What is the meaning of life?',
      })
    )

    expect(sessionSvcMock.updateSession).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'What is the meaning of life?' })
    )
  })

  // 13. Ownership mismatch – session belongs to a different user
  it('creates a new session when the found session belongs to a different user', async () => {
    const foreignSession = { ...BASE_SESSION, userId: 'other-user-999' }
    const ownSession     = { ...BASE_SESSION, chatSessionId: 'cs_own_001', userId: 'user-123' }

    // First getSession call returns foreign session (ownership fails → session = undefined)
    // browserId lookup: redis.get returns null → no browser session
    // createSession is then called and returns ownSession
    // Subsequent getSession calls (in RAG pipeline) return ownSession
    sessionSvcMock.getSession
      .mockResolvedValueOnce(foreignSession as any) // chatSessionId lookup
      .mockResolvedValue(ownSession as any)          // RAG pipeline calls
    redisMock.get.mockResolvedValue(null)
    sessionSvcMock.createSession.mockResolvedValue(ownSession as any)

    ragSvcMock.retrieveContext.mockResolvedValue([])
    ragSvcMock.retrieveDatasetContext.mockResolvedValue([])
    ragSvcMock.retrieveFaqContext.mockResolvedValue([])
    ragSvcMock.compressHistory.mockResolvedValue(undefined)
    ragSvcMock.buildSystemPrompt.mockResolvedValue('system prompt')
    ragSvcMock.buildMessages.mockReturnValue([
      { role: 'system', content: 'system prompt' },
      { role: 'user',   content: 'Hello chatbot' },
    ] as any)
    sessionSvcMock.getMessages.mockResolvedValue([])

    const provider = makeAIProvider(['hi'])
    aiServiceMock.getProvider.mockReturnValue(provider as any)

    const events = await collectStream(ChatbotService.chatStream(BASE_STREAM_ARGS))
    const metaEvt = events.map(parseEvent).find((e) => e.type === 'meta')
    expect(metaEvt!.chatSessionId).toBe('cs_own_001')
    expect(sessionSvcMock.createSession).toHaveBeenCalled()
  })

  // 14. Guest user session restored via browserId
  it('restores a guest session by browserId when no chatSessionId is provided', async () => {
    const guestUserId = 'guest:abc123'
    const guestSession = {
      ...BASE_SESSION,
      userId:    guestUserId,
      browserId: 'browser-abc',
      status:    'ACTIVE' as const,
      chatSessionId: 'cs_guest_001',
    }

    // No chatSessionId → first branch skipped entirely.
    // redis.get(BROWSER_SESSION) returns an existing session ID.
    // getSession(browserSessionId) returns guestSession where userId === guestUserId → session found.
    // Subsequent calls (RAG pipeline) also return guestSession.
    redisMock.get.mockResolvedValue('cs_guest_001')
    sessionSvcMock.getSession.mockResolvedValue(guestSession as any)

    moderationMock.isUserBanned.mockResolvedValue(false)
    moderationMock.checkUserRateLimit.mockResolvedValue(true)

    ragSvcMock.retrieveContext.mockResolvedValue([])
    ragSvcMock.retrieveDatasetContext.mockResolvedValue([])
    ragSvcMock.retrieveFaqContext.mockResolvedValue([])
    ragSvcMock.compressHistory.mockResolvedValue(undefined)
    ragSvcMock.buildSystemPrompt.mockResolvedValue('system prompt')
    ragSvcMock.buildMessages.mockReturnValue([
      { role: 'system', content: 'system prompt' },
      { role: 'user',   content: 'Hello chatbot' },
    ] as any)
    sessionSvcMock.getMessages.mockResolvedValue([])

    const provider = makeAIProvider(['hey'])
    aiServiceMock.getProvider.mockReturnValue(provider as any)

    const events = await collectStream(
      ChatbotService.chatStream({
        ...BASE_STREAM_ARGS,
        userId:        guestUserId,
        chatSessionId: undefined,
      })
    )

    const metaEvt = events.map(parseEvent).find((e) => e.type === 'meta')
    expect(metaEvt).toBeDefined()
    expect(metaEvt!.chatSessionId).toBe('cs_guest_001')
    // session was found via browserId; createSession must NOT have been called
    expect(sessionSvcMock.createSession).not.toHaveBeenCalled()
  })
})
