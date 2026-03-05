import { WebSocket } from 'ws'
import { Redis } from 'ioredis'
import { redisConnection } from '@/libs/redis'
import Logger from '@/libs/logger'
import type {
  WSBaseEvent,
  WSConnectedClient,
  WSFeatureHandler,
  WSNamespace,
} from '@/types/common/WebSocketTypes'

// ── Channel key builders ─────────────────────────────────────────────
/** e.g. ws:chatbot:session:abc123 */
const channelKey = (ns: WSNamespace, channelId: string) => `ws:${ns}:${channelId}`

/**
 * Generic, namespace-aware WebSocket manager.
 *
 * Features register a `WSFeatureHandler` for their namespace.
 * The manager owns:
 *   • client registry (keyed by raw ws)
 *   • Redis Pub/Sub for cross-instance delivery
 *   • channel subscription & event routing
 *
 * Usage:
 *   wsManager.registerHandler(chatbotWSHandler)
 *   wsManager.registerClient(ws, userId, role)
 *   wsManager.subscribe(ws, 'chatbot', sessionId)
 *   wsManager.publish('chatbot', sessionId, event)
 */
class WSManager {
  private clients = new Map<WebSocket, WSConnectedClient>()
  private handlers = new Map<WSNamespace, WSFeatureHandler>()
  private pub: Redis | null = null
  private sub: Redis | null = null
  private redisReady = false

  // ── Redis lazy init ──────────────────────────────────────────────

  private ensureRedis() {
    if (this.redisReady) return

    this.pub = new Redis({ ...redisConnection, lazyConnect: false })
    this.sub = new Redis({ ...redisConnection, lazyConnect: false })

    this.pub.on('error', (err) => Logger.error(`[WS-PUB] Redis error: ${err.message}`))
    this.sub.on('error', (err) => Logger.error(`[WS-SUB] Redis error: ${err.message}`))

    this.sub.on('message', (channel: string, raw: string) => {
      try {
        // Forward to every local client subscribed to this channel
        for (const [, client] of this.clients) {
          if (client.ws.readyState !== WebSocket.OPEN) continue
          if (client.channels.has(channel)) {
            client.ws.send(raw)
          }
        }
      } catch {
        Logger.error(`[WS] Failed to relay pub/sub on ${channel}`)
      }
    })

    this.redisReady = true
  }

  // ── Handler registration ─────────────────────────────────────────

  registerHandler(handler: WSFeatureHandler) {
    this.handlers.set(handler.ns, handler)
    Logger.info(`[WS] Handler registered for namespace "${handler.ns}"`)
  }

  getHandler(ns: WSNamespace): WSFeatureHandler | undefined {
    return this.handlers.get(ns)
  }

  // ── Client lifecycle ─────────────────────────────────────────────

  registerClient(
    ws: WebSocket,
    userId: string,
    role: string,
    meta: Record<string, unknown> = {},
  ): WSConnectedClient {
    this.ensureRedis()
    const client: WSConnectedClient = { ws, userId, role, channels: new Set(), meta }
    this.clients.set(ws, client)
    Logger.info(`[WS] Client registered: ${userId} (${role}) — total: ${this.clients.size}`)

    // Notify all feature handlers
    for (const [, handler] of this.handlers) {
      handler.onConnect?.(client)
    }

    return client
  }

  removeClient(ws: WebSocket) {
    const client = this.clients.get(ws)
    if (!client) return

    // Unsubscribe from every channel
    for (const channel of client.channels) {
      this.unsubscribeChannel(ws, channel)
    }

    // Notify feature handlers
    for (const [, handler] of this.handlers) {
      handler.onDisconnect?.(client)
    }

    this.clients.delete(ws)
    Logger.info(`[WS] Client removed: ${client.userId} — total: ${this.clients.size}`)
  }

  // ── Channel subscription ─────────────────────────────────────────

