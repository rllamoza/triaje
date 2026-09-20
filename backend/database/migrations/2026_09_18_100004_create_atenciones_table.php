<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('atenciones', function (Blueprint $table) {
            $table->id();
            $table->integer('ticket_number');
            $table->foreignId('beneficiario_id')->constrained('beneficiarios')->cascadeOnDelete();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('station_id')->nullable()->constrained('stations')->nullOnDelete();
            $table->dateTime('arrival_time');
            $table->enum('status', [
                'admitido',
                'en_espera_triaje',
                'en_triaje',
                'en_espera_medico',
                'en_consulta',
                'en_farmacia',
                'finalizado',
                'referido',
                'no_se_presento'
            ])->default('admitido');
            $table->string('seguro_usado', 50)->nullable();
            $table->dateTime('triage_start_at')->nullable();
            $table->dateTime('triage_end_at')->nullable();
            $table->dateTime('medico_start_at')->nullable();
            $table->dateTime('medico_end_at')->nullable();
            $table->string('referred_to', 200)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('admitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['campaign_id', 'ticket_number']);
        });
    }
    public function down(): void { Schema::dropIfExists('atenciones'); }
};
