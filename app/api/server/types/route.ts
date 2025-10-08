import { NextResponse } from "next/server"

const SERVER_TYPES = [
  {
    code: "su-basic-server-type-001",
    name: "Базовый",
    description: "Базовый сервер для небольших проектов",
    price_per_hour: "0.05",
    user_can_modify: true,
    auto_shutdown_default_delay_min: 30,
    server_max_usage: 80,
    stricted_region: "",
    auto_force_shutdown_hours: 24,
  },
  {
    code: "su-standard-server-type-002",
    name: "Стандартный",
    description: "Стандартный сервер для средних проектов",
    price_per_hour: "0.10",
    user_can_modify: true,
    auto_shutdown_default_delay_min: 60,
    server_max_usage: 90,
    stricted_region: "",
    auto_force_shutdown_hours: 48,
  },
  {
    code: "su-premium-server-type-003",
    name: "Премиум",
    description: "Премиум сервер с высокой производительностью",
    price_per_hour: "0.20",
    user_can_modify: true,
    auto_shutdown_default_delay_min: 120,
    server_max_usage: 95,
    stricted_region: "europe-west1-b",
    auto_force_shutdown_hours: 72,
  },
  {
    code: "su-enterprise-server-type-004",
    name: "Корпоративный",
    description: "Корпоративный сервер для крупных проектов",
    price_per_hour: "0.50",
    user_can_modify: false,
    auto_shutdown_default_delay_min: 240,
    server_max_usage: 100,
    stricted_region: "us-east1-a",
    auto_force_shutdown_hours: 168,
  },
]

export async function GET() {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json(SERVER_TYPES)
  } catch (error) {
    console.error("Error fetching server types:", error)
    return NextResponse.json({ error: "Failed to fetch server types" }, { status: 500 })
  }
}
