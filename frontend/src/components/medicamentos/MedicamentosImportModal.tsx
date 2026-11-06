import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  useImportMedicamentos,
  useMedSyncConfig,
  useSaveMedSyncConfig,
  useTestMedSync,
  useRunMedSync,
  type MedSyncConfig,
} from '../../api/hooks'

const FIELD_BY_HEADER: Record<string, string> = {
  clasificacion: 'clasificacion',
  'clasificacion terapeutica': 'clasificacion',
  codigo: 'codigo',
  'nombre generico': 'nombre_generico',
  'nombre comercial': 'nombre_comercial',
  concentracion: 'concentracion',
  'forma farmaceutica': 'forma_farmaceutica',
  'via administracion': 'via_administracion',
  'stock actual': 'stock_actual',
  'stock minimo': 'stock_minimo',
  uso: 'uso',
  'poblacion / uso': 'uso',
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

type Msg = { text: string; type: 'ok' | 'error' } | null

interface MedicamentosImportModalProps {
  isOpen: boolean
  onClose: () => void
  campaignId: number
  campaignName: string
  campaignCode: string
  onDownloadTemplate: () => void
  onImportSuccess?: (msg: string) => void
}

export function MedicamentosImportModal({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  campaignCode,
  onDownloadTemplate,
  onImportSuccess,
}: MedicamentosImportModalProps) {
  const [activeTab, setActiveTab] = useState<'excel' | 'sync'>('excel')

  // Hooks Excel
  const importMut = useImportMedicamentos()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [fileName, setFileName] = useState('')
  const [modo, setModo] = useState<'actualizar' | 'reemplazar'>('actualizar')
  const [excelMsg, setExcelMsg] = useState<Msg>(null)
  const [importErrors, setImportErrors] = useState<{ fila: number; error: string }[]>([])

  // Hooks Sync Externa
  const { data: cfg } = useMedSyncConfig(campaignId)
  const saveCfg = useSaveMedSyncConfig()
  const testSync = useTestMedSync()
  const runSync = useRunMedSync()
  const [syncForm, setSyncForm] = useState<Partial<MedSyncConfig> & { password?: string } | null>(null)
  const [syncMsg, setSyncMsg] = useState<Msg>(null)

  const f = {
    host: syncForm?.host ?? cfg?.host ?? '',
    port: syncForm?.port ?? cfg?.port ?? '3306',
    database: syncForm?.database ?? cfg?.database ?? '',
    username: syncForm?.username ?? cfg?.username ?? '',
    password: syncForm?.password ?? '',
    table: syncForm?.table ?? cfg?.table ?? '',
    col_codigo: syncForm?.col_codigo ?? cfg?.col_codigo ?? 'codigo',
    col_stock: syncForm?.col_stock ?? cfg?.col_stock ?? 'stock',
  }
  const setF = (k: string, v: string) => setSyncForm({ ...f, [k]: v })

  if (!isOpen) return null

  // Lectura de archivo Excel
  const handleFile = async (file: File) => {
    setExcelMsg(null)
    setImportErrors([])
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const ws = wb.Sheets['Medicamentos'] ?? wb.Sheets[wb.SheetNames[0]]
      let raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
      let hasHeaders = raw.length > 0 && Object.keys(raw[0]).some((k) => norm(k) in FIELD_BY_HEADER)
      if (!hasHeaders) {
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
        setExcelMsg({
          text: 'No se encontraron filas. Utilice el formato en blanco oficial de Semilla.',
          type: 'error',
        })
        return
      }
      setRows(parsed)
      setFileName(file.name)
    } catch {
      setExcelMsg({ text: 'No se pudo leer el archivo. Asegúrese de que sea un archivo Excel válido.', type: 'error' })
    }
  }

  const doImport = async () => {
    setExcelMsg(null)
    try {
      const r = await importMut.mutateAsync({ campaign_id: campaignId, items: rows, modo })
      setImportErrors(r.errores ?? [])
      const msgOk =
        `Importación completada: ${r.creados} creados, ${r.actualizados} actualizados` +
        (r.desactivados ? `, ${r.desactivados} desactivados` : '') +
        (r.errores?.length ? `, ${r.errores.length} filas con error.` : '.')
      setExcelMsg({ text: msgOk, type: 'ok' })
      onImportSuccess?.(msgOk)
      setRows([])
      setFileName('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setExcelMsg({ text: errMsg(e), type: 'error' })
    }
  }

  const persistCfg = async () => {
    const payload: Record<string, unknown> = { ...f, campaign_id: campaignId }
    if (!payload.password) delete payload.password
    await saveCfg.mutateAsync(payload)
    setSyncForm(null)
  }

  const onSaveCfg = async () => {
    try {
      await persistCfg()
      setSyncMsg({ text: 'Configuración de conexión guardada.', type: 'ok' })
    } catch (e) {
      setSyncMsg({ text: errMsg(e), type: 'error' })
    }
  }

  const onTest = async () => {
    try {
      await persistCfg()
      const r = await testSync.mutateAsync(campaignId)
      setSyncMsg({ text: `${r.message} ${r.total_filas} registros encontrados en la tabla remota.`, type: 'ok' })
    } catch (e) {
      setSyncMsg({ text: errMsg(e), type: 'error' })
    }
  }

  const onSync = async () => {
    try {
      await persistCfg()
      const r = await runSync.mutateAsync(campaignId)
      const resMsg =
        `Stock sincronizado: ${r.actualizados} actualizados, ${r.sin_cambio} sin cambio. ` +
        `${r.no_encontrados_en_externa} medicamentos no figuran en la base externa.`
      setSyncMsg({ text: resMsg, type: 'ok' })
      onImportSuccess?.(resMsg)
    } catch (e) {
      setSyncMsg({ text: errMsg(e), type: 'error' })
    }
  }

  const inputCls =
    'w-full h-9 px-3 bg-surface-container-low text-xs border border-surface-container-highest text-on-surface focus:border-primary focus:outline-none'
  const labelCls = 'block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1'

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border-2 border-primary shadow-2xl w-full max-w-3xl text-on-surface animate-fade-in my-8 flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="p-5 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded">
              <span className="material-symbols-outlined text-2xl">sync_saved_locally</span>
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide text-on-surface">
                Importación y Sincronización de Medicamentos
              </h2>
              <div className="text-xs text-on-surface-variant">
                Campaña: <strong className="text-on-surface">{campaignName}</strong> ({campaignCode})
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tabs de Selección */}
        <div className="flex border-b border-surface-container-high bg-surface-container">
          <button
            type="button"
            onClick={() => setActiveTab('excel')}
            className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'excel'
                ? 'border-primary bg-surface text-primary font-black'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface/50'
            }`}
          >
            <span className="material-symbols-outlined text-lg">upload_file</span>
            <span>Opción A · Archivo Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'sync'
                ? 'border-primary bg-surface text-primary font-black'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface/50'
            }`}
          >
            <span className="material-symbols-outlined text-lg">database</span>
            <span>Opción B · Sincronizar Stock (BD Externa)</span>
          </button>
        </div>

        {/* Contenido del Tab */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'excel' ? (
            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Cargue el vademécum de la campaña mediante un archivo Excel oficial. Puede descargar la plantilla con formato institucional y fórmulas prediseñadas.
              </p>

              {/* Botones de acción Excel */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onDownloadTemplate}
                  className="px-4 py-2.5 border border-primary text-primary hover:bg-primary/10 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  Descargar Formato en Blanco (.xlsx)
                </button>

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2.5 bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">folder_open</span>
                  Seleccionar Excel Lleno
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>

              {/* Archivo cargado y opciones */}
              {rows.length > 0 && (
                <div className="p-4 bg-surface-container-low border border-surface-container-high space-y-3">
                  <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
                    <div className="text-xs font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">description</span>
                      <span>{fileName}</span>
                    </div>
                    <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-primary-container text-on-primary-container">
                      {rows.length} medicamentos detectados
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={modo === 'actualizar'}
                        onChange={() => setModo('actualizar')}
                        className="mt-0.5 accent-primary"
                      />
                      <div>
                        <strong className="text-on-surface">Agregar y Actualizar:</strong>
                        <div className="text-[11px] text-on-surface-variant">
                          Registra nuevos medicamentos y actualiza el stock de los que coincidan por código o nombre. El resto del catálogo permanece igual.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={modo === 'reemplazar'}
                        onChange={() => setModo('reemplazar')}
                        className="mt-0.5 accent-primary"
                      />
                      <div>
                        <strong className="text-on-surface">Reemplazar Catálogo Completo:</strong>
                        <div className="text-[11px] text-on-surface-variant">
                          Desactiva los medicamentos que no estén presentes en este archivo Excel (el historial clínico previo se conserva íntegro).
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={doImport}
                      disabled={importMut.isPending}
                      className="w-full py-3 bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-base">cloud_upload</span>
                      <span>{importMut.isPending ? 'Procesando Importación...' : 'Confirmar e Importar al Sistema'}</span>
                    </button>
                  </div>
                </div>
              )}

              {excelMsg && (
                <div
                  className={`p-3 text-xs border flex items-center gap-2 ${
                    excelMsg.type === 'ok'
                      ? 'bg-tertiary-container/30 border-tertiary text-on-surface'
                      : 'bg-error-container text-on-error-container border-error/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {excelMsg.type === 'ok' ? 'check_circle' : 'error'}
                  </span>
                  <span>{excelMsg.text}</span>
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="p-3 bg-error-container/20 border border-error/30 text-xs">
                  <div className="font-bold text-error uppercase mb-1">Errores encontrados en el Excel:</div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-on-surface max-h-32 overflow-auto">
                    {importErrors.map((e, i) => (
                      <li key={i}>
                        Fila {e.fila}: {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Conecte el sistema a la base de datos MySQL de su almacén central o farmacia para actualizar automáticamente el stock disponible en tiempo real según el <b>Código</b> del medicamento.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-surface-container-low border border-surface-container-high">
                <div>
                  <label className={labelCls}>Servidor Host / IP</label>
                  <input
                    className={inputCls}
                    value={f.host}
                    onChange={(e) => setF('host', e.target.value)}
                    placeholder="192.168.1.50 o db.hospital.pe"
                  />
                </div>
                <div>
                  <label className={labelCls}>Puerto MySQL</label>
                  <input
                    className={inputCls}
                    value={f.port}
                    onChange={(e) => setF('port', e.target.value)}
                    placeholder="3306"
                  />
                </div>
                <div>
                  <label className={labelCls}>Base de Datos</label>
                  <input
                    className={inputCls}
                    value={f.database}
                    onChange={(e) => setF('database', e.target.value)}
                    placeholder="almacen_farmacia"
                  />
                </div>
                <div>
                  <label className={labelCls}>Usuario</label>
                  <input
                    className={inputCls}
                    value={f.username}
                    onChange={(e) => setF('username', e.target.value)}
                    placeholder="almacen_ro"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>
                    Contraseña {cfg?.has_password && '(Guardada en bóveda — deje vacío para mantener)'}
                  </label>
                  <input
                    type="password"
                    className={inputCls}
                    value={f.password}
                    onChange={(e) => setF('password', e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className={labelCls}>Tabla de Productos / Stock</label>
                  <input
                    className={inputCls}
                    value={f.table}
                    onChange={(e) => setF('table', e.target.value)}
                    placeholder="productos o kardex_stock"
                  />
                </div>
                <div />
                <div>
                  <label className={labelCls}>Nombre Columna Código</label>
                  <input
                    className={inputCls}
                    value={f.col_codigo}
                    onChange={(e) => setF('col_codigo', e.target.value)}
                    placeholder="codigo o cod_item"
                  />
                </div>
                <div>
                  <label className={labelCls}>Nombre Columna Stock</label>
                  <input
                    className={inputCls}
                    value={f.col_stock}
                    onChange={(e) => setF('col_stock', e.target.value)}
                    placeholder="stock o cantidad_actual"
                  />
                </div>
              </div>

              {/* Botones de acción BD externa */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={onSaveCfg}
                  disabled={saveCfg.isPending}
                  className="px-4 py-2.5 border border-primary text-primary hover:bg-primary/10 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>{saveCfg.isPending ? 'Guardando...' : 'Guardar Credenciales'}</span>
                </button>

                <button
                  type="button"
                  onClick={onTest}
                  disabled={testSync.isPending}
                  className="px-4 py-2.5 border border-surface-container-highest text-on-surface hover:bg-surface-container text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">cable</span>
                  <span>{testSync.isPending ? 'Verificando...' : 'Probar Conexión'}</span>
                </button>

                <button
                  type="button"
                  onClick={onSync}
                  disabled={runSync.isPending}
                  className="px-5 py-2.5 bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 ml-auto"
                >
                  <span className="material-symbols-outlined text-base">sync</span>
                  <span>{runSync.isPending ? 'Sincronizando...' : 'Sincronizar Stock Ahora'}</span>
                </button>
              </div>

              {cfg?.last_sync_at && (
                <div className="text-[11px] text-on-surface-variant font-mono flex items-center gap-1.5 pt-1">
                  <span className="material-symbols-outlined text-sm text-tertiary">history</span>
                  <span>Última sincronización exitosa: {cfg.last_sync_at}</span>
                </div>
              )}

              {syncMsg && (
                <div
                  className={`p-3 text-xs border flex items-center gap-2 ${
                    syncMsg.type === 'ok'
                      ? 'bg-tertiary-container/30 border-tertiary text-on-surface'
                      : 'bg-error-container text-on-error-container border-error/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {syncMsg.type === 'ok' ? 'check_circle' : 'error'}
                  </span>
                  <span>{syncMsg.text}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-container-high bg-surface-container-low flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-surface border border-surface-container-highest text-xs font-bold uppercase text-on-surface hover:bg-surface-container cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  )
}

