import wsManager from '@/libs/websocket/WSManager'
import ChatbotService from '@/services/ChatbotService'
import BrowserSessionService from '@/services/ChatbotService/BrowserSessionService'
import ChatbotAdminService from '@/services/ChatbotService/ChatbotAdminService'
import { ADMIN_TAKEOVER_SENTINEL } from '@/services/ChatbotService/constants'
import { ChatbotRequestSchema } from '@/dtos/ChatbotDTO'
import ChatbotMessages from '@/messages/ChatbotMessages'
import AuthMessages from '@/messages/AuthMessages'
import Logger from '@/libs/logger'
import type { WSConnectedClient, WSBaseEvent, WSFeatureHandler } from '@/types/common/WebSocketTypes'
import type { ChatMessage, ChatbotWSServerEvent } from '@/types/features/ChatbotTypes'

// ── Helpers ───────────────────────────────────────────────────────────

function send(client: WSConnectedClient, event: ChatbotWSServerEvent) {
  if (client.ws.readyState === 1 /* OPEN */) {
    client.ws.send(JSON.stringify(event))
  }
}

// ── Event handlers ────────────────────────────────────────────────────

async function handleRestore(client: WSConnectedClient, browserId: string) {
  if (!browserId) {
    send(client, { ns: 'chatbot', type: 'error', error: 'browserId required' })
    return
  }

  // Store browserId in client meta for later use
  client.meta.browserId = browserId

  // Cancel any pending disconnect timer
  await BrowserSessionService.cancelBrowserDisconnect(browserId)

  const result = await BrowserSessionService.restoreSession(client.userId, browserId)
  if (!result) return // Nothing to restore — fresh session

  // Auto-subscribe to restored session channel
  wsManager.subscribe(client.ws, 'chatbot', result.session.chatSessionId)

  // Send history back to client
  const messages: ChatMessage[] = result.messages
    .filter((m) => m.content !== ADMIN_TAKEOVER_SENTINEL)
    .map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      sources: m.sources,
      adminUserId: m.adminUserId,
      createdAt: m.createdAt,
    }))

  send(client, {
    ns: 'chatbot',
    type: 'history',
    chatSessionId: result.session.chatSessionId,
    messages,
    status: result.session.status,
  })

  // Notify admins watching this session that user came back online
  wsManager.publish('chatbot', result.session.chatSessionId, {
    ns: 'chatbot',
    type: 'browser_status',
    chatSessionId: result.session.chatSessionId,
    online: true,
  })
}

async function handleChat(
  client: WSConnectedClient,
  event: WSBaseEvent,
) {
  const parsed = ChatbotRequestSchema.safeParse({
    message: event.message,
    chatSessionId: event.chatSessionId,
    provider: event.provider,
    model: event.model,
    page_context: event.page_context,
  })

  if (!parsed.success) {
    send(client, { ns: 'chatbot', type: 'error', error: parsed.error.errors.map((e) => e.message).join(', ') })
    return
  }

  const { message, chatSessionId, provider, model, page_context } = parsed.data
  const userId = client.userId
  const userEmail = (client.meta.email as string) ?? ''
  const browserId = (client.meta.browserId as string) ?? undefined

  try {
    for await (const sseChunk of ChatbotService.chatStream({
      message,
      chatSessionId,
      userId,
      userEmail,
      browserId,
      provider,
      model,
      pageContext: page_context,
    })) {
      const lines = sseChunk.split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw) continue

        try {
          const evt = JSON.parse(raw) as ChatbotWSServerEvent
          // Ensure ns is set on events coming from SSE format
          const nsEvt = { ...evt, ns: 'chatbot' as const }
          send(client, nsEvt)

          // Auto-subscribe user to this session for real-time updates
          if (nsEvt.type === 'meta' && 'chatSessionId' in nsEvt) {
            wsManager.subscribe(client.ws, 'chatbot', nsEvt.chatSessionId)
          }
        } catch { /* skip malformed */ }
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : ChatbotMessages.CHATBOT_RESPONSE_FAILED
    send(client, { ns: 'chatbot', type: 'error', error: errMsg })
  }
}

