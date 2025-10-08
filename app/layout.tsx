import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { LocalizationProvider } from "@/contexts/localization-context"
import { WebSocketProvider } from "@/contexts/websocket-context"
import { ServerProvider } from "@/contexts/server-context"
import { NotificationProvider } from "@/components/ui/notification"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "4tt.org - Неофициальный хостинг Foundry",
  description: "4TT Server Management Platform",
  generator: "4tt.org",
  icons: {
    icon: "https://static.4tt.org/frontend/favicons/favicon.ico",
  },
  manifest: "https://static.4tt.org/frontend/favicons/site.webmanifest",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <AuthProvider>
            <WebSocketProvider>
              <ServerProvider>
                <NotificationProvider>
                  <LocalizationProvider>{children}</LocalizationProvider>
                </NotificationProvider>
              </ServerProvider>
            </WebSocketProvider>
          </AuthProvider>
        </Suspense>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
