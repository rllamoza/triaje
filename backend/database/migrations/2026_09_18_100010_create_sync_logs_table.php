<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sync_logs', function (Blueprint $table) {
            $table->id();
            $table->string('node_id', 50);
            $table->string('entity_type', 50);   // atencion, triaje, consulta...
            $table->unsignedBigInteger('entity_id');
            $table->enum('operation', ['INSERT', 'UPDATE', 'DELETE']);
            $table->json('payload');
            $table->boolean('synced')->default(false);
            $table->dateTime('synced_at')->nullable();
            $table->boolean('conflict')->default(false);
            $table->text('conflict_notes')->nullable();
            $table->timestamps();
            $table->index(['node_id', 'synced']);
            $table->index(['entity_type', 'entity_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('sync_logs'); }
};
