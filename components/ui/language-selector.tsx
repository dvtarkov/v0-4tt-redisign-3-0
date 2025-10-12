"use client"

import { Button } from "@/components/ui/button"
import { useLocalization } from "@/contexts/localization-context"
import type { SupportedLanguage } from "@/types/localization"
import { ChevronDown, Globe, Loader2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"

const languages = {
  en: "English",
  ru: "Русский",
}

export function LanguageSelector() {
  const { language, setLanguage, loading } = useLocalization()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    if (lang !== language && !loading) {
      setIsOpen(false)
      await setLanguage(lang)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button variant="ghost" size="sm" className="gap-2" disabled={loading} onClick={() => setIsOpen(!isOpen)}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
        <span className="uppercase">{language}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 min-w-[120px] rounded-md border border-border bg-popover shadow-md z-50 animate-in fade-in-0 zoom-in-95">
          <div className="p-1">
            {Object.entries(languages).map(([code, name]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code as SupportedLanguage)}
                disabled={loading}
                className={`w-full text-left px-3 py-2 text-sm rounded-sm transition-colors ${
                  language === code
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
