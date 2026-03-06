
import type { WebSocket, WebSocketServer } from 'ws'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import AuthMessages from '@/messages/AuthMessages'
import wsManager from '@/libs/websocket/WSManager'
import ChatbotWSHandler from '@/services/ChatbotService/handler'
import ChatSessionService from '@/services/ChatbotService/ChatSessionService'
import ChatbotMessages from '@/messages/ChatbotMessages'
import Logger from '@/libs/logger'
import type { WSBaseEvent } from '@/types/common/WebSocketTypes'
import { NextResponse } from 'next/server'

// ── Register all feature handlers on first import ────────────────────
// Add new feature handlers here as the system grows.
wsManager.registerHandler(ChatbotWSHandler)

/**
 * UPGRADE /api/chatbot — Central WebSocket endpoint.
 *
 * All features share this single WS connection. Messages are routed
 * by their `ns` (namespace) field to the appropriate feature handler.
 *
 * Wire format (JSON):
 *
 * Client → Server:
 *   { ns: "chatbot",  type: "chat", message: "...", ... }
 *   { ns: "system",   type: "ping" }
 *
 * Server → Client:
 *   { ns: "chatbot",  type: "chunk", content: "..." }
 *   { ns: "system",   type: "pong" }
 *   { ns: "system",   type: "connected", userId, role }
 *   { ns: "system",   type: "error", error: "..." }
 */
export function UPGRADE(
  client: WebSocket,
  _server: WebSocketServer,
  request: NextRequest,
) {
  handleConnection(client, request).catch((err) => {
    Logger.error(`[WS] Connection setup failed: ${err.message}`)
    safeSend(client, { ns: 'system', type: 'error', error: AuthMessages.USER_NOT_AUTHENTICATED })
    client.close(1008, 'Authentication failed')
  })
}

// ── Helpers ───────────────────────────────────────────────────────────

function safeSend(ws: WebSocket, event: Record<string, unknown>) {
  if (ws.readyState === 1) ws.send(JSON.stringify(event))
}

// ── Main connection handler ───────────────────────────────────────────

async function handleConnection(client: WebSocket, request: NextRequest) {
  const auth = await AuthMiddleware.authenticateUserByRequest({
    request,
    requiredUserRole: 'GUEST',
  })

  const user = auth.user
  if (!user) {
    safeSend(client, { ns: 'system', type: 'error', error: AuthMessages.USER_NOT_AUTHENTICATED })
    client.close(1008, 'Authentication required')
    return
  }

  const isAdmin = user.userRole === 'ADMIN' || user.userRole === 'SUPER_ADMIN'
  const role = isAdmin ? 'admin' : 'user'

  // Register client with generic WSManager
  wsManager.registerClient(client, user.userId, role, { email: user.email })

  safeSend(client, { ns: 'system', type: 'connected', userId: user.userId, role })

  // ── Heartbeat ────────────────────────────────────────────────────
  const heartbeat = setInterval(() => {
    if (client.readyState === 1) client.ping()
  }, 30_000)

  // ── Message handler — route by namespace ─────────────────────────
  client.on('message', async (raw) => {
    let event: WSBaseEvent
    try {
      event = JSON.parse(raw.toString()) as WSBaseEvent
    } catch {
      safeSend(client, { ns: 'system', type: 'error', error: 'Invalid JSON' })
      return
    }

    // System-level events
    if (event.ns === 'system') {
      if (event.type === 'ping') {
        safeSend(client, { ns: 'system', type: 'pong' })
      }
      return
    }

    // Delegate to feature handler
    await wsManager.handleMessage(client, event)
  })

  // ── Cleanup ──────────────────────────────────────────────────────
  client.on('close', () => {
    clearInterval(heartbeat)
    wsManager.removeClient(client)
  })

  client.on('error', (err) => {
    Logger.error(`[WS] Client error: ${err.message}`)
    clearInterval(heartbeat)
    wsManager.removeClient(client)
  })
}

export async function GET(request: NextRequest) {
  try {
    const auth = await AuthMiddleware.authenticateUserByRequest({
      request,
      requiredUserRole: 'GUEST',
    })
    const user = auth.user
    if (!user) {
      return NextResponse.json({ message: AuthMessages.USER_NOT_AUTHENTICATED }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chatSessionId = searchParams.get('chatSessionId')

    if (chatSessionId) {
      // Get specific session + messages
      const session = await ChatSessionService.getSession(chatSessionId)
      if (!session || session.userId !== user.userId) {
        return NextResponse.json(
          { message: ChatbotMessages.SESSION_NOT_FOUND },
          { status: 404 }
        )
      }
      const messages = await ChatSessionService.getMessages(chatSessionId)
      return NextResponse.json({ session, messages })
    }

    // List user's sessions
    const sessions = await ChatSessionService.getUserSessions(user.userId)
    return NextResponse.json({ sessions })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : ChatbotMessages.CHATBOT_RESPONSE_FAILED
    return NextResponse.json({ message: errMsg }, { status: 500 })
  }
}
