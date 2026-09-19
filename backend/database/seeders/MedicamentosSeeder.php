<?php
namespace Database\Seeders;

use App\Models\Medicamento;
use Illuminate\Database\Seeder;

class MedicamentosSeeder extends Seeder
{
    public function run(): void
    {
        $meds = [
            ['nombre_generico'=>'Paracetamol','concentracion'=>'500mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>500],
            ['nombre_generico'=>'Paracetamol','concentracion'=>'1g','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>200],
            ['nombre_generico'=>'Ibuprofeno','concentracion'=>'400mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>300],
            ['nombre_generico'=>'Amoxicilina','concentracion'=>'500mg','forma_farmaceutica'=>'capsula','via_administracion'=>'oral','stock_actual'=>200],
            ['nombre_generico'=>'Enalapril','concentracion'=>'10mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>150],
            ['nombre_generico'=>'Metformina','concentracion'=>'850mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>100],
            ['nombre_generico'=>'Amlodipino','concentracion'=>'5mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>100],
            ['nombre_generico'=>'Omeprazol','concentracion'=>'20mg','forma_farmaceutica'=>'capsula','via_administracion'=>'oral','stock_actual'=>200],
            ['nombre_generico'=>'Loratadina','concentracion'=>'10mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>150],
            ['nombre_generico'=>'Azitromicina','concentracion'=>'500mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>80],
            ['nombre_generico'=>'Ciprofloxacino','concentracion'=>'500mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>80],
            ['nombre_generico'=>'Diclofenaco','concentracion'=>'50mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>120],
            ['nombre_generico'=>'Metronidazol','concentracion'=>'500mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>100],
            ['nombre_generico'=>'Sulfato Ferroso','concentracion'=>'200mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>200],
            ['nombre_generico'=>'Vitamina C','concentracion'=>'500mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>300],
            ['nombre_generico'=>'Atorvastatina','concentracion'=>'20mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>60],
            ['nombre_generico'=>'Salbutamol','concentracion'=>'100mcg','forma_farmaceutica'=>'otro','via_administracion'=>'inhalada','stock_actual'=>30],
            ['nombre_generico'=>'Suero Oral','concentracion'=>'Sachet','forma_farmaceutica'=>'solucion','via_administracion'=>'oral','stock_actual'=>400],
            ['nombre_generico'=>'Dimenhidrinato','concentracion'=>'50mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>100],
            ['nombre_generico'=>'Ketorolaco','concentracion'=>'30mg/ml','forma_farmaceutica'=>'inyectable','via_administracion'=>'IM','stock_actual'=>50],
            ['nombre_generico'=>'Dexametasona','concentracion'=>'4mg/ml','forma_farmaceutica'=>'inyectable','via_administracion'=>'IM','stock_actual'=>30],
            ['nombre_generico'=>'Furosemida','concentracion'=>'40mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>40],
            ['nombre_generico'=>'Captopril','concentracion'=>'25mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>80],
            ['nombre_generico'=>'Betametasona','concentracion'=>'0.05%','forma_farmaceutica'=>'crema','via_administracion'=>'topica','stock_actual'=>30],
            ['nombre_generico'=>'Diazepam','concentracion'=>'5mg','forma_farmaceutica'=>'tableta','via_administracion'=>'oral','stock_actual'=>20],
        ];
        foreach ($meds as $m) {
            Medicamento::firstOrCreate(['nombre_generico'=>$m['nombre_generico'],'concentracion'=>$m['concentracion']],array_merge($m,['activo'=>true]));
        }
    }
}