import { useState } from 'react'
import { Link } from 'react-router-dom'
import ExcelJS from 'exceljs'
import {
  useCampaigns,
  useCopyMedicamentos,
  useMedicamentosAdmin,
  useDeleteMedicamento,
  type MedicamentoAdmin,
} from '../../api/hooks'
import { useAuthStore } from '../../store/authStore'
import { useBrandingStore } from '../../store/brandingStore'
import { useFeatureStore } from '../../store/featureStore'
import { MedicamentoFormModal } from '../../components/medicamentos/MedicamentoFormModal'
import { MedicamentoStockModal } from '../../components/medicamentos/MedicamentoStockModal'
import { MedicamentosImportModal } from '../../components/medicamentos/MedicamentosImportModal'
import { MedicamentosThermalModal } from '../../components/medicamentos/MedicamentosThermalModal'

export const MED_EXCEL_HEADERS = [
  'Clasificación',
  'Código',
  'Nombre Genérico',
  'Nombre Comercial',
  'Concentración',
  'Forma Farmacéutica',
  'Vía Administración',
  'Stock Actual',
  'Stock Mínimo',
  'Uso',
  'Activo',
]

const errMsg = (e: unknown) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  (e as Error)?.message ||
  'Error inesperado'

async function downloadCorporateTemplate(campaignName: string, campaignCode: string) {
  const branding = useBrandingStore.getState()
  const wb = new ExcelJS.Workbook()
  wb.creator = branding.appName || 'ONG Semilla'
  wb.lastModifiedBy = 'Semilla Triaje Salud'
  wb.created = new Date()
  wb.modified = new Date()

  // ── HOJA 1: MEDICAMENTOS ──────────────────────────────────────────
  const ws = wb.addWorksheet('Medicamentos', {
    views: [{ showGridLines: true }],
  })

  // Ancho de columnas
  ws.columns = [
    { key: 'clasificacion', width: 22 },
    { key: 'codigo', width: 16 },
    { key: 'generico', width: 34 },
    { key: 'comercial', width: 26 },
    { key: 'concentracion', width: 18 },
    { key: 'forma', width: 22 },
    { key: 'via', width: 20 },
    { key: 'stock', width: 15 },
    { key: 'minimo', width: 15 },
    { key: 'uso', width: 18 },
    { key: 'activo', width: 12 },
  ]

  // Fila 1: Título Institucional Principal
  ws.mergeCells('A1:K1')
  const r1 = ws.getCell('A1')
  r1.value = `ORGANIZACIÓN SOCIAL SEMILLA — ${branding.exportHeader || 'ASISTENCIA MÉDICA RURAL'}`
  r1.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
  r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F4C81' } }
  r1.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(1).height = 36

  // Fila 2: Subtítulo & Misión
  ws.mergeCells('A2:K2')
  const r2 = ws.getCell('A2')
  r2.value = `FORMATO OFICIAL DE ASIGNACIÓN Y CARGA DE VADEMÉCUM DE CAMPAÑA | ${branding.exportSubheader || 'SISTEMA DE TRIAJE CLÍNICO'}`
  r2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFE8F1F8' } }
  r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF195B94' } }
  r2.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(2).height = 22

  // Fila 3: Metadatos de la campaña
  ws.mergeCells('A3:F3')
  const r3a = ws.getCell('A3')
  r3a.value = `CAMPAÑA DESTINO: ${campaignName ? campaignName.toUpperCase() : 'CAMPAÑA MÉDICA GENERAL'} (${campaignCode || 'ACTIVA'})`
  r3a.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF0F4C81' } }
  r3a.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } }
  r3a.alignment = { vertical: 'middle', indent: 1 }

  ws.mergeCells('G3:K3')
  const r3b = ws.getCell('G3')
  r3b.value = `FECHA EMISIÓN: ${new Date().toLocaleDateString('es-PE')} | MÓDULO FARMACIA & BOTIQUÍN`
  r3b.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF555555' } }
  r3b.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } }
  r3b.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }
  ws.getRow(3).height = 20

  // Fila 4: Banner informativo de orientación
  ws.mergeCells('A4:K4')
  const r4 = ws.getCell('A4')
  r4.value = 'Complete las medicinas asignadas por carpa o botiquín. La columna obligatoria es "Nombre Genérico". Puede especificar "Clasificación" (Antitusivo, etc.) y "Uso" (Pediátrico, Adultos).'
  r4.font = { name: 'Segoe UI', size: 8.5, italic: true, color: { argb: 'FF004D40' } }
  r4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2F1' } }
  r4.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(4).height = 22

  // Fila 5: Separador estético
  ws.getRow(5).height = 6

  // Fila 6: Encabezados de Columna
  const headers = [
    'Clasificación',
    'Código',
    'Nombre Genérico',
    'Nombre Comercial',
    'Concentración',
    'Forma Farmacéutica',
    'Vía Administración',
    'Stock Actual',
    'Stock Mínimo',
    'Uso',
    'Activo',
  ]
  const hRow = ws.getRow(6)
  headers.forEach((h, idx) => {
    const cell = hRow.getCell(idx + 1)
    cell.value = h
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }
    cell.alignment = { vertical: 'middle', horizontal: idx >= 7 && idx <= 8 ? 'right' : 'left' }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1F2937' } },
      bottom: { style: 'medium', color: { argb: 'FF1F2937' } },
      left: { style: 'thin', color: { argb: 'FF374151' } },
      right: { style: 'thin', color: { argb: 'FF374151' } },
    }
  })
  hRow.height = 26

  // Filas de ejemplo (7 y 8)
  const sampleData = [
    ['Analgésico', 'PAR-500', 'Paracetamol', 'Panadol', '500mg', 'tableta', 'oral', 200, 20, 'Adultos', 'si'],
    ['Antibiótico', 'AMX-500', 'Amoxicilina', 'Velamox', '500mg', 'capsula', 'oral', 150, 25, 'Adultos', 'si'],
    ['Antitusivo', 'DXT-15', 'Dextrometorfano', 'Bisolvon', '15mg/5ml', 'jarabe', 'oral', 80, 15, 'Pediátrico', 'si'],
  ]
  sampleData.forEach((row, rIdx) => {
    const dataRow = ws.getRow(7 + rIdx)
    row.forEach((val, cIdx) => {
      const cell = dataRow.getCell(cIdx + 1)
      cell.value = val
      cell.font = { name: 'Segoe UI', size: 9.5 }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
    })
    dataRow.height = 20
  })

  // Exportar archivo al navegador
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = (campaignCode || 'CAMPANA').replace(/[^a-zA-Z0-9_-]/g, '_')
  a.download = `Vademecum_Semilla_${safeName}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export default function MedicamentosPage() {
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'bajos' | 'inactivos'>('todos')
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'ok' | 'error' } | null>(null)

  // Configuración de Columnas personalizada desde el store / BD
  const { medicamentosColumns } = useFeatureStore()
  const activeColumns = [...(medicamentosColumns || [])]
    .filter((c) => c.visible)
    .sort((a, b) => a.order - b.order)

  // Campañas
  const { data: campaigns = [] } = useCampaigns()
  const storeCampaignId = useAuthStore((s) => s.campaignId)
  const [pickedCamp, setPickedCamp] = useState<number | null>(null)
  const campaignId: number | null =
    pickedCamp ??
    storeCampaignId ??
    campaigns.find((c) => c.status === 'active')?.id ??
    campaigns[0]?.id ??
    null
  const campaign = campaigns.find((c) => c.id === campaignId)

  // Copia entre campañas
  const [copyFrom, setCopyFrom] = useState<number | ''>('')
  const [copyStock, setCopyStock] = useState(false)
  const copyMut = useCopyMedicamentos()

  // Consulta de medicamentos
  const { data: meds = [], isLoading, refetch } = useMedicamentosAdmin(campaignId, search || undefined)
  const deleteMut = useDeleteMedicamento()

  // Estados de los Modales
  const [showImportModal, setShowImportModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [medToEdit, setMedToEdit] = useState<MedicamentoAdmin | null>(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [medForStock, setMedForStock] = useState<MedicamentoAdmin | null>(null)
  const [showThermalModal, setShowThermalModal] = useState(false)
  const [medToDelete, setMedToDelete] = useState<MedicamentoAdmin | null>(null)

  const showToast = (text: string, type: 'ok' | 'error' = 'ok') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 4000)
  }

  // Filtrado de la tabla (incluyendo clasificacion y uso)
  const q = search.trim().toLowerCase()
  const filteredMeds = meds.filter((m) => {
    const activo = Number(m.activo) === 1 || Boolean(m.activo)
    if (filtroEstado === 'activos' && !activo) return false
    if (filtroEstado === 'inactivos' && activo) return false
    if (filtroEstado === 'bajos' && (!activo || m.stock_actual > m.stock_minimo)) return false

    if (q) {
      const matchGen = m.nombre_generico?.toLowerCase().includes(q)
      const matchCom = m.nombre_comercial?.toLowerCase().includes(q)
      const matchCod = m.codigo?.toLowerCase().includes(q)
      const matchClasif = m.clasificacion?.toLowerCase().includes(q)
      const matchUso = m.uso?.toLowerCase().includes(q)
      const matchConc = m.concentracion?.toLowerCase().includes(q)
      if (!matchGen && !matchCom && !matchCod && !matchClasif && !matchUso && !matchConc) {
        return false
      }
    }
    return true
  })

  // Métricas
  const totalItems = meds.length
  const totalStock = meds.reduce((acc, m) => acc + (m.stock_actual || 0), 0)
  const bajos = meds.filter((m) => Number(m.activo) === 1 && m.stock_actual <= m.stock_minimo).length
  const agotados = meds.filter((m) => Number(m.activo) === 1 && m.stock_actual === 0).length

  // Manejo de eliminación
  const handleDeleteConfirm = async () => {
    if (!medToDelete || !campaignId) return
    try {
      const res = await deleteMut.mutateAsync({ id: medToDelete.id, campaign_id: campaignId })
      showToast(res.message || `Medicamento "${medToDelete.nombre_generico}" procesado correctamente.`, 'ok')
      setMedToDelete(null)
      refetch()
    } catch (err: unknown) {
      showToast(errMsg(err), 'error')
    }
  }

  const inputCls =
    'w-full h-9 px-3 bg-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none'
  const labelCls = 'block text-[10px] font-bold text-secondary uppercase mb-1'

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* ── CABECERA PRINCIPAL ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">medication</span>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface uppercase tracking-wider">
              Medicamentos de la Campaña
            </h1>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Gestión de vademécum: clasificación clínica, altas, inventario físico, importación y comprobantes térmicos.
          </p>
        </div>

        {/* Botones de Acción Primaria */}
        <div className="flex flex-wrap items-center gap-2">
          {/* BOTÓN PERSONALIZAR COLUMNAS */}
          <Link
            to="/admin/personalizacion"
            className="px-3 py-2.5 bg-surface border border-surface-container-highest text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Personalizar qué columnas se muestran y su orden"
          >
            <span className="material-symbols-outlined text-base text-primary">tune</span>
            <span>Personalizar Columnas</span>
          </Link>

          {/* BOTÓN NUEVO MODAL: OPCIÓN A Y B IMPORTACIÓN / SYNC */}
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2.5 bg-surface border-2 border-primary text-primary hover:bg-primary/10 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
            title="Importar catálogo por Excel (.xlsx) o sincronizar stock desde Base de Datos externa"
          >
            <span className="material-symbols-outlined text-lg">sync_saved_locally</span>
            <span>Importar / Sincronizar</span>
          </button>

          {/* BOTÓN IMPRIMIR RESUMEN TÉRMICO T88 */}
          <button
            type="button"
            onClick={() => setShowThermalModal(true)}
            className="px-3.5 py-2.5 bg-surface-container border border-surface-container-highest text-on-surface hover:bg-surface-container-high text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
            title="Imprimir resumen de vademécum en impresora térmica Epson TM-T88 (80mm)"
          >
            <span className="material-symbols-outlined text-lg">receipt_long</span>
            <span>Resumen Térmico (T88)</span>
          </button>

          {/* BOTÓN CREAR NUEVO MEDICAMENTO */}
          <button
            type="button"
            onClick={() => {
              setMedToEdit(null)
              setShowFormModal(true)
            }}
            className="px-4 py-2.5 bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            id="btn-nuevo-medicamento"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>Nuevo Medicamento</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`p-3.5 text-xs font-semibold border flex items-center justify-between gap-2 shadow-sm animate-fade-in ${
            toastMsg.type === 'ok'
              ? 'bg-tertiary-container text-on-tertiary-container border-tertiary/40'
              : 'bg-error-container text-on-error-container border-error/40'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              {toastMsg.type === 'ok' ? 'check_circle' : 'error'}
            </span>
            <span>{toastMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-xs font-bold uppercase hover:opacity-80 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── SELECTOR DE CAMPAÑA Y COPIA DE CATÁLOGO ────────────────────── */}
      <div className="p-4 bg-surface-container-low border border-surface-container-high flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="md:w-96">
          <label className={labelCls}>Campaña Activa en Gestión</label>
          <select
            id="select-campana-medicamentos"
            className={`${inputCls} cursor-pointer font-semibold`}
            value={campaignId ?? ''}
            onChange={(e) => {
              setPickedCamp(Number(e.target.value))
              setCopyFrom('')
            }}
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code}){c.status === 'active' ? ' — ACTIVA' : c.status === 'closed' ? ' — cerrada' : ''}
              </option>
            ))}
          </select>
          {campaign && (
            <div className="text-[11px] text-on-surface-variant mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">location_on</span>
              <span>{campaign.location_name || 'Ubicación de brigada'}</span>
            </div>
          )}
        </div>

        {campaigns.length > 1 && (
          <div className="flex flex-wrap items-end gap-2 border-t md:border-t-0 md:border-l border-surface-container-high pt-3 md:pt-0 md:pl-4">
            <div>
              <label className={labelCls}>Copiar Vademécum Desde</label>
              <select
                className={`${inputCls} cursor-pointer md:w-56`}
                value={copyFrom}
                onChange={(e) => setCopyFrom(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">— Seleccionar otra campaña —</option>
                {campaigns
                  .filter((c) => c.id !== campaignId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] h-9 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={copyStock}
                onChange={(e) => setCopyStock(e.target.checked)}
                className="accent-primary h-4 w-4"
              />
              <span className="font-semibold text-on-surface">Copiar con Stock</span>
            </label>
            <button
              type="button"
              className="px-3.5 h-9 border border-primary text-primary hover:bg-primary/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
              disabled={!copyFrom || copyMut.isPending}
              onClick={async () => {
                try {
                  const r = await copyMut.mutateAsync({
                    campaign_id: campaignId!,
                    from_campaign_id: Number(copyFrom),
                    con_stock: copyStock,
                  })
                  showToast(`${r.copiados} medicamentos copiados exitosamente a esta campaña.`, 'ok')
                  setCopyFrom('')
                } catch (e) {
                  showToast(errMsg(e), 'error')
                }
              }}
            >
              <span className="material-symbols-outlined text-base">content_copy</span>
              <span>{copyMut.isPending ? 'Copiando...' : 'Copiar'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── KPI METRICS CARDS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-surface border border-surface-container-high">
          <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Medicamentos Registrados
          </div>
          <div className="text-2xl font-mono font-black text-on-surface mt-0.5">
            {totalItems}
          </div>
        </div>

        <div className="p-3.5 bg-surface border border-surface-container-high">
          <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Stock Total Acumulado
          </div>
          <div className="text-2xl font-mono font-black text-primary mt-0.5">
            {totalStock} <span className="text-xs font-normal text-on-surface-variant">unid.</span>
          </div>
        </div>

        <div className={`p-3.5 border ${bajos > 0 ? 'bg-error-container/20 border-error/40' : 'bg-surface border-surface-container-high'}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Stock Bajo / Crítico
          </div>
          <div className={`text-2xl font-mono font-black mt-0.5 ${bajos > 0 ? 'text-error' : 'text-on-surface'}`}>
            {bajos}
          </div>
        </div>

        <div className={`p-3.5 border ${agotados > 0 ? 'bg-error-container/30 border-error' : 'bg-surface border-surface-container-high'}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Medicamentos Agotados (0)
          </div>
          <div className={`text-2xl font-mono font-black mt-0.5 ${agotados > 0 ? 'text-error underline' : 'text-on-surface'}`}>
            {agotados}
          </div>
        </div>
      </div>

      {/* ── TABLA / LISTA DE MEDICAMENTOS CON COLUMNAS DINÁMICAS ────── */}
      <section className="bg-surface border border-surface-container-high shadow-xs">
        {/* Barra de Búsqueda y Filtros */}
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-surface-container-high bg-surface-container-low">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase text-on-surface-variant mr-1">Filtro:</span>
            {[
              { id: 'todos', label: `Todos (${meds.length})` },
              { id: 'activos', label: `Activos (${meds.filter((m) => Number(m.activo) === 1).length})` },
              { id: 'bajos', label: `Stock Bajo (${bajos})`, isAlert: bajos > 0 },
              { id: 'inactivos', label: `Inactivos (${meds.filter((m) => Number(m.activo) !== 1).length})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroEstado(f.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                  filtroEstado === f.id
                    ? f.isAlert
                      ? 'bg-error text-on-error font-black'
                      : 'bg-primary text-on-primary font-black'
                    : 'bg-surface text-on-surface hover:bg-surface-container border border-surface-container-high'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative md:w-80">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              className={`${inputCls} pl-8`}
              placeholder="Buscar por genérico, clasificación, uso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla Responsive con Encabezados Dinámicos */}
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 shadow-xs">
              <tr className="bg-surface-container text-[11px] font-bold uppercase tracking-wider text-on-surface-variant border-b border-surface-container-high">
                {activeColumns.map((col) => {
                  const isRight = col.key === 'stock_actual' || col.key === 'stock_minimo'
                  const isCenter = col.key === 'activo' || col.key === 'uso'
                  return (
                    <th
                      key={col.key}
                      className={`py-3 px-3 ${
                        isRight ? 'text-right' : isCenter ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.label}
                    </th>
                  )
                })}
                <th className="py-3 px-3 text-center w-36">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {isLoading && (
                <tr>
                  <td colSpan={activeColumns.length + 1} className="p-8 text-center text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                      <span>Cargando vademécum de campaña...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && filteredMeds.length === 0 && (
                <tr>
                  <td colSpan={activeColumns.length + 1} className="p-8 text-center text-on-surface-variant">
                    <div className="max-w-md mx-auto space-y-2">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant/60">
                        medication
                      </span>
                      <div className="font-bold text-sm text-on-surface">No se encontraron medicamentos</div>
                      <p className="text-xs">
                        No hay medicamentos registrados que coincidan con la búsqueda o filtro actual.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setMedToEdit(null)
                          setShowFormModal(true)
                        }}
                        className="mt-2 px-4 py-2 bg-primary text-on-primary text-xs font-bold uppercase cursor-pointer"
                      >
                        + Crear Primer Medicamento
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {filteredMeds.map((m) => {
                const activo = Number(m.activo) === 1 || Boolean(m.activo)
                const bajo = activo && m.stock_actual <= m.stock_minimo
                const agotado = activo && m.stock_actual === 0

                return (
                  <tr
                    key={m.id}
                    className={`hover:bg-surface-container-low transition-colors ${
                      !activo ? 'opacity-50 bg-surface-container-low/40' : ''
                    }`}
                  >
                    {/* Renderizado dinámico de columnas según el orden configurado */}
                    {activeColumns.map((col) => {
                      switch (col.key) {
                        case 'clasificacion':
                          return (
                            <td key={col.key} className="py-2.5 px-3">
                              {m.clasificacion ? (
                                <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                  {m.clasificacion}
                                </span>
                              ) : (
                                <span className="text-on-surface-variant/50 font-mono text-[11px]">—</span>
                              )}
                            </td>
                          )
                        case 'codigo':
                          return (
                            <td key={col.key} className="py-2.5 px-3 font-mono font-semibold text-primary">
                              {m.codigo || <span className="text-on-surface-variant/60">—</span>}
                            </td>
                          )
                        case 'medicamento':
                          return (
                            <td key={col.key} className="py-2.5 px-3">
                              <div className="font-bold text-on-surface text-[12.5px] leading-snug">
                                {m.nombre_generico}
                              </div>
                              {m.nombre_comercial && (
                                <div className="text-[11px] text-on-surface-variant italic">
                                  Comercial: {m.nombre_comercial}
                                </div>
                              )}
                            </td>
                          )
                        case 'concentracion':
                          return (
                            <td key={col.key} className="py-2.5 px-3 font-medium">
                              {m.concentracion || <span className="text-on-surface-variant/60">—</span>}
                            </td>
                          )
                        case 'forma_farmaceutica':
                          return (
                            <td key={col.key} className="py-2.5 px-3 capitalize">
                              {m.forma_farmaceutica}
                            </td>
                          )
                        case 'via_administracion':
                          return (
                            <td key={col.key} className="py-2.5 px-3">
                              {m.via_administracion}
                            </td>
                          )
                        case 'stock_actual':
                          return (
                            <td key={col.key} className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setMedForStock(m)
                                  setShowStockModal(true)
                                }}
                                className={`px-2.5 py-1 text-xs font-mono font-black border transition-all cursor-pointer ${
                                  agotado
                                    ? 'bg-error text-on-error border-error shadow-xs'
                                    : bajo
                                    ? 'bg-warning-container text-on-warning-container border-warning shadow-xs'
                                    : 'bg-surface-container text-on-surface border-surface-container-highest hover:bg-primary hover:text-on-primary hover:border-primary'
                                }`}
                                title="Haga clic para ingresar, retirar o ajustar stock"
                              >
                                {m.stock_actual} unid.
                              </button>
                            </td>
                          )
                        case 'stock_minimo':
                          return (
                            <td key={col.key} className="py-2.5 px-3 text-right font-mono text-on-surface-variant">
                              {m.stock_minimo}
                            </td>
                          )
                        case 'activo':
                          return (
                            <td key={col.key} className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  activo
                                    ? 'bg-primary-container text-on-primary-container'
                                    : 'bg-surface-container-highest text-on-surface-variant'
                                }`}
                              >
                                {activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                          )
                        case 'uso':
                          return (
                            <td key={col.key} className="py-2.5 px-3 text-center">
                              {m.uso ? (
                                <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-secondary/10 text-secondary border border-secondary/20">
                                  {m.uso}
                                </span>
                              ) : (
                                <span className="text-on-surface-variant/50 font-mono text-[11px]">—</span>
                              )}
                            </td>
                          )
                        default:
                          return (
                            <td key={col.key} className="py-2.5 px-3">
                              -
                            </td>
                          )
                      }
                    })}

                    {/* Acciones CRUD & Stock */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Botón Manejar Stock */}
                        <button
                          type="button"
                          onClick={() => {
                            setMedForStock(m)
                            setShowStockModal(true)
                          }}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors cursor-pointer"
                          title="Manejar Inventario / Stock"
                        >
                          <span className="material-symbols-outlined text-[19px]">inventory_2</span>
                        </button>

                        {/* Botón Editar */}
                        <button
                          type="button"
                          onClick={() => {
                            setMedToEdit(m)
                            setShowFormModal(true)
                          }}
                          className="p-1.5 text-secondary hover:bg-secondary/10 rounded transition-colors cursor-pointer"
                          title="Editar Fármaco"
                        >
                          <span className="material-symbols-outlined text-[19px]">edit</span>
                        </button>

                        {/* Botón Borrar */}
                        <button
                          type="button"
                          onClick={() => setMedToDelete(m)}
                          className="p-1.5 text-error hover:bg-error/10 rounded transition-colors cursor-pointer"
                          title="Eliminar o Desactivar Medicamento"
                        >
                          <span className="material-symbols-outlined text-[19px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── MODAL 1: NUEVO / EDITAR MEDICAMENTO ───────────────────────── */}
      <MedicamentoFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false)
          setMedToEdit(null)
        }}
        campaignId={campaignId ?? 1}
        medicamentoToEdit={medToEdit}
        onSaved={async (msg) => {
          showToast(msg, 'ok')
          await refetch()
        }}
      />

      {/* ── MODAL 2: MANEJAR STOCK (INGRESO / RETIRO / AJUSTE) ────────── */}
      <MedicamentoStockModal
        isOpen={showStockModal}
        onClose={() => setShowStockModal(false)}
        medicamento={medForStock}
        campaignId={campaignId ?? 1}
        onSuccess={(msg) => {
          showToast(msg, 'ok')
          refetch()
        }}
      />

      {/* ── MODAL 3: IMPORTAR EXCEL (OPCIÓN A) & SYNC BD (OPCIÓN B) ──── */}
      <MedicamentosImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        campaignId={campaignId ?? 1}
        campaignName={campaign?.name || 'Campaña Activa'}
        campaignCode={campaign?.code || 'CAMP'}
        onDownloadTemplate={() =>
          downloadCorporateTemplate(campaign?.name || 'Campaña General', campaign?.code || '')
        }
        onImportSuccess={(msg) => {
          showToast(msg, 'ok')
          refetch()
        }}
      />

      {/* ── MODAL 4: RESUMEN PARA IMPRESORA TÉRMICA T88 (80MM) ────────── */}
      <MedicamentosThermalModal
        isOpen={showThermalModal}
        onClose={() => setShowThermalModal(false)}
        medicamentos={meds}
        campaignName={campaign?.name || 'Campaña Activa'}
        campaignCode={campaign?.code || 'CAMP'}
      />

      {/* ── DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN ───────────────────── */}
      {medToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border-2 border-error shadow-2xl w-full max-w-md p-6 text-on-surface animate-fade-in">
            <div className="flex items-center gap-3 pb-3 border-b border-surface-container-high text-error">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="text-base font-bold uppercase tracking-wide">
                Confirmar Eliminación
              </h3>
            </div>

            <p className="text-xs text-on-surface-variant my-4 leading-relaxed">
              ¿Está seguro de eliminar el medicamento{' '}
              <strong className="text-on-surface font-black">
                "{medToDelete.nombre_generico} {medToDelete.concentracion || ''}"
              </strong>{' '}
              ({medToDelete.codigo || 'Sin código'})?
              <br />
              <br />
              <span className="text-[11px] text-error font-semibold">
                Nota: Si ya fue dispensado en recetas médicas anteriores, el sistema lo desactivará de forma segura para preservar el historial forense de atenciones.
              </span>
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setMedToDelete(null)}
                className="px-4 py-2 border border-surface-container-highest text-xs font-semibold uppercase text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteMut.isPending}
                className="px-5 py-2 bg-error text-on-error text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm hover:bg-error/90 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">delete_forever</span>
                <span>{deleteMut.isPending ? 'Eliminando...' : 'Sí, Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
