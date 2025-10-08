"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLocalization } from "@/contexts/localization-context"
import type { SupportedLanguage } from "@/types/localization"
import { ChevronDown, Globe, Loader2 } from "lucide-react"

const languages = {
  en: "English",
  ru: "Русский",
}

export function LanguageSelector() {
  const { language, setLanguage, loading } = useLocalization()

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    if (lang !== language && !loading) {
      await setLanguage(lang)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
          <span className="uppercase">{language}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {Object.entries(languages).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as SupportedLanguage)}
            disabled={loading}
            className={`cursor-pointer transition-colors ${
              language === code
                ? "bg-primary text-primary-foreground font-medium"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
