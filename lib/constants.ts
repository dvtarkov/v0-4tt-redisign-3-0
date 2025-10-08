// Application constants
export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_API || "https://4tt.org/"
export const STATIC_URL = "https://static.4tt.org/"

// Brand colors
export const COLORS = {
  main: "#d30d12",
  accent: "#0778b9",
} as const

// API endpoints
export const ENDPOINTS = {
  USER_ME: "api/user/me/",
  AUTH_REFRESH: "api/user/auth/refresh/",
  I18N_CURRENT: "api/user/i18n/current/",
  I18N_SET_LANGUAGE: "api/user/i18n/set-language/",
} as const

// Localization files
export const LOCALIZATION_FILES = {
  en: "/i18n/en.json",
  ru: "/i18n/ru.json",
} as const
