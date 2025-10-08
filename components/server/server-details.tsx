"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/layout/header"
import { RealTimeUpdates } from "@/components/real-time-updates"
import { CopyButton } from "@/components/ui/copy-button"
import {
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  Server,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  LinkIcon,
  Archive,
  Download,
} from "lucide-react"
import { useServerDetails } from "@/hooks/use-server-details"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { COLORS } from "@/lib/constants"
import { apiClient } from "@/lib/api"
import { useWebSocket } from "@/contexts/websocket-context"

interface ServerDetailsProps {
  serverUrl: string
}

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

export function ServerDetails({ serverUrl }: ServerDetailsProps) {
  const { server, loading, error, refetch, toggleServerStatus, setServer } = useServerDetails(serverUrl)
  const { registerServerStatusCallback, unregisterServerStatusCallback } = useWebSocket()
  const [actionLoading, setActionLoading] = useState<
    | "start"
    | "stop"
    | "regenerate"
    | "restart-foundry"
    | "reset-license"
    | "foundry-install"
    | "change-fb-password"
    | "restore"
    | null
  >(null)

  const [activeTab, setActiveTab] = useState("main")

  const [foundryDownloadUrl, setFoundryDownloadUrl] = useState("")
  const [filebrowserPassword, setFilebrowserPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [backups, setBackups] = useState<any[]>([])
  const [backupsLoading, setBackupsLoading] = useState(false)
  const [restoringSlotId, setRestoringSlotId] = useState<number | null>(null)

  useEffect(() => {
    const savedTab = localStorage.getItem(`server-details-tab-${serverUrl}`)
    if (savedTab) {
      setActiveTab(savedTab)
    }
  }, [serverUrl])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    localStorage.setItem(`server-details-tab-${serverUrl}`, value)
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${label} has been copied to clipboard`,
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const regenerateActivationSlug = async () => {
    if (!server) return

    try {
      setActionLoading("regenerate")
      const response = await apiClient.post(`api/server/${server.uid}/regenerate-activation-slug/`)

      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: "Success!",
        description: "Activation link updated",
      })

      refetch()
    } catch (err) {
      console.log("[v0] Error regenerating activation slug:", err)
      toast({
        title: "Error",
        description: "Failed to update activation link",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleStatus = async (action: "start" | "stop") => {
    if (!server) return

    try {
      setActionLoading(action)
      await toggleServerStatus(action)
      console.log("[v0] Server status toggle completed, waiting for WebSocket update")
    } catch (err) {
      console.error("Failed to toggle server status:", err)
      toast({
        title: `Failed to ${action} server`,
        description: `Could not ${action} server ${server.name}`,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const restartFoundry = async () => {
    if (!server) return

    try {
      setActionLoading("restart-foundry")
      const response = await apiClient.post(`api/server/${server.uid}/restart-foundry/`)

      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: "Success!",
        description: "Foundry restarted successfully",
      })

      refetch()
    } catch (err) {
      console.log("[v0] Error restarting Foundry:", err)
      toast({
        title: "Error",
        description: "Failed to restart Foundry",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const resetLicense = async () => {
    if (!server) return

    try {
      setActionLoading("reset-license")
      const response = await apiClient.post(`api/server/${server.uid}/revoke-foundry-config/`)

      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: "Success!",
        description: "Foundry config revoked successfully",
      })

      refetch()
    } catch (err) {
      console.log("[v0] Error revoking foundry config:", err)
      toast({
        title: "Error",
        description: "Failed to revoke foundry config",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const changeFoundryVersion = async () => {
    if (!server || !foundryDownloadUrl.trim()) return

    try {
      setActionLoading("foundry-install")
      const response = await apiClient.post(`api/server/${server.uid}/install-foundry/`, {
        foundry_download_url: foundryDownloadUrl,
      })

      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: "Success!",
        description: "Foundry installation started",
      })

      setFoundryDownloadUrl("")
    } catch (err) {
      console.log("[v0] Error installing Foundry:", err)
      toast({
        title: "Error",
        description: "Failed to start Foundry installation",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const changeFilebrowserPassword = async () => {
    if (!server || !filebrowserPassword.trim()) return

    if (filebrowserPassword.length < 12) {
      toast({
        title: "Error",
        description: "Password must be at least 12 characters long",
        variant: "destructive",
      })
      return
    }

    try {
      setActionLoading("change-fb-password")
      const response = await apiClient.post(`api/server/${server.uid}/fb-create-user/`, {
        password: filebrowserPassword,
      })

      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: "Success!",
        description: "Filebrowser password changed successfully",
      })

      setFilebrowserPassword("")
      refetch()
    } catch (err) {
      console.log("[v0] Error changing Filebrowser password:", err)
      toast({
        title: "Error",
        description: "Failed to change Filebrowser password",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const loadBackups = async () => {
    if (!server) return

    try {
      setBackupsLoading(true)
      const response = await apiClient.get(`api/backup/slots/`)

      if (response.error) {
        throw new Error(response.error)
      }

      setBackups(response.data || [])
    } catch (err) {
      console.log("[v0] Error loading backups:", err)
      toast({
        title: "Error",
        description: "Failed to load backups",
        variant: "destructive",
      })
    } finally {
      setBackupsLoading(false)
    }
  }

  const restoreBackup = async (slotUid: string, slotId: number) => {
    if (!server) return

    try {
      setActionLoading("restore")
      setRestoringSlotId(slotId)
      const response = await apiClient.post(`api/backup/slots/restore/`, {
        slot_uid: slotUid,
        server_uid: server.uid,
      })

      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: "Success!",
        description: "Backup restore started successfully",
      })

      refetch()
    } catch (err) {
      console.log("[v0] Error restoring backup:", err)
      toast({
        title: "Error",
        description: "Failed to restore backup",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
      setRestoringSlotId(null)
    }
  }

  useEffect(() => {
    if (server) {
      loadBackups()
    }
  }, [server])

  useEffect(() => {
    if (server?.uid) {
      console.log("[v0] Registering WebSocket callback for detailed view:", server.uid)

      const handleStatusUpdate = (serverUid: string, newStatus: string) => {
        console.log("[v0] Detailed view received status update:", serverUid, "->", newStatus)
        if (serverUid === server.uid) {
          setServer((prev) => (prev ? { ...prev, status: newStatus } : null))
        }
      }

      registerServerStatusCallback(handleStatusUpdate)

      return () => {
        console.log("[v0] Unregistering WebSocket callback for detailed view")
        unregisterServerStatusCallback(handleStatusUpdate)
      }
    }
  }, [server?.uid, registerServerStatusCallback, unregisterServerStatusCallback, setServer])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !server) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <Server className="h-16 w-16 text-gray-400" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">Server not found</h3>
                <p className="text-gray-600 mt-2">{error || "Failed to load server information"}</p>
              </div>
              <Button onClick={refetch} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const fullServerUrl = `https://${server.url}.4tt.org/`
  const shouldShowStartButton = ["stopped", "suspended"].includes(server.status)
  const shouldShowStopButton = server.status === "running"
  const isButtonDisabled = actionLoading !== null || ["stopping", "starting"].includes(server.status)

  const activationLink = server.activation_slug
    ? `${process.env.NEXT_PUBLIC_BACKEND_API || "https://4tt.org"}/activate/${serverUrl}/${server.activation_slug}`
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">{server.name}</h1>
                <Badge
                  variant="outline"
                  className={`${STATUS_COLORS[server.status] || "bg-gray-50 text-gray-700 border-gray-200"} !cursor-default`}
                >
                  {STATUS_LABELS[server.status] || server.status}
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={fullServerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  {fullServerUrl}
                </a>
                <CopyButton text={fullServerUrl} label="Server URL" />
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div>Type: {server.server_type?.name || "Unknown"}</div>
                <div>Zone: {server.zone}</div>
                {server.foundry_current_version && <div>Foundry: {server.foundry_current_version}</div>}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={loading}
                className="cursor-pointer bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              {shouldShowStartButton && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStatus("start")}
                  disabled={isButtonDisabled}
                  className="h-8 px-3 border shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150 bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  {isButtonDisabled && actionLoading === "start" ? (
                    <>
                      <div className="animate-spin h-3 w-3 mr-1 border border-current border-t-transparent rounded-full" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </>
                  )}
                </Button>
              )}

              {shouldShowStopButton && (
                <Button
                  size="sm"
                  onClick={() => handleToggleStatus("stop")}
                  disabled={isButtonDisabled}
                  className="h-8 px-3 border shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150"
                  style={{
                    backgroundColor: COLORS.main,
                    borderColor: COLORS.main,
                    color: "white",
                    opacity: isButtonDisabled ? 0.6 : 1,
                    cursor: isButtonDisabled ? "not-allowed" : "pointer",
                  }}
                >
                  {isButtonDisabled && actionLoading === "stop" ? (
                    <>
                      <div className="animate-spin h-3 w-3 mr-1 border border-current border-t-transparent rounded-full" />
                      Stopping...
                    </>
                  ) : (
                    <>
                      <Square className="h-3 w-3 mr-1" />
                      Stop
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {activationLink && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <LinkIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Activation link:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono max-w-md truncate">
                    {activationLink}
                  </code>
                </div>
                <div className="flex space-x-2 items-center">
                  <CopyButton text={activationLink} label="Activation link" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={regenerateActivationSlug}
                    disabled={actionLoading === "regenerate"}
                    className="cursor-pointer bg-transparent"
                  >
                    {actionLoading === "regenerate" ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {server.status === "running" && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Foundry Management:</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={restartFoundry}
                    disabled={actionLoading === "restart-foundry"}
                    className="cursor-pointer bg-transparent"
                  >
                    {actionLoading === "restart-foundry" ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Restarting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Restart Foundry
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetLicense}
                    disabled={actionLoading === "reset-license"}
                    className="cursor-pointer bg-transparent"
                  >
                    {actionLoading === "reset-license" ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Revoking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Revoke Config
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://${server.url}.4tt.org/filebrowser`, "_blank")}
                    className="cursor-pointer bg-transparent"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Filebrowser
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="cursor-pointer">
            <TabsTrigger value="main" className="cursor-pointer">
              Main Information
            </TabsTrigger>
            <TabsTrigger value="foundry-version" className="cursor-pointer">
              Foundry Management
            </TabsTrigger>
            <TabsTrigger value="backups" className="cursor-pointer">
              Backups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span>{server.created_at ? new Date(server.created_at).toLocaleString("ru-RU") : "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last active:</span>
                      <span>{server.last_active ? new Date(server.last_active).toLocaleString("ru-RU") : "N/A"}</span>
                    </div>
                  </div>
                  <div className="space-y-3">{/* Removed Max storage and Auto shutdown entries */}</div>
                </div>

                {/* Storage and Server Time Progress Bars */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Storage Progress Bar */}
                    {server.used_storage_mb !== undefined && server.server_type?.max_storage_mb && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <HardDrive className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm font-medium">Занимаемое место</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {server.used_storage_mb}/{server.server_type.max_storage_mb} MB
                          </span>
                        </div>
                        <Progress
                          value={(server.used_storage_mb / server.server_type.max_storage_mb) * 100}
                          className="h-3"
                        />
                      </div>
                    )}

                    {/* Server Time Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 mr-2 text-green-500" />
                          <span className="text-sm font-medium">Потраченное время</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {server.active_time_h !== undefined && server.sever_max_usage
                            ? `${Math.round(server.active_time_h * 100) / 100}/${Math.round(server.sever_max_usage * 100) / 100}h`
                            : "N/A"}
                        </span>
                      </div>
                      {(() => {
                        const percentage =
                          server.active_time_h !== undefined && server.sever_max_usage
                            ? Math.round((server.active_time_h / server.sever_max_usage) * 100 * 100) / 100
                            : null

                        console.log("[v0] Server Time Progress Bar Debug:", {
                          active_time_h: server.active_time_h,
                          sever_max_usage: server.sever_max_usage,
                          active_time_h_type: typeof server.active_time_h,
                          sever_max_usage_type: typeof server.sever_max_usage,
                          active_time_h_undefined: server.active_time_h === undefined,
                          sever_max_usage_falsy: !server.sever_max_usage,
                          condition_met: server.active_time_h !== undefined && server.sever_max_usage,
                          calculated_percentage: percentage,
                        })
                        return null
                      })()}
                      {server.active_time_h !== undefined && server.sever_max_usage ? (
                        <Progress
                          value={Math.round((server.active_time_h / server.sever_max_usage) * 100 * 100) / 100}
                          className="h-3"
                        />
                      ) : (
                        <div className="h-3 bg-gray-200 rounded-full">
                          <div className="h-3 bg-gray-300 rounded-full w-0"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            {server.stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Performance Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {server.stats.cpu_usage !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Cpu className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm font-medium">CPU</span>
                          </div>
                          <span className="text-sm text-gray-600">{server.stats.cpu_usage}%</span>
                        </div>
                        <Progress value={server.stats.cpu_usage} className="h-2" />
                      </div>
                    )}

                    {server.stats.memory_usage !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <MemoryStick className="h-4 w-4 mr-2 text-green-500" />
                            <span className="text-sm font-medium">RAM</span>
                          </div>
                          <span className="text-sm text-gray-600">{server.stats.memory_usage}%</span>
                        </div>
                        <Progress value={server.stats.memory_usage} className="h-2" />
                      </div>
                    )}

                    {server.stats.disk_usage !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <HardDrive className="h-4 w-4 mr-2 text-purple-500" />
                            <span className="text-sm font-medium">Disk</span>
                          </div>
                          <span className="text-sm text-gray-600">{server.stats.disk_usage}%</span>
                        </div>
                        <Progress value={server.stats.disk_usage} className="h-2" />
                      </div>
                    )}

                    {(server.stats.network_in !== undefined || server.stats.network_out !== undefined) && (
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 mr-2 text-orange-500" />
                          <span className="text-sm font-medium">Network</span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          {server.stats.network_in !== undefined && <div>In: {server.stats.network_in} MB/s</div>}
                          {server.stats.network_out !== undefined && <div>Out: {server.stats.network_out} MB/s</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Configuration */}
            {server.config && (
              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(server.config).map(([key, value]) => {
                      let displayValue: string

                      if (value === null || value === undefined) {
                        displayValue = "N/A"
                      } else if (typeof value === "boolean") {
                        displayValue = value ? "Yes" : "No"
                      } else if (typeof value === "object") {
                        displayValue = JSON.stringify(value)
                      } else {
                        displayValue = String(value)
                      }

                      return (
                        <div key={key} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-600 font-medium">
                            {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:
                          </span>
                          <span className="font-mono text-right">{displayValue}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="foundry-version">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Foundry Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Version Display */}
                {server.foundry_current_version && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Current Foundry Version</h4>
                        <p className="text-blue-700 font-mono">{server.foundry_current_version}</p>
                      </div>
                      <Server className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                )}

                {/* Installation Instructions */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="text-sm text-amber-800 leading-relaxed">
                    <p className="mb-2">
                      Перейдите на сайт <strong>foundryvtt.com</strong>, войдите в аккаунт и перейдите во вкладку{" "}
                      <strong>Download Software</strong>. Выберите желаемую версию.
                    </p>
                    <p className="mb-2">
                      <strong className="text-red-600">!!! Обязательно выберите версию Node.js !!!</strong>
                    </p>
                    <p>
                      После чего нажмите <strong>Timed URL</strong>, чтобы скопировать ссылку и вставить в поле ниже.
                      Ссылка живёт недолго, поэтому постарайтесь сделать это быстро!
                    </p>
                  </div>
                </div>

                {/* Foundry URL Input */}
                <div className="space-y-2">
                  <Label htmlFor="foundryUrl" className="text-sm font-medium text-gray-700">
                    Foundry VTT Download URL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="foundryUrl"
                    value={foundryDownloadUrl}
                    onChange={(e) => setFoundryDownloadUrl(e.target.value)}
                    placeholder="https://r2.foundryvtt.com/releases/13.348/FoundryVTT-Node-13.348.zip?verify=1758059055-rO1dy2sXIGD1yyIbwvVzYO8tMYn%2Fwd2HDn3SNTSYoxo%3D"
                    disabled={actionLoading === "foundry-install"}
                  />
                  <p className="text-xs text-gray-500">Paste the timed download URL from Foundry VTT website</p>
                </div>

                {/* Install Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={changeFoundryVersion}
                    disabled={!foundryDownloadUrl.trim() || actionLoading === "foundry-install"}
                    className="bg-red-400 hover:bg-red-500 text-white px-6"
                  >
                    {actionLoading === "foundry-install" ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Installing Foundry...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Install Foundry
                      </>
                    )}
                  </Button>
                </div>

                {/* RealTimeUpdates component to show WebSocket progress */}
                <RealTimeUpdates serverUid={server.uid} title="Foundry Installation Progress" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backups">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Archive className="h-5 w-5 mr-2" />
                  Backups
                </CardTitle>
              </CardHeader>
              <CardContent>
                {backupsLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Loading backups...</p>
                  </div>
                ) : backups.length === 0 ? (
                  <div className="text-center py-12">
                    <Archive className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Backups Found</h3>
                    <p className="text-gray-600 mb-6">No backup slots are available for this server</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadBackups}
                      disabled={backupsLoading}
                      className="cursor-pointer bg-transparent"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${backupsLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Available Backups</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadBackups}
                        disabled={backupsLoading}
                        className="cursor-pointer bg-transparent"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${backupsLoading ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {backups.map((backup) => (
                        <div
                          key={backup.slot_id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Archive className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-gray-900">Slot #{backup.slot_id}</span>
                                {backup.file_name && (
                                  <span className="text-sm text-gray-600">({backup.file_name})</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                {backup.last_backup_at ? (
                                  <>Last backup: {new Date(backup.last_backup_at).toLocaleString("ru-RU")}</>
                                ) : (
                                  "No backup date available"
                                )}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">Slot UID: {backup.slot_uid}</div>
                            </div>

                            <Button
                              onClick={() => restoreBackup(backup.slot_uid, backup.slot_id)}
                              disabled={actionLoading === "restore" || !backup.file_name}
                              variant="outline"
                              size="sm"
                            >
                              {actionLoading === "restore" && restoringSlotId === backup.slot_id ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Restoring...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Restore
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