function handleSubscribe(
  client: WSConnectedClient,
  chatSessionId: string,
) {
  if (!chatSessionId) {
    send(client, { ns: 'chatbot', type: 'error', error: 'chatSessionId required' })
    return
  }

  const isAdmin = client.role === 'admin'
  if (!isAdmin) {
    send(client, { ns: 'chatbot', type: 'error', error: 'Only admins can subscribe to sessions' })
    return
  }

  wsManager.subscribe(client.ws, 'chatbot', chatSessionId)
}

async function handleAdminReply(
  client: WSConnectedClient,
  chatSessionId: string,
  message: string,
) {
  if (!chatSessionId || !message?.trim()) {
    send(client, { ns: 'chatbot', type: 'error', error: 'chatSessionId and message required' })
    return
  }

  const isAdmin = client.role === 'admin'
  if (!isAdmin) {
    send(client, { ns: 'chatbot', type: 'error', error: AuthMessages.USER_NOT_AUTHENTICATED })
    return
  }

  // Broadcast typing indicator to the user before sending the reply (Phase 13)
  wsManager.publish('chatbot', chatSessionId, {
    ns: 'chatbot',
    type: 'typing',
    role: 'admin',
    chatSessionId,
  })

  const stored = await ChatbotAdminService.adminReply({
    chatSessionId,
    message: message.trim(),
    adminUserId: client.userId,
  })

  const chatMsg: ChatMessage = {
    id: stored.id,
    role: 'admin',
    content: stored.content,
    adminUserId: stored.adminUserId,
    createdAt: stored.createdAt,
  }

  wsManager.publish('chatbot', chatSessionId, {
    ns: 'chatbot',
    type: 'new_message',
    chatSessionId,
    message: chatMsg,
  })

  send(client, { ns: 'chatbot', type: 'done' })
}

// ── Typing indicator handler (Phase 13) ───────────────────────────────

/**
 * Broadcast an admin-typing indicator to all subscribers of the session.
 * Called when the admin client emits a 'typing' event while composing a reply.
 */
function handleTyping(
  client: WSConnectedClient,
  chatSessionId: string,
) {
  if (!chatSessionId) {
    send(client, { ns: 'chatbot', type: 'error', error: 'chatSessionId required' })
    return
  }

  const isAdmin = client.role === 'admin'
  if (!isAdmin) {
    // Only admins broadcast typing indicators via this event.
    // Users' AI typing is emitted by the stream itself.
    return
  }

  wsManager.publish('chatbot', chatSessionId, {
    ns: 'chatbot',
    type: 'typing',
    role: 'admin',
    chatSessionId,
  })
}

// ── Feature handler (implements WSFeatureHandler) ─────────────────────

const ChatbotWSHandler: WSFeatureHandler = {
  ns: 'chatbot',

  async onMessage(client: WSConnectedClient, event: WSBaseEvent) {
    try {
      switch (event.type) {
        case 'restore':
          await handleRestore(client, event.browserId as string)
          break

        case 'chat':
          await handleChat(client, event)
          break

        case 'subscribe':
          handleSubscribe(client, event.chatSessionId as string)
          break

        case 'admin_reply':
          await handleAdminReply(client, event.chatSessionId as string, event.message as string)
          break

        case 'typing':
          handleTyping(client, event.chatSessionId as string)
          break

        default:
          send(client, { ns: 'chatbot', type: 'error', error: `Unknown chatbot event type: ${event.type}` })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Internal error'
      Logger.error(`[ChatbotWS] Event handler error: ${msg}`)
      send(client, { ns: 'chatbot', type: 'error', error: msg })
    }
  },

  onConnect(client: WSConnectedClient) {
    Logger.info(`[ChatbotWS] Client connected: ${client.userId} (${client.role})`)
  },

  async onDisconnect(client: WSConnectedClient) {
    const browserId = client.meta.browserId as string | undefined
    if (browserId) {
      await BrowserSessionService.markBrowserDisconnected(browserId)

      // Notify admins watching this session that user went offline
      const chatSessionId = await BrowserSessionService.getSessionIdByBrowser(browserId)
      if (chatSessionId) {
        wsManager.publish('chatbot', chatSessionId, {
          ns: 'chatbot',
          type: 'browser_status',
          chatSessionId,
          online: false,
        })
      }
    }
    Logger.info(`[ChatbotWS] Client disconnected: ${client.userId}`)
  },
}

export default ChatbotWSHandler
