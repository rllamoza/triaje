<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('medicamentos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_generico', 200);
            $table->string('nombre_comercial', 200)->nullable();
            $table->string('concentracion', 50)->nullable();      // "500mg"
            $table->enum('forma_farmaceutica', ['tableta','capsula','jarabe','inyectable','crema','ovulo','solucion','otro']);
            $table->enum('via_administracion', ['oral','IM','IV','topica','inhalada','sublingual','otro']);
            $table->integer('stock_actual')->default(0);
            $table->integer('stock_minimo')->default(10);
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('medicamentos'); }
};
