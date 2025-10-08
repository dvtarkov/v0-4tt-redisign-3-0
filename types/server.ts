export interface Server {
  uid: string
  name: string
  url: string
  status: "running" | "stopping" | "starting" | "stopped" | "suspended" | "deleted"
  phase: "creating" | "ready_for_foundry" | "setting_foundry" | "foundry_ready" | "setting_infra" | string
  blocked: boolean
  zone: string
  server_type:
    | string
    | {
        max_storage_mb?: number
        server_max_usage?: number
      }
  created_at: string
  last_active: string
  active_time_h?: number
  server_max_usage?: number
  used_storage_mb?: number
}

export interface ServerStats {
  cpu_usage?: number
  memory_usage?: number
  disk_usage?: number
  network_in?: number
  network_out?: number
}
