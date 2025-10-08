"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import type { Server, ServerStats } from "@/types/server"

interface ServerDetails extends Server {
  stats?: ServerStats
  logs?: string[]
  config?: {
    memory: string
    cpu: string
    storage: string
  }
}

export function useServerDetails(serverUrl: string) {
  const [server, setServer] = useState<ServerDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServerDetails = async () => {
    if (!serverUrl) return

    try {
      setLoading(true)
      const response = await apiClient.get<ServerDetails>(`api/server/by-url/${encodeURIComponent(serverUrl)}/`)

      console.log("[v0] Detailed Server API Response:", JSON.stringify(response.data, null, 2))
      console.log("[v0] server_max_usage in response:", response.data?.server_max_usage)

      if (response.data) {
        setServer(response.data)
        setError(null)
      } else {
        setError(response.error || "Failed to fetch server details")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const toggleServerStatus = async (action: "start" | "stop") => {
    if (!server) return

    try {
      const endpoint = action === "start" ? `api/server/${server.uid}/resume/` : `api/server/${server.uid}/stop/`
      const response = await apiClient.post(endpoint)

      if (response.error) {
        throw new Error(response.error)
      }

      setServer((prev) => (prev ? { ...prev, status: action === "start" ? "starting" : "stopping" } : null))

      return response
    } catch (err) {
      console.error(`Failed to ${action} server:`, err)
      throw err
    }
  }

  useEffect(() => {
    fetchServerDetails()
  }, [serverUrl])

  return {
    server,
    loading,
    error,
    refetch: fetchServerDetails,
    toggleServerStatus,
    setServer,
  }
}
