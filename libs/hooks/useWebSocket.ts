'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import type { WSConnectionStatus, WSBaseEvent } from '@/types/common/WebSocketTypes'

interface UseWebSocketOptions<TServerEvent> {
  /** WebSocket endpoint path (default: "/api/ws") */
  path?: string
  /** Called for every server event */
  onEvent: (event: TServerEvent) => void
  /** Auto-connect on mount (default: false) */
  autoConnect?: boolean
  /** Reconnect delay in ms (default: 3000) */
  reconnectDelay?: number
  /** Max reconnect attempts (default: 5) */
  maxReconnects?: number
}

/**
 * Generic WebSocket React hook.
 *
 * Manages connection lifecycle, auto-reconnect, and typed message
 * sending / receiving. Feature-specific convenience hooks can wrap
 * this with their own event types and helpers.
 *
 * @example
 * const { sendEvent, status } = useWebSocket<MyClientEvent, MyServerEvent>({
 *   path: '/api/ws',
 *   onEvent: (e) => console.log(e),
 *   autoConnect: true,
 * })
 */
export function useWebSocket<
  TClientEvent extends WSBaseEvent = WSBaseEvent,
  TServerEvent = WSBaseEvent,
>({
  path = '/api/ws',
  onEvent,
  autoConnect = false,
  reconnectDelay = 3000,
  maxReconnects = 5,
}: UseWebSocketOptions<TServerEvent>) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCount = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onEventRef = useRef(onEvent)
  const [status, setStatus] = useState<WSConnectionStatus>('disconnected')

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  const cleanup = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    cleanup()

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}${path}`

    setStatus('connecting')
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      reconnectCount.current = 0
    }

    ws.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data) as TServerEvent
        onEventRef.current(event)
      } catch { /* skip malformed */ }
    }

    ws.onerror = () => {
      setStatus('error')
    }

    ws.onclose = () => {
      setStatus('disconnected')
      wsRef.current = null

      if (reconnectCount.current < maxReconnects) {
        reconnectCount.current++
        const delay = reconnectDelay * reconnectCount.current
        reconnectTimer.current = setTimeout(() => connect(), delay)
      }
    }
  }, [cleanup, reconnectDelay, maxReconnects, path])

  const disconnect = useCallback(() => {
    reconnectCount.current = maxReconnects
    cleanup()
    setStatus('disconnected')
  }, [cleanup, maxReconnects])

  const sendEvent = useCallback((event: TClientEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event))
      return true
    }
    return false
  }, [])

  useEffect(() => {
    if (autoConnect) connect()
    return () => cleanup()
  }, [autoConnect, connect, cleanup])

  return {
    status,
    connect,
    disconnect,
    sendEvent,
    isConnected: status === 'connected',
  }
}
