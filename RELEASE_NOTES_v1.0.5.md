# 📋 NOTAS DE LA VERSIÓN v1.0.5 — SEMILLA TRIAJE CLÍNICO
**Fecha de Publicación:** 04 de Noviembre de 2026  
**Rama:** `v0.3.0-runtime` | **Tag:** `v1.0.5`  
**Estado de Compilación:** `✓ 100% Producción Aprobada (Vite + TypeScript 0 Errores)`  
**Estado de Pruebas de Integridad:** `✓ 100% Aprobadas (4 de 4 suites ejecutadas exitosamente)`

---

## 🎯 Resumen Ejecutivo del Release v1.0.5

La versión **v1.0.5** perfecciona el motor de impresión térmica de tickets, la calibración visual de comprobantes en campo para impresoras térmicas de 80mm y 58mm, y resuelve de forma definitiva la persistencia de configuraciones y constantes del sistema en la base de datos MySQL:

1. **Centrado Preciso y Corrección de Desbordes en Tickets Térmicos:**
   - Se eliminaron los desplazamientos forzados hacia la derecha que causaban cortes en los datos del paciente (DNI, Comunidad, Hora y Médico) y generaban un espacio en blanco excesivo en el lateral izquierdo.
   - La impresión ahora utiliza un centrado geométrico perfecto (`margin: 0 auto !important;` y contenedor flex centrado en `html, body`) tanto en el motor de renderizado HTML del navegador (`printEngine.ts`) como en las reglas CSS de impresión global (`index.css`).
   - Se limitó el ancho máximo de impresión a **68mm** (para rollos de 80mm) y **48mm** (para rollos de 58mm) con márgenes internos de seguridad de 3mm a cada lado, garantizando que **ningún dato se corte ni en el extremo izquierdo ni en el derecho**.
   - Los datos tabulares del paciente cuentan con etiquetas fijas (`shrink-0`) y valores alineados a la derecha (`text-right`) con truncado de protección.

2. **Selector de Ancho de Rollo y Centrado en Personalización (Pestaña 3):**
   - Control interactivo en **Personalización (Documentos a Exportar)** para alternar entre:
     - **80mm (Estándar POS):** Impresoras de mostrador (Epson TM-T88, Star Micronics, Bixolon, etc.).
     - **58mm (Portátil / Mini):** Impresoras móviles térmicas Bluetooth compactas de brigada.
   - El sistema calcula y adapta automáticamente el centrado y ancho útil según el tipo de rollo seleccionado.

3. **Reajuste del Comando de Hardware ESC/POS:**
   - En [`backend/core/ESCPOSService.php`](file:///c:/Users/sistemas3/Documents/APPS/triaje/backend/core/ESCPOSService.php), se configuró el margen izquierdo nativo en `0` (`\x1D\x4C\x00\x00`) para que el cabezal de las impresoras térmicas directas por USB/Spooler imprima de forma naturalmente centrada sin recortes de papel.

4. **Persistencia Definitiva de Constantes en Base de Datos MySQL (`system_settings`):**
   - **Corrección de antecedentes:** Se corrigió la causa por la cual la sección de *Antecedentes de Riesgo Crónico* volvía a aparecer tras reiniciar o recargar (anteriormente residía solo en `localStorage` con valor predeterminado `true`).
   - **Almacenamiento Centralizado en MySQL:** Se creó el controlador [`SettingsController.php`](file:///c:/Users/sistemas3/Documents/APPS/triaje/backend/controllers/SettingsController.php) y endpoints `GET /api/settings` y `POST /api/settings`. Toda la configuración (campos de registro, activación de triaje, opciones de examen y branding) se almacena en la tabla `system_settings`.
   - **Sincronización en Inicio de Sistema:** En [`App.tsx`](file:///c:/Users/sistemas3/Documents/APPS/triaje/frontend/src/App.tsx), se consulta `/api/settings` al arrancar el cliente, hidratando los almacenes de Zustand de inmediato. Si `seccionAntecedentes` se marca como inactiva, queda asentada en la base de datos y no vuelve a activarse tras apagar y encender el sistema.

5. **Suite Completa de Pruebas Automatizadas de Integridad y Flujo (`test/`):**
   - Carpeta `test/` con pruebas automatizadas ejecutables vía `php test/run_all_tests.php` o `run_tests.bat`:
     - **`01_database_constants_test.php`:** Verifica conexión a BD, almacenamiento de constantes, simulación de apagado de servidor (destrucción de conexiones y flush de memoria), encendido y recuperación intacta de configuraciones.
     - **`02_patient_flow_test.php`:** Simulación de admisión de paciente con sección de antecedentes inactiva, detección de duplicados, creación de turno y ticket térmico.
     - **`03_triaje_flow_test.php`:** Simulación de los 2 flujos clínicos: (A) con triaje activado (cola triaje -> signos vitales -> espera médico) y (B) con triaje desactivado (paso directo a consulta médica -> diagnóstico -> finalizado).
     - **`04_branding_ticket_test.php`:** Verificación binaria del motor térmico ESC/POS (reseteo `GS L 0 0`, fuente Font A 12x24, supresión de QR y corte de papel).

---

## 🛠️ Archivos del Release

- **`backend/controllers/SettingsController.php`**: Controlador REST para constantes del sistema en `system_settings`.
- **`backend/core/Database.php`**: Inicialización y compatibilidad automática de la tabla `system_settings`.
- **`backend/index.php`**: Enrutador para `GET /api/settings` y `POST /api/settings`.
- **`frontend/src/services/settingsService.ts`**: Servicio de sincronización cliente-servidor para constantes.
- **`frontend/src/store/featureStore.ts`**: Configuración con antecedentes desactivados por defecto y persistencia extendida.
- **`frontend/src/pages/admin/PersonalizacionPage.tsx`**: Sincronización inmediata con backend al modificar switches.
- **`frontend/src/App.tsx`**: Hidratación de constantes desde BD en el arranque del sistema.
- **`frontend/src/utils/printEngine.ts`**: Centrado de impresión sin desplazamiento forzado.
- **`backend/core/ESCPOSService.php`**: Comando `GS L 0 0` de centrado para tickets térmicos.
- **`test/`**: Suite integral de pruebas automatizadas con ejecutor maestro `run_all_tests.php`.
- **`frontend_dist_cpanel.zip`**: Paquete de distribución compilado para producción.
