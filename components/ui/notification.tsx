"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  message: string
  type: "success" | "error" | "info"
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (message: string, type?: "success" | "error" | "info") => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substr(2, 9)
    const notification = { id, message, type }

    console.log("[v0] Adding notification:", notification)

    setNotifications((prev) => [...prev, notification])

    // Auto remove after 2 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 2000)
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

function NotificationContainer() {
  const context = useContext(NotificationContext)
  if (!context) return null

  const { notifications, removeNotification } = context

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-2 duration-300",
            "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
            "min-w-[300px] max-w-[400px]",
          )}
        >
          {notification.type === "success" && <Check className="h-5 w-5 text-green-500 flex-shrink-0" />}

          <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">{notification.message}</span>

          <button
            onClick={() => removeNotification(notification.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}
