jest.mock('@/libs/websocket/WSManager', () => ({
  __esModule: true,
  default: {
    subscribe: jest.fn(),
    publish: jest.fn(),
  },
}))

jest.mock('@/services/ChatbotService', () => ({
  __esModule: true,
  default: {
    chatStream: jest.fn(),
  },
}))

jest.mock('@/services/ChatbotService/BrowserSessionService', () => ({
  __esModule: true,
  default: {
    cancelBrowserDisconnect: jest.fn(),
    restoreSession: jest.fn(),
    markBrowserDisconnected: jest.fn(),
    getSessionIdByBrowser: jest.fn(),
  },
}))

jest.mock('@/services/ChatbotService/ChatbotAdminService', () => ({
  __esModule: true,
  default: {
    adminReply: jest.fn(),
  },
}))

import ChatbotWSHandler from '@/services/ChatbotService/handler'
import wsManager from '@/libs/websocket/WSManager'
import ChatbotService from '@/services/ChatbotService'
import BrowserSessionService from '@/services/ChatbotService/BrowserSessionService'
import ChatbotAdminService from '@/services/ChatbotService/ChatbotAdminService'
import Logger from '@/libs/logger'

const mockWsManager = wsManager as jest.Mocked<typeof wsManager>
const mockChatbotService = ChatbotService as jest.Mocked<typeof ChatbotService>
const mockBrowserSession = BrowserSessionService as jest.Mocked<typeof BrowserSessionService>
const mockAdminService = ChatbotAdminService as jest.Mocked<typeof ChatbotAdminService>
const mockLogger = Logger as jest.Mocked<typeof Logger>

function makeClient(overrides: Record<string, any> = {}) {
  return {
    ws: { readyState: 1, send: jest.fn() },
    userId: 'user-1',
    role: 'user',
    meta: { browserId: undefined, email: 'user@example.com' },
    ...overrides,
  } as any
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ── onConnect ─────────────────────────────────────────────────────────────────

describe('ChatbotWSHandler.onConnect', () => {
  it('logs client connection', () => {
    const client = makeClient()
    ChatbotWSHandler.onConnect(client)
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('connected'))
  })
})

// ── onDisconnect ──────────────────────────────────────────────────────────────

describe('ChatbotWSHandler.onDisconnect', () => {
  it('marks browser disconnected and publishes offline status when browserId is set', async () => {
    const client = makeClient({ meta: { browserId: 'browser-abc' } })
    ;(mockBrowserSession.markBrowserDisconnected as jest.Mock).mockResolvedValue(undefined)
    ;(mockBrowserSession.getSessionIdByBrowser as jest.Mock).mockResolvedValue('sess-1')

    await ChatbotWSHandler.onDisconnect(client)

    expect(mockBrowserSession.markBrowserDisconnected).toHaveBeenCalledWith('browser-abc')
    expect(mockBrowserSession.getSessionIdByBrowser).toHaveBeenCalledWith('browser-abc')
    expect(mockWsManager.publish).toHaveBeenCalledWith('chatbot', 'sess-1', expect.objectContaining({ type: 'browser_status', online: false }))
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('disconnected'))
  })

  it('skips publish when no chatSessionId found for browserId', async () => {
    const client = makeClient({ meta: { browserId: 'browser-xyz' } })
    ;(mockBrowserSession.markBrowserDisconnected as jest.Mock).mockResolvedValue(undefined)
    ;(mockBrowserSession.getSessionIdByBrowser as jest.Mock).mockResolvedValue(null)

    await ChatbotWSHandler.onDisconnect(client)

    expect(mockWsManager.publish).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalled()
  })

  it('only logs when no browserId in meta', async () => {
    const client = makeClient({ meta: {} })
    await ChatbotWSHandler.onDisconnect(client)

    expect(mockBrowserSession.markBrowserDisconnected).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('disconnected'))
  })
})

// ── onMessage — unknown type ───────────────────────────────────────────────────

describe('ChatbotWSHandler.onMessage — unknown type', () => {
  it('sends error for unknown event type', async () => {
    const client = makeClient()
    await ChatbotWSHandler.onMessage(client, { type: 'unknown_type' } as any)
    expect(client.ws.send).toHaveBeenCalledWith(expect.stringContaining('Unknown chatbot event type'))
  })

  it('does not send when ws readyState is not OPEN', async () => {
    const client = makeClient({ ws: { readyState: 3, send: jest.fn() } })
    await ChatbotWSHandler.onMessage(client, { type: 'unknown_type' } as any)
    expect(client.ws.send).not.toHaveBeenCalled()
  })
})

// ── onMessage — restore ───────────────────────────────────────────────────────

