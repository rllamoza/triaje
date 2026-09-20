# Semilla Triaje de Salud — Asistencia Médica (Offline-First)

Plataforma integral de triaje clínico, filiación médica, colas de atención, impresión de tickets térmicos ESC/POS y telemetría de campo diseñada bajo la estética **IBM Carbon Clinical** para brigadas médicas rurales en entornos de conectividad limitada o nula.

---

## 🚀 Arquitectura Tecnológica

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, TanStack React Query, Zustand (persistencia local), Dexie.js (IndexedDB).
- **Backend**: Laravel 11, PHP 8.4, MySQL / SQLite local contingente, Laravel Sanctum (autenticación API y tokens de guardia).
- **Impresión & Hardware**: Soporte nativo para impresión de tickets térmicos ESC/POS de 58mm y 80mm vía Bluetooth y USB.
- **Sincronización P2P & Mesh**: Preparado para trabajo desconectado y sincronización con gateways Starlink o nodos locales.

---

## 📁 Estructura del Repositorio

```
triaje/
├── backend/                  # API REST Laravel 11
│   ├── app/Http/Controllers/ # Controladores (Auth, Beneficiarios, Triaje, Cola, Tickets)
│   ├── database/migrations/  # 18 migraciones clínicas y de campaña
│   └── routes/api.php        # Endpoints protegidos y de contingencia
├── frontend/                 # Aplicación SPA React 19 + Vite
│   ├── src/pages/            # Admisión, Cola, Triaje, Consulta, Tickets, Administración
│   ├── src/components/       # Layouts, Navbar interactivo, modales Carbon
│   └── src/store/            # Stores Zustand (Auth, Branding, Cola)
├── disenos/                  # Maquetas HTML de referencia clínica Carbon
├── .agents/                  # Skills y configuraciones del agente
├── iniciar_proyecto.bat      # Script lanzador automático de ambos servidores
└── README.md
```

---

## ⚡ Inicio Rápido

### Opción 1: Lanzador de un clic
Hacer doble clic en `iniciar_proyecto.bat` para iniciar automáticamente el backend y el frontend.

### Opción 2: Manual
1. **Backend**:
   ```bash
   cd backend
   php artisan migrate --seed
   php artisan serve --host=0.0.0.0 --port=8000
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev -- --host 0.0.0.0
   ```

O ejecutar directamente:
```bash
iniciar_proyecto.bat
```

Acceder en el navegador:
- Local: `http://localhost:5173`
- Red Local (móviles, tablets, otras PCs): `http://<TU_IP_LOCAL>:5173` (ej. `http://192.168.0.251:5173`)

---

## 🔑 Credenciales de Acceso por Defecto
- **Usuario**: `admin@semilla.pe`
- **Contraseña**: `Admin2025!`
- **PIN de Guardia**: `1234`
