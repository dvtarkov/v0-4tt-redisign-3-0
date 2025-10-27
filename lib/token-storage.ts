// Token storage abstraction with cookie/localStorage switch
const AUTH_USE_COOKIES = true // <-- Переключатель между куки и localStorage

interface TokenStorage {
  getAccessToken(): string | null
  getRefreshToken(): string | null
  setTokens(accessToken: string, refreshToken: string): void
  clearTokens(): void
  hasTokens(): boolean
}

class CookieTokenStorage implements TokenStorage {
  // The browser will automatically send cookies with requests
  getAccessToken(): string | null {
    console.log("[v0] Cookie mode: tokens managed by browser (HttpOnly)")
    return null // Cannot read HttpOnly cookies from JS
  }

  getRefreshToken(): string | null {
    console.log("[v0] Cookie mode: tokens managed by browser (HttpOnly)")
    return null // Cannot read HttpOnly cookies from JS
  }

  setTokens(accessToken: string, refreshToken: string): void {
    console.log("[v0] Cookie mode: tokens set by backend (HttpOnly)")
    // Backend sets HttpOnly cookies, no client-side action needed
  }

  clearTokens(): void {
    console.log("[v0] Cookie mode: tokens will be cleared by backend")
    // Backend will clear cookies on logout
  }

  hasTokens(): boolean {
    console.log("[v0] Cookie mode: cannot check HttpOnly cookies from JS")
    return false // Will rely on API responses to determine auth state
  }
}

class LocalStorageTokenStorage implements TokenStorage {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("access")
  }

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("refresh")
  }

  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === "undefined") return

    console.log("[v0] Storing tokens in localStorage")
    localStorage.setItem("access", accessToken)
    localStorage.setItem("refresh", refreshToken)
  }

  clearTokens(): void {
    if (typeof window === "undefined") return

    console.log("[v0] Clearing tokens from localStorage")
    localStorage.removeItem("access")
    localStorage.removeItem("refresh")
  }

  hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken())
  }
}

// Export the configured token storage instance
export const tokenStorage: TokenStorage = AUTH_USE_COOKIES ? new CookieTokenStorage() : new LocalStorageTokenStorage()

export { AUTH_USE_COOKIES }
