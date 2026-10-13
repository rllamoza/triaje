# 🚀 Release v0.3.0 — Semilla Triaje de Salud

**Fecha de lanzamiento:** 12 de Octubre de 2026  
**Versión:** `v0.3.0`  
**Estado:** Producción / Estable  

---

## 📋 Resumen del Release

La versión **0.3.0** representa un salto arquitectónico fundamental en el proyecto **Semilla Triaje de Salud**, enfocado en la **simplicidad operativa**, la **compatibilidad total con entornos de hosting compartido (cPanel / BanaHosting)** y un **motor de impresión térmica universal multi-dispositivo** optimizado para máxima nitidez y rendimiento inmediato.

Se ha reemplazado por completo el backend dependiente del framework Laravel por una **arquitectura de API REST en PHP 8 nativo y puro**, reduciendo drásticamente el peso del despliegue (de ~100MB a menos de 45KB), eliminando la necesidad de Composer, terminal SSH o extensiones complejas en servidores de producción.

---

## ✨ Novedades y Mejoras Clave

### 1. ⚡ Backend Nativo en PHP 8 (Zero-Dependency & Zero-Laravel)
- **Despliegue directo por copia de archivos:** El backend ahora funciona de forma plug-and-play en cualquier servidor Apache / cPanel / BanaHosting sin requerir Composer, Node ni dependencias pesadas en el servidor.
- **Enrutador Front-Controller (`index.php`):**
  - Manejo universal de CORS con headers permisivos y respuesta inmediata a preflight `OPTIONS`.
  - Reescritura transparente con `.htaccess` y soporte para cabecera `Authorization: Bearer <token>`.
- **Controladores Nativos:**
  - `AuthController`: Autenticación con BCrypt/SHA256, tokens de sesión y compatibilidad con PIN de guardia.
  - `BeneficiarioController`: Registro y búsqueda de pacientes con soporte RENIEC simulado/offline.
  - `AtencionController`: Flujo completo de admisión, estados de espera (`ESPERA_TRIAJE`, `TRIAJE`, `ESPERA_CONSULTA`, `ATENDIDO`).
  - `TriajeController`: Registro de signos vitales (Presión arterial, FC, FR, Temp, SpO2, Glucosa, Glasgow, IMC).
  - `ConsultaController`: Diagnósticos CIE-10, prescripción farmacológica e indicaciones.
  - `TicketController`: Despacho de tickets térmicos con numeración y cola por campaña.
  - `UserController`, `CampaignController`, `AuditController`: Gestión de brigadistas, campañas y auditoría.
- **Persistencia PDO Ultraliviana:** Conexión singleton PDO optimizada con soporte para MySQL remoto y local.

### 2. 🖨️ Motor de Impresión Térmica Universal Multi-Dispositivo
- **Detección inteligente de plataforma:** El sistema detecta automáticamente si el usuario opera desde **Windows Desktop**, **Android**, **iOS** o **Navegador Móvil**.
- **Enrutamiento directo al driver de impresión:**
  - **En Windows:** Permite la invocación directa al spooler RAW del sistema o la apertura del diálogo de impresión en formato térmico optimizado.
  - **En Smartphones (Android/iOS):** Conexión inmediata al servicio de impresión nativo del dispositivo (Bluetooth, USB-OTG, AirPrint o visor térmico móvil) sin requerir software intermediario ni bloquear la interfaz.
- **Iframe Térmico Aislado (`printEngine.ts`):** La impresión web ahora se ejecuta en un iframe invisible e independiente, garantizando que **solo se imprima el recibo térmico** sin elementos de navegación, cabeceras del sistema ni márgenes excesivos.
- **Calidad de impresión mejorada (Ultra Nitidez):**
  - Tipografía en negro 100% puro (`#000000`) y fuentes monoespaciadas de alto contraste (`Courier New`, `Consolas`, monospace).
  - Soporte de comando ESC/POS nativo `DOUBLE_STRIKE_ON` (`\x1B\x47\x01`) y espaciado de línea denso (`ESC 3 30`) para impresoras térmicas de 58mm y 80mm.