  /**
   * Subscribe a client to a namespaced channel.
   * Returns the full channel key (useful for logging).
   */
  subscribe(ws: WebSocket, ns: WSNamespace, channelId: string): string | null {
    const client = this.clients.get(ws)
    if (!client) return null

    const channel = channelKey(ns, channelId)
    if (client.channels.has(channel)) return channel
    client.channels.add(channel)

    // Only subscribe on Redis when this is the first local listener
    if (!this.hasOtherSubscriber(ws, channel)) {
      this.sub?.subscribe(channel).catch((err) =>
        Logger.error(`[WS] Redis subscribe error: ${err.message}`),
      )
    }

    Logger.info(`[WS] ${client.userId} subscribed to ${channel}`)
    return channel
  }

  unsubscribe(ws: WebSocket, ns: WSNamespace, channelId: string) {
    const channel = channelKey(ns, channelId)
    this.unsubscribeChannel(ws, channel)
  }

  private unsubscribeChannel(ws: WebSocket, channel: string) {
    const client = this.clients.get(ws)
    if (!client) return

    client.channels.delete(channel)

    if (!this.hasOtherSubscriber(ws, channel)) {
      this.sub?.unsubscribe(channel).catch((err) =>
        Logger.error(`[WS] Redis unsubscribe error: ${err.message}`),
      )
    }
  }

  private hasOtherSubscriber(ws: WebSocket, channel: string): boolean {
    for (const [otherWs, other] of this.clients) {
      if (otherWs !== ws && other.channels.has(channel)) return true
    }
    return false
  }

  // ── Sending ──────────────────────────────────────────────────────

  /** Send a JSON event to a single client */
  send(ws: WebSocket, event: WSBaseEvent | Record<string, unknown>) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event))
    }
  }

  /** Publish to a namespaced channel (cross-server via Redis) */
  publish(ns: WSNamespace, channelId: string, event: WSBaseEvent | Record<string, unknown>) {
    this.ensureRedis()
    const channel = channelKey(ns, channelId)
    const raw = JSON.stringify(event)

    // Cross-server via Redis
    this.pub?.publish(channel, raw).catch((err) =>
      Logger.error(`[WS] Redis publish error: ${err.message}`),
    )

    // Local echo (Redis pub/sub doesn't echo to the sender's subscriber)
    for (const [, client] of this.clients) {
      if (client.ws.readyState !== WebSocket.OPEN) continue
      if (client.channels.has(channel)) {
        client.ws.send(raw)
      }
    }
  }

  /** Send an event to all connections of a specific user */
  sendToUser(userId: string, event: WSBaseEvent | Record<string, unknown>) {
    const raw = JSON.stringify(event)
    for (const [, client] of this.clients) {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(raw)
      }
    }
  }

  /** Broadcast to every connected client */
  broadcast(event: WSBaseEvent | Record<string, unknown>) {
    const raw = JSON.stringify(event)
    for (const [, client] of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(raw)
      }
    }
  }

  // ── Message routing ──────────────────────────────────────────────

  /**
   * Route an incoming client message to the correct feature handler.
   * Called from the WS route's `message` listener.
   */
  async handleMessage(ws: WebSocket, event: WSBaseEvent) {
    const handler = this.handlers.get(event.ns)
    if (!handler) {
      this.send(ws, { ns: 'system', type: 'error', error: `Unknown namespace: ${event.ns}` })
      return
    }

    const client = this.clients.get(ws)
    if (!client) return

    await handler.onMessage(client, event)
  }

  // ── Helpers ──────────────────────────────────────────────────────

  getClient(ws: WebSocket): WSConnectedClient | undefined {
    return this.clients.get(ws)
  }

  getClientsByUserId(userId: string): WSConnectedClient[] {
    const result: WSConnectedClient[] = []
    for (const [, client] of this.clients) {
      if (client.userId === userId) result.push(client)
    }
    return result
  }

  /** Get all clients subscribed to a specific channel */
  getChannelClients(ns: WSNamespace, channelId: string): WSConnectedClient[] {
    const channel = channelKey(ns, channelId)
    const result: WSConnectedClient[] = []
    for (const [, client] of this.clients) {
      if (client.channels.has(channel)) result.push(client)
    }
    return result
  }
}

// ── Singleton (survives HMR in dev) ─────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var wsManager: WSManager | undefined
}

const wsManager = globalThis.wsManager ?? new WSManager()

if (process.env.NODE_ENV !== 'production') {
  globalThis.wsManager = wsManager
}

export default wsManager
