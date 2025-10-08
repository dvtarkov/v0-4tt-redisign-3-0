"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Square, Eye, Settings, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useServerContext } from "@/contexts/server-context"
import type { Server } from "@/types/server"
import { COLORS } from "@/lib/constants"
import Link from "next/link"
import { CopyButton } from "@/components/ui/copy-button"

interface ServerCardProps {
  server: Server
  isLoading?: boolean
  onToggleStatus?: (serverUid: string, action: "start" | "stop") => Promise<void>
  onViewDetails?: (server: Server) => void
}

const CREATING_PHASES = ["creating", "ready_for_foundry", "setting_foundry", "foundry_ready", "setting_infra"]

const STATUS_LABELS: Record<string, string> = {
  running: "Running",
  stopping: "Stopping",
  starting: "Starting",
  stopped: "Stopped",
  suspended: "Suspended",
}

const STATUS_COLORS: Record<string, string> = {
  running: "bg-green-50 text-green-700 border-green-200",
  stopping: "bg-yellow-50 text-yellow-700 border-yellow-200",
  starting: "bg-blue-50 text-blue-700 border-blue-200",
  stopped: "bg-red-50 text-red-700 border-red-200",
  suspended: "bg-gray-50 text-gray-700 border-gray-200",
}

export function ServerCard({ server, isLoading = false, onToggleStatus, onViewDetails }: ServerCardProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { setContinuingServer } = useServerContext()

  const isCreating = server.phase !== "completed"
  const serverUrl = `https://${server.url}.4tt.org/`

  const shouldShowStartButton = ["stopped", "suspended"].includes(server.status)
  const shouldShowStopButton = server.status === "running"
  const isButtonDisabled = isLoading || ["stopping", "starting"].includes(server.status)
  const canShowToggleButton = !server.blocked && !["stopping", "starting"].includes(server.status) && !isCreating

  const handleToggleStatus = async () => {
    if (!onToggleStatus) {
      console.log("[v0] No onToggleStatus function provided")
      return
    }

    const action = shouldShowStartButton ? "start" : "stop"
    console.log("[v0] Toggle server status:", server.uid, action)

    if (isButtonDisabled) {
      console.log("[v0] Button disabled, ignoring click")
      return
    }

    try {
      console.log("[v0] Calling onToggleStatus function")
      await onToggleStatus(server.uid, action)
      console.log("[v0] onToggleStatus completed successfully")
    } catch (err) {
      console.log("[v0] onToggleStatus failed:", err)
      toast({
        title: `Failed to ${action} server`,
        description: `Could not ${action} server ${server.name}`,
        variant: "destructive",
      })
    }
  }

  const handleContinueCreation = () => {
    setContinuingServer(server)
    router.push("/create-server")
  }

  const getDetailedUrl = () => {
    return `/server/${encodeURIComponent(server.url)}`
  }

  return (
    <Card
      className={`w-full relative transition-shadow duration-200 ${
        isCreating ? "border-orange-200 bg-orange-50/30 hover:shadow-md" : "border-gray-200 hover:shadow-lg"
      }`}
      style={{ cursor: "default" }}
    >
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-lg text-gray-900">{server.name}</h3>
            {isCreating ? (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 !cursor-default">
                Creating...
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className={`${STATUS_COLORS[server.status] || "bg-gray-50 text-gray-700 border-gray-200"} !cursor-default`}
              >
                {STATUS_LABELS[server.status] || server.status}
              </Badge>
            )}
          </div>

          {isCreating ? (
            <Button
              size="sm"
              onClick={handleContinueCreation}
              className="h-8 px-3 border shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150 bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
            >
              <Settings className="h-3 w-3 mr-1" />
              Continue Setup
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          ) : (
            canShowToggleButton &&
            (shouldShowStartButton || shouldShowStopButton) && (
              <Button
                size="sm"
                variant={shouldShowStartButton ? "outline" : "destructive"}
                onClick={handleToggleStatus}
                disabled={isButtonDisabled}
                className={`h-8 px-3 border shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150 ${
                  shouldShowStartButton
                    ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    : ""
                }`}
                style={
                  shouldShowStopButton
                    ? {
                        backgroundColor: COLORS.main,
                        borderColor: COLORS.main,
                        color: "white",
                        opacity: isButtonDisabled ? 0.6 : 1,
                        cursor: isButtonDisabled ? "not-allowed" : "pointer",
                      }
                    : undefined
                }
              >
                {isButtonDisabled ? (
                  <>
                    <div className="animate-spin h-3 w-3 mr-1 border border-current border-t-transparent rounded-full" />
                    {server.status === "starting" || (isLoading && shouldShowStartButton)
                      ? "Starting..."
                      : "Stopping..."}
                  </>
                ) : shouldShowStopButton ? (
                  <>
                    <Square className="h-3 w-3 mr-1" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </>
                )}
              </Button>
            )
          )}
        </div>

        {isCreating ? (
          <div className="flex items-center space-x-2 text-sm text-orange-700 mt-2">
            <span className="font-medium">Server is being created...</span>
            <div className="animate-pulse w-2 h-2 bg-orange-500 rounded-full"></div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
            <a
              href={serverUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              {serverUrl}
            </a>
            <CopyButton text={serverUrl} label="Server URL" />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div>Zone: {server.zone}</div>
          <div>Type: {server.server_type}</div>
          {isCreating && <div className="font-medium text-orange-700">Phase: {server.phase.replace(/_/g, " ")}</div>}
        </div>

        {!isCreating && (
          <div className="flex justify-end">
            <Link href={getDetailedUrl()}>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 border-gray-300 hover:bg-gray-100 hover:text-gray-900 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150 bg-transparent"
              >
                <Eye className="h-4 w-4" />
                <span>Detailed</span>
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
