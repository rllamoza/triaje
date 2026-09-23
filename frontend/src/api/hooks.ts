import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from './client'
import { useAuthStore } from '../store/authStore'

/* ── Types ──────────────────────────────────────────────────── */
export interface User {
  id: number
  nombres: string
  apellidos: string
  full_name: string
  cmp_code: string | null
  dni: string | null
  role: 'admin' | 'medico' | 'triaje' | 'admision' | 'guardia'
  station_default: string | null
  active: boolean
  last_login_at: string | null
}

export interface Campaign {
  id: number
  code: string
  name: string
  location_name: string
  province: string | null
  department: string | null
  altitude_masl: number | null
  start_date: string
  end_date: string | null
  status: 'planned' | 'active' | 'closed'
  node_id: string | null
  starlink_active: boolean
  today_count: number
  stations_count: number
}

export interface Station {
  id: number
  campaign_id: number
  code: string
  type: 'admision' | 'triaje' | 'medico' | 'farmacia' | 'pediatria' | 'otro'
  label: string
  printer_id: string | null
  active: boolean
}

export interface Beneficiario {
  id: number
  dni: string
  nombres: string
  apellidos: string
  fecha_nacimiento: string
  edad_calculada: number | null
  sexo: 'M' | 'F' | 'O'
  idioma_principal: string
  tipo_seguro: string
  celular: string | null
  grupo_sanguineo: string | null
  rh_factor: '+' | '-' | null
  peso_kg: number | null
  talla_cm: number | null
  reniec_verified: boolean
  campaign_id: number
}

export interface Atencion {
  id: number
  ticket_number: number
  beneficiario_id: number
  campaign_id: number
  station_id: number | null
  arrival_time: string
  status: string
  seguro_usado: string | null
  triage_start_at: string | null
  triage_end_at: string | null
  medico_start_at: string | null
  medico_end_at: string | null
  referred_to: string | null
  beneficiario?: Beneficiario
  triaje?: Triaje
  station?: Station
}

export interface Triaje {
  id: number
  atencion_id: number
  temperatura_c: number | null
  presion_sistolica: number | null
  presion_diastolica: number | null
  frecuencia_cardiaca: number | null
  frecuencia_respiratoria: number | null
  saturacion_o2_pct: number | null
  glucosa_mg_dl: number | null
  peso_kg: number | null
  talla_cm: number | null
  imc: number | null
  altitud_atencion_masl: number | null
  prioridad: 'I' | 'II' | 'III'
  prioridad_label: string | null
  prioridad_color: 'rojo' | 'amarillo' | 'verde'
  sintoma_principal: string | null
  motivo_consulta: string | null
  observaciones_triaje: string | null
  alergias_activas: string[] | null
  alertas_clinicas: unknown[] | null
}

export interface Medicamento {
  id: number
  nombre_generico: string
  nombre_comercial: string | null
  concentracion: string | null
  forma_farmaceutica: string
  via_administracion: string
}

export interface NodeStatus {
  node_id: string
  hardware?: string
  starlink: boolean
  latency_ms: number
  battery_pct: number
  printer: string
  printer_ok: boolean
  db_synced: boolean
  pending_sync_count?: number
  timezone?: string
  timestamp: string
}

/* ── Auth ────────────────────────────────────────────────────── */
export const useLogin = () =>
  useMutation({
    mutationFn: (data: {
      credential: string
      password: string
      campaign_id?: number
      station_id?: string
    }) => api.post('/auth/login', data).then((r) => r.data),
  })

export const useLoginPin = () =>
  useMutation({
    mutationFn: (data: {
      pin: string
      responsable: string
      campaign_id?: number
    }) => api.post('/auth/login-pin', data).then((r) => r.data),
  })

export const useLogout = () =>
  useMutation({
    mutationFn: () => api.post('/auth/logout').then((r) => r.data),
  })

export const useNodeStatus = () =>
  useQuery<NodeStatus>({
    queryKey: ['node-status'],
    queryFn: () => api.get('/auth/node-status').then((r) => r.data),
    refetchInterval: 30000,
  })

/* ── Campaigns ───────────────────────────────────────────────── */
export const useCampaigns = (status?: string) => {
  const token = useAuthStore((s) => s.token)
  return useQuery<Campaign[]>({
    queryKey: ['campaigns', status],
    queryFn: () =>
      api.get('/campaigns', { params: status ? { status } : {} }).then((r) => r.data),
    enabled: !!token,
  })
}

export const useCampaign = (id: number) => {
  const token = useAuthStore((s) => s.token)
  return useQuery<Campaign>({
    queryKey: ['campaigns', id],
    queryFn: () => api.get(`/campaigns/${id}`).then((r) => r.data),
    enabled: !!id && !!token,
  })
}

