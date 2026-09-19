<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('beneficiarios', function (Blueprint $table) {
            $table->id();
            $table->string('dni', 8)->unique();
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->date('fecha_nacimiento');
            $table->tinyInteger('edad_calculada')->nullable();
            $table->enum('sexo', ['M', 'F', 'O']);
            $table->enum('estado_civil', ['soltero','casado','conviviente','viudo','divorciado'])->nullable();
            $table->enum('idioma_principal', ['espanol','quechua','aymara','otro'])->default('espanol');
            $table->string('grado_instruccion', 50)->nullable();
            $table->string('ocupacion', 100)->nullable();
            // Dirección
            $table->string('region', 100)->nullable();
            $table->string('provincia', 100)->nullable();
            $table->string('distrito', 100)->nullable();
            $table->string('comunidad', 150)->nullable();
            $table->string('direccion_libre', 200)->nullable();
            $table->integer('altitud_residencia')->nullable();
            // Seguro
            $table->enum('tipo_seguro', ['SIS','ESSALUD','privado','ninguno','otro'])->default('ninguno');
            $table->string('numero_afiliacion', 50)->nullable();
            // Contacto
            $table->string('celular', 15)->nullable();
            // Datos clínicos base
            $table->string('grupo_sanguineo', 5)->nullable();
            $table->enum('rh_factor', ['+','-'])->nullable();
            $table->decimal('peso_kg', 5, 2)->nullable();
            $table->decimal('talla_cm', 5, 1)->nullable();
            // RENIEC
            $table->boolean('reniec_verified')->default(false);
            $table->json('reniec_data_raw')->nullable();
            // Meta
            $table->foreignId('registered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('beneficiarios'); }
};
