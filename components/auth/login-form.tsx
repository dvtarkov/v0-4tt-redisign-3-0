"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const success = await login({ username, password })

    if (success) {
      window.location.replace("/")
    } else {
      setError("Invalid credentials. Please try again.")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg border border-gray-200 bg-white">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-bold text-[#d30d12]">Добро пожаловать</CardTitle>
          <CardDescription className="text-lg text-gray-600">Войдите в свой аккаунт 4TT</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                Имя пользователя
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className="h-12 border-2 border-gray-200 focus:border-[#d30d12] focus:ring-[#d30d12] rounded-lg"
                placeholder="Введите имя пользователя"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Пароль
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 border-2 border-gray-200 focus:border-[#d30d12] focus:ring-[#d30d12] rounded-lg pr-12"
                  placeholder="Введите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#d30d12] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-[#d30d12] hover:bg-[#b50a0f] text-white font-semibold rounded-lg shadow-lg transition-all duration-200"
              disabled={loading}
            >
              {loading ? "Вход..." : "Войти"}
            </Button>
          </form>

          <div className="space-y-4 text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-[#0778b9] hover:text-[#065a8c] font-medium transition-colors"
            >
              Забыли пароль?
            </Link>

            <div className="text-sm text-gray-600">
              Нет аккаунта?{" "}
              <Link href="/register" className="text-[#d30d12] hover:text-[#b50a0f] font-medium transition-colors">
                Зарегистрируйтесь
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
