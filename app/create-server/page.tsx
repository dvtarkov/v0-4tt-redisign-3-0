"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, ArrowRight, Check, ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useServerContext } from "@/contexts/server-context"
import { apiClient } from "@/lib/api"
import { ServerUrlInput } from "@/components/server/server-url-input"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { RealTimeUpdates } from "@/components/real-time-updates"

interface ServerType {
  code: string
  name: string
  description: string
  price_per_hour: string
  user_can_modify: boolean
  auto_shutdown_default_delay_min: number
  sever_max_usage: number
  stricted_region: string
  auto_force_shutdown_hours: number
}

interface Zone {
  id: string
  name: string
  region: string
}

const ZONES: Zone[] = [
  { id: "europe-west1-b", name: "europe-west1-b", region: "europe-west" },
  { id: "us-east1-a", name: "us-east1-a", region: "us-east" },
  { id: "asia-southeast1-a", name: "asia-southeast1-a", region: "asia-southeast" },
]

export default function CreateServerPage() {
  const router = useRouter()
  const { user } = useAuth()
  const websocket = useWebSocketContext()
  const { continuingServer, clearContinuingServer } = useServerContext()

  const [serverTypes, setServerTypes] = useState<ServerType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [serverUid, setServerUid] = useState<string | null>(null)
  const [serverPhase, setServerPhase] = useState<string>("initial")
  const [isCreatingServer, setIsCreatingServer] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    serverTypeCode: "",
    zone: "",
    foundryDownloadUrl: "",
  })

  const selectedServerType = serverTypes.find((type) => type.code === formData.serverTypeCode)

  useEffect(() => {
    if (serverUid) {
      websocket.setServerPhaseUpdateCallback((uid: string, phase: string) => {
        if (uid === serverUid) {
          console.log("[v0] Server phase updated:", phase)
          setServerPhase(phase)

          // Auto-trigger next step actions based on phase
          if (phase === "ready_for_foundry" && getCurrentStep() === 1) {
            // Server creation completed, ready for Foundry installation
            console.log("[v0] Server ready for Foundry installation")
          } else if (phase === "foundry_ready" && getCurrentStep() === 2) {
            // Foundry installation completed, ready for deployment
            console.log("[v0] Foundry ready, proceeding to deployment")
            // Automatically start server deployment
            handleStep3Submit()
          } else if (phase === "setting_infra") {
            // Server deployment started
            console.log("[v0] Server deployment started")
          } else if (phase === "completed") {
            // All steps completed
            console.log("[v0] Server setup completed")
          }
        }
      })
    }
  }, [serverUid, websocket])

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (continuingServer) {
      console.log("[v0] Continuing server setup:", continuingServer)
      setServerUid(continuingServer.uid)
      setServerPhase(continuingServer.phase)

      // Pre-fill form data from continuing server
      setFormData((prev) => ({
        ...prev,
        name: continuingServer.name,
        url: continuingServer.url,
        serverTypeCode: continuingServer.server_type,
        zone: continuingServer.zone,
      }))

      // Clear the continuing server from context
      clearContinuingServer()
    }

    fetchServerTypes()
  }, [user, router, continuingServer, clearContinuingServer])

  useEffect(() => {
    if (selectedServerType?.stricted_region) {
      setFormData((prev) => ({ ...prev, zone: selectedServerType.stricted_region! }))
    }
  }, [selectedServerType])

  const fetchServerTypes = async () => {
    try {
      console.log("[v0] Starting to fetch server types...")
      setLoading(true)
      const response = await apiClient.get<ServerType[]>("api/server/types/")
      console.log("[v0] API response:", response)

      if (response.data) {
        console.log("[v0] Received server types data:", response.data)
        setServerTypes(response.data)
        setError(null)
      } else {
        throw new Error(response.error || "Failed to fetch server types")
      }
    } catch (err) {
      console.log("[v0] Error fetching server types:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStep = () => {
    switch (serverPhase) {
      case "initial":
        return 1
      case "creating":
        return 1
      case "ready_for_foundry":
        return 2
      case "setting_foundry":
        return 2
      case "foundry_ready":
        return 3
      case "setting_infra":
        return 3
      case "completed":
        return 4
      default:
        return 1
    }
  }

  const getStepStatus = (stepNumber: number) => {
    const currentStep = getCurrentStep()

    if (stepNumber < currentStep) return "completed"
    if (stepNumber === currentStep) {
      if (
        (stepNumber === 1 && serverPhase === "creating") ||
        (stepNumber === 2 && serverPhase === "setting_foundry") ||
        (stepNumber === 3 && serverPhase === "setting_infra")
      ) {
        return "in-progress"
      }
      return "active"
    }
    return "inactive"
  }

  const isStepValid = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return formData.name && formData.url && formData.serverTypeCode && formData.zone
      case 2:
        return formData.foundryDownloadUrl
      default:
        return false
    }
  }

  const handleStep1Submit = async () => {
    if (!isStepValid(1)) return

    try {
      setIsCreatingServer(true)
      console.log("[v0] Creating server with data:", {
        name: formData.name,
        url: formData.url,
        server_type_code: formData.serverTypeCode,
        zone: formData.zone,
      })

      const response = await apiClient.post("api/server/create/", {
        name: formData.name,
        url: formData.url,
        server_type_code: formData.serverTypeCode,
        zone: formData.zone,
      })

      console.log("[v0] Server creation response:", response)

      let serverUid = null

      if (response.data?.server_uid) {
        serverUid = response.data.server_uid
      } else if (response.data?.uid) {
        serverUid = response.data.uid
      } else if (response.data?.id) {
        serverUid = response.data.id
      } else if (response.server_uid) {
        serverUid = response.server_uid
      } else if (response.uid) {
        serverUid = response.uid
      } else if (response.id) {
        serverUid = response.id
      }

      console.log("[v0] Extracted server UID:", serverUid)

      if (serverUid) {
        setServerUid(serverUid)
        setServerPhase("creating")
        console.log("[v0] Server creation successful, UID:", serverUid)
      } else {
        setTimeout(() => {
          if (!serverUid) {
            throw new Error(response.error || "Failed to create server - no server UID returned")
          }
        }, 2000)
      }
    } catch (err) {
      console.error("[v0] Error creating server:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsCreatingServer(false)
    }
  }

  const handleStep2Submit = async () => {
    if (!isStepValid(2) || !serverUid) return

    try {
      console.log("[v0] Starting Foundry installation with URL:", formData.foundryDownloadUrl)

      const response = await apiClient.post(`api/server/${serverUid}/install-foundry/`, {
        foundry_download_url: formData.foundryDownloadUrl,
      })

      console.log("[v0] Foundry installation API response:", response)

      if (response.status === 200 || response.status === 201 || response.status === 202) {
        console.log("[v0] Foundry installation started successfully")
        setServerPhase("setting_foundry")
        setError(null)
      } else if (response.error) {
        throw new Error(response.error)
      } else {
        console.log("[v0] Foundry installation may have started - checking WebSocket for updates")
        setServerPhase("setting_foundry")
        setError(null)
      }
    } catch (err) {
      console.error("[v0] Error setting Foundry:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const handleStep3Submit = async () => {
    if (!serverUid) return

    try {
      console.log("[v0] Starting server deployment for:", serverUid)

      const response = await apiClient.post(`api/server/${serverUid}/deploy/`, {})

      console.log("[v0] Server deployment API response:", response)

      if (response.status === 200 || response.status === 201 || response.status === 202) {
        console.log("[v0] Server deployment started successfully")
        setServerPhase("setting_infra")
        setError(null)
      } else if (response.error) {
        throw new Error(response.error)
      } else {
        console.log("[v0] Server deployment may have started - checking WebSocket for updates")
        setServerPhase("setting_infra")
        setError(null)
      }
    } catch (err) {
      console.error("[v0] Error starting server deployment:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  const renderStepHeader = (stepNumber: number, title: string) => {
    const status = getStepStatus(stepNumber)

    return (
      <div className="flex items-center space-x-3 mb-4">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
            status === "completed"
              ? "bg-green-600 text-white"
              : status === "active"
                ? "bg-red-600 text-white"
                : status === "in-progress"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-300 text-gray-600"
          }`}
        >
          {status === "completed" ? (
            <Check className="w-4 h-4" />
          ) : status === "in-progress" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            stepNumber
          )}
        </div>
        <h3 className={`text-lg font-semibold ${status === "completed" ? "text-green-700" : "text-gray-900"}`}>
          {title}
          {status === "completed" && <span className="ml-2 text-sm text-green-600">Done</span>}
          {status === "in-progress" && <span className="ml-2 text-sm text-orange-600">In Progress</span>}
        </h3>
        <div className="flex-1" />
        {status === "active" || status === "in-progress" ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-xl border">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Start New Server</h2>
                {serverUid && <p className="text-sm text-gray-500">Server ID: {serverUid}</p>}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Setup Progress</span>
              <span className="text-gray-500">{Math.max(0, getCurrentStep() - 1)} of 3 completed</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(Math.max(0, getCurrentStep() - 1) / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Загрузка типов серверов...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">Ошибка: {error}</p>
                <Button onClick={fetchServerTypes} variant="outline">
                  Повторить
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Step 1: Server Configuration */}
                <div
                  className={`border rounded-lg ${getStepStatus(1) === "completed" ? "border-green-200 bg-green-50" : "border-gray-200"}`}
                >
                  <div className="p-4">
                    {renderStepHeader(1, "Server Configuration")}

                    {(getStepStatus(1) === "active" || getStepStatus(1) === "in-progress") && (
                      <div className="space-y-6 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="serverName" className="text-sm font-medium text-gray-700">
                              Server Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="serverName"
                              value={formData.name}
                              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter your server name"
                              className="mt-1"
                              disabled={getStepStatus(1) === "in-progress"}
                            />
                            <p className="text-xs text-gray-500 mt-1">Choose a unique name for your server</p>
                          </div>

                          <div>
                            <Label htmlFor="serverUrl" className="text-sm font-medium text-gray-700">
                              Server URL <span className="text-red-500">*</span>
                            </Label>
                            <ServerUrlInput
                              value={formData.url}
                              onChange={(value) => setFormData((prev) => ({ ...prev, url: value }))}
                              className="mt-1"
                              disabled={getStepStatus(1) === "in-progress"}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="serverType" className="text-sm font-medium text-gray-700">
                              Server Type
                            </Label>
                            <Select
                              value={formData.serverTypeCode}
                              onValueChange={(value) => setFormData((prev) => ({ ...prev, serverTypeCode: value }))}
                              disabled={getStepStatus(1) === "in-progress"}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Choose server type" />
                              </SelectTrigger>
                              <SelectContent>
                                {serverTypes.map((type) => (
                                  <SelectItem key={type.code} value={type.code}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">Choose your server specifications</p>
                          </div>

                          <div>
                            <Label htmlFor="zone" className="text-sm font-medium text-gray-700">
                              Zone
                            </Label>
                            <Select
                              value={formData.zone}
                              onValueChange={(value) => setFormData((prev) => ({ ...prev, zone: value }))}
                              disabled={!!selectedServerType?.stricted_region || getStepStatus(1) === "in-progress"}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select zone" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedServerType?.stricted_region ? (
                                  <SelectItem value={selectedServerType.stricted_region}>
                                    {selectedServerType.stricted_region} (Restricted)
                                  </SelectItem>
                                ) : (
                                  ZONES.map((zone) => (
                                    <SelectItem key={zone.id} value={zone.id}>
                                      {zone.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                              {selectedServerType?.stricted_region
                                ? "Zone is restricted for this server type"
                                : "Select your preferred zone"}
                            </p>
                          </div>
                        </div>

                        {selectedServerType && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="space-y-1 text-sm">
                              <div className="text-blue-700">
                                <span className="font-medium">Price:</span> ${selectedServerType.price_per_hour}/hour
                              </div>
                              <div className="text-blue-700">
                                <span className="font-medium">Auto shutdown:</span>{" "}
                                {selectedServerType.auto_shutdown_default_delay_min} min
                              </div>
                              <div className="text-blue-700">
                                <span className="font-medium">Max usage:</span> {selectedServerType.sever_max_usage}%
                              </div>
                              {selectedServerType.stricted_region && (
                                <div className="text-blue-700">
                                  <span className="font-medium">Region:</span> {selectedServerType.stricted_region}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {getStepStatus(1) === "active" && (
                          <div className="flex justify-end">
                            <Button
                              onClick={handleStep1Submit}
                              disabled={!isStepValid(1) || isCreatingServer}
                              className="bg-red-400 hover:bg-red-500 text-white px-6"
                            >
                              {isCreatingServer ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Creating Server...
                                </>
                              ) : (
                                "Create Server"
                              )}
                            </Button>
                          </div>
                        )}

                        {serverUid && getStepStatus(1) === "in-progress" && (
                          <RealTimeUpdates serverUid={serverUid} title="Server Creation Progress" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Foundry Installation */}
                <div
                  className={`border rounded-lg ${getStepStatus(2) === "completed" ? "border-green-200 bg-green-50" : "border-gray-200"}`}
                >
                  <div className="p-4">
                    {renderStepHeader(2, "Foundry Installation")}

                    {(getStepStatus(2) === "active" || getStepStatus(2) === "in-progress") && (
                      <div className="space-y-6 mt-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="text-sm text-amber-800 leading-relaxed">
                            <p className="mb-2">
                              Перейдите на сайт <strong>foundryvtt.com</strong>, войдите в аккаунт и перейдите во
                              вкладку <strong>Download Software</strong>. Выберите желаемую версию.
                            </p>
                            <p className="mb-2">
                              <strong className="text-red-600">!!! Обязательно выберите версию Node.js !!!</strong>
                            </p>
                            <p>
                              После чего нажмите <strong>Timed URL</strong>, чтобы скопировать ссылку и вставить в поле
                              ниже. Ссылка живёт недолго, поэтому постарайтесь сделать это быстро!
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="foundryUrl" className="text-sm font-medium text-gray-700">
                            Foundry VTT Download URL <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="foundryUrl"
                            value={formData.foundryDownloadUrl}
                            onChange={(e) => setFormData((prev) => ({ ...prev, foundryDownloadUrl: e.target.value }))}
                            placeholder="https://r2.foundryvtt.com/releases/13.348/FoundryVTT-Node-13.348.zip?verify=1758059055-rO1dy2sXIGD1yyIbwvVzYO8tMYn%2Fwd2HDn3SNTSYoxo%3D"
                            className="mt-1"
                            disabled={getStepStatus(2) === "in-progress"}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Paste the timed download URL from Foundry VTT website
                          </p>
                        </div>

                        {getStepStatus(2) === "active" && (
                          <div className="flex justify-end">
                            <Button
                              onClick={handleStep2Submit}
                              disabled={!isStepValid(2)}
                              className="bg-red-400 hover:bg-red-500 text-white px-6"
                            >
                              Install Foundry
                            </Button>
                          </div>
                        )}

                        {serverUid && getStepStatus(2) === "in-progress" && (
                          <RealTimeUpdates serverUid={serverUid} title="Foundry Installation Progress" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: Server Deployment */}
                <div
                  className={`border rounded-lg ${getStepStatus(3) === "completed" ? "border-green-200 bg-green-50" : "border-gray-200"}`}
                >
                  <div className="p-4">
                    {renderStepHeader(3, "Server Deployment")}

                    {(getStepStatus(3) === "active" || getStepStatus(3) === "in-progress") && (
                      <div className="space-y-6 mt-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-800">
                            {getStepStatus(3) === "in-progress"
                              ? "Развертывание сервера в процессе. Пожалуйста, подождите..."
                              : "Сервер готов к развертыванию. Этот процесс запустится автоматически."}
                          </p>
                        </div>

                        {serverUid && getStepStatus(3) === "in-progress" && (
                          <RealTimeUpdates serverUid={serverUid} title="Server Deployment Progress" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
