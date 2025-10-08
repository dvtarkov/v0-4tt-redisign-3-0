"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, ArrowRight } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface ServerType {
  id: string
  name: string
  price_per_hour: number
  auto_shutdown_default_delay_min: number
  server_max_usage: number
  stricted_region?: string
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

interface CreateServerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateServerModal({ isOpen, onClose }: CreateServerModalProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [serverTypes, setServerTypes] = useState<ServerType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    serverTypeId: "",
    zone: "",
  })

  const selectedServerType = serverTypes.find((type) => type.id === formData.serverTypeId)

  useEffect(() => {
    if (isOpen) {
      fetchServerTypes()
    }
  }, [isOpen])

  // Auto-set zone when server type with stricted_region is selected
  useEffect(() => {
    if (selectedServerType?.stricted_region) {
      setFormData((prev) => ({ ...prev, zone: selectedServerType.stricted_region! }))
    }
  }, [selectedServerType])

  const fetchServerTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/server/types/")
      if (!response.ok) throw new Error("Failed to fetch server types")
      const data = await response.json()
      setServerTypes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSubmit = async () => {
    // TODO: Implement server creation API call
    console.log("Creating server with data:", formData)
    onClose()
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.url && formData.serverTypeId && formData.zone
      default:
        return false
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-x-0 top-0 flex justify-center z-50 pt-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 animate-in slide-in-from-top-4 duration-300 border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Start New Server</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Setup Progress</span>
            <span className="text-gray-500">{currentStep - 1} of 3 completed</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
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
            <div className="space-y-8">
              {/* Step 1: Server Configuration */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                      currentStep >= 1 ? "bg-red-600" : "bg-gray-400"
                    }`}
                  >
                    1
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Server Configuration</h3>
                </div>

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
                    />
                    <p className="text-xs text-gray-500 mt-1">Choose a unique name for your server</p>
                  </div>

                  <div>
                    <Label htmlFor="serverUrl" className="text-sm font-medium text-gray-700">
                      Server URL <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="serverUrl"
                      value={formData.url}
                      onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                      placeholder="my-server"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">URL slug for your server</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="serverType" className="text-sm font-medium text-gray-700">
                      Server Type
                    </Label>
                    <Select
                      value={formData.serverTypeId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, serverTypeId: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose server type" />
                      </SelectTrigger>
                      <SelectContent>
                        {serverTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
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
                      disabled={!!selectedServerType?.stricted_region}
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
                        <span className="font-medium">Max usage:</span> {selectedServerType.server_max_usage}%
                      </div>
                      {selectedServerType.stricted_region && (
                        <div className="text-blue-700">
                          <span className="font-medium">Region:</span> {selectedServerType.stricted_region}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleNext}
                      disabled={!isStepValid()}
                      className="bg-red-400 hover:bg-red-500 text-white px-6"
                    >
                      Continue to Foundry Setup
                    </Button>
                  </div>
                )}
              </div>

              {/* Step 2: Foundry Installation */}
              <div className={`space-y-6 ${currentStep < 2 ? "opacity-50" : ""}`}>
                <div className="flex items-center space-x-3 mb-6">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= 2 ? "bg-red-600 text-white" : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    2
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Foundry Installation</h3>
                </div>
                {currentStep >= 2 && (
                  <>
                    <p className="text-gray-600">Foundry configuration will be implemented here...</p>
                    <div className="flex justify-end">
                      <Button onClick={handleNext} className="bg-red-400 hover:bg-red-500 text-white px-6">
                        Continue to Final Setup
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* Step 3: Server Deployment */}
              <div className={`space-y-6 ${currentStep < 3 ? "opacity-50" : ""}`}>
                <div className="flex items-center space-x-3 mb-6">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= 3 ? "bg-red-600 text-white" : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    3
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Server Deployment</h3>
                </div>
                {currentStep >= 3 && (
                  <>
                    <p className="text-gray-600">Final setup steps will be implemented here...</p>
                    <div className="flex justify-end">
                      <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 text-white px-6">
                        Create Server
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
