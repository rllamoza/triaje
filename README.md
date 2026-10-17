# Semilla Triaje de Salud — Asistencia Médica (Offline-First)

Plataforma integral de triaje clínico, filiación médica, colas de atención, impresión de tickets térmicos ESC/POS y telemetría de campo diseñada bajo la estética **IBM Carbon Clinical** para brigadas médicas rurales en entornos de conectividad limitada o nula.

**Versión Actual:** `v1.0.1`

---

## 🚀 Arquitectura Tecnológica (v1.0.1)

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, TanStack React Query, Zustand (persistencia local), Dexie.js (IndexedDB).
- **Backend API**: PHP 8 Nativo y Ligero (**Zero-Laravel, Zero-Composer**), Arquitectura Front-Controller, PDO MySQL/SQLite, autenticación por tokens y PIN de guardia.
- **Motor de Impresión**: Motor universal multi-dispositivo con detección automática de Windows Desktop vs Smartphones (Android/iOS), iframe térmico aislado y renderizado ESC/POS de alta nitidez.
- **Despliegue Plug-and-Play**: Listo para cPanel / BanaHosting y servidores Apache compartidos mediante archivos ZIP preempaquetados.

---

## 📁 Estructura del Repositorio

```
triaje/
├── backend/                       # API REST Nativa PHP 8
│   ├── config/                    # Configuración de BD y entorno
│   ├── controllers/               # Controladores clínicos y administrativos
│   ├── core/                      # Conexión PDO, Auth y Helpers
│   ├── database/                  # Dump SQL de producción (triaje_produccion.sql)
│   ├── .htaccess                  # Reescritura Apache y headers CORS
│   └── index.php                  # Router principal y Front-Controller
├── frontend/                      # Aplicación SPA React 19 + TypeScript + Vite
│   ├── dist/                      # Compilado de producción listo para cPanel
│   ├── src/                       # Código fuente de componentes y vistas
│   └── package.json               # Dependencias de frontend
├── lib/                           # Recursos auxiliares, maquetas y documentación
├── backend_produccion_cpanel.zip  # Archivo zip listo para cPanel (~43 KB)
├── frontend_dist_cpanel.zip       # Archivo zip listo para cPanel (~347 KB)
├── iniciar_proyecto.bat           # Lanzador en un clic para desarrollo local
├── RELEASE_NOTES_v0.3.md          # Notas oficiales de la versión 0.3
└── README.md
```

---

## ⚡ Inicio Rápido en Desarrollo Local

### Opción 1: Lanzador de un clic (Recomendado en Windows)
Hacer doble clic en `iniciar_proyecto.bat` para iniciar automáticamente el backend y el frontend.

### Opción 2: Línea de comandos
1. **Backend**:
   ```bash
   cd backend
   php -S 0.0.0.0:8000 index.php
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev -- --host 0.0.0.0
   ```

Acceder en el navegador:
- **Local:** `http://localhost:5173`
- **Red Local (Smartphones, tablets, laptops):** `http://<TU_IP_LOCAL>:5173` (ej. `http://192.168.0.251:5173`)

---

## 🌐 Despliegue en Producción (cPanel / BanaHosting)

1. **Crear Base de Datos en cPanel:**
   - Crear una base de datos MySQL y un usuario con todos los privilegios.
   - En phpMyAdmin, importar el archivo `backend/database/triaje_produccion.sql`.
2. **Subir Backend:**
   - Subir el archivo `backend_produccion_cpanel.zip` a su carpeta destino (ej. `public_html/api` o un subdominio como `api.tudominio.com`).
   - Extraer el ZIP y configurar las credenciales en `backend/config/db.php`.
3. **Subir Frontend:**
   - Subir el archivo `frontend_dist_cpanel.zip` a `public_html` (o la carpeta raíz de su dominio).
   - Extraer el contenido (incluye el archivo `.htaccess` para enrutamiento SPA).

---

## 🔑 Credenciales de Acceso por Defecto

| Rol | Correo / Credencial | Contraseña | PIN de Guardia |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@semilla.pe` (o `ADMIN-001`) | `Admin2025!` | `1234` |
| **Médico General** | `mhuaman@semilla.pe` (o `CMP-89241`) | `Med2025!` | `8247` |
| **Enfermera Triaje**| `sbenavides@semilla.pe` (o `CMP-92017`) | `Enf2025!` | `5519` |
| **Admisión** | `atorres@semilla.pe` | `Adm2025!` | — |

---

## 📄 Notas de la Versión
Consulte el archivo [RELEASE_NOTES_v1.0.1.md](file:///c:/Users/sistemas3/Documents/APPS/triaje/RELEASE_NOTES_v1.0.1.md) para ver la lista completa de cambios, arquitectura clínica y mejoras introducidas en esta versión. Consulte [RELEASE_NOTES_v0.3.md](file:///c:/Users/sistemas3/Documents/APPS/triaje/RELEASE_NOTES_v0.3.md) para el historial previo.
