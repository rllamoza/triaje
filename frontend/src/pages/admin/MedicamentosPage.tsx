import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import {
  useCampaigns,
  useCopyMedicamentos,
  useMedicamentosAdmin,
  useImportMedicamentos,
  useMedSyncConfig,
  useSaveMedSyncConfig,
  useTestMedSync,
  useRunMedSync,
} from '../../api/hooks'
import { useAuthStore } from '../../store/authStore'
import { useBrandingStore } from '../../store/brandingStore'

type Msg = { text: string; type: 'ok' | 'error' } | null

export const MED_EXCEL_HEADERS = [
  'Código',
  'Nombre Genérico',
  'Nombre Comercial',
  'Concentración',
  'Forma Farmacéutica',
  'Vía Administración',
  'Stock Actual',
  'Stock Mínimo',
  'Activo',
]

// Cabecera normalizada -> campo del backend
const FIELD_BY_HEADER: Record<string, string> = {
  codigo: 'codigo',
  'nombre generico': 'nombre_generico',
  'nombre comercial': 'nombre_comercial',
  concentracion: 'concentracion',
  'forma farmaceutica': 'forma_farmaceutica',
  'via administracion': 'via_administracion',
  'stock actual': 'stock_actual',
  'stock minimo': 'stock_minimo',
  activo: 'activo',
}

