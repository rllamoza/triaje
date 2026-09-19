<?php
namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name'=>'Administrador','apellidos'=>'Semilla','email'=>'admin@semilla.pe','password'=>Hash::make('Admin2025!'),'cmp_code'=>'ADMIN-001','role'=>'admin','pin_hash'=>Hash::make('1234'),'active'=>true],
            ['name'=>'Marco','apellidos'=>'Huaman Quispe','email'=>'mhuaman@semilla.pe','password'=>Hash::make('Med2025!'),'cmp_code'=>'CMP-89241','dni'=>'45892104','role'=>'medico','pin_hash'=>Hash::make('8247'),'station_default'=>'MED-01','active'=>true],
            ['name'=>'Sofia','apellidos'=>'Benavides Roca','email'=>'sbenavides@semilla.pe','password'=>Hash::make('Enf2025!'),'cmp_code'=>'CMP-92017','role'=>'triaje','pin_hash'=>Hash::make('5519'),'station_default'=>'TRI-02','active'=>true],
            ['name'=>'Ana','apellidos'=>'Torres Mamani','email'=>'atorres@semilla.pe','password'=>Hash::make('Adm2025!'),'role'=>'admision','station_default'=>'ADM-01','active'=>true],
        ];
        foreach ($users as $u) { User::updateOrCreate(['email'=>$u['email']], $u); }
    }
}