### 3. 📦 Paquetes de Despliegue para cPanel (BanaHosting)
- `backend_produccion_cpanel.zip` (~43 KB): Contiene toda la API PHP nativa lista para descomprimir en la raíz o subdominio en cPanel (`api.tudominio.com` o carpeta en `public_html`).
- `frontend_dist_cpanel.zip` (~347 KB): Contiene el bundle compilado de React 19 con `.htaccess` configurado para enrutamiento SPA (`RewriteRule ^index.html$ - [L]`).
- `backend/database/triaje_produccion.sql`: Script SQL con la base de datos completa y 4 usuarios brigadistas preconfigurados.

### 4. 🧹 Depuración de Archivos y Organización del Repositorio
- Eliminación de todas las carpetas y archivos obsoletos de Laravel (`vendor/`, `storage/`, `bootstrap/`, `artisan`, etc.).
- Movimiento de maquetas, diseños y scripts auxiliares a la carpeta `lib/`.
- Repositorio limpio y optimizado para clonación y desarrollo ágil.

---

## 🛠️ Estructura del Proyecto en v0.3.0

```
triaje/
├── backend/                  # API REST Nativa PHP 8
│   ├── config/               # Configuración de base de datos (db.php)
│   ├── controllers/          # Controladores REST nativos (Auth, Atencion, etc.)
│   ├── core/                 # Motor de base de datos PDO y utilidades
│   ├── database/             # Script SQL de producción (triaje_produccion.sql)
│   ├── .htaccess             # Reescritura Apache y headers CORS
│   └── index.php             # Router principal / Front-controller
├── frontend/                 # Aplicación SPA React 19 + TypeScript + Vite
│   ├── dist/                 # Build de producción compilado con .htaccess
│   ├── src/
│   │   ├── api/              # Cliente Axios y hooks TanStack Query
│   │   ├── pages/            # Módulos clínicos (Admisión, Triaje, Consulta, Tickets)
│   │   ├── store/            # Estado global (Zustand)
│   │   └── utils/            # Motor de impresión multi-dispositivo (printEngine.ts)
│   └── package.json          # v0.3.0
├── lib/                      # Archivos de respaldo, maquetas y utilitarios
├── iniciar_proyecto.bat      # Lanzador en un clic para desarrollo local y red LAN
├── README.md                 # Documentación técnica general
└── RELEASE_NOTES_v0.3.md     # Notas oficiales del lanzamiento v0.3.0
```

---

## 🚀 Guía Rápida de Instalación

### En Desarrollo Local (Windows)
1. Ejecutar el archivo:
   ```cmd
   iniciar_proyecto.bat
   ```
2. La API se iniciará en `http://localhost:8000` y el Frontend en `http://localhost:5173`.
3. Dispositivos en la misma red Wi-Fi pueden acceder mediante la IP local mostrada en consola.

### En Producción (cPanel / BanaHosting)
1. **Base de Datos:**
   - Crear una base de datos MySQL en cPanel (ej. `tuusuario_triaje`).
   - Importar el archivo `backend/database/triaje_produccion.sql` desde phpMyAdmin.
2. **Backend:**
   - Subir y extraer `backend_produccion_cpanel.zip` en la carpeta destino (ej. `public_html/api` o subdominio `api.tudominio.com`).
   - Ajustar las credenciales en `config/db.php`.
3. **Frontend:**
   - Subir y extraer `frontend_dist_cpanel.zip` en la carpeta web principal (ej. `public_html`).
   - Todo listo y funcionando con HTTPS.

---

## 👥 Credenciales de Prueba por Defecto
- **Administrador:** `admin@semilla.pe` / `Admin2025!`
- **Médico General:** `medico@semilla.pe` / `Medico2025!`
- **Enfermera Triaje:** `enfermera@semilla.pe` / `Enfermera2025!`
- **PIN de Guardia Rápido:** `1234`
