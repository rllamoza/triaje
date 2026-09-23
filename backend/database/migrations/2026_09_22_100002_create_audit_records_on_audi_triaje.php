<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        try {
            if (!Schema::connection('audi_triaje')->hasTable('audit_records')) {
                Schema::connection('audi_triaje')->create('audit_records', function (Blueprint $table) {
                    $table->id();
                    
                    // Identidad del Usuario
                    $table->unsignedBigInteger('user_id')->nullable()->index();
                    $table->string('user_name', 150)->nullable();
                    $table->string('user_email', 150)->nullable();
                    $table->string('user_role', 50)->nullable()->index();
                    $table->string('user_dni', 20)->nullable()->index();
                    $table->string('station', 50)->nullable();

                    // Acción y Protocolo HTTP
                    $table->string('method', 10)->index(); // GET, POST, PUT, DELETE, PATCH
                    $table->text('url');
                    $table->string('endpoint', 255)->index();
                    $table->string('route_name', 100)->nullable();
                    $table->string('action_category', 50)->default('GENERAL')->index(); // AUTH, TRIAJE, CONSULTA, ADMISION, TICKETS, ADMIN
                    $table->integer('status_code')->index();
                    $table->float('duration_ms')->nullable();

                    // Red, IP y Conectividad
                    $table->string('ip_address', 45)->index();
                    $table->boolean('is_local_ip')->default(false)->index();
                    $table->string('hostname', 150)->nullable();
                    $table->string('network_effective_type', 20)->nullable(); // 4g, 3g, 2g, wifi
                    $table->integer('network_rtt_ms')->nullable();
                    $table->float('network_downlink_mbps')->nullable();
                    $table->boolean('network_save_data')->default(false);

                    // Dispositivo y Entorno del Cliente
                    $table->string('device_type', 30)->nullable(); // Desktop, Mobile, Tablet
                    $table->string('device_os', 60)->nullable();   // Windows, Android, iOS, Linux, MacOS
                    $table->string('device_browser', 60)->nullable(); // Chrome, Firefox, Edge, Safari
                    $table->string('screen_resolution', 30)->nullable(); // e.g. 1920x1080
                    $table->string('client_timezone', 60)->nullable(); // e.g. America/Lima
                    $table->string('client_language', 50)->nullable(); // e.g. es-PE
                    $table->text('user_agent')->nullable();

                    // Carga Útil y Respuestas Forenses
                    $table->json('request_payload')->nullable();
                    $table->json('response_summary')->nullable();
                    $table->text('error_message')->nullable();

                    $table->timestamp('created_at')->useCurrent()->index();
                    $table->timestamp('updated_at')->nullable();
                });
            }
        } catch (\Throwable $e) {
            // Registramos pero no bloqueamos si audi_triaje aún requiere aprovisionamiento inicial
            \Illuminate\Support\Facades\Log::warning('No se pudo migrar audi_triaje directamente en migrate: ' . $e->getMessage());
        }
    }

    public function down(): void
    {
        try {
            Schema::connection('audi_triaje')->dropIfExists('audit_records');
        } catch (\Throwable $e) {}
    }
};
