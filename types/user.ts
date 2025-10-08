// User-related TypeScript types
export interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  is_active: boolean
  date_joined: string
  last_login?: string
  email_confirmed: boolean // Added email_confirmed field
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  email: string
  password1: string
  password2: string
}
