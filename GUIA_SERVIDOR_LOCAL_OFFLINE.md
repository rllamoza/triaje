# Guía de Arquitectura: Servidor Local Offline y Sincronización en Campaña Médica
**Plataforma Clínica Semilla Triaje de Salud**  
*Fecha de Elaboración: 23 de Octubre de 2026*

---

## 📌 1. Resumen Ejecutivo y Diagnóstico

Este documento detalla la arquitectura técnica, configuración paso a paso y estrategias de sincronización para que la plataforma **Semilla Triaje de Salud** funcione **100% sin conexión a internet** en zonas rurales o de difícil acceso (mediante una laptop que actúa como servidor local de campaña), y posteriormente sincronice toda la información con el servidor central en la nube (cPanel/MySQL) al recuperar la conectividad.

### Fortalezas Actuales del Sistema:
1. **Frontend PWA (Progressive Web App)**: Desarrollado con Vite, React y Workbox, lo que permite que la aplicación cargue en navegadores sin conexión a servidores externos.
2. **Backend PHP Nativo Desacoplado**: No depende de microservicios pesados ni de autenticación en la nube en tiempo real; se ejecuta limpiamente con el servidor web embebido de PHP (`php -S 0.0.0.0:8000`).
3. **Malla Local Lista**: El script [`iniciar_proyecto.bat`](file:///c:/Users/sistemas3/Documents/APPS/triaje/iniciar_proyecto.bat) ya viene configurado para detectar automáticamente la dirección IP local de la laptop y exponer tanto la API como la interfaz web a toda la red Wi-Fi o cableada.

---

## 🏕️ 2. Topología de Red en Campaña (Sin Internet)

Para que múltiples puestos (Admisión, Triaje, Consultorios Médicos y Farmacia) trabajen simultáneamente sin internet en la carpa médica:

```
                  ┌────────────────────────────────────────┐
                  │       ROUTER WI-FI DE CAMPAÑA          │
                  │ (Sin cable ni chip de internet móvil)  │
                  │         IP: 192.168.1.1                │
                  └───────────────────┬────────────────────┘
                                      │
              ┌───────────────────────┼────────────────────────┐
              │ (Wi-Fi / Ethernet)    │ (Wi-Fi)                │ (Wi-Fi)
              ▼                       ▼                        ▼
┌───────────────────────────┐  ┌──────────────┐         ┌──────────────┐
│  LAPTOP SERVIDOR CAMPAÑA  │  │ TABLET / PC  │         │ TABLET / PC  │
│  - MySQL Local            │  │   TRIAJE     │         │ CONSULTORIO  │
│  - Backend PHP (:8000)    │  │              │         │   MÉDICO     │
│  - Frontend Web (:5173)   │  │ Navegador:   │         │ Navegador:   │
│  - IP: 192.168.1.50       │  │ :5173        │         │ :5173        │
└─────────────┬─────────────┘  └──────────────┘         └──────────────┘
              │ (USB)
              ▼
  ┌───────────────────────┐
  │  IMPRESORA TÉRMICA    │
  │  Tickets de Admisión  │
  └───────────────────────┘
```

---

## 💻 3. Implementación del Servidor Local en la Laptop

### A. Requisitos de Software en la Laptop Servidor:
1. **XAMPP** (o MySQL Server standalone): Provee la base de datos MySQL local.
2. **PHP 8.2 o superior**: Viene con XAMPP o se agrega a las Variables de Entorno del sistema.
3. **Node.js (versión 20.x o superior)**: Para servir el frontend en modo de desarrollo/red.

---

### B. Archivos que se deben copiar a la Laptop:
Copiar la carpeta raíz del proyecto `triaje` en la laptop (ejemplo: `C:\APPS\triaje`):

```text
C:\APPS\triaje\
├── backend/                       <-- Toda la carpeta
│   ├── .env                       <-- Configuración de conexión local
│   ├── config/
│   ├── controllers/
│   │   ├── AtencionController.php
│   │   ├── MedicamentoController.php
│   │   ├── ConsultaController.php
│   │   └── ...
│   ├── core/
│   ├── database/
│   │   └── triaje_produccion.sql  <-- Script de estructura y datos semilla
│   └── index.php
├── frontend/                      <-- Toda la carpeta
│   ├── src/
│   ├── dist/
│   ├── package.json
│   └── vite.config.ts
└── iniciar_proyecto.bat           <-- Lanzador automático de red
```

---

### C. Configuración de Base de Datos Local:
1. Abrir **XAMPP Control Panel** e iniciar el servicio **MySQL**.
2. Ingresar a `http://localhost/phpmyadmin`.
3. Crear una base de datos con cotejamiento `utf8mb4_unicode_ci` llamada:
   ```sql
   CREATE DATABASE triaje_semilla CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
4. Ir a la pestaña **Importar** y cargar el archivo:
   `C:\APPS\triaje\backend\database\triaje_produccion.sql`.
5. Asegurar que el archivo `C:\APPS\triaje\backend\.env` contenga las credenciales locales de la laptop:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=triaje_semilla
   DB_USERNAME=root
   DB_PASSWORD=
   ```

---

### D. Instalación de Dependencias Frontend (Única Vez):
Abrir una terminal (PowerShell o CMD) en la carpeta `C:\APPS\triaje\frontend` y ejecutar:
```bash
npm install
```

---

## 🚀 4. Operación del Sistema en el Terreno

1. **Encendido del Router de Campaña**: Conectar el router a la toma eléctrica o batería.
2. **Conexión de la Laptop Servidor**: Conectar la laptop al router por cable de red o Wi-Fi.
3. **Iniciar los Servicios**:
   - En la laptop servidor, hacer doble clic en el archivo **`iniciar_proyecto.bat`**.
   - El script levantará el backend en el puerto `8000` y el frontend en el puerto `5173`, detectando la IP local (ejemplo `192.168.1.50`).
4. **Acceso de los Dispositivos de la Brigada**:
   - Conectar tablets, smartphones o laptops de los evaluadores a la misma red Wi-Fi.
   - Abrir Google Chrome o Edge e ingresar a:
     ```text
     http://192.168.1.50:5173
     ```
   - Cada voluntario ingresa con sus credenciales (Admisión, Triaje o Médico).
   - Las atenciones, colas en tiempo real, vademécum de campaña y prescripción operan a velocidad de red local LAN sin retardos de satélite ni internet.

---

## 🎫 5. Gestión de Correlativos y Números de Tickets en Modo Offline

El número de ticket visible en el ticket térmico (ejemplo: `MED-0001`, `PED-0002`) se calcula en [`AtencionController.php`](file:///c:/Users/sistemas3/Documents/APPS/triaje/backend/controllers/AtencionController.php):

### Escenario 1: Servidor Local Centralizado (Recomendado)
- Al existir una sola laptop servidor en la carpa que aloja la base de datos MySQL local, **todas las mesas de admisión consultan el mismo correlativo en tiempo real**.
- **Comportamiento:** Los números se emiten estrictamente secuenciales: `MED-0001`, `MED-0002`, `MED-0003`...
- **Resultado al subir a la nube:** Los tickets de papel físico entregados a los beneficiarios coinciden al 100% con los registros que se consolidan en el servidor en cPanel.

### Escenario 2: Varias Laptops de Admisión Totalmente Desconectadas entre Sí
Si dos puestos de admisión operaran en laptops independientes sin router común:
- **Estrategia por Prefijo de Estación**:
  - Mesa 1 emite: `MED-A001`, `MED-A002`, `MED-A003`...
  - Mesa 2 emite: `MED-B001`, `MED-B002`, `MED-B003`...
- **Estrategia por Bloques de Rango**:
  - Mesa 1 emite: `MED-0001` a `MED-0500`.
  - Mesa 2 emite: `MED-0501` a `MED-1000`.
- Esta separación garantiza que jamás existan dos pacientes con el mismo boleto en la sala de espera comunitaria.

---

## ☁️ 6. Sincronización de Datos con la Nube (Al Recuperar Conectividad)

Al finalizar la jornada médica y llegar a un punto con conexión a internet (hotel, base o ciudad):

### Procedimiento de Sincronización Manual (Inmediato):
1. En la laptop servidor, abrir `http://localhost/phpmyadmin`.
2. Seleccionar la base de datos `triaje_semilla` y entrar en la pestaña **Exportar**.
3. Seleccionar método de exportación *Personalizado*, eligiendo únicamente las tablas transaccionales generadas en la campaña:
   - `beneficiarios` (Nuevos pacientes empadronados o actualizados).
   - `atenciones` (Turnos y atenciones del día).
   - `triajes` (Signos vitales y somatometría).
   - `consultas` (Diagnósticos CIE-10, historias clínicas y recetas).
   - `medicamentos` (Stock consumido).
4. En las opciones de creación de sentencias, marcar **`INSERT IGNORE`** o **`REPLACE`** para no generar colisiones de clave primaria.
5. Ingresar al phpMyAdmin de cPanel en la nube e importar el archivo `.sql`.

---

### Procedimiento Automatizado Futuro (Script o Botón de 1 Clic):
Para eliminar la manipulación manual de archivos `.sql`, la arquitectura permite agregar un endpoint de sincronización bidireccional:

1. **Uso de UUIDs (Universally Unique Identifiers)**:
   - Cada atención y beneficiario nuevo se genera con un UUID v4 (ej. `f47ac10b-58cc-4372-a567-0e02b2c3d479`).
2. **Columna de Estado de Sincronización**:
   - `sync_status ENUM('pending', 'synced') DEFAULT 'pending'`
   - `synced_at TIMESTAMP NULL`
3. **Botón en Navbar "Sincronizar con Servidor Central"**:
   - La laptop local toma todos los registros con `sync_status = 'pending'`, los empaqueta en un payload JSON cifrado y hace un `POST` al endpoint `/api/sync/push` de cPanel.
   - cPanel inserta los registros sin riesgo de sobreescritura y devuelve un `HTTP 200 OK`.
   - La laptop local actualiza sus registros a `sync_status = 'synced'`.

---

## 📋 7. Lista de Verificación (Checklist) para la Brigada de Campo

- [ ] Laptop servidor con batería cargada al 100% y cargador original.
- [ ] XAMPP / MySQL instalado y verificado con `triaje_produccion.sql`.
- [ ] Router Wi-Fi portátil probado en taller (conectar laptop y smartphone de prueba).
- [ ] Regleta / extensión eléctrica de campo para carpa médica.
- [ ] Impresora térmica ESC/POS con rollos térmicos de repuesto y cable USB.
- [ ] Acceso directo a `iniciar_proyecto.bat` en el escritorio de la laptop.
- [ ] Credenciales de contingencia anotadas (Administrador y Médicos de turno).
