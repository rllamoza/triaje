<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('cmp_code', 30)->nullable()->unique()->after('id');
            $table->string('dni', 8)->nullable()->after('cmp_code');
            $table->string('apellidos', 100)->nullable()->after('name');
            $table->enum('role', ['admin','medico','triaje','admision','guardia'])->default('admision')->after('apellidos');
            $table->string('pin_hash', 255)->nullable()->after('password');
            $table->string('biometric_hash', 500)->nullable()->after('pin_hash');
            $table->string('token_fisico', 100)->nullable()->after('biometric_hash');
            $table->string('station_default', 20)->nullable()->after('token_fisico');
            $table->boolean('active')->default(true)->after('station_default');
            $table->timestamp('last_login_at')->nullable()->after('active');
        });
    }
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['cmp_code','dni','apellidos','role','pin_hash','biometric_hash','token_fisico','station_default','active','last_login_at']);
        });
    }
};
