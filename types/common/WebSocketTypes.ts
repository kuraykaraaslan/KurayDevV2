/**
 * Generic WebSocket types — feature-agnostic infrastructure.
 *
 * Every feature (chatbot, notifications, live-edit, etc.) defines its own
 * event types extending WSEvent and registers a namespace with the server.
 *
 * Wire format:  { ns: "chatbot", ...payload }
 *
 * The `ns` (namespace) field routes messages to the right handler on both
 * server and client side.
 */

// ── Namespace registry (add new features here) ──────────────────────
export type WSNamespace = 'chatbot' | 'notifications' | 'live' | 'system'

// ── Base event shapes ───────────────────────────────────────────────

/** Every WS message carries a namespace + type */
export interface WSBaseEvent {
  ns: WSNamespace
  type: string
  [key: string]: unknown
}

// ── System-level events (built-in, no feature handler needed) ───────
export type WSSystemClientEvent =
  | { ns: 'system'; type: 'ping' }

export type WSSystemServerEvent =
  | { ns: 'system'; type: 'pong' }
  | { ns: 'system'; type: 'connected'; userId: string; role: string }
  | { ns: 'system'; type: 'error'; error: string }

// ── Connection status (client-side) ─────────────────────────────────
export type WSConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

// ── Server-side handler registration ────────────────────────────────

export interface WSConnectedClient {
  ws: import('ws').WebSocket
  userId: string
  role: string
  /** Channels this client listens to (e.g. "chatbot:session:abc") */
  channels: Set<string>
  /** Feature-specific metadata bag */
  meta: Record<string, unknown>
}

/**
 * A feature handler processes WS events for its namespace.
 * Register one per namespace via WSManager.registerHandler().
 */
export interface WSFeatureHandler {
  /** The namespace this handler owns */
  ns: WSNamespace
  /** Called when a client sends a message in this namespace */
  onMessage(client: WSConnectedClient, event: WSBaseEvent): Promise<void> | void
  /** Optional: called when a client disconnects */
  onDisconnect?(client: WSConnectedClient): void
  /** Optional: called right after a client connects & authenticates */
  onConnect?(client: WSConnectedClient): void
}
