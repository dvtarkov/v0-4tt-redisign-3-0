"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import type { Server } from "@/types/server"

export function useServers() {
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<Server[]>("api/server/list/")

      if (response.data) {
        // Filter out deleted servers
        const filteredServers = response.data.filter((server) => server.status !== "deleted")
        setServers(filteredServers)
        setError(null)
      } else {
        setError(response.error || "Failed to fetch servers")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const updateServerStatus = (serverUid: string, newStatus: string) => {
    console.log("[v0] updateServerStatus called with:", { serverUid, newStatus })

    setServers((prevServers) => {
      console.log(
        "[v0] Current servers before update:",
        prevServers.map((s) => ({ uid: s.uid, status: s.status })),
      )

      // If servers array is empty, we can't update yet
      if (prevServers.length === 0) {
        console.log("[v0] Servers array is empty, skipping update")
        return prevServers
      }

      const serverIndex = prevServers.findIndex((s) => s.uid === serverUid)
      if (serverIndex === -1) {
        console.log("[v0] Server not found in current servers list:", serverUid)
        return prevServers
      }

      const updatedServers = [...prevServers]
      updatedServers[serverIndex] = { ...updatedServers[serverIndex], status: newStatus }

      console.log("[v0] Server status updated:", {
        serverUid,
        oldStatus: prevServers[serverIndex].status,
        newStatus,
        serverIndex,
      })
      console.log(
        "[v0] Updated servers:",
        updatedServers.map((s) => ({ uid: s.uid, status: s.status })),
      )

      return updatedServers
    })
  }

  const [pendingUpdates, setPendingUpdates] = useState<Map<string, string>>(new Map())

  const updateServerStatusWithPending = (serverUid: string, newStatus: string) => {
    console.log("[v0] updateServerStatusWithPending called with:", { serverUid, newStatus })
    console.log("[v0] Current servers count:", servers.length)

    // Always try to update immediately, regardless of servers.length
    // This ensures we don't miss updates when servers are already loaded
    updateServerStatus(serverUid, newStatus)

    // Also store as pending update in case the immediate update didn't work
    if (servers.length === 0) {
      console.log("[v0] Storing pending update:", { serverUid, newStatus })
      setPendingUpdates((prev) => new Map(prev).set(serverUid, newStatus))
    }
  }

  useEffect(() => {
    if (servers.length > 0 && pendingUpdates.size > 0) {
      console.log("[v0] Applying pending updates:", Array.from(pendingUpdates.entries()))

      setServers((prevServers) => {
        const updatedServers = [...prevServers]

        pendingUpdates.forEach((status, serverUid) => {
          const serverIndex = updatedServers.findIndex((s) => s.uid === serverUid)
          if (serverIndex !== -1) {
            updatedServers[serverIndex] = { ...updatedServers[serverIndex], status }
            console.log("[v0] Applied pending update:", { serverUid, status })
          }
        })

        return updatedServers
      })

      // Clear pending updates
      setPendingUpdates(new Map())
    }
  }, [servers.length, pendingUpdates])

  const toggleServerStatus = async (serverUid: string, action: "start" | "stop") => {
    console.log("[v0] Starting API request:", action, "for server:", serverUid)

    try {
      const endpoint = action === "start" ? `api/server/${serverUid}/resume/` : `api/server/${serverUid}/stop/`
      console.log("[v0] Making request to:", endpoint)

      const response = await apiClient.post(endpoint)
      console.log("[v0] API response:", response)

      if (response.error) {
        throw new Error(response.error)
      }

      return response
    } catch (err) {
      console.error(`[v0] Failed to ${action} server:`, err)
      throw err
    }
  }

  useEffect(() => {
    fetchServers()
  }, [])

  return {
    servers,
    loading,
    error,
    refetch: fetchServers,
    toggleServerStatus,
    updateServerStatus: updateServerStatusWithPending,
  }
}
