"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api"

interface EmailConfirmationFormProps {
  token: string
}

export function EmailConfirmationForm({ token }: EmailConfirmationFormProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        console.log("[v0] Starting email confirmation with token:", token)

        const response = await apiClient.get(`api/user/confirm-email/${token}/`)
        console.log("[v0] Email confirmation response status:", response.status)

        if (response.status === 200) {
          console.log("[v0] Email confirmed successfully")
          setStatus("success")
        } else {
          console.log("[v0] Email confirmation failed with status:", response.status)
          setStatus("error")
          setErrorMessage("Не удалось подтвердить email. Попробуйте еще раз.")
        }
      } catch (error) {
        console.log("[v0] Email confirmation error:", error)
        setStatus("error")
        setErrorMessage("Произошла ошибка при подтверждении email. Проверьте ссылку или попробуйте еще раз.")
      }
    }

    if (token) {
      confirmEmail()
    }
  }, [token])

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Подтверждение Email</CardTitle>
          <CardDescription>
            {status === "loading" && "Подтверждаем ваш email адрес..."}
            {status === "success" && "Email успешно подтвержден!"}
            {status === "error" && "Ошибка подтверждения email"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
          )}

          {status === "success" && (
            <>
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <p className="text-gray-600">
                Ваш email адрес был успешно подтвержден. Теперь у вас есть полный доступ ко всем функциям.
              </p>
              <Button onClick={handleGoHome} className="w-full">
                Перейти на главную страницу
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex justify-center">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <p className="text-gray-600">{errorMessage}</p>
              <div className="space-y-2">
                <Button onClick={handleGoHome} variant="outline" className="w-full bg-transparent">
                  Перейти на главную страницу
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
