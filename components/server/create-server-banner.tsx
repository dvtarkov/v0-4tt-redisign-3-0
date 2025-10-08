"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Server, Plus, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

export function CreateServerBanner() {
  const router = useRouter()

  return (
    <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Server className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Создайте свой сервер!</h3>
            <p className="text-sm text-gray-600">Всего за три простых шага</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
            <Zap className="w-4 h-4" />
            <span>Быстрая настройка</span>
          </div>
          <Button onClick={() => router.push("/create-server")} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Создать сервер
          </Button>
        </div>
      </div>
    </Card>
  )
}
