<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('campaign_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('station_id', 20)->nullable();    // MED-01, TRI-02
            $table->string('role_override', 30)->nullable(); // rol especial en esta campaña
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->unique(['campaign_id', 'user_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('campaign_users'); }
};
