"use client"

import { useEffect, useState } from "react"
import { useWebSocketContext } from "@/contexts/websocket-context"

interface SetupTask {
  task_name: string
  status: string
  message: string
  timestamp: Date
  isNew?: boolean // Added flag to track new tasks for animation
}

interface RealTimeUpdatesProps {
  serverUid?: string
  title?: string
}

export function RealTimeUpdates({ serverUid, title = "Real-time updates" }: RealTimeUpdatesProps) {
  const [setupTasks, setSetupTasks] = useState<SetupTask[]>([])
  const websocket = useWebSocketContext()

  useEffect(() => {
    console.log("[v0] RealTimeUpdates: Setting up WebSocket callback for server:", serverUid)

    const handleServerSetup = (uid: string, taskName: string, status: string, message: string) => {
      console.log("[v0] RealTimeUpdates: Received server setup message:", { uid, taskName, status, message })

      // Only show messages for this specific server if serverUid is provided
      if (serverUid && uid !== serverUid) {
        console.log("[v0] RealTimeUpdates: Ignoring message for different server")
        return
      }

      const newTask: SetupTask = {
        task_name: taskName,
        status: status,
        message: message,
        timestamp: new Date(),
        isNew: true, // Mark as new for animation
      }

      setSetupTasks((prev) => {
        const updatedPrev = prev.map((task) => ({
          ...task,
          status: task.status === "pending" ? "success" : task.status,
          isNew: false,
        }))

        // Replace existing task with same name or add new one
        const existingIndex = updatedPrev.findIndex((task) => task.task_name === taskName)
        if (existingIndex >= 0) {
          const updated = [...updatedPrev]
          updated[existingIndex] = newTask
          console.log("[v0] RealTimeUpdates: Updated existing task:", taskName)
          return updated
        } else {
          console.log("[v0] RealTimeUpdates: Added new task:", taskName)
          return [...updatedPrev, newTask]
        }
      })

      setTimeout(() => {
        setSetupTasks((prev) => prev.map((task) => (task.task_name === taskName ? { ...task, isNew: false } : task)))
      }, 1000)
    }

    websocket.setServerSetupUpdateCallback(handleServerSetup)

    return () => {
      console.log("[v0] RealTimeUpdates: Cleaning up WebSocket callback")
      // Note: The current context doesn't have a remove callback function
      // This is a limitation of the current implementation
    }
  }, [serverUid, websocket])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-blue-400"
      case "success":
      case "completed":
        return "text-green-400"
      case "error":
      case "failed":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusIcon = (status: string, isNew = false) => {
    switch (status) {
      case "pending":
        return (
          <img
            src="https://static.4tt.org/frontend/dice-icons/dice-loading.svg"
            alt="Loading"
            className="w-4 h-4 animate-spin"
          />
        )
      case "success":
      case "completed":
        return (
          <div className="relative">
            <img
              src="https://static.4tt.org/frontend/dice-icons/dice-success.svg"
              alt="Success"
              className={`w-4 h-4 ${isNew ? "animate-pulse-green" : ""}`}
            />
            {isNew && (
              <div className="absolute inset-0 animate-wave-expand">
                <div className="w-4 h-4 rounded-full border-2 border-green-400 opacity-0"></div>
              </div>
            )}
          </div>
        )
      case "error":
      case "failed":
        return <img src="https://static.4tt.org/frontend/dice-icons/dice-error.svg" alt="Error" className="w-4 h-4" />
      default:
        return <span className="w-4 h-4 text-gray-400">📝</span>
    }
  }

  if (setupTasks.length === 0) {
    return null
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <span className="text-xs text-gray-400">{setupTasks.length} updates</span>
      </div>
      <div className="space-y-2">
        {setupTasks.map((task, index) => (
          <div key={`${task.task_name}-${index}`} className="flex items-start gap-2 text-sm">
            <div className="flex-shrink-0 mt-0.5">{getStatusIcon(task.status, task.isNew)}</div>
            <div className="flex-1 min-w-0">
              <div className={`${getStatusColor(task.status)} font-medium`}>{task.message}</div>
              <div className="text-xs text-gray-500 mt-1">{task.timestamp.toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes pulse-green {
          0%, 100% { 
            transform: scale(1);
            filter: drop-shadow(0 0 0 rgba(34, 197, 94, 0));
          }
          50% { 
            transform: scale(1.1);
            filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.6));
          }
        }
        
        @keyframes wave-expand {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
        
        .animate-pulse-green {
          animation: pulse-green 1s ease-in-out;
        }
        
        .animate-wave-expand {
          animation: wave-expand 0.8s ease-out;
        }
      `}</style>
    </div>
  )
}
