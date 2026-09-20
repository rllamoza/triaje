@echo off
title Semilla Triaje - Servidor Completo (Red Local)
echo ===================================================
echo   Iniciando Semilla Triaje de Salud (Red Local)
echo ===================================================
echo.

set "LAN_IP="
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp,Manual | Select-Object -ExpandProperty IPAddress -First 1)"') do set LAN_IP=%%a

if "%LAN_IP%"=="" set LAN_IP=127.0.0.1

echo 1. Iniciando Backend Laravel en 0.0.0.0:8000...
start "Backend Laravel" cmd /k "cd /d %~dp0backend && php artisan serve --host=0.0.0.0 --port=8000"

echo 2. Iniciando Frontend Vite en 0.0.0.0:5173...
start "Frontend Vite" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 0.0.0.0"

echo.
echo ===================================================
echo   SERVIDORES ACTIVOS Y ESCUCHANDO EN TODA LA RED
echo ===================================================
echo   Acceso desde esta maquina (Local):
echo     - Frontend:  http://localhost:5173
echo     - Backend:   http://localhost:8000
echo.
echo   Acceso desde cualquier dispositivo en tu Red Local:
echo   (Smartphones, Tablets, Laptops u otras PCs en el mismo Wi-Fi/LAN)
echo     - Frontend:  http://%LAN_IP%:5173
echo     - Backend:   http://%LAN_IP%:8000
echo.
echo   Credenciales de prueba:
echo     - Correo: admin@semilla.pe
echo     - Clave:  Admin2025!
echo     - PIN:    1234
echo.
echo   NOTA: Si otro dispositivo en la red no carga la pagina,
echo   asegurate de permitir los puertos 5173 y 8000 en el
echo   Firewall de Windows o colocar tu red como "Privada".
echo ===================================================
timeout /t 5 >nul
start http://localhost:5173
