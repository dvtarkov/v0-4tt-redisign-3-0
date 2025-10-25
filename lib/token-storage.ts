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
  private getCookie(name: string): string | null {
    if (typeof document === "undefined") return null

    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null
    }
    return null
  }

  private setCookie(name: string, value: string, days = 30): void {
    if (typeof document === "undefined") return

    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)

    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`
  }

  private deleteCookie(name: string): void {
    if (typeof document === "undefined") return

    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict`
  }

  getAccessToken(): string | null {
    return this.getCookie("__Secure-access")
  }

  getRefreshToken(): string | null {
    return this.getCookie("__Secure-refresh")
  }

  setTokens(accessToken: string, refreshToken: string): void {
    console.log("[v0] Storing tokens in cookies")
    this.setCookie("__Secure-access", accessToken, 1) // Access token expires in 1 day
    this.setCookie("__Secure-refresh", refreshToken, 30) // Refresh token expires in 30 days
  }

  clearTokens(): void {
    console.log("[v0] Clearing tokens from cookies")
    this.deleteCookie("__Secure-access")
    this.deleteCookie("__Secure-refresh")
  }

  hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken())
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
