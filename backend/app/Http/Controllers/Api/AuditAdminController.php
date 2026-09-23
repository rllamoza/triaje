<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditRecord;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AuditAdminController extends Controller
{
    /**
     * Devuelve el estado general del módulo de auditoría y conectividad de audi_triaje.
     */
    public function status(Request $request)
    {
        $enabled = SystemSetting::get('audit_module_enabled', filter_var(env('AUDIT_MODULE_ENABLED', true), FILTER_VALIDATE_BOOLEAN));

        $dbConnected = false;
        $tableExists = false;
        $totalRecords = 0;
        $recordsToday = 0;
        $errorRecords = 0;
        $dbSizeMb = 0.0;
        $lastRecord = null;
        $errorMessage = null;

        try {
            // Comprobar conexión y nombre de base de datos
            $dbName = DB::connection('audi_triaje')->getDatabaseName();
            $dbConnected = true;

            $tableExists = Schema::connection('audi_triaje')->hasTable('audit_records');

            if ($tableExists) {
                $totalRecords = AuditRecord::count();
                $recordsToday = AuditRecord::whereDate('created_at', now()->toDateString())->count();
                $errorRecords = AuditRecord::where('status_code', '>=', 400)->count();
                $lastRecord = AuditRecord::latest('id')->first(['id', 'endpoint', 'method', 'created_at', 'user_name']);

                // Calcular tamaño en disco de la base de datos
                $sizeQuery = DB::connection('audi_triaje')->select("
                    SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                    FROM information_schema.TABLES
                    WHERE table_schema = ?
                ", [$dbName]);

                if (!empty($sizeQuery) && isset($sizeQuery[0]->size_mb)) {
                    $dbSizeMb = (float) $sizeQuery[0]->size_mb;
                }
            }
        } catch (\Throwable $e) {
            $errorMessage = $e->getMessage();
        }

        return response()->json([
            'enabled'        => (bool) $enabled,
            'db_connected'   => $dbConnected,
            'db_name'        => 'audi_triaje',
            'table_exists'   => $tableExists,
            'total_records'  => $totalRecords,
            'records_today'  => $recordsToday,
            'error_records'  => $errorRecords,
            'db_size_mb'     => $dbSizeMb,
            'last_record'    => $lastRecord,
            'error_message'  => $errorMessage,
        ]);
    }

    /**
     * Activa o desactiva en caliente el módulo de auditoría.
     */
    public function toggle(Request $request)
    {
        $validated = $request->validate([
            'enabled' => 'required|boolean',
        ]);

        $enabled = (bool) $validated['enabled'];

        SystemSetting::set(
            'audit_module_enabled',
            $enabled,
            'audit',
            'Estado del módulo de auditoría forense y telemetría de red'
        );

        return response()->json([
            'success' => true,
            'enabled' => $enabled,
            'message' => $enabled
                ? 'Módulo de auditoría forense ACTIVADO con éxito.'
                : 'Módulo de auditoría forense DESACTIVADO.',
        ]);
    }

    /**
     * Lista paginada con filtros forenses (usuario, fechas, estatus, red, dispositivo).
     */
    public function index(Request $request)
    {
        try {
            if (!Schema::connection('audi_triaje')->hasTable('audit_records')) {
                return response()->json([
                    'data' => [],
                    'total' => 0,
                    'current_page' => 1,
                    'last_page' => 1,
                    'message' => 'La tabla audit_records aún no ha sido aprovisionada en audi_triaje.',
                ]);
            }

            $query = AuditRecord::query();

            // 1. Búsqueda de texto general
            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('user_name', 'like', "%{$search}%")
                      ->orWhere('user_dni', 'like', "%{$search}%")
                      ->orWhere('endpoint', 'like', "%{$search}%")
                      ->orWhere('ip_address', 'like', "%{$search}%")
                      ->orWhere('device_os', 'like', "%{$search}%")
                      ->orWhere('device_browser', 'like', "%{$search}%");
                });
            }

            // 2. Filtro por categoría
            if ($cat = $request->input('category')) {
                if ($cat !== 'TODOS') {
                    $query->where('action_category', $cat);
                }
            }

            // 3. Filtro por método HTTP
            if ($method = $request->input('method')) {
                if ($method !== 'TODOS') {
                    $query->where('method', strtoupper($method));
                }
            }

            // 4. Filtro por estatus (éxito o error)
            if ($status = $request->input('status')) {
                if ($status === 'success') {
                    $query->where('status_code', '<', 400);
                } elseif ($status === 'error') {
                    $query->where('status_code', '>=', 400);
                }
            }

            // 5. Filtro por red (local LAN vs WAN)
            if ($request->has('is_local_ip') && $request->input('is_local_ip') !== '') {
                $query->where('is_local_ip', filter_var($request->input('is_local_ip'), FILTER_VALIDATE_BOOLEAN));
            }

            // 6. Filtro por dispositivo
            if ($dev = $request->input('device_type')) {
                if ($dev !== 'TODOS') {
                    $query->where('device_type', $dev);
                }
            }

            // 7. Rango de fechas
            if ($dateFrom = $request->input('date_from')) {
                $query->where('created_at', '>=', "{$dateFrom} 00:00:00");
            }
            if ($dateTo = $request->input('date_to')) {
                $query->where('created_at', '<=', "{$dateTo} 23:59:59");
            }

            // 8. Usuario específico
            if ($userId = $request->input('user_id')) {
                $query->where('user_id', $userId);
            }

            $perPage = min(max((int) $request->input('per_page', 25), 10), 100);

            $records = $query->orderBy('id', 'desc')->paginate($perPage);

            return response()->json($records);

        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Error al consultar logs de audi_triaje: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Retorna el detalle completo de un registro individual forense.
     */
    public function show($id)
    {
        try {
            $record = AuditRecord::findOrFail($id);
            return response()->json($record);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Registro forense no encontrado'], 404);
        }
    }

    /**
     * Estadísticas forenses para gráficos y métricas del administrador.
     */
    public function stats(Request $request)
    {
        try {
            if (!Schema::connection('audi_triaje')->hasTable('audit_records')) {
                return response()->json(['categories' => [], 'devices' => [], 'hourly' => []]);
            }

            // Desglose por Categoría
            $categories = AuditRecord::select('action_category', DB::raw('count(*) as count'))
                ->groupBy('action_category')
                ->orderByDesc('count')
                ->get();

            // Desglose por Sistema Operativo / Dispositivo
            $devices = AuditRecord::select('device_os', DB::raw('count(*) as count'))
                ->whereNotNull('device_os')
                ->groupBy('device_os')
                ->orderByDesc('count')
                ->limit(6)
                ->get();

            // Tráfico de las últimas 24 horas
            $hourly = AuditRecord::select(DB::raw('HOUR(created_at) as hour'), DB::raw('count(*) as count'))
                ->where('created_at', '>=', now()->subHours(24))
                ->groupBy('hour')
                ->orderBy('hour')
                ->get();

            return response()->json([
                'categories' => $categories,
                'devices'    => $devices,
                'hourly'     => $hourly,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Exportación en formato CSV de eventos auditados.
     */
    public function export(Request $request)
    {
        try {
            $query = AuditRecord::orderBy('id', 'desc')->limit(2000);

            if ($search = $request->input('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('user_name', 'like', "%{$search}%")
                      ->orWhere('endpoint', 'like', "%{$search}%")
                      ->orWhere('ip_address', 'like', "%{$search}%");
                });
            }

            $records = $query->get();

            $headers = [
                'Content-Type'        => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="auditoria_triaje_' . date('Ymd_His') . '.csv"',
            ];

            $callback = function () use ($records) {
                $file = fopen('php://output', 'w');
                // BOM para compatibilidad con Excel
                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

                fputcsv($file, [
                    'ID', 'Fecha / Hora', 'Usuario', 'DNI', 'Rol', 'Puesto',
                    'Método', 'Endpoint', 'Categoría', 'HTTP Status', 'Duración (ms)',
                    'IP', 'Tipo Red', 'Red Estimada', 'RTT (ms)', 'Downlink (Mbps)',
                    'Dispositivo', 'SO', 'Navegador', 'Resolución', 'Zona Horaria'
                ]);

                foreach ($records as $r) {
                    fputcsv($file, [
                        $r->id,
                        $r->created_at?->format('Y-m-d H:i:s'),
                        $r->user_name ?? 'Anónimo',
                        $r->user_dni ?? '-',
                        $r->user_role ?? '-',
                        $r->station ?? '-',
                        $r->method,
                        $r->endpoint,
                        $r->action_category,
                        $r->status_code,
                        $r->duration_ms,
                        $r->ip_address,
                        $r->is_local_ip ? 'LAN Privada' : 'WAN Pública',
                        $r->network_effective_type ?? 'N/D',
                        $r->network_rtt_ms ?? '-',
                        $r->network_downlink_mbps ?? '-',
                        $r->device_type,
                        $r->device_os,
                        $r->device_browser,
                        $r->screen_resolution ?? '-',
                        $r->client_timezone ?? '-',
                    ]);
                }

                fclose($file);
            };

            return response()->stream($callback, 200, $headers);

        } catch (\Throwable $e) {
            return response()->json(['error' => 'Error al exportar registros: ' . $e->getMessage()], 500);
        }
    }
}
