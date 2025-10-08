"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import { Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await apiClient.post("api/user/auth/password-reset-request/", {
        email: email,
      })
      setSuccess(true)
    } catch (error: any) {
      console.error("Password reset request failed:", error)
      setError("Ошибка при отправке запроса. Попробуйте снова.")
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-lg border border-gray-200 bg-white">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Письмо отправлено</CardTitle>
            <CardDescription className="text-gray-600">
              Мы отправили инструкции по восстановлению пароля на ваш email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-gray-600">
              Не получили письмо? Проверьте папку "Спам" или попробуйте снова через несколько минут.
            </div>

            <Link href="/login">
              <Button className="w-full h-12 bg-[#0778b9] hover:bg-[#065a94] text-white font-semibold rounded-lg shadow-lg transition-all duration-200">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Вернуться к входу
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg border border-gray-200 bg-white">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-[#0778b9]">Забыли пароль?</CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Введите ваш email и мы отправим инструкции по восстановлению
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-12 border-2 border-gray-200 focus:border-[#0778b9] focus:ring-[#0778b9] rounded-lg"
                placeholder="Введите ваш email"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-[#0778b9] hover:bg-[#065a94] text-white font-semibold rounded-lg shadow-lg transition-all duration-200"
              disabled={loading || !email.trim()}
            >
              {loading ? "Отправка..." : "Отправить email"}
            </Button>
          </form>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-[#0778b9] font-medium transition-colors inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Вернуться к входу
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
