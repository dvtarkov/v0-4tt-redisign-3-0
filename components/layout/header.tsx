"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LanguageSelector } from "@/components/ui/language-selector"
import { useAuth } from "@/contexts/auth-context"
import { useLocalization } from "@/contexts/localization-context"
import { COLORS } from "@/lib/constants"
import { Menu, X, LogOut } from "lucide-react"

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

          <div className="hidden md:flex items-center space-x-4">
            <LanguageSelector />

            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent p-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </Button>
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

          <div className="flex md:hidden items-center space-x-2">
            <LanguageSelector />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="cursor-pointer p-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 pt-2 pb-3 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="border-t border-gray-200 pt-3 mt-2 space-y-2">
              {user ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout()
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent cursor-pointer justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("auth.logout", "Logout")}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Link href="/login" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full cursor-pointer bg-transparent">
                      {t("auth.login", "Login")}
                    </Button>
                  </Link>
                  <Link href="/register" className="block" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      size="sm"
                      style={{ backgroundColor: COLORS.main }}
                      className="w-full text-white hover:opacity-90 cursor-pointer"
                    >
                      {t("auth.register", "Register")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
