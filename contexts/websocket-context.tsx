"use client"

import { createContext, useContext, useRef, type ReactNode } from "react"
import { useWebSocket as useWebSocketHook } from "@/hooks/use-websocket"

interface WebSocketContextType {
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  sendMessage: (message: any) => void
  onServerStatusUpdate?: (serverUid: string, status: string) => void
  setServerStatusUpdateCallback: (callback: (serverUid: string, status: string) => void) => void
  onServerPhaseUpdate?: (serverUid: string, phase: string) => void
  setServerPhaseUpdateCallback: (callback: (serverUid: string, phase: string) => void) => void
  onServerSetupUpdate?: (serverUid: string, taskName: string, status: string, message: string) => void
  setServerSetupUpdateCallback: (
    callback: (serverUid: string, taskName: string, status: string, message: string) => void,
  ) => void
  registerServerStatusCallback: (callback: (serverUid: string, status: string) => void) => void
  unregisterServerStatusCallback: (callback: (serverUid: string, status: string) => void) => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const serverStatusUpdateCallbackRef = useRef<((serverUid: string, status: string) => void) | undefined>()
  const serverPhaseUpdateCallbackRef = useRef<((serverUid: string, phase: string) => void) | undefined>()
  const serverSetupUpdateCallbackRef = useRef<
    ((serverUid: string, taskName: string, status: string, message: string) => void) | undefined
  >()

  const websocket = useWebSocketHook({
    onMessage: (message) => {
      console.log("[v0] Global WebSocket message received:", message)

      if (message.event === "server_status") {
        console.log("[v0] Processing server_status event:", message.payload)
        if (serverStatusUpdateCallbackRef.current) {
          const { server_uid, status } = message.payload
          console.log("[v0] Calling server status update callback:", server_uid, "to", status)
          serverStatusUpdateCallbackRef.current(server_uid, status)
        } else {
          console.log("[v0] No server status update callback registered!")
        }
      }

      if (message.event === "server_phase") {
        console.log("[v0] Processing server_phase event:", message.payload)
        if (serverPhaseUpdateCallbackRef.current) {
          const { server_uid, status: phase } = message.payload
          console.log("[v0] Calling server phase update callback:", server_uid, "to", phase)
          serverPhaseUpdateCallbackRef.current(server_uid, phase)
        } else {
          console.log("[v0] No server phase update callback registered!")
        }
      }

      if (message.event === "server_setup") {
        console.log("[v0] Processing server_setup event:", message.payload)
        if (serverSetupUpdateCallbackRef.current) {
          const { server_uid, task_name, status, message: setupMessage } = message.payload
          console.log("[v0] Calling server setup update callback:", server_uid, task_name, status, setupMessage)
          serverSetupUpdateCallbackRef.current(server_uid, task_name, status, setupMessage)
        } else {
          console.log("[v0] No server setup update callback registered!")
        }
      }
    },
    onConnect: () => {
      console.log("[v0] Global WebSocket connected")
    },
    onDisconnect: () => {
      console.log("[v0] Global WebSocket disconnected")
    },
    onError: (error) => {
      console.error("[v0] Global WebSocket error:", error)
    },
  })

  const setServerStatusUpdateCallback = (callback: (serverUid: string, status: string) => void) => {
    console.log("[v0] Setting server status update callback")
    serverStatusUpdateCallbackRef.current = callback
  }

  const setServerPhaseUpdateCallback = (callback: (serverUid: string, phase: string) => void) => {
    console.log("[v0] Setting server phase update callback")
    serverPhaseUpdateCallbackRef.current = callback
  }

  const setServerSetupUpdateCallback = (
    callback: (serverUid: string, taskName: string, status: string, message: string) => void,
  ) => {
    console.log("[v0] Setting server setup update callback")
    serverSetupUpdateCallbackRef.current = callback
  }

  const registerServerStatusCallback = (callback: (serverUid: string, status: string) => void) => {
    setServerStatusUpdateCallback(callback)
  }

  const unregisterServerStatusCallback = (callback: (serverUid: string, status: string) => void) => {
    setServerStatusUpdateCallback(() => {})
  }

  return (
    <WebSocketContext.Provider
      value={{
        ...websocket,
        setServerStatusUpdateCallback,
        onServerStatusUpdate: serverStatusUpdateCallbackRef.current,
        setServerPhaseUpdateCallback,
        onServerPhaseUpdate: serverPhaseUpdateCallbackRef.current,
        setServerSetupUpdateCallback,
        onServerSetupUpdate: serverSetupUpdateCallbackRef.current,
        registerServerStatusCallback,
        unregisterServerStatusCallback,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider")
  }
  return context
}

export const useWebSocket = useWebSocketContext
