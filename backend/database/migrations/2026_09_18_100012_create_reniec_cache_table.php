<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reniec_cache', function (Blueprint $table) {
            $table->string('dni', 8)->primary();
            $table->json('data');
            $table->timestamp('cached_at');
            $table->timestamp('expires_at');
        });
    }
    public function down(): void { Schema::dropIfExists('reniec_cache'); }
};
