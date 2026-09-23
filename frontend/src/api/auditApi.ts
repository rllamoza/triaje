import api from './client'

export interface AuditStatus {
  enabled: boolean
  db_connected: boolean
  db_name: string
  table_exists: boolean
  total_records: number
  records_today: number
  error_records: number
  db_size_mb: number
  last_record: {
    id: number
    endpoint: string
    method: string
    created_at: string
    user_name: string | null
  } | null
  error_message: string | null
}

export interface AuditRecordItem {
  id: number
  user_id: number | null
  user_name: string | null
  user_email: string | null
  user_role: string | null
  user_dni: string | null
  station: string | null
  method: string
  url: string
  endpoint: string
  route_name: string | null
  action_category: string
  status_code: number
  duration_ms: number | null
  ip_address: string
  is_local_ip: boolean
  hostname: string | null
  network_effective_type: string | null
  network_rtt_ms: number | null
  network_downlink_mbps: number | null
  network_save_data: boolean
  device_type: string | null
  device_os: string | null
  device_browser: string | null
  screen_resolution: string | null
  client_timezone: string | null
  client_language: string | null
  user_agent: string | null
  request_payload: Record<string, any> | null
  response_summary: Record<string, any> | null
  error_message: string | null
  created_at: string
}

export interface AuditLogsResponse {
  data: AuditRecordItem[]
  current_page: number
  last_page: number
  total: number
  per_page: number
  from: number
  to: number
}

export interface AuditStats {
  categories: { action_category: string; count: number }[]
  devices: { device_os: string; count: number }[]
  hourly: { hour: number; count: number }[]
}

export const auditApi = {
  getStatus: async (): Promise<AuditStatus> => {
    const res = await api.get<AuditStatus>('/admin/audit/status')
    return res.data
  },

  toggle: async (enabled: boolean): Promise<{ success: boolean; enabled: boolean; message: string }> => {
    const res = await api.post<{ success: boolean; enabled: boolean; message: string }>('/admin/audit/toggle', { enabled })
    return res.data
  },

  getLogs: async (params?: Record<string, any>): Promise<AuditLogsResponse> => {
    const res = await api.get<AuditLogsResponse>('/admin/audit/logs', { params })
    return res.data
  },

  getLogDetail: async (id: number): Promise<AuditRecordItem> => {
    const res = await api.get<AuditRecordItem>(`/admin/audit/logs/${id}`)
    return res.data
  },

  getStats: async (): Promise<AuditStats> => {
    const res = await api.get<AuditStats>('/admin/audit/stats')
    return res.data
  },

  exportCsvUrl: (params?: Record<string, any>): string => {
    const searchParams = new URLSearchParams(params as any).toString()
    const base = import.meta.env.VITE_API_URL || '/api'
    return `${base}/admin/audit/export?${searchParams}`
  }
}
