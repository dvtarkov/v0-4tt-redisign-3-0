"use client"

import { ServerCard } from "./server-card"
import type { Server } from "@/types/server"

interface ServerGridProps {
  servers: Server[]
  loading?: boolean
  loadingServers?: Set<string>
  onToggleServerStatus?: (serverUid: string, action: "start" | "stop") => Promise<void>
  onViewServerDetails?: (server: Server) => void
}

export function ServerGrid({
  servers,
  loading,
  loadingServers = new Set(),
  onToggleServerStatus,
  onViewServerDetails,
}: ServerGridProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">Loading servers...</div>
      </div>
    )
  }

  if (servers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">No servers available</div>
        <div className="text-gray-400 text-sm">Create a server to get started</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {servers.map((server) => (
        <ServerCard
          key={server.uid}
          server={server}
          isLoading={loadingServers.has(server.uid)}
          onToggleStatus={onToggleServerStatus}
          onViewDetails={onViewServerDetails}
        />
      ))}
    </div>
  )
}
