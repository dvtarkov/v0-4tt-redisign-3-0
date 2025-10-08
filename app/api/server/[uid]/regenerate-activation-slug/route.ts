import { type NextRequest, NextResponse } from "next/server"
import { apiClient } from "@/lib/api"

export async function POST(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const { uid } = params

    if (!uid) {
      return NextResponse.json({ error: "Server UID is required" }, { status: 400 })
    }

    const response = await apiClient.post(`/server/${uid}/regenerate-activation-slug/`)

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: response.status })
    }

    return NextResponse.json(response.data || { success: true })
  } catch (error) {
    console.error("Error regenerating activation slug:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