describe('ChatbotWSHandler.onMessage — restore', () => {
  it('sends error when browserId is missing', async () => {
    const client = makeClient()
    await ChatbotWSHandler.onMessage(client, { type: 'restore', browserId: '' } as any)
    expect(client.ws.send).toHaveBeenCalledWith(expect.stringContaining('browserId required'))
  })

  it('restores session and sends history when session found', async () => {
    const client = makeClient()
    ;(mockBrowserSession.cancelBrowserDisconnect as jest.Mock).mockResolvedValue(undefined)
    ;(mockBrowserSession.restoreSession as jest.Mock).mockResolvedValue({
      session: { chatSessionId: 'sess-1', status: 'ACTIVE' },
      messages: [{ id: 'm1', role: 'USER', content: 'hello', sources: null, adminUserId: null, createdAt: new Date() }],
    })

    await ChatbotWSHandler.onMessage(client, { type: 'restore', browserId: 'browser-1' } as any)

    expect(mockBrowserSession.cancelBrowserDisconnect).toHaveBeenCalledWith('browser-1')
    expect(mockBrowserSession.restoreSession).toHaveBeenCalledWith('user-1', 'browser-1')
    expect(client.ws.send).toHaveBeenCalledWith(expect.stringContaining('history'))
    expect(mockWsManager.publish).toHaveBeenCalledWith('chatbot', 'sess-1', expect.objectContaining({ type: 'browser_status', online: true }))
  })

  it('returns early without sending when restoreSession returns null', async () => {
    const client = makeClient()
    ;(mockBrowserSession.cancelBrowserDisconnect as jest.Mock).mockResolvedValue(undefined)
    ;(mockBrowserSession.restoreSession as jest.Mock).mockResolvedValue(null)

    await ChatbotWSHandler.onMessage(client, { type: 'restore', browserId: 'browser-1' } as any)

    expect(client.ws.send).not.toHaveBeenCalled()
  })

  it('filters out ADMIN_TAKEOVER_SENTINEL messages from history', async () => {
    const client = makeClient()
    ;(mockBrowserSession.cancelBrowserDisconnect as jest.Mock).mockResolvedValue(undefined)
    ;(mockBrowserSession.restoreSession as jest.Mock).mockResolvedValue({
      session: { chatSessionId: 'sess-2', status: 'TAKEN_OVER' },
      messages: [
        { id: 'm1', role: 'USER', content: 'hello', sources: null, adminUserId: null, createdAt: new Date() },
        { id: 'm2', role: 'SYSTEM', content: '__ADMIN_TAKEOVER__', sources: null, adminUserId: null, createdAt: new Date() },
      ],
    })

    await ChatbotWSHandler.onMessage(client, { type: 'restore', browserId: 'browser-2' } as any)

    const sentJson = JSON.parse((client.ws.send as jest.Mock).mock.calls[0][0])
    expect(sentJson.messages).toHaveLength(1)
    expect(sentJson.messages[0].content).toBe('hello')
  })
})

// ── onMessage — subscribe ─────────────────────────────────────────────────────

describe('ChatbotWSHandler.onMessage — subscribe', () => {
  it('sends error when chatSessionId is missing', async () => {
    const client = makeClient()
    await ChatbotWSHandler.onMessage(client, { type: 'subscribe', chatSessionId: '' } as any)
    expect(client.ws.send).toHaveBeenCalledWith(expect.stringContaining('chatSessionId required'))
  })

  it('sends error when non-admin tries to subscribe', async () => {
    const client = makeClient({ role: 'user' })
    await ChatbotWSHandler.onMessage(client, { type: 'subscribe', chatSessionId: 'sess-1' } as any)
    expect(client.ws.send).toHaveBeenCalledWith(expect.stringContaining('Only admins'))
  })

  it('subscribes admin to chatSession', async () => {
    const client = makeClient({ role: 'admin' })
    await ChatbotWSHandler.onMessage(client, { type: 'subscribe', chatSessionId: 'sess-1' } as any)
    expect(mockWsManager.subscribe).toHaveBeenCalledWith(client.ws, 'chatbot', 'sess-1')
    expect(client.ws.send).not.toHaveBeenCalled()
  })
})

// ── onMessage — typing ────────────────────────────────────────────────────────

describe('ChatbotWSHandler.onMessage — typing', () => {
  it('sends error when chatSessionId is missing', async () => {
    const client = makeClient({ role: 'admin' })
    await ChatbotWSHandler.onMessage(client, { type: 'typing', chatSessionId: '' } as any)
    expect(client.ws.send).toHaveBeenCalledWith(expect.stringContaining('chatSessionId required'))
  })

  it('silently returns when non-admin sends typing', async () => {
    const client = makeClient({ role: 'user' })
    await ChatbotWSHandler.onMessage(client, { type: 'typing', chatSessionId: 'sess-1' } as any)
    expect(mockWsManager.publish).not.toHaveBeenCalled()
    expect(client.ws.send).not.toHaveBeenCalled()
  })

  it('publishes typing event when admin sends typing', async () => {
    const client = makeClient({ role: 'admin' })
    await ChatbotWSHandler.onMessage(client, { type: 'typing', chatSessionId: 'sess-1' } as any)
    expect(mockWsManager.publish).toHaveBeenCalledWith('chatbot', 'sess-1', expect.objectContaining({ type: 'typing', role: 'admin' }))
  })
})

