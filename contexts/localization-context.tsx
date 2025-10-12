"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { apiClient } from "@/lib/api"
import { LOCALIZATION_FILES } from "@/lib/constants"
import type { SupportedLanguage, LocalizationData, I18nResponse } from "@/types/localization"

interface LocalizationContextType {
  language: SupportedLanguage
  translations: LocalizationData
  loading: boolean
  setLanguage: (lang: SupportedLanguage) => Promise<void>
  t: (key: string, fallback?: string) => string
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = "preferred_language"

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en")
  const [translations, setTranslations] = useState<LocalizationData>({})
  const [loading, setLoading] = useState(true)

  const loadTranslations = async (lang: SupportedLanguage) => {
    try {
      console.log(`[v0] Loading translations for ${lang} from ${LOCALIZATION_FILES[lang]}`)
      const response = await fetch(LOCALIZATION_FILES[lang])
      if (response.ok) {
        const data = await response.json()
        console.log(`[v0] Successfully loaded translations for ${lang}`)
        setTranslations(data)
      } else {
        console.error(`[v0] Failed to load translations for ${lang}: HTTP ${response.status}`)
        setTranslations({})
      }
    } catch (error) {
      console.error(`[v0] Failed to load translations for ${lang}:`, error)
      setTranslations({})
    }
  }

  const getCurrentLanguage = async (): Promise<SupportedLanguage> => {
    // First, check localStorage for saved preference
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null
      if (savedLang && ["en", "ru"].includes(savedLang)) {
        console.log(`[v0] Using saved language preference: ${savedLang}`)
        return savedLang
      }
    }

    // Try to get language from server
    try {
      console.log("[v0] Fetching current language from server")
      const response = await apiClient.get<I18nResponse>("api/user/i18n/current/")
      if (response.data?.django_language) {
        const serverLang = response.data.django_language
        console.log(`[v0] Server language: ${serverLang}`)
        return serverLang
      }
    } catch (error) {
      console.error("[v0] Failed to get current language from server:", error)
    }

    // Fallback to browser language
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language.split("-")[0] as SupportedLanguage
      const detectedLang = ["en", "ru"].includes(browserLang) ? browserLang : "en"
      console.log(`[v0] Using browser language: ${detectedLang}`)
      return detectedLang
    }

    console.log("[v0] Using default language: en")
    return "en"
  }

  const setLanguage = async (lang: SupportedLanguage) => {
    console.log(`[v0] Changing language to: ${lang}`)
    setLoading(true)

    try {
      // Save to localStorage immediately for instant persistence
      if (typeof window !== "undefined") {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
        console.log(`[v0] Saved language preference to localStorage: ${lang}`)
      }

      // Update local state first for immediate UI feedback
      setLanguageState(lang)

      // Load new translations
      await loadTranslations(lang)

      // Try to update language on server (non-blocking)
      try {
        console.log(`[v0] Updating language on server: ${lang}`)
        await apiClient.post("api/user/i18n/set-language/", {
          language: lang,
        })
        console.log("[v0] Successfully updated language on server")
      } catch (serverError) {
        // Server update failed, but we already saved locally, so it's okay
        console.warn("[v0] Failed to update language on server (continuing with local change):", serverError)
      }
    } catch (error) {
      console.error("[v0] Failed to set language:", error)
      throw error // Re-throw so the UI can show an error
    } finally {
      setLoading(false)
    }
  }

  const t = (key: string, fallback?: string): string => {
    const keys = key.split(".")
    let value: any = translations

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        return fallback || key
      }
    }

    return typeof value === "string" ? value : fallback || key
  }

  useEffect(() => {
    const initLocalization = async () => {
      console.log("[v0] Initializing localization")
      setLoading(true)

      // Get current language (checks localStorage, server, then browser)
      const currentLang = await getCurrentLanguage()
      setLanguageState(currentLang)

      // Load translations
      await loadTranslations(currentLang)

      setLoading(false)
      console.log("[v0] Localization initialized")
    }

    initLocalization()
  }, [])

  const value: LocalizationContextType = {
    language,
    translations,
    loading,
    setLanguage,
    t,
  }

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>
}

export function useLocalization() {
  const context = useContext(LocalizationContext)
  if (context === undefined) {
    throw new Error("useLocalization must be used within a LocalizationProvider")
  }
  return context
}
