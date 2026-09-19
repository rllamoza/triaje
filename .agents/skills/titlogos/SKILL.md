---
name: titlogos
description: >-
  Personalización integral de identidad institucional y branding clínico: configuración de títulos,
  subtítulos, logotipos de cabecera y pie de página, sellos para documentos a exportar
  (tickets térmicos ESC/POS, reportes PDF y fichas de triaje) y menú interactivo de perfil de usuario en la barra superior.
---

# Skill: titlogos — Personalización de Títulos, Subtítulos, Logos y Menú de Usuario

Esta skill documenta, gestiona y ejecuta los flujos de personalización visual, institucional y de telemetría de campo para la plataforma clínica **Semilla Triaje de Salud**.

---

## 📋 Capacidades y Comandos Disponibles

### 1. `titlogos config-page` (Página de Personalización)
Ruta: `/admin/personalizacion` en el frontend ([PersonalizacionPage.tsx](file:///c:/Users/Warehouse/Downloads/APPS/APPS/triaje/frontend/src/pages/admin/PersonalizacionPage.tsx)).
Permite:
- **Casillas de Texto para Títulos y Subtítulos**:
  - Título principal de la barra de navegación superior (`appName`).
  - Subtítulo o lema de la cabecera (`appTagline`).
  - Título de carpa en la pantalla de acceso/login (`loginTitle`).
  - Subtítulo operativo en la pantalla de login (`loginSubtitle`).
- **Gestión de Logotipos con Subida de Archivos o URL**:
  - Subida directa de imágenes (PNG, JPG, SVG, WebP) convertidas a Data URL Base64 para soporte 100% offline sin dependencias de red WAN.
  - Alternativa de ingresar URLs directas.
  - Logotipo Principal (Cabecera / Navbar).
  - Isotipo Cuadrado / Emblema institucional (Login y Fichas de pacientes).
- **Partes Inferiores y Pie de Página (Footer)**:
  - Casilla para texto de soporte técnico / enlace de contingencia (`footerLeftText`).
  - Casilla para estado de red mesh / nodo en pie de página (`footerCenterText`).
  - Casilla para identificador de compilación (`footerRightText`).
  - Opción de subir sello o logotipo institucional inferior (`footerLogoUrl`).
- **Documentos a Exportar (Tickets Térmicos y PDFs)**:
  - Selector del logotipo a estampar en tickets y reportes:
    1. Usar Logotipo Principal.
    2. Usar Isotipo Cuadrado.
    3. Usar Logotipo Monocromático Especial para Tickets (optimizado para impresión térmica 58mm/80mm ESC/POS).
    4. Sin Logotipo (solo texto institucional).
  - Subida de imagen para logotipo térmico monocromático.
  - Casilla de encabezado institucional para documentos exportados (`exportHeader`).
  - Casilla de sub-encabezado / dependencia médica (`exportSubheader`).
  - Casilla de leyenda legal / pie de validez del documento (`exportFooterLegal`).
  - Previsualizador en vivo del Ticket Térmico 58mm con las dimensiones y tipografías reales de campo.

---

### 2. `titlogos user-menu` (Menú de Perfil en la Barra Superior)
Ubicación: [Navbar.tsx](file:///c:/Users/Warehouse/Downloads/APPS/APPS/triaje/frontend/src/components/layout/Navbar.tsx).
Comportamiento:
- Al hacer clic en el ícono de la persona (`person`) o en el nombre/cargo del usuario en la esquina superior derecha:
  - Se despliega un menú flotante con estética IBM Carbon Clinical.
  - Muestra la tarjeta del usuario con iniciales, nombre completo, código de colegiatura (CMP) o DNI, y etiqueta de rol activo.
  - **Enlaces de acceso directo**:
    - `Personalización & Logos` (`/admin/personalizacion`).
    - `Gestión de Usuarios` (`/admin/usuarios`).
    - `Integraciones & Telemetría` (`/admin/telemetria`).
  - **Cierre de sesión seguro**: Botón de "Cerrar Sesión" que invalida el token en el backend y limpia el almacenamiento local.
  - Detección de clics externos para cerrar automáticamente el menú al hacer clic fuera de él.

---

### 3. `titlogos store-sync` (Almacenamiento y Reactividad Global)
Ubicación: [brandingStore.ts](file:///c:/Users/Warehouse/Downloads/APPS/APPS/triaje/frontend/src/store/brandingStore.ts).
- Persistencia automática en el navegador (`localStorage: triaje-branding-v1`).
- Reactividad instantánea en:
  - [Navbar.tsx](file:///c:/Users/Warehouse/Downloads/APPS/APPS/triaje/frontend/src/components/layout/Navbar.tsx)
  - [LoginPage.tsx](file:///c:/Users/Warehouse/Downloads/APPS/APPS/triaje/frontend/src/pages/auth/LoginPage.tsx)
  - [TicketPage.tsx](file:///c:/Users/Warehouse/Downloads/APPS/APPS/triaje/frontend/src/pages/tickets/TicketPage.tsx)
  - Modales de impresión rápida en la Cola de Espera y Admisión.

---

## 🚀 Guía Rápida de Uso

1. **Acceder a la Personalización**:
   - Inicie sesión como Administrador (`admin@semilla.pe` / `Admin2025!`).
   - Haga clic en el ícono de usuario en la esquina superior derecha y seleccione **Personalización & Logos** (o use el enlace de la barra lateral izquierda).
2. **Subir nuevos Logotipos**:
   - En la pestaña *1. Cabeceras, Títulos y Logos*, presione el botón **Subir** junto al Logotipo Principal o Isotipo y seleccione una imagen de su equipo.
   - Observe la previsualización en tiempo real.
3. **Configurar el Ticket Térmico para Impresora**:
   - En la pestaña *3. Documentos a Exportar*, elija el logo a estampar, escriba el encabezado institucional y el pie legal.
   - Verifique la apariencia en la simulación interactiva de 58mm.
4. **Guardar**:
   - Haga clic en **Guardar Configuración**. Los cambios tendrán efecto inmediato en todas las pantallas.
