"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LanguageSelector } from "@/components/ui/language-selector"
import { useAuth } from "@/contexts/auth-context"
import { useLocalization } from "@/contexts/localization-context"
import { COLORS } from "@/lib/constants"

export function Header() {
  const { user, logout } = useAuth()
  const { t } = useLocalization()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems: { href: string; label: string }[] = []

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 cursor-pointer">
            <img
              src="https://static.4tt.org/frontend/4tt-logo.webp"
              alt="4TT Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-semibold text-gray-900">4TT.org</span>
          </Link>

          {/* Navigation - now empty but keeping structure */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side - Language selector and auth */}
          <div className="flex items-center space-x-4">
            <LanguageSelector />

            {user ? (
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent p-2 cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login" className="cursor-pointer">
                  <Button variant="ghost" size="sm" className="cursor-pointer">
                    {t("auth.login", "Login")}
                  </Button>
                </Link>
                <Link href="/register" className="cursor-pointer">
                  <Button
                    size="sm"
                    style={{ backgroundColor: COLORS.main }}
                    className="text-white hover:opacity-90 cursor-pointer"
                  >
                    {t("auth.register", "Register")}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile navigation - now empty but keeping structure */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-gray-50">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md cursor-pointer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <div className="border-t border-gray-200 pt-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout()
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent cursor-pointer"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  {t("auth.logout", "Logout")}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
