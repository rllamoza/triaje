<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('webhooks', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->enum('type', ['rest_client', 'outgoing_webhook', 'incoming_webhook', 'p2p_sync'])->default('outgoing_webhook');
            $table->string('protocol', 60)->default('REST JSON');
            $table->string('url', 255);
            $table->string('event', 100)->default('on_patient_consultation_closed');
            $table->enum('auth_type', ['none', 'bearer_token', 'basic_auth', 'hmac_sha256', 'mtls'])->default('none');
            $table->text('auth_token')->nullable();
            $table->string('secret', 255)->nullable();
            $table->json('headers')->nullable();
            $table->enum('status', ['active', 'degraded', 'offline', 'queued'])->default('active');
            $table->integer('last_status_code')->nullable();
            $table->integer('last_latency_ms')->nullable();
            $table->dateTime('last_triggered_at')->nullable();
            $table->text('last_error')->nullable();
            $table->json('payload_sample')->nullable();
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();

            $table->index(['type', 'status']);
            $table->index(['event']);
        });

        Schema::create('webhook_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('webhook_id')->nullable()->constrained('webhooks')->nullOnDelete();
            $table->string('event', 100);
            $table->string('url', 255);
            $table->json('request_headers')->nullable();
            $table->json('request_payload')->nullable();
            $table->integer('response_status')->nullable();
            $table->json('response_headers')->nullable();
            $table->text('response_body')->nullable();
            $table->integer('duration_ms')->nullable();
            $table->enum('status', ['SUCCESS', 'FAILED', 'PENDING'])->default('SUCCESS');
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['webhook_id', 'created_at']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_deliveries');
        Schema::dropIfExists('webhooks');
    }
};
