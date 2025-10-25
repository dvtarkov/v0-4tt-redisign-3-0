// Universal API client for 4TT application
import { tokenStorage } from "./token-storage"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_API || "https://4tt.org/"

interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    const accessToken = tokenStorage.getAccessToken()
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`
    }

    return headers
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = tokenStorage.getRefreshToken()

      if (!refreshToken) {
        return false
      }

      const response = await fetch(`${this.baseUrl}api/user/auth/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        tokenStorage.setTokens(data.access, data.refresh || refreshToken)
        return true
      }
    } catch (error) {
      console.error("Token refresh failed:", error)
    }

    return false
  }

  private redirectToLogin() {
    console.log("[v0] API: Redirecting to login due to auth failure")
    tokenStorage.clearTokens()

    // Redirect to login page
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const headers = await this.getAuthHeaders()

      console.log(`[v0] API: Making request to ${endpoint}`)
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      })

      // Handle 401 - try to refresh token
      if (response.status === 401) {
        console.log(`[v0] API: Got 401 for ${endpoint}, attempting token refresh`)
        const refreshSuccess = await this.refreshToken()

        if (refreshSuccess) {
          console.log(`[v0] API: Token refresh successful, retrying ${endpoint}`)
          // Retry the original request with new token
          const newHeaders = await this.getAuthHeaders()
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              ...newHeaders,
              ...options.headers,
            },
          })

          if (retryResponse.ok) {
            console.log(`[v0] API: Retry successful for ${endpoint}`)
            const data = await retryResponse.json()
            return { data, status: retryResponse.status }
          } else {
            console.log(`[v0] API: Retry failed for ${endpoint}, status:`, retryResponse.status)
          }
        } else {
          console.log(`[v0] API: Token refresh failed for ${endpoint}`)
        }

        // If refresh failed or retry failed, redirect to login
        this.redirectToLogin()
        return { error: "Authentication failed", status: 401 }
      }

      if (response.ok) {
        console.log(`[v0] API: Request successful for ${endpoint}`)
        const data = await response.json()
        return { data, status: response.status }
      } else {
        console.log(`[v0] API: Request failed for ${endpoint}, status:`, response.status)
        const errorData = await response.json().catch(() => ({}))
        return {
          error: errorData.message || "Request failed",
          status: response.status,
        }
      }
    } catch (error) {
      console.error(`[v0] API: Network error for ${endpoint}:`, error)
      return {
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      }
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }
}

// Export singleton instance
export const apiClient = new ApiClient(BACKEND_URL)
export default apiClient
