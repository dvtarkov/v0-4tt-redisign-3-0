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

  const getCurrentLanguage = async () => {
    try {
      const response = await apiClient.get<I18nResponse>("api/user/i18n/current/")
      if (response.data?.django_language) {
        return response.data.django_language
      }
    } catch (error) {
      console.error("Failed to get current language:", error)
    }

    // Fallback to browser language or default
    if (typeof navigator !== "undefined") {
      const browserLang = navigator.language.split("-")[0] as SupportedLanguage
      return ["en", "ru"].includes(browserLang) ? browserLang : "en"
    }

    return "en"
  }

  const setLanguage = async (lang: SupportedLanguage) => {
    setLoading(true)
    try {
      // Update language on server
      await apiClient.post("api/user/i18n/set-language/", {
        language: lang,
      })

      // Update local state
      setLanguageState(lang)

      // Load new translations
      await loadTranslations(lang)
    } catch (error) {
      console.error("Failed to set language:", error)
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
      setLoading(true)

      // Get current language from server
      const currentLang = await getCurrentLanguage()
      setLanguageState(currentLang)

      // Load translations
      await loadTranslations(currentLang)

      setLoading(false)
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
