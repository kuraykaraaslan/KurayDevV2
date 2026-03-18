jest.mock('@/libs/redis', () => ({
  __esModule: true,
  default: { get: jest.fn(), set: jest.fn(), zadd: jest.fn() },
}))

jest.mock('@/services/AIServices', () => ({
  AIService: {
    getProvider: jest.fn(),
  },
}))

jest.mock('@/libs/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

jest.mock('@/libs/websocket/WSManager', () => ({
  __esModule: true,
  default: { publish: jest.fn(), subscribe: jest.fn() },
}))

jest.mock('@/services/ChatbotService/ChatSessionService', () => ({
  __esModule: true,
  default: {
    getSession:    jest.fn(),
    createSession: jest.fn(),
    addMessage:    jest.fn(),
    updateSession: jest.fn(),
    getMessages:   jest.fn(),
  },
}))

jest.mock('@/services/ChatbotService/ChatbotRAGService', () => ({
  __esModule: true,
  default: {
    retrieveContext:        jest.fn().mockResolvedValue([]),
    retrieveDatasetContext: jest.fn().mockResolvedValue([]),
    retrieveFaqContext:     jest.fn().mockResolvedValue([]),
    compressHistory:        jest.fn().mockResolvedValue(null),
    buildSystemPrompt:      jest.fn().mockResolvedValue('system-prompt'),
    buildMessages:          jest.fn().mockReturnValue([{ role: 'user', content: 'hello' }]),
  },
}))

jest.mock('@/services/ChatbotService/ChatbotModerationService', () => ({
  __esModule: true,
  default: {
    isUserBanned:       jest.fn(),
    checkUserRateLimit: jest.fn(),
  },
}))

import redis from '@/libs/redis'
import { AIService } from '@/services/AIServices'
import ChatSessionService from '@/services/ChatbotService/ChatSessionService'
import ChatbotModerationService from '@/services/ChatbotService/ChatbotModerationService'
import ChatbotService from '@/services/ChatbotService'
import ChatbotMessages from '@/messages/ChatbotMessages'

const redisMock = redis as jest.Mocked<typeof redis>
const aiServiceMock = AIService as jest.Mocked<typeof AIService>
const chatSessionMock = ChatSessionService as jest.Mocked<typeof ChatSessionService>
const moderationMock = ChatbotModerationService as jest.Mocked<typeof ChatbotModerationService>

const SESSION = {
  chatSessionId: 'sess-1',
  userId: 'user-1',
  status: 'ACTIVE' as const,
  title: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

async function collect(gen: AsyncGenerator<string>): Promise<string[]> {
  const chunks: string[] = []
  for await (const c of gen) chunks.push(c)
  return chunks
}

describe('ChatbotService.chatStream', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    redisMock.get.mockResolvedValue(null)
    redisMock.set.mockResolvedValue('OK')
    redisMock.zadd.mockResolvedValue(1)
    chatSessionMock.addMessage.mockResolvedValue(undefined as any)
    chatSessionMock.updateSession.mockResolvedValue(undefined as any)
    chatSessionMock.getMessages.mockResolvedValue([])
    chatSessionMock.getSession.mockResolvedValue(SESSION as any)
  })

  it('yields error event when user is banned', async () => {
    moderationMock.isUserBanned.mockResolvedValueOnce(true)

    const gen = ChatbotService.chatStream({ message: 'hi', userId: 'user-1' })
    const chunks = await collect(gen)
    const errorChunk = chunks.find((c) => c.includes('"type":"error"'))
    expect(errorChunk).toBeDefined()
    expect(errorChunk).toContain(ChatbotMessages.USER_BANNED)
  })

  it('yields error event when user rate limit is exceeded', async () => {
    moderationMock.isUserBanned.mockResolvedValueOnce(false)
    moderationMock.checkUserRateLimit.mockResolvedValueOnce(false)

    const gen = ChatbotService.chatStream({ message: 'hi', userId: 'user-1' })
    const chunks = await collect(gen)
    expect(chunks.some((c) => c.includes(ChatbotMessages.RATE_LIMIT_EXCEEDED))).toBe(true)
  })

  it('yields meta and typing events on normal flow', async () => {
    moderationMock.isUserBanned.mockResolvedValueOnce(false)
    moderationMock.checkUserRateLimit.mockResolvedValueOnce(true)
    chatSessionMock.createSession.mockResolvedValueOnce(SESSION as any)
    chatSessionMock.getSession.mockResolvedValue(SESSION as any)

    async function* fakeStream() {
      yield 'Hello'
      yield ' world'
    }
    const mockProvider = { generateText: jest.fn(), streamText: fakeStream }
    aiServiceMock.getProvider.mockReturnValue(mockProvider as any)

    const gen = ChatbotService.chatStream({ message: 'hi', userId: 'user-1' })
    const chunks = await collect(gen)

    expect(chunks.some((c) => c.includes('"type":"meta"'))).toBe(true)
    expect(chunks.some((c) => c.includes('"type":"typing"'))).toBe(true)
    expect(chunks.some((c) => c.includes('"type":"done"'))).toBe(true)
  })

  it('yields admin-takeover sentinel when session is TAKEN_OVER', async () => {
    moderationMock.isUserBanned.mockResolvedValueOnce(false)
    moderationMock.checkUserRateLimit.mockResolvedValueOnce(true)
    const takenOverSession = { ...SESSION, status: 'TAKEN_OVER' as const }
    chatSessionMock.createSession.mockResolvedValueOnce(takenOverSession as any)
    chatSessionMock.getSession.mockResolvedValue(takenOverSession as any)

    const mockProvider = { generateText: jest.fn(), streamText: jest.fn() }
    aiServiceMock.getProvider.mockReturnValue(mockProvider as any)

    const gen = ChatbotService.chatStream({ message: 'hi', userId: 'user-1' })
    const chunks = await collect(gen)
    expect(chunks.some((c) => c.includes('"type":"done"'))).toBe(true)
  })

  it('yields error event when AI stream throws', async () => {
    moderationMock.isUserBanned.mockResolvedValueOnce(false)
    moderationMock.checkUserRateLimit.mockResolvedValueOnce(true)
    chatSessionMock.createSession.mockResolvedValueOnce(SESSION as any)
    chatSessionMock.getSession.mockResolvedValue(SESSION as any)

    async function* failingStream() {
      throw new Error('AI stream crashed')
      yield ''
    }
    const mockProvider = { generateText: jest.fn().mockResolvedValue(''), streamText: failingStream }
    aiServiceMock.getProvider.mockReturnValue(mockProvider as any)

    const gen = ChatbotService.chatStream({ message: 'hi', userId: 'user-1' })
    const chunks = await collect(gen)
    expect(chunks.some((c) => c.includes('"type":"error"'))).toBe(true)
  })
})
