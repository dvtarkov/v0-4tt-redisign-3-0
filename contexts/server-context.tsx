"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Server } from "@/types/server"

interface ServerContextType {
  continuingServer: Server | null
  setContinuingServer: (server: Server | null) => void
  clearContinuingServer: () => void
}

const ServerContext = createContext<ServerContextType | undefined>(undefined)

export function ServerProvider({ children }: { children: ReactNode }) {
  const [continuingServer, setContinuingServer] = useState<Server | null>(null)

  const clearContinuingServer = () => {
    setContinuingServer(null)
  }

  return (
    <ServerContext.Provider
      value={{
        continuingServer,
        setContinuingServer,
        clearContinuingServer,
      }}
    >
      {children}
    </ServerContext.Provider>
  )
}

export function useServerContext() {
  const context = useContext(ServerContext)
  if (context === undefined) {
    throw new Error("useServerContext must be used within a ServerProvider")
  }
  return context
}
