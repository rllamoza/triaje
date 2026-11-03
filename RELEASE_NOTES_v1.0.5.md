# 📋 NOTAS DE LA VERSIÓN v1.0.5 — SEMILLA TRIAJE CLÍNICO
**Fecha de Publicación:** 03 de Noviembre de 2026  
**Rama:** `v0.3.0-runtime` | **Tag:** `v1.0.5`  
**Estado de Compilación:** `✓ 100% Producción Aprobada (Vite + TypeScript 0 Errores)`

---

## 🎯 Resumen Ejecutivo del Release v1.0.5

La versión **v1.0.5** perfecciona el motor de impresión térmica de tickets y la calibración visual de comprobantes en campo para impresoras térmicas de 80mm y 58mm:

1. **Centrado Preciso y Corrección de Desbordes en Tickets Térmicos:**
   - Se eliminaron los desplazamientos forzados hacia la derecha que causaban cortes en los datos del paciente (DNI, Comunidad, Hora y Médico) y generaban un espacio en blanco excesivo en el lateral izquierdo.
   - La impresión ahora utiliza un centrado geométrico perfecto (`margin: 0 auto !important;` y contenedor flex centrado en `html, body`) tanto en el motor de renderizado HTML del navegador (`printEngine.ts`) como en las reglas CSS de impresión global (`index.css`).
   - Se limitó el ancho máximo de impresión a **68mm** (para rollos de 80mm) y **48mm** (para rollos de 58mm) con márgenes internos de seguridad de 3mm a cada lado, garantizando que **ningún dato se corte ni en el extremo izquierdo ni en el derecho**.
   - Los datos tabulares del paciente cuentan con etiquetas fijas (`shrink-0`) y valores alineados a la derecha (`text-right`) con truncado de protección.

2. **Selector de Ancho de Rollo y Centrado en Personalización (Pestaña 3):**
   - Nuevo control interactivo en **Personalización (Documentos a Exportar)** para alternar entre:
     - **80mm (Estándar POS):** Impresoras de mostrador (Epson TM-T88, Star Micronics, Bixolon, etc.).
     - **58mm (Portátil / Mini):** Impresoras móviles térmicas Bluetooth compactas de brigada.
   - El sistema calcula y adapta automáticamente el centrado y ancho útil según el tipo de rollo seleccionado.

3. **Reajuste del Comando de Hardware ESC/POS:**
   - En [`backend/core/ESCPOSService.php`](file:///c:/Users/sistemas3/Documents/APPS/triaje/backend/core/ESCPOSService.php), se configuró el margen izquierdo nativo en `0` (`\x1D\x4C\x00\x00`) para que el cabezal de las impresoras térmicas directas por USB/Spooler imprima de forma naturalmente centrada sin recortes de papel.

---

## 🛠️ Archivos Modificados en el Release v1.0.5

1. **`frontend/src/utils/printEngine.ts`**:
   - Centrado del iframe de impresión con `display: flex; justify-content: center;` y `margin: 0 auto;`.
   - Anchos máximos seguros calibrados a 68mm (80mm) y 48mm (58mm).
2. **`frontend/src/index.css`**:
   - Actualización de `@media print` para comprobantes térmicos con centrado automático y eliminación de offsets manuales.
3. **`frontend/src/components/common/TicketModal.tsx`**:
   - Aplicación de `margin: 0 auto;`, `maxWidth` dinámico basado en el store de branding, y protección contra desbordes en filas de datos del paciente (`shrink-0`, `text-right`).
4. **`frontend/src/store/brandingStore.ts`**:
   - Incorporación de la propiedad `ticketPaperWidth: '80mm' | '58mm'` con persistencia en `localStorage`.
5. **`frontend/src/pages/admin/PersonalizacionPage.tsx`**:
   - Control selector de rollo de papel (80mm / 58mm) y simulador con centrado visual activo.
6. **`backend/core/ESCPOSService.php`**:
   - Normalización del comando de margen izquierdo a `0` para centrado natural de impresión en rollos físicos.
7. **`frontend/package.json`**:
   - Actualización de versión a `1.0.5`.
