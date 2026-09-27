<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'email_verification_code')) {
                $table->string('email_verification_code', 6)->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'email_verification_expires_at')) {
                $table->timestamp('email_verification_expires_at')->nullable()->after('email_verification_code');
            }
            if (!Schema::hasColumn('users', 'email_verification_attempts')) {
                $table->unsignedTinyInteger('email_verification_attempts')->default(0)->after('email_verification_expires_at');
            }
            if (!Schema::hasColumn('users', 'telefono')) {
                $table->string('telefono', 20)->nullable()->after('dni');
            }
            if (!Schema::hasColumn('users', 'especialidad')) {
                $table->string('especialidad', 100)->nullable()->after('cmp_code');
            }
        });

        // En MySQL convertimos role a VARCHAR(30) para soportar todos los roles de campaña sin restricciones de ENUM rígidos
        try {
            DB::statement("ALTER TABLE users MODIFY COLUMN role VARCHAR(30) NOT NULL DEFAULT 'voluntario'");
        } catch (\Throwable $e) {
            // Si el driver es sqlite u otro en tests, omitir DB::statement
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'email_verification_code',
                'email_verification_expires_at',
                'email_verification_attempts',
                'telefono',
                'especialidad',
            ]);
        });
    }
};
