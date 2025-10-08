"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    password1: "",
    password2: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const { register } = useAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (formData.password1 !== formData.password2) {
      setError("Пароли не совпадают")
      setLoading(false)
      return
    }

    if (!agreedToTerms) {
      setError("Необходимо согласиться с политикой конфиденциальности и офертой")
      setLoading(false)
      return
    }

    const success = await register(formData)

    if (success) {
      router.push("/")
    } else {
      setError("Ошибка регистрации. Попробуйте снова.")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg border border-gray-200 bg-white">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-[#0778b9]">Регистрация</CardTitle>
          <CardDescription className="text-lg text-gray-600">Создайте новый аккаунт 4TT</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="h-11 border-2 border-gray-200 focus:border-[#0778b9] focus:ring-[#0778b9] rounded-lg"
                placeholder="Введите email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password1" className="text-sm font-semibold text-gray-700">
                Пароль
              </Label>
              <div className="relative">
                <Input
                  id="password1"
                  name="password1"
                  type={showPassword ? "text" : "password"}
                  value={formData.password1}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-11 border-2 border-gray-200 focus:border-[#0778b9] focus:ring-[#0778b9] rounded-lg pr-12"
                  placeholder="Введите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#0778b9] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password2" className="text-sm font-semibold text-gray-700">
                Подтвердите пароль
              </Label>
              <div className="relative">
                <Input
                  id="password2"
                  name="password2"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.password2}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-11 border-2 border-gray-200 focus:border-[#0778b9] focus:ring-[#0778b9] rounded-lg pr-12"
                  placeholder="Повторите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#0778b9] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="mt-1 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer block">
                  Я согласен с{" "}
                  <Link href="/privacy" className="text-[#0778b9] hover:text-[#065a94] underline">
                    политикой конфиденциальности
                  </Link>{" "}
                  и{" "}
                  <Link href="/terms" className="text-[#0778b9] hover:text-[#065a94] underline">
                    офертой
                  </Link>
                </Label>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-[#0778b9] hover:bg-[#065a94] text-white font-semibold rounded-lg shadow-lg transition-all duration-200"
              disabled={loading}
            >
              {loading ? "Создание аккаунта..." : "Создать аккаунт"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600 pt-4">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-[#0778b9] hover:text-[#065a94] font-medium transition-colors">
              Войти
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
