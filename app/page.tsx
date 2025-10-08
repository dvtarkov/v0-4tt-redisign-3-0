"use client"

import { Header } from "@/components/layout/header"
import { EmailConfirmationWarning } from "@/components/email-confirmation-warning"
import { ServerGrid } from "@/components/server/server-grid"
import { CreateServerBanner } from "@/components/server/create-server-banner"
import { useAuth } from "@/contexts/auth-context"
import { useServers } from "@/hooks/use-servers"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

export default function HomePage() {
  const { user } = useAuth()
  const { servers, loading, error, refetch, toggleServerStatus, updateServerStatus } = useServers()
  const [loadingServers, setLoadingServers] = useState<Set<string>>(new Set())

  const { setServerStatusUpdateCallback } = useWebSocketContext()

  useEffect(() => {
    console.log("[v0] Setting up WebSocket callback, updateServerStatus available:", !!updateServerStatus)

    if (updateServerStatus) {
      setServerStatusUpdateCallback((serverUid: string, status: string) => {
        console.log("[v0] WebSocket callback triggered:", serverUid, "->", status)
        updateServerStatus(serverUid, status)

        // Remove server from loading state when it reaches final status
        if (status === "running" || status === "stopped" || status === "suspended") {
          setLoadingServers((prev) => {
            const newSet = new Set(prev)
            newSet.delete(serverUid)
            console.log("[v0] Removed server from loading state:", serverUid)
            return newSet
          })
        }
      })
      console.log("[v0] WebSocket callback registered successfully")
    }
  }, [updateServerStatus, setServerStatusUpdateCallback])

  const handleActivateEmail = () => {
    // TODO: Implement email activation logic
    console.log("Activate email clicked")
  }

  const handleToggleServerStatus = async (serverUid: string, action: "start" | "stop") => {
    setLoadingServers((prev) => new Set(prev).add(serverUid))

    try {
      await toggleServerStatus(serverUid, action)
    } catch (error) {
      setLoadingServers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(serverUid)
        return newSet
      })
      console.error("Failed to toggle server status:", error)
    }
  }

  const handleViewServerDetails = (server: any) => {
    console.log("View server details:", server)
    // TODO: Implement server details view
  }

  const shouldShowCreateServerBanner = user && user.email_confirmed && (!servers || servers.length === 0) && !loading

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user && !user.email_confirmed && <EmailConfirmationWarning onActivateClick={handleActivateEmail} />}

        {user ? (
          <div>
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                Мои серверы
              </h1>
              <p className="text-muted-foreground text-lg">Управляйте своими серверами легко и весело! 🎮</p>
            </div>

            {shouldShowCreateServerBanner && <CreateServerBanner />}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700 font-medium">Ошибка загрузки серверов: {error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetch}
                  className="mt-2 hover-bounce border-red-300 text-red-700 hover:bg-red-50 bg-transparent"
                >
                  Повторить
                </Button>
              </div>
            )}

            <ServerGrid
              servers={servers}
              loading={loading}
              loadingServers={loadingServers}
              onToggleServerStatus={handleToggleServerStatus}
              onViewServerDetails={handleViewServerDetails}
            />
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-card rounded-3xl p-12 max-w-2xl mx-auto card-hover">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
                4TT.org
              </h1>
              <p className="text-2xl text-muted-foreground mb-6">Неофициальный хостинг Foundry ⚡</p>
              <p className="text-lg text-foreground/80">Готовы начать создавать удивительные миры? 🌟</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
