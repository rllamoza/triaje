<?php
namespace App\Services;

use App\Models\ReniecCache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RENIECService
{
    private string $apiUrl;
    private string $apiToken;

    public function __construct()
    {
        $this->apiUrl   = config('services.reniec.url', 'https://api.reniec.cloud/dni/');
        $this->apiToken = config('services.reniec.token', '');
    }

    public function lookup(string $dni): ?array
    {
        // 1. Revisar caché local
        $cached = DB::table('reniec_cache')
            ->where('dni', $dni)
            ->where('expires_at', '>', now())
            ->first();

        if ($cached) {
            return json_decode($cached->data, true);
        }

        // 2. Intentar API externa
        try {
            $response = Http::withToken($this->apiToken)
                ->timeout(5)
                ->get($this->apiUrl . $dni);

            if ($response->ok()) {
                $data = $response->json();
                $this->cacheResult($dni, $data);
                return $data;
            }
        } catch (\Exception $e) {
            \Log::warning("RENIEC API error for DNI $dni: " . $e->getMessage());
        }

        return null;
    }

    private function cacheResult(string $dni, array $data): void
    {
        DB::table('reniec_cache')->updateOrInsert(
            ['dni' => $dni],
            [
                'data'      => json_encode($data),
                'cached_at' => now(),
                'expires_at'=> now()->addDays(30),
            ]
        );
    }

    public function mapToForm(array $reniecData): array
    {
        return [
            'nombres'          => $reniecData['nombres'] ?? '',
            'apellidos'        => trim(($reniecData['apellidoPaterno'] ?? '') . ' ' . ($reniecData['apellidoMaterno'] ?? '')),
            'fecha_nacimiento' => $reniecData['fechaNacimiento'] ?? null,
            'sexo'             => $reniecData['sexo'] === 'M' ? 'M' : 'F',
            'ubigeo_nacimiento'=> $reniecData['ubigeoNacimiento'] ?? null,
            'reniec_verified'  => true,
            'reniec_data_raw'  => $reniecData,
        ];
    }
}