const norm = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()

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
    { key: 'codigo', width: 16 },
    { key: 'generico', width: 34 },
    { key: 'comercial', width: 26 },
    { key: 'concentracion', width: 18 },
    { key: 'forma', width: 22 },
    { key: 'via', width: 20 },
    { key: 'stock', width: 15 },
    { key: 'minimo', width: 15 },
    { key: 'activo', width: 12 },
  ]

  // Fila 1: Título Institucional Principal
  ws.mergeCells('A1:I1')
  const r1 = ws.getCell('A1')
  r1.value = `ORGANIZACIÓN SOCIAL SEMILLA — ${branding.exportHeader || 'ASISTENCIA MÉDICA RURAL'}`
  r1.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
  r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F4C81' } } // Azul Corporativo Semilla
  r1.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(1).height = 36

  // Fila 2: Subtítulo & Misión
  ws.mergeCells('A2:I2')
  const r2 = ws.getCell('A2')
  r2.value = `FORMATO OFICIAL DE ASIGNACIÓN Y CARGA DE VADEMÉCUM DE CAMPAÑA | ${branding.exportSubheader || 'SISTEMA DE TRIAJE CLÍNICO'}`
  r2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFE8F1F8' } }
  r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF195B94' } }
  r2.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(2).height = 22

  // Fila 3: Metadatos de la campaña
  ws.mergeCells('A3:E3')
  const r3a = ws.getCell('A3')
  r3a.value = `CAMPAÑA DESTINO: ${campaignName ? campaignName.toUpperCase() : 'CAMPAÑA MÉDICA GENERAL'} (${campaignCode || 'ACTIVA'})`
  r3a.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF0F4C81' } }
  r3a.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } }
  r3a.alignment = { vertical: 'middle', indent: 1 }

  ws.mergeCells('F3:I3')
  const r3b = ws.getCell('F3')
  r3b.value = `FECHA EMISIÓN: ${new Date().toLocaleDateString('es-PE')} | MÓDULO FARMACIA & BOTIQUÍN`
  r3b.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF555555' } }
  r3b.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } }
  r3b.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 }
  ws.getRow(3).height = 20

  // Fila 4: Banner informativo de orientación
  ws.mergeCells('A4:I4')
  const r4 = ws.getCell('A4')
  r4.value = 'Complete las medicinas asignadas por carpa o botiquín. La columna obligatoria es "Nombre Genérico". El Código SKU permite enlazar con el stock de almacén central.'
  r4.font = { name: 'Segoe UI', size: 8.5, italic: true, color: { argb: 'FF004D40' } }
  r4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2F1' } } // Verde menta pastel
  r4.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(4).height = 22

  // Fila 5: Separador estético
  ws.getRow(5).height = 6

  // Fila 6: Encabezados de Columna
  const headers = [
    'Código',
    'Nombre Genérico',
    'Nombre Comercial',
    'Concentración',
    'Forma Farmacéutica',
    'Vía Administración',
    'Stock Actual',
    'Stock Mínimo',
    'Activo',
  ]
  const hRow = ws.getRow(6)
  hRow.values = headers
  hRow.height = 28
  hRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F4C81' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0A3356' } },
      bottom: { style: 'medium', color: { argb: 'FF0A3356' } },
      left: { style: 'thin', color: { argb: 'FF3B7CB4' } },
      right: { style: 'thin', color: { argb: 'FF3B7CB4' } },
    }
  })

  // Filas de ejemplo con estilo clínico
  const ejemplos = [
    ['MED-0001', 'Paracetamol', 'Panadol', '500mg', 'tableta', 'oral', 500, 50, 'SI'],
    ['MED-0002', 'Amoxicilina', 'Amoxil', '500mg', 'capsula', 'oral', 200, 30, 'SI'],
    ['MED-0003', 'Ibuprofeno', '', '400mg', 'tableta', 'oral', 300, 40, 'SI'],
    ['MED-0004', 'Ketorolaco', 'Dolnac', '30mg/ml', 'inyectable', 'IM', 60, 15, 'SI'],
    ['MED-0005', 'Dexametasona', '', '4mg/ml', 'inyectable', 'IM', 40, 10, 'SI'],
    ['MED-0006', 'Salbutamol', 'Ventolin', '100mcg', 'otro', 'inhalada', 30, 10, 'SI'],
    ['MED-0007', 'Suero Fisiológico 0.9%', '', '1000ml', 'solucion', 'IV', 25, 5, 'SI'],
  ]

  ejemplos.forEach((fila, idx) => {
    const row = ws.addRow(fila)
    row.height = 22
    const isEven = idx % 2 === 0
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF222222' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF9FBFD' }, // Rayado zebra tenue
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
      // Alineaciones específicas
      if (colNum === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' }
      else if (colNum === 7 || colNum === 8) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.numFmt = '#,##0'
      } else if (colNum === 9) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF1B5E20' } }
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
      }
    })
  })

  // Formato 100% tipográfico limpio institucional (sin incrustación de imágenes de logo)

  // ── HOJA 2: GUÍA & VALORES PERMITIDOS ─────────────────────────────
  const wsGuia = wb.addWorksheet('Instrucciones', {
    views: [{ showGridLines: true }],
  })

  wsGuia.columns = [
    { key: 'colA', width: 30 },
    { key: 'colB', width: 28 },
    { key: 'colC', width: 45 },
  ]

  wsGuia.mergeCells('A1:C1')
  const g1 = wsGuia.getCell('A1')
  g1.value = 'GUÍA OFICIAL DE LLENADO DEL VADEMÉCUM DE CAMPAÑA'
  g1.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
  g1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F4C81' } }
  g1.alignment = { vertical: 'middle', horizontal: 'center' }
  wsGuia.getRow(1).height = 30

  const guideRows = [
    ['Regla Clínica', 'Descripción Operativa', 'Impacto en el Sistema'],
    ['1. Nombre Genérico Obligatorio', 'Coloque el nombre DCI (ej. Paracetamol, Amoxicilina).', 'Es el nombre que visualiza el médico para prescribir.'],
    ['2. Código SKU (Opcional)', 'Código del sistema de almacén/farmacia (ej. MED-0012).', 'Permite que el botón de "Sincronizar Stock" actualice automáticamente.'],
    ['3. Concentración & Forma', 'Detalle la dosis (500mg, 10mg/ml) y forma autorizada.', 'Se imprime fielmente en la receta térmica para el paciente.'],
    ['4. Modos de Importación', 'Al subir en la web elija: Agregar/Actualizar o Reemplazar.', 'Reemplazar desactiva lo no incluido sin borrar recetas históricas.'],
  ]

  guideRows.forEach((r, idx) => {
    const row = wsGuia.addRow(r)
    row.height = 24
    row.eachCell((cell) => {
      if (idx === 0) {
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF195B94' } }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      } else {
        cell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF333333' } }
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        }
      }
    })
  })

  wsGuia.addRow([])
  wsGuia.mergeCells('A8:C8')
  const catTitle = wsGuia.getCell('A8')
  catTitle.value = 'CATÁLOGO DE VALORES ESTÁNDAR ACEPTADOS'
  catTitle.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F4C81' } }
  catTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F1F8' } }
  catTitle.alignment = { vertical: 'middle', horizontal: 'center' }
  wsGuia.getRow(8).height = 24

  const valHeaders = wsGuia.addRow(['Forma Farmacéutica', 'Vía de Administración', 'Estado Activo'])
  valHeaders.height = 22
  valHeaders.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F4C81' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  const valData = [
    ['tableta (o tab, comprimido)', 'oral (o VO)', 'SI (o 1, activo)'],
    ['capsula (o cap)', 'IM (intramuscular)', 'NO (o 0, inactivo)'],
    ['jarabe (o suspension)', 'IV (endovenosa, EV)', ''],
    ['inyectable (o ampolla, vial)', 'topica (o cutanea)', ''],
    ['crema (o gel, pomada)', 'inhalada (inhalatoria)', ''],
    ['ovulo', 'sublingual (o SL)', ''],
    ['solucion (o gotas, sachet)', 'otro', ''],
    ['otro', '', ''],
  ]

  valData.forEach((vd) => {
    const row = wsGuia.addRow(vd)
    row.height = 20
    row.eachCell((cell) => {
      cell.font = { name: 'Segoe UI', size: 8.5, color: { argb: 'FF444444' } }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
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
  const fileRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [modo, setModo] = useState<'actualizar' | 'reemplazar'>('actualizar')
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [fileName, setFileName] = useState('')
  const [msg, setMsg] = useState<Msg>(null)
  const [importErrors, setImportErrors] = useState<{ fila: number; error: string }[]>([])

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
  const [copyFrom, setCopyFrom] = useState<number | ''>('')
  const [copyStock, setCopyStock] = useState(false)
  const copyMut = useCopyMedicamentos()

  const changeCampaign = (id: number) => {
    setPickedCamp(id)
    setRows([])
    setFileName('')
    setMsg(null)
    setSyncMsg(null)
    setImportErrors([])
    setForm(null)
    setCopyFrom('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const { data: meds = [], isLoading } = useMedicamentosAdmin(campaignId, search || undefined)
  const importMut = useImportMedicamentos()

  const { data: cfg } = useMedSyncConfig(campaignId)
  const saveCfg = useSaveMedSyncConfig()
  const testSync = useTestMedSync()
  const runSync = useRunMedSync()
  const [form, setForm] = useState<Record<string, string> | null>(null)
  const [syncMsg, setSyncMsg] = useState<Msg>(null)

  const f = form ?? {
    host: cfg?.host ?? '',
    port: cfg?.port ?? '3306',
    database: cfg?.database ?? '',
    username: cfg?.username ?? '',
    password: '',
    table: cfg?.table ?? '',
    col_codigo: cfg?.col_codigo ?? 'codigo',
    col_stock: cfg?.col_stock ?? 'stock',
  }
  const setF = (k: string, v: string) => setForm({ ...f, [k]: v })

  const handleFile = async (file: File) => {
    setMsg(null)
    setImportErrors([])
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const ws = wb.Sheets['Medicamentos'] ?? wb.Sheets[wb.SheetNames[0]]
      // Soporte inteligente: leer con encabezado en fila 1 o detectar si viene del formato corporativo (encabezado en fila 6)
      let raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
      let hasHeaders = raw.length > 0 && Object.keys(raw[0]).some((k) => norm(k) in FIELD_BY_HEADER)
      if (!hasHeaders) {
        // Intentar rango con offset desde fila 6 (índice 5 base 0)
        raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', range: 5 })
      }
      const parsed = raw
        .map((r) => {
          const o: Record<string, unknown> = {}
          Object.entries(r).forEach(([k, v]) => {
            const field = FIELD_BY_HEADER[norm(k)]
            if (field) o[field] = v
          })
          return o
        })
        .filter((o) => String(o.nombre_generico ?? '').trim() !== '' || String(o.codigo ?? '').trim() !== '')
      if (!parsed.length) {
        setRows([])
        setFileName('')
        setMsg({ text: 'No se encontraron filas. Use el formato en blanco (columna "Nombre Genérico").', type: 'error' })
        return
      }
      setRows(parsed)
      setFileName(file.name)
    } catch {
      setMsg({ text: 'No se pudo leer el archivo. Verifique que sea un Excel (.xlsx / .xls).', type: 'error' })
    }
  }

  const doImport = async () => {
    setMsg(null)
    try {
      const r = await importMut.mutateAsync({ campaign_id: campaignId!, items: rows, modo })
      setImportErrors(r.errores ?? [])
      setMsg({
        text: `Importación lista: ${r.creados} creados, ${r.actualizados} actualizados` +
          (r.desactivados ? `, ${r.desactivados} desactivados` : '') +
          (r.errores?.length ? `, ${r.errores.length} filas con error.` : '.'),
        type: 'ok',
      })
      setRows([])
      setFileName('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setMsg({ text: errMsg(e), type: 'error' })
    }
  }

  const persistCfg = async () => {
    const payload: Record<string, unknown> = { ...f, campaign_id: campaignId }
    if (!payload.password) delete payload.password
    await saveCfg.mutateAsync(payload)
    setForm(null)
  }

  const onSaveCfg = async () => {
    try {
      await persistCfg()
      setSyncMsg({ text: 'Configuración guardada.', type: 'ok' })
    } catch (e) {
      setSyncMsg({ text: errMsg(e), type: 'error' })
    }
  }

  const onTest = async () => {
    try {
      await persistCfg()
      const r = await testSync.mutateAsync(campaignId!)
      setSyncMsg({ text: `${r.message} ${r.total_filas} registros en la tabla externa.`, type: 'ok' })
    } catch (e) {
      setSyncMsg({ text: errMsg(e), type: 'error' })
    }
  }

  const onSync = async () => {
    try {
      await persistCfg()
      const r = await runSync.mutateAsync(campaignId!)
      setSyncMsg({
        text: `Stock sincronizado: ${r.actualizados} actualizados, ${r.sin_cambio} sin cambio. ` +
          `${r.no_encontrados_en_externa} del catálogo no están en la base externa; ` +
          `${r.ignorados_fuera_de_campana} registros externos ignorados (no asignados a esta campaña).`,
        type: 'ok',
      })
    } catch (e) {
      setSyncMsg({ text: errMsg(e), type: 'error' })
    }
  }

  const banner = (m: Msg) =>
    m && (
      <div
        className={`mt-3 p-3 text-xs border ${
          m.type === 'ok'
            ? 'bg-tertiary/10 border-tertiary text-on-surface'
            : 'bg-error/10 border-error text-error'
        }`}
      >
        {m.text}
      </div>
    )

  const inputCls =
    'w-full h-9 px-2 bg-surface text-xs border border-surface-container-high focus:border-primary focus:outline-none'
  const labelCls = 'block text-[10px] font-bold text-secondary uppercase mb-1'
  const btnPrimary =
    'px-4 h-9 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
  const btnGhost =
    'px-4 h-9 border border-primary text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:bg-primary/10 disabled:opacity-50'

  const bajos = meds.filter((m) => Number(m.activo) && m.stock_actual <= m.stock_minimo).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-2xl">medication</span>
        <h1 className="text-xl font-semibold text-on-surface uppercase tracking-wider">
          Medicamentos de la Campaña
        </h1>
      </div>
      <p className="text-xs text-on-surface-variant mt-1">
        Catálogo que verán los médicos al recetar en la campaña seleccionada. Solo incluye los medicamentos asignados a esa campaña (no el almacén completo).
        Puede cargarlo por Excel, sincronizar el stock desde otra base de datos, o ambos de forma independiente.
      </p>

      {/* Selector de campaña */}
      <div className="mt-4 p-4 bg-surface-container-low border border-surface-container-high flex flex-col md:flex-row md:items-end gap-4">
        <div className="md:w-96">
          <label className={labelCls}>Campaña a gestionar</label>
          <select
            id="select-campana-medicamentos"
            className={`${inputCls} cursor-pointer`}
            value={campaignId ?? ''}
            onChange={(e) => changeCampaign(Number(e.target.value))}
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code}){c.status === 'active' ? ' — ACTIVA' : c.status === 'closed' ? ' — cerrada' : ''}
              </option>
            ))}
          </select>
          {campaign && (
            <div className="text-[11px] text-on-surface-variant mt-1">{campaign.location_name}</div>
          )}
        </div>
        {campaigns.length > 1 && (
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className={labelCls}>Copiar catálogo desde</label>
              <select
                className={`${inputCls} cursor-pointer md:w-64`}
                value={copyFrom}
                onChange={(e) => setCopyFrom(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">— otra campaña —</option>
                {campaigns.filter((c) => c.id !== campaignId).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] h-9 cursor-pointer">
              <input type="checkbox" checked={copyStock} onChange={(e) => setCopyStock(e.target.checked)} className="accent-primary" />
              con stock
            </label>
            <button
              type="button"
              className={btnGhost}
              disabled={!copyFrom || copyMut.isPending}
              onClick={async () => {
                try {
                  const r = await copyMut.mutateAsync({ campaign_id: campaignId!, from_campaign_id: Number(copyFrom), con_stock: copyStock })
                  setMsg({ text: `${r.copiados} medicamentos copiados a esta campaña.`, type: 'ok' })
                } catch (e) {
                  setMsg({ text: errMsg(e), type: 'error' })
                }
              }}
            >
              <span className="material-symbols-outlined text-base">content_copy</span>
              Copiar
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* ── Opción A: Excel ── */}
        <section className="bg-surface-container-low p-5 border border-surface-container-high">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high">
            <span className="material-symbols-outlined text-primary">upload_file</span>
            <h2 className="text-sm font-semibold uppercase tracking-wider">Opción A · Importar desde Excel</h2>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadCorporateTemplate(campaign?.name || 'Campaña General', campaign?.code || '')}
              className={btnGhost}
              id="btn-descargar-formato-medicamentos"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Descargar formato en blanco
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className={btnPrimary} id="btn-seleccionar-excel-medicamentos">
              <span className="material-symbols-outlined text-base">folder_open</span>
              Seleccionar Excel lleno
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {rows.length > 0 && (
            <div className="mt-4 p-3 bg-surface border border-surface-container-high">
              <div className="text-xs font-semibold">
                {fileName} — {rows.length} medicamentos listos para cargar
              </div>
              <div className="mt-3 space-y-1.5 text-xs">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" checked={modo === 'actualizar'} onChange={() => setModo('actualizar')} className="mt-0.5 accent-primary" />
                  <span><b>Agregar / actualizar</b>: crea los nuevos y actualiza los existentes; el resto del catálogo queda igual.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" checked={modo === 'reemplazar'} onChange={() => setModo('reemplazar')} className="mt-0.5 accent-primary" />
                  <span><b>Reemplazar catálogo</b>: desactiva todo medicamento que no esté en este Excel (el historial de recetas se conserva).</span>
                </label>
              </div>
              <button type="button" onClick={doImport} disabled={importMut.isPending} className={`${btnPrimary} mt-3`} id="btn-confirmar-importacion">
                <span className="material-symbols-outlined text-base">cloud_upload</span>
                {importMut.isPending ? 'Importando…' : 'Confirmar importación'}
              </button>
            </div>
          )}

          {banner(msg)}
          {importErrors.length > 0 && (
            <ul className="mt-2 text-[11px] text-error list-disc pl-5 max-h-28 overflow-auto">
              {importErrors.map((e, i) => (
                <li key={i}>Fila {e.fila}: {e.error}</li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Opción B: BD externa ── */}
        <section className="bg-surface-container-low p-5 border border-surface-container-high">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high">
            <span className="material-symbols-outlined text-primary">database</span>
            <h2 className="text-sm font-semibold uppercase tracking-wider">Opción B · Sincronizar stock (BD externa)</h2>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-2">
            Se conecta (solo lectura) a la base del almacén y actualiza el stock de los medicamentos de este catálogo que tengan el mismo <b>Código</b>. Los demás productos del almacén se ignoran.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div><label className={labelCls}>Servidor</label><input className={inputCls} value={f.host} onChange={(e) => setF('host', e.target.value)} placeholder="192.168.1.50" /></div>
            <div><label className={labelCls}>Puerto</label><input className={inputCls} value={f.port} onChange={(e) => setF('port', e.target.value)} /></div>
            <div><label className={labelCls}>Base de datos</label><input className={inputCls} value={f.database} onChange={(e) => setF('database', e.target.value)} /></div>
            <div><label className={labelCls}>Usuario</label><input className={inputCls} value={f.username} onChange={(e) => setF('username', e.target.value)} /></div>
            <div className="col-span-2">
              <label className={labelCls}>Contraseña {cfg?.has_password && '(guardada — deje vacío para conservar)'}</label>
              <input type="password" className={inputCls} value={f.password} onChange={(e) => setF('password', e.target.value)} autoComplete="new-password" />
            </div>
            <div><label className={labelCls}>Tabla de stock</label><input className={inputCls} value={f.table} onChange={(e) => setF('table', e.target.value)} placeholder="productos" /></div>
            <div />
            <div><label className={labelCls}>Columna código</label><input className={inputCls} value={f.col_codigo} onChange={(e) => setF('col_codigo', e.target.value)} /></div>
            <div><label className={labelCls}>Columna stock</label><input className={inputCls} value={f.col_stock} onChange={(e) => setF('col_stock', e.target.value)} /></div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={onSaveCfg} disabled={saveCfg.isPending} className={btnGhost}>
              <span className="material-symbols-outlined text-base">save</span>Guardar
            </button>
            <button type="button" onClick={onTest} disabled={testSync.isPending} className={btnGhost}>
              <span className="material-symbols-outlined text-base">cable</span>
              {testSync.isPending ? 'Probando…' : 'Probar conexión'}
            </button>
            <button type="button" onClick={onSync} disabled={runSync.isPending} className={btnPrimary} id="btn-sincronizar-stock">
              <span className="material-symbols-outlined text-base">sync</span>
              {runSync.isPending ? 'Sincronizando…' : 'Sincronizar stock ahora'}
            </button>
          </div>
          {cfg?.last_sync_at && (
            <div className="mt-2 text-[11px] text-on-surface-variant font-mono">Última sincronización: {cfg.last_sync_at}</div>
          )}
          {banner(syncMsg)}
        </section>
      </div>

      {/* ── Catálogo actual ── */}
      <section className="mt-6 bg-surface border border-surface-container-high">
        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-surface-container-high">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider">Catálogo actual</h2>
            <div className="text-[11px] text-on-surface-variant mt-0.5">
              {meds.length} medicamentos · {bajos > 0 ? <span className="text-error font-semibold">{bajos} con stock bajo</span> : 'sin alertas de stock'}
            </div>
          </div>
          <input className={`${inputCls} md:w-72`} placeholder="Buscar por nombre o código…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0">
              <tr className="bg-surface-container text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Medicamento</th>
                <th className="py-2.5 px-3">Concentración</th>
                <th className="py-2.5 px-3">Forma</th>
                <th className="py-2.5 px-3">Vía</th>
                <th className="py-2.5 px-3 text-right">Stock</th>
                <th className="py-2.5 px-3 text-right">Mín.</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {isLoading && (
                <tr><td colSpan={9} className="p-6 text-center text-on-surface-variant">Cargando…</td></tr>
              )}
              {!isLoading && meds.length === 0 && (
                <tr><td colSpan={9} className="p-6 text-center text-on-surface-variant">No hay medicamentos. Importe un Excel para comenzar.</td></tr>
              )}
              {meds.map((m) => {
                const activo = Number(m.activo) === 1
                const bajo = activo && m.stock_actual <= m.stock_minimo
                return (
                  <tr key={m.id} className={activo ? '' : 'opacity-50'}>
                    <td className="py-2 px-3 font-mono">{m.codigo || '—'}</td>
                    <td className="py-2 px-3 font-medium">
                      {m.nombre_generico}
                      {m.nombre_comercial && <span className="text-on-surface-variant"> ({m.nombre_comercial})</span>}
                    </td>
                    <td className="py-2 px-3">{m.concentracion || '—'}</td>
                    <td className="py-2 px-3">{m.forma_farmaceutica}</td>
                    <td className="py-2 px-3">{m.via_administracion}</td>
                    <td className={`py-2 px-3 text-right font-mono font-semibold ${bajo ? 'text-error' : ''}`}>{m.stock_actual}</td>
                    <td className="py-2 px-3 text-right font-mono">{m.stock_minimo}</td>
                    <td className="py-2 px-3">{activo ? 'Activo' : 'Inactivo'}</td>
                    <td className="py-2 px-3 text-on-surface-variant">{m.origen}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
