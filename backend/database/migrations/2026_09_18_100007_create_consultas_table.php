<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('consultas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('atencion_id')->unique()->constrained('atenciones')->cascadeOnDelete();
            $table->foreignId('medico_id')->nullable()->constrained('users')->nullOnDelete();
            // Anamnesis
            $table->text('motivo_consulta')->nullable();
            $table->text('enfermedad_actual')->nullable();
            $table->text('antecedentes_personales')->nullable();
            $table->text('antecedentes_familiares')->nullable();
            // Examen físico (JSON por sistemas)
            $table->json('examen_fisico')->nullable();
            // Diagnósticos CIE-10
            $table->json('diagnosticos')->nullable();
            // Plan terapéutico
            $table->text('plan_tratamiento')->nullable();
            $table->text('indicaciones')->nullable();
            // Receta
            $table->json('receta')->nullable();
            // Exámenes auxiliares
            $table->json('examenes_solicitados')->nullable();
            // Derivación
            $table->boolean('requiere_referencia')->default(false);
            $table->string('referencia_destino', 200)->nullable();
            $table->enum('referencia_urgencia', ['normal', 'urgente', 'emergencia'])->nullable();
            // Firma digital
            $table->text('signature_hash')->nullable();
            $table->dateTime('signed_at')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('consultas'); }
};
