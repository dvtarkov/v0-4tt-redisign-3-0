// Localization-related TypeScript types
export type SupportedLanguage = "en" | "ru"

export interface LocalizationData {
  [key: string]: string | LocalizationData
}

export interface I18nResponse {
  django_language: SupportedLanguage
}
