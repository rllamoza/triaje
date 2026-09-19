<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tickets_termicos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('atencion_id')->constrained('atenciones')->cascadeOnDelete();
            $table->enum('tipo', ['admision', 'receta', 'referencia', 'cierre']);
            $table->string('printer_id', 50)->nullable();
            $table->text('contenido_raw')->nullable();      // ESC/POS texto generado
            $table->text('escpos_base64')->nullable();      // binario base64
            $table->string('qr_code', 200)->nullable();
            $table->dateTime('printed_at')->nullable();
            $table->foreignId('printed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('bt_device_name', 100)->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('tickets_termicos'); }
};