// ── onMessage — admin_reply ───────────────────────────────────────────────────

describe('ChatbotWSHandler.onMessage — admin_reply', () => {
  it('sends error when chatSessionId or message is missing', async () => {
    const client = makeClient({ role: 'admin' })
    await ChatbotWSHandler.onMessage(client, { type: 'admin_reply', chatSessionId: '', message: 'hi' } as any)
    expect(client.ws.send).toHaveBeenCalledWith(expect.stringContaining('chatSessionId and message required'))
  })

  it('sends error when non-admin sends admin_reply', async () => {
    const client = makeClient({ role: 'user' })
    await ChatbotWSHandler.onMessage(client, { type: 'admin_reply', chatSessionId: 'sess-1', message: 'hello' } as any)
    expect(client.ws.send).toHaveBeenCalledWith(expect.stringContaining('USER_NOT_AUTHENTICATED'))
  })

  it('publishes typing, stores reply, and broadcasts new_message for admin', async () => {
    const client = makeClient({ role: 'admin' })
    ;(mockAdminService.adminReply as jest.Mock).mockResolvedValue({
      id: 'msg-1',
      content: 'Admin reply',
      adminUserId: 'admin-1',
      createdAt: new Date(),
    })

    await ChatbotWSHandler.onMessage(client, { type: 'admin_reply', chatSessionId: 'sess-1', message: '  Admin reply  ' } as any)

    expect(mockAdminService.adminReply).toHaveBeenCalledWith({
      chatSessionId: 'sess-1',
      message: 'Admin reply',
      adminUserId: 'user-1',
    })
    expect(mockWsManager.publish).toHaveBeenCalledWith('chatbot', 'sess-1', expect.objectContaining({ type: 'typing' }))
    expect(mockWsManager.publish).toHaveBeenCalledWith('chatbot', 'sess-1', expect.objectContaining({ type: 'new_message' }))
  })
})

// ── onMessage — chat ──────────────────────────────────────────────────────────

describe('ChatbotWSHandler.onMessage — chat', () => {
  it('sends validation error when message is missing', async () => {
    const client = makeClient()
    await ChatbotWSHandler.onMessage(client, { type: 'chat', message: '' } as any)
    expect(client.ws.send).toHaveBeenCalledWith(expect.stringContaining('error'))
  })

  it('sends error when chatStream throws', async () => {
    const client = makeClient()
    async function* failingStream() { throw new Error('stream failed') }
    ;(mockChatbotService.chatStream as jest.Mock).mockReturnValue(failingStream())

    await ChatbotWSHandler.onMessage(client, { type: 'chat', message: 'hello', chatSessionId: 'sess-1', provider: 'openai', model: 'gpt-4o' } as any)

    expect(client.ws.send).toHaveBeenCalledWith(expect.stringContaining('stream failed'))
  })

  it('forwards SSE chunks from chatStream to client', async () => {
    const client = makeClient()
    async function* goodStream() {
      yield 'data: {"type":"chunk","content":"Hello"}\n\n'
      yield 'data: {"type":"done"}\n\n'
    }
    ;(mockChatbotService.chatStream as jest.Mock).mockReturnValue(goodStream())

    await ChatbotWSHandler.onMessage(client, { type: 'chat', message: 'hi', chatSessionId: 'sess-1', provider: 'openai', model: 'gpt-4o' } as any)

    expect(client.ws.send).toHaveBeenCalledWith(expect.stringContaining('chunk'))
    expect(client.ws.send).toHaveBeenCalledWith(expect.stringContaining('done'))
  })

  it('subscribes client to session when meta event received', async () => {
    const client = makeClient()
    async function* metaStream() {
      yield 'data: {"type":"meta","chatSessionId":"new-sess"}\n\n'
    }
    ;(mockChatbotService.chatStream as jest.Mock).mockReturnValue(metaStream())

    await ChatbotWSHandler.onMessage(client, { type: 'chat', message: 'hi', chatSessionId: 'sess-1', provider: 'openai', model: 'gpt-4o' } as any)

    expect(mockWsManager.subscribe).toHaveBeenCalledWith(client.ws, 'chatbot', 'new-sess')
  })
})

// ── onMessage — error handling ────────────────────────────────────────────────

describe('ChatbotWSHandler.onMessage — error propagation', () => {
  it('catches thrown errors in handlers and sends error event', async () => {
    const client = makeClient()
    ;(mockBrowserSession.cancelBrowserDisconnect as jest.Mock).mockRejectedValue(new Error('Redis down'))

    await ChatbotWSHandler.onMessage(client, { type: 'restore', browserId: 'browser-err' } as any)

    expect(client.ws.send).toHaveBeenCalledWith(expect.stringContaining('Redis down'))
    expect(mockLogger.error).toHaveBeenCalled()
  })
})
