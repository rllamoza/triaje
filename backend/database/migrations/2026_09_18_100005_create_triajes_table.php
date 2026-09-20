<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('triajes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('atencion_id')->unique()->constrained('atenciones')->cascadeOnDelete();
            // Signos vitales
            $table->decimal('temperatura_c', 4, 1)->nullable();
            $table->smallInteger('presion_sistolica')->nullable();
            $table->smallInteger('presion_diastolica')->nullable();
            $table->smallInteger('frecuencia_cardiaca')->nullable();
            $table->tinyInteger('frecuencia_respiratoria')->nullable();
            $table->tinyInteger('saturacion_o2_pct')->nullable();
            $table->smallInteger('glucosa_mg_dl')->nullable();
            $table->decimal('peso_kg', 5, 2)->nullable();
            $table->decimal('talla_cm', 5, 1)->nullable();
            $table->decimal('imc', 4, 1)->nullable();
            // Altitud
            $table->integer('altitud_atencion_masl')->nullable();
            $table->tinyInteger('saturacion_corregida')->nullable();
            // Prioridad Manchester Andina
            $table->enum('prioridad', ['I', 'II', 'III'])->default('III');
            $table->string('prioridad_label', 30)->nullable();  // Emergencia, Urgente, No Urgente
            $table->enum('prioridad_color', ['rojo', 'amarillo', 'verde'])->default('verde');
            // Anamnesis
            $table->string('sintoma_principal', 200)->nullable();
            $table->json('alergias_activas')->nullable();   // ["Penicilina","AINEs"]
            $table->json('alertas_clinicas')->nullable();
            $table->text('motivo_consulta')->nullable();
            $table->text('observaciones_triaje')->nullable();
            // Personal
            $table->foreignId('enfermera_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('triajes'); }
};
