<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Api\CampaignController;
use App\Http\Controllers\Api\BeneficiarioController;
use App\Http\Controllers\Api\AtencionController;
use App\Http\Controllers\Api\TriajeController;
use App\Http\Controllers\Api\ConsultaController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\UserController;

// ── Públicos ────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('login',        [AuthController::class, 'login']);
    Route::post('login-pin',    [AuthController::class, 'loginPin']);
    Route::get('node-status',   [AuthController::class, 'nodeStatus']);
});

// ── Autenticados ────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('auth/logout',  [AuthController::class, 'logout']);
    Route::get('auth/me',       [AuthController::class, 'me']);

    // Campañas
    Route::get('campaigns',                         [CampaignController::class, 'index']);
    Route::post('campaigns',                        [CampaignController::class, 'store']);
    Route::get('campaigns/{campaign}',              [CampaignController::class, 'show']);
    Route::put('campaigns/{campaign}',              [CampaignController::class, 'update']);
    Route::post('campaigns/{campaign}/activate',    [CampaignController::class, 'activate']);
    Route::post('campaigns/{campaign}/close',       [CampaignController::class, 'close']);
    Route::get('campaigns/{campaign}/stats',        [CampaignController::class, 'stats']);
    Route::get('campaigns/{campaign}/stations',     [CampaignController::class, 'stations']);
    Route::post('campaigns/{campaign}/stations',    [CampaignController::class, 'storeStation']);

    // Cola en vivo (SSE — puede ser sin auth en red local)
    Route::get('campaigns/{campaign}/cola',         [AtencionController::class, 'cola']);
    Route::get('campaigns/{campaign}/cola/live',    [AtencionController::class, 'colaLive']);

    // RENIEC
    Route::get('reniec/{dni}',                      [BeneficiarioController::class, 'reniecLookup']);
    Route::get('beneficiarios/check-duplicate/{dni}', [BeneficiarioController::class, 'checkDuplicate']);

    // Beneficiarios
    Route::get('beneficiarios',                     [BeneficiarioController::class, 'index']);
    Route::post('beneficiarios',                    [BeneficiarioController::class, 'store']);
    Route::get('beneficiarios/{beneficiario}',      [BeneficiarioController::class, 'show']);
    Route::get('beneficiarios/{beneficiario}/historial', [BeneficiarioController::class, 'historial']);

    // Atenciones
    Route::get('atenciones',                        [AtencionController::class, 'index']);
    Route::post('atenciones',                       [AtencionController::class, 'store']);
    Route::get('atenciones/{atencion}',             [AtencionController::class, 'show']);
    Route::patch('atenciones/{atencion}/status',    [AtencionController::class, 'updateStatus']);

    // Triaje
    Route::post('triajes',                          [TriajeController::class, 'store']);
    Route::get('triajes/atencion/{atencionId}',     [TriajeController::class, 'showByAtencion']);
    Route::put('triajes/{triaje}',                  [TriajeController::class, 'update']);
    Route::get('triajes/rangos',                    [TriajeController::class, 'rangos']);

    // Consultas
    Route::post('consultas',                        [ConsultaController::class, 'store']);
    Route::get('consultas/atencion/{atencionId}',   [ConsultaController::class, 'showByAtencion']);
    Route::put('consultas/{consulta}',              [ConsultaController::class, 'update']);
    Route::post('consultas/{consulta}/firmar',      [ConsultaController::class, 'firmar']);
    Route::get('medicamentos',                      [ConsultaController::class, 'medicamentos']);

    // Tickets
    Route::post('tickets/generate',                 [TicketController::class, 'generate']);
    Route::get('tickets/atencion/{atencion}',       [TicketController::class, 'historial']);
    Route::get('printers/status',                   [TicketController::class, 'printerStatus']);

    // Usuarios
    Route::get('users',                             [UserController::class, 'index']);
    Route::post('users',                            [UserController::class, 'store']);
    Route::get('users/{user}',                      [UserController::class, 'show']);
    Route::put('users/{user}',                      [UserController::class, 'update']);
    Route::delete('users/{user}',                   [UserController::class, 'destroy']);
    Route::post('users/{user}/reset-pin',           [UserController::class, 'resetPin']);
});
