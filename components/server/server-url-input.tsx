"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api"

interface ServerUrlInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function ServerUrlInput({ value, onChange, className }: ServerUrlInputProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [warning, setWarning] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null)

  // Update display value when prop changes
  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const validateAndTransform = (input: string): { value: string; warning: string | null } => {
    let warning: string | null = null

    if (input.length > 55) {
      warning = "Максимальная длина URL - 55 символов"
      input = input.substring(0, 55)
    }

    // Check for invalid characters (anything other than English letters, numbers, hyphens, spaces)
    const invalidChars = input.match(/[^a-zA-Z0-9\s-]/g)
    if (invalidChars) {
      warning = `Недопустимые символы: ${invalidChars.join(", ")}`
      input = input.replace(/[^a-zA-Z0-9\s-]/g, "")
    }

    // Check for space or hyphen at the beginning
    if (input.match(/^[\s-]/)) {
      warning = "URL не может начинаться с пробела или дефиса"
      input = input.replace(/^[\s-]+/, "")
    }

    if (input.includes("--")) {
      warning = "Нельзя использовать два дефиса подряд"
      input = input.replace(/-+/g, "-")
    }

    // Convert uppercase to lowercase
    input = input.toLowerCase()

    // Convert spaces to hyphens
    input = input.replace(/\s+/g, "-")

    return { value: input, warning }
  }

  const checkAliasAvailability = useCallback(async (alias: string) => {
    if (!alias.trim()) {
      setIsAvailable(null)
      return
    }

    try {
      setIsChecking(true)
      const response = await apiClient.get(`api/server/check-alias/?alias=${encodeURIComponent(alias)}`)

      // Status 200 means available
      setIsAvailable(response.status === 200)
    } catch (error) {
      // Any error means not available
      setIsAvailable(false)
    } finally {
      setIsChecking(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const { value: transformedValue, warning } = validateAndTransform(inputValue)

    setDisplayValue(transformedValue)
    setWarning(warning)
    onChange(transformedValue)

    // Clear previous timeout
    if (checkTimeout) {
      clearTimeout(checkTimeout)
    }

    // Reset availability state
    setIsAvailable(null)
    setIsChecking(false)

    // Set new timeout for API check (1.5 seconds after user stops typing)
    if (transformedValue.trim()) {
      const timeout = setTimeout(() => {
        checkAliasAvailability(transformedValue)
      }, 1500)
      setCheckTimeout(timeout)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeout) {
        clearTimeout(checkTimeout)
      }
    }
  }, [checkTimeout])

  const getStatusIcon = () => {
    if (isChecking) {
      return <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
    }
    if (isAvailable === true) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    if (isAvailable === false) {
      return <XCircle className="w-4 h-4 text-red-500" />
    }
    return null
  }

  const getStatusMessage = () => {
    if (isChecking) {
      return "Проверка доступности..."
    }
    if (isAvailable === true) {
      return "URL доступен"
    }
    if (isAvailable === false) {
      return "URL уже занят"
    }
    return null
  }

  return (
    <div className={className}>
      <div className="relative">
        <Input
          id="serverUrl"
          value={displayValue}
          onChange={handleInputChange}
          placeholder="my-server"
          maxLength={55}
          className={`pr-10 ${
            isAvailable === false
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : isAvailable === true
                ? "border-green-300 focus:border-green-500 focus:ring-green-500"
                : ""
          }`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">{getStatusIcon()}</div>
      </div>

      {/* Warning message */}
      {warning && <p className="text-xs text-red-600 mt-1">{warning}</p>}

      {/* Status message */}
      {getStatusMessage() && (
        <p
          className={`text-xs mt-1 ${
            isAvailable === true ? "text-green-600" : isAvailable === false ? "text-red-600" : "text-gray-500"
          }`}
        >
          {getStatusMessage()}
        </p>
      )}

      {/* Help text */}
      {!warning && !getStatusMessage() && <p className="text-xs text-gray-500 mt-1">URL slug for your server</p>}
    </div>
  )
}