export const useCampaignStats = (id: number) => {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['campaigns', id, 'stats'],
    queryFn: () => api.get(`/campaigns/${id}/stats`).then((r) => r.data),
    enabled: !!id && !!token,
    refetchInterval: 20000,
  })
}

export const useCampaignStations = (id: number) => {
  const token = useAuthStore((s) => s.token)
  return useQuery<Station[]>({
    queryKey: ['campaigns', id, 'stations'],
    queryFn: () => api.get(`/campaigns/${id}/stations`).then((r) => r.data),
    enabled: !!id && !!token,
  })
}

export const useActivateCampaign = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post(`/campaigns/${id}/activate`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  })
}

/* ── Queue ───────────────────────────────────────────────────── */
export const useQueue = (campaignId: number) => {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['queue', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/cola`).then((r) => r.data),
    enabled: !!campaignId && !!token,
    refetchInterval: 8000,
  })
}

/* ── Beneficiarios ───────────────────────────────────────────── */
export const useReniecLookup = () =>
  useMutation({
    mutationFn: (dni: string) => api.get(`/reniec/${dni}`).then((r) => r.data),
  })

export const useCheckDuplicate = () =>
  useMutation({
    mutationFn: (params: { dni: string; campaign_id?: number }) =>
      api
        .get(`/beneficiarios/check-duplicate/${params.dni}`, {
          params: { campaign_id: params.campaign_id },
        })
        .then((r) => r.data),
  })

export const useStoreBeneficiario = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/beneficiarios', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['beneficiarios'] }),
  })
}

/* ── Atenciones ──────────────────────────────────────────────── */
export const useAtenciones = (params?: Record<string, unknown>) => {
  const token = useAuthStore((s) => s.token)
  return useQuery<{ data: Atencion[] }>({
    queryKey: ['atenciones', params],
    queryFn: () => api.get('/atenciones', { params }).then((r) => r.data),
    enabled: !!token,
  })
}

export const useAtencion = (id: number) => {
  const token = useAuthStore((s) => s.token)
  return useQuery<Atencion>({
    queryKey: ['atenciones', id],
    queryFn: () => api.get(`/atenciones/${id}`).then((r) => r.data),
    enabled: !!id && !!token,
  })
}

export const useStoreAtencion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      beneficiario_id: number
      campaign_id: number
      station_id?: number
      seguro_usado?: string
    }) => api.post('/atenciones', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['atenciones'] })
      qc.invalidateQueries({ queryKey: ['queue'] })
    },
  })
}

export const useUpdateAtencionStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number
      status: string
      station_id?: number
    }) => api.patch(`/atenciones/${id}/status`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['atenciones'] })
      qc.invalidateQueries({ queryKey: ['queue'] })
    },
  })
}

/* ── Triaje ──────────────────────────────────────────────────── */
export const useTriajeRangos = (altitud?: number) =>
  useQuery({
    queryKey: ['triaje-rangos', altitud],
    queryFn: () =>
      api
        .get('/triajes/rangos', { params: altitud ? { altitud_masl: altitud } : {} })
        .then((r) => r.data),
  })

export const useStoreTriaje = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/triajes', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['atenciones'] })
      qc.invalidateQueries({ queryKey: ['queue'] })
    },
  })
}

/* ── Consulta ─────────────────────────────────────────────────── */
export const useMedicamentos = (q?: string) =>
  useQuery<Medicamento[]>({
    queryKey: ['medicamentos', q],
    queryFn: () => api.get('/medicamentos', { params: q ? { q } : {} }).then((r) => r.data),
  })

export const useStoreConsulta = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/consultas', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['atenciones'] }),
  })
}

export const useUpdateConsulta = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [k: string]: unknown }) =>
      api.put(`/consultas/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['atenciones'] }),
  })
}

export const useFirmarConsulta = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post(`/consultas/${id}/firmar`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['atenciones'] }),
  })
}

/* ── Tickets ──────────────────────────────────────────────────── */
export const useGenerateTicket = () =>
  useMutation({
    mutationFn: (data: { atencion_id: number; tipo: string; printer_id?: string }) =>
      api.post('/tickets/generate', data).then((r) => r.data),
  })

/* ── Users ────────────────────────────────────────────────────── */
export const useUsers = () => {
  const token = useAuthStore((s) => s.token)
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: !!token,
  })
}

export const useStoreUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/users', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useUpdateUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; [k: string]: unknown }) =>
      api.put(`/users/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useDeleteUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useResetPin = () =>
  useMutation({
    mutationFn: ({ id, pin }: { id: number; pin: string }) =>
      api.post(`/users/${id}/reset-pin`, { pin }).then((r) => r.data),
  })
