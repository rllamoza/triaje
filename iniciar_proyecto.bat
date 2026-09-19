@echo off
title Semilla Triaje - Servidor Completo
echo ===================================================
echo   Iniciando Semilla Triaje de Salud (Offline-First)
echo ===================================================
echo.

echo 1. Iniciando Backend Laravel (Puerto 8000)...
start "Backend Laravel" cmd /k "cd /d %~dp0backend && php artisan serve --port=8000"

echo 2. Iniciando Frontend Vite (Puerto 5173)...
start "Frontend Vite" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo Ambos servidores han sido lanzados en terminales separadas:
echo   - Backend:  http://127.0.0.1:8000
echo   - Frontend: http://localhost:5173
echo.
echo Credenciales de prueba:
echo   - Correo: admin@semilla.pe
echo   - Clave:  Admin2025!
echo   - PIN:    1234
echo ===================================================
timeout /t 5 >nul
start http://localhost:5173
