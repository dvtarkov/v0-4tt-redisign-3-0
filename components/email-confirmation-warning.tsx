"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import { useNotification } from "@/components/ui/notification"
import { useState } from "react"
import { apiClient } from "@/lib/api" // Import apiClient for proper backend API calls

interface EmailConfirmationWarningProps {
  onActivateClick?: () => void // Made optional since we handle API call internally now
}

export function EmailConfirmationWarning({ onActivateClick }: EmailConfirmationWarningProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { addNotification } = useNotification()

  const handleResendEmail = async () => {
    console.log("[v0] Email resend button clicked")
    setIsLoading(true)

    try {
      console.log("[v0] Making API request to api/user/confirm-email/resend_link/")
      const response = await apiClient.post("api/user/confirm-email/resend_link/")

      console.log("[v0] API response status:", response.status)

      if (response.status === 200) {
        console.log("[v0] Email resend successful")
        addNotification("Письмо с активацией отправлено на ваш email", "success")

        // Call the original callback if provided
        onActivateClick?.()
      } else {
        console.log("[v0] Email resend failed with status:", response.status)
        addNotification("Не удалось отправить письмо активации", "error")
      }
    } catch (error) {
      console.error("[v0] Error resending email:", error)
      addNotification("Произошла ошибка при отправке письма", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <Mail className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-amber-800">
          Ваш email не подтвержден. Подтвердите email для полного доступа к функциям.
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResendEmail}
          disabled={isLoading}
          className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100 bg-transparent"
        >
          {isLoading ? "Отправка..." : "Активировать email"}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
