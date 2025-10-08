"use client"

import { useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { tokenStorage } from "@/lib/token-storage"

interface WebSocketMessage {
  event: string
  payload: {
    server_uid: string
    task_name: string
    status: string
    message: string
  }
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { user, loading } = useAuth()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const isConnectingRef = useRef(false)
  const lastConnectAttemptRef = useRef<number>(0)
  const connectionStableRef = useRef(false)

  const { onMessage, onConnect, onDisconnect, onError, reconnectInterval = 3000, maxReconnectAttempts = 10 } = options

  const connect = useCallback(() => {
    console.log("[v0] WebSocket connect called")

    const accessToken = tokenStorage.getAccessToken()
    console.log("[v0] Access token:", accessToken ? "exists" : "missing")
    console.log("[v0] Is connecting:", isConnectingRef.current)

    const now = Date.now()
    if (now - lastConnectAttemptRef.current < 1000) {
      console.log("[v0] WebSocket connection rate limited")
      return
    }
    lastConnectAttemptRef.current = now

    if (!accessToken || isConnectingRef.current) {
      console.log("[v0] WebSocket connection aborted - no token or already connecting")
      return
    }

    try {
      isConnectingRef.current = true
      connectionStableRef.current = false

      const wsUrl = `wss://4tt.org/ws/status/?token=${accessToken}`

      console.log("[v0] WebSocket connecting to:", wsUrl)

      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log("[v0] WebSocket connected")
        isConnectingRef.current = false
        reconnectAttemptsRef.current = 0
        connectionStableRef.current = true
        onConnect?.()
      }

      wsRef.current.onmessage = (event) => {
        console.log("[v0] Raw WebSocket message received:", event.data)

        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log("[v0] Parsed WebSocket message:", message)

          // Log different event types
          switch (message.event) {
            case "server_status":
              console.log("[v0] Server status update:", message.payload)
              break
            case "server_phase":
              console.log("[v0] Server phase change:", message.payload)
              break
            case "server_setup":
              console.log("[v0] Server setup log:", message.payload)
              break
            default:
              console.log("[v0] Unknown event type:", message.event, "payload:", message.payload)
          }

          onMessage?.(message)
        } catch (error) {
          console.error("[v0] Failed to parse WebSocket message:", error, "Raw data:", event.data)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log("[v0] WebSocket disconnected:", event.code, event.reason || "No reason provided")
        isConnectingRef.current = false
        connectionStableRef.current = false
        wsRef.current = null
        onDisconnect?.()

        if (event.code !== 1000 && event.code !== 1001 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          console.log(
            `[v0] Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts}) after ${reconnectInterval}ms`,
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            if (user && tokenStorage.getAccessToken()) {
              connect()
            }
          }, reconnectInterval * reconnectAttemptsRef.current) // Exponential backoff
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error("[v0] Max reconnection attempts reached")
        }
      }

      wsRef.current.onerror = (error) => {
        console.error("[v0] WebSocket error occurred:", {
          readyState: wsRef.current?.readyState,
          url: wsRef.current?.url,
          connectionStable: connectionStableRef.current,
          reconnectAttempts: reconnectAttemptsRef.current,
        })
        isConnectingRef.current = false
        onError?.(error)
      }
    } catch (error) {
      console.error("[v0] Failed to create WebSocket connection:", error)
      isConnectingRef.current = false
    }
  }, [user, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      console.log("[v0] Manually disconnecting WebSocket")
      wsRef.current.close(1000, "Manual disconnect")
      wsRef.current = null
    }

    isConnectingRef.current = false
    connectionStableRef.current = false
    reconnectAttemptsRef.current = 0
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      console.log("[v0] WebSocket message sent:", message)
    } else {
      console.warn("[v0] WebSocket not connected, cannot send message")
    }
  }, [])

  useEffect(() => {
    if (loading) {
      console.log("[v0] Auth still loading, skipping WebSocket operations")
      return
    }

    console.log("[v0] Auth state changed - user:", user ? "authenticated" : "not authenticated")

    const accessToken = tokenStorage.getAccessToken()
    console.log("[v0] Access token:", accessToken ? "present" : "missing")

    // Clear any existing timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (user && accessToken) {
      // Debounce connection attempts
      const connectTimeout = setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          console.log("[v0] Attempting WebSocket connection...")
          connect()
        }
      }, 100)

      return () => clearTimeout(connectTimeout)
    } else {
      console.log("[v0] Disconnecting WebSocket - no auth")
      disconnect()
    }
  }, [user, loading, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    connect,
    disconnect,
    sendMessage,
  }
}
