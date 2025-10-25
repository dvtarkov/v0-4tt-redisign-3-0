"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { tokenStorage, AUTH_USE_COOKIES } from "@/lib/token-storage"
import type { User, LoginCredentials, RegisterData } from "@/types/user"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  console.log(`[v0] AuthProvider initialized with ${AUTH_USE_COOKIES ? "COOKIES" : "LOCALSTORAGE"} mode`)

  const refreshUser = async () => {
    try {
      console.log("[v0] Starting refreshUser request")
      const response = await apiClient.get<User>("api/user/me/")
      if (response.data) {
        console.log("[v0] User data fetched successfully")
        setUser(response.data)
      } else {
        console.log("[v0] No user data received, status:", response.status)
        setUser(null)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch user:", error)
      setUser(null)
    }
  }

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      console.log("[v0] Starting login process")
      const response = await apiClient.post("api/user/auth/login/", credentials)

      if (response.data) {
        console.log("[v0] Login API successful")
        // In localStorage mode, we need to store tokens manually
        if (!AUTH_USE_COOKIES && response.data.access && response.data.refresh) {
          tokenStorage.setTokens(response.data.access, response.data.refresh)
          console.log("[v0] Tokens stored in localStorage")
        } else {
          console.log("[v0] Tokens set by backend in HttpOnly cookies")
        }

        // Fetch user data
        console.log("[v0] Fetching user data after login")
        await refreshUser()
        console.log("[v0] Login process completed successfully")
        return true
      }
      console.log("[v0] Login API failed - no data received")
      return false
    } catch (error) {
      console.error("[v0] Login failed:", error)
      return false
    }
  }

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const response = await apiClient.post("api/user/auth/register/", data)

      if (response.data) {
        if (response.data.access && response.data.refresh) {
          tokenStorage.setTokens(response.data.access, response.data.refresh)
        }

        // Fetch user data
        await refreshUser()
        return true
      }
      return false
    } catch (error) {
      console.error("Registration failed:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      // In localStorage mode, send refresh token
      const refreshToken = tokenStorage.getRefreshToken()
      const body = AUTH_USE_COOKIES ? {} : { refresh: refreshToken }

      await apiClient.post("api/user/auth/logout/", body)
    } catch (error) {
      console.error("Logout API call failed:", error)
      // Continue with local cleanup even if API call fails
    }

    tokenStorage.clearTokens()
    setUser(null)

    // Redirect to login
    window.location.href = "/login"
  }

  useEffect(() => {
    console.log("[v0] AuthProvider useEffect started")

    const initAuth = async () => {
      setLoading(true)

      // In localStorage mode, only fetch if tokens exist
      const shouldFetchUser = AUTH_USE_COOKIES || tokenStorage.hasTokens()
      console.log(`[v0] Should fetch user: ${shouldFetchUser}`)

      if (shouldFetchUser) {
        // If tokens exist (or cookie mode), try to fetch user data
        await refreshUser()
      }

      setLoading(false)
      console.log("[v0] Auth initialization completed")
    }

    initAuth()
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
