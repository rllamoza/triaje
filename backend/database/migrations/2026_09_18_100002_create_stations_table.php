<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->string('code', 20);   // ADM-01, TRI-02, MED-01
            $table->enum('type', ['admision', 'triaje', 'medico', 'farmacia', 'pediatria', 'otro']);
            $table->string('label', 100);
            $table->string('printer_id', 50)->nullable();  // BT-POS-01
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->unique(['campaign_id', 'code']);
        });
    }
    public function down(): void { Schema::dropIfExists('stations'); }
};
