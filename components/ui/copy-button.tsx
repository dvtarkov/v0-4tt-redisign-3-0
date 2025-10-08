"use client"

import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useNotification } from "@/components/ui/notification"

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
  size?: "sm" | "default" | "lg"
}

export function CopyButton({ text, label = "Text", className = "", size = "sm" }: CopyButtonProps) {
  const { addNotification } = useNotification()

  const copyToClipboard = async () => {
    console.log("[v0] Copy button clicked, text:", text, "label:", label)

    try {
      await navigator.clipboard.writeText(text)
      console.log("[v0] Text copied successfully, calling notification")

      addNotification(`${label} copied to clipboard`, "success")

      console.log("[v0] Notification called successfully")
    } catch (err) {
      console.log("[v0] Copy failed with error:", err)

      addNotification(`Failed to copy ${label.toLowerCase()}`, "error")
    }
  }

  return (
    <Button
      size={size}
      variant="ghost"
      onClick={copyToClipboard}
      className={`h-6 w-6 p-0 hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-colors ${className}`}
    >
      <Copy className="h-3 w-3" />
    </Button>
  )
}
