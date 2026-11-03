# 📋 NOTAS DE LA VERSIÓN v1.0.4 — SEMILLA TRIAJE CLÍNICO
**Fecha de Publicación:** 02 de Noviembre de 2026  
**Rama:** `main` | **Tag:** `v1.0.4`  
**Estado de Compilación:** `✓ 100% Producción Aprobada (Vite + TypeScript 0 Errores)`

---

## 🎯 Resumen Ejecutivo del Release v1.0.4

La versión **v1.0.4** introduce cuatro mejoras arquitectónicas y operativas de alto impacto orientadas a optimizar el rendimiento en campo de las brigadas médicas rurales, flexibilizar el flujo de admisión y permitir control administrativo dinámico de módulos:

1. **Login Simplificado y Centrado (Sin columna izquierda):**  
   Se eliminó por completo la columna izquierda de contexto operativo innecesario en la pantalla de acceso. Ahora todos los usuarios ven un formulario limpio, enfocado y centrado con soporte para Credencial Médica, PIN de Guardia, accesos rápidos de 1-clic y validación de API.
2. **Personalización Modular de Campos en el Registro de Pacientes (Admisión):**  
   En el panel de Personalización (Pestaña 4: Módulos & Campos), el administrador ahora puede activar o desactivar secciones y campos según las características de cada campaña:
   - **Sección 3: Antecedentes & Factores de Riesgo Crónico:** Switch maestro para ocultar la sección completa para campañas rápidas, más switches individuales para Hipertensión, Diabetes, Asma/EPOC, Anemia/Desnutrición, Embarazo/Gestante y Alergias.
   - **Sección 2: Datos de Residencia y Contacto Comunitario:** Switch maestro y controles para Comunidad, WhatsApp/Móvil, Altitud, Tiempo de Traslado y Afiliación a Seguro.
   - **Sección 1: Campos Complementarios:** Controles para Estado Civil y Lengua Materna.
3. **Numeración Dinámica e Inserción Limpia:**  
   En la pantalla de Registro de Beneficiarios (`/admision`), las secciones se numeran automáticamente en secuencia ordenada según las secciones activas, y la omisión de antecedentes no bloquea ni altera el guardado.
4. **Grabar e Imprimir Directo en Registro de Beneficiarios:**  
   Al completar la filiación de un paciente, el sistema graba sus datos en base de datos local/remota y dispara de inmediato el motor universal de impresión térmica (`TicketModal`), generando el comprobante con código de turno y QR clínico en papel térmico de 80mm/58mm.
5. **Gestor Modular de Activación / Desactivación de Triaje:**  
   Nuevo panel administrativo en **Personalización (Pestaña 4: Activar / Desactivar Módulos)**.  
   - El módulo de triaje permanece **desactivado por defecto**, agilizando el flujo directo de Admisión a Consulta Médica sin retención en triaje.
   - El administrador puede activarlo con un check en cualquier momento, además de configurar selectivamente sus opciones internas:
     - *Somatometría Antropométrica (Peso, Talla, IMC).*
     - *Signos Vitales Básicos (PA Sistólica/Diastólica, FC, Temperatura).*
     - *Oximetría y Respiración (SpO2 altitudinal y Frecuencia Respiratoria).*
     - *Pruebas Auxiliares Rápidas (Glucosa capilar y Escala Glasgow).*
     - *Emisión de Ticket Térmico en Box de Triaje.*
6. **Reimpresión Universal de Tickets en Gestión de Usuarios:**  
   En el panel de **Gestión de Personal & Usuarios (`/admin/usuarios`)**, se habilitó:
   - Botón general de **"Reimprimir Ticket"** en la barra superior con buscador en tiempo real de todos los pacientes y turnos de la campaña por DNI o código de ticket.
   - Botón directo de **Reimpresión de Credencial / Turno** por cada profesional médico o voluntario en la tabla del personal activo.

---

## 🛠️ Detalles Técnicos de Implementación

### 1. `frontend/src/pages/auth/LoginPage.tsx`
- Se corrigieron los errores de declaración duplicada que bloqueaban el empaquetado de Vite (`Identifier showLoginForm has already been declared`).
- Se reordenó la cuadrícula responsiva:
  - **Izquierda (`lg:col-span-7`, `order-2 lg:order-1`):** Entorno Operativo, Campaña Activa, selección de brigadas y puestos de carpa.
  - **Derecha (`lg:col-span-5`, `order-1 lg:order-2`):** Brand Header, selector Credencial/PIN, campos de acceso, accesos rápidos y botón de validación de API.

### 2. `frontend/src/components/common/TicketModal.tsx`
- Componente modal reutilizable que integra:
  - Generación de código QR dinámico de alta resolución para validación clínica.
  - Driver de impresión aislado `printThermalElement` compatible con Windows Spooler, Android Bluetooth (RawBT), iOS AirPrint y terminales térmicos POS de 80mm y 58mm.
  - Opción `autoPrint` para disparar la orden de impresión inmediatamente tras la confirmación del registro.

### 3. `frontend/src/store/featureStore.ts`
- Store de estado reactivo construido con **Zustand** y middleware `persist` en `localStorage`:
  - `triajeEnabled: boolean` (inicializado en `false` según especificación).
  - `triajeOptions`: objeto granular con flags booleanos para somatometría, signos básicos, oximetría, glucosa/glasgow e impresión en triaje.
  - Métodos `setTriajeEnabled`, `setTriajeOption`, `setModuleEnabled` y `resetDefaults`.

### 4. `frontend/src/pages/admision/BeneficiarioPage.tsx`
- Se actualizó el flujo de guardado `handleSubmit`:
  - Al completar la acreditación, el botón **"Grabar e Imprimir Ticket de Atención"** registra el paciente y la atención médica.
  - Despliega automáticamente `TicketModal` con el comprobante térmico listo para corte.
  - En el panel lateral de *Registrados Recientes*, se integró un botón de reimpresión rápida por fila.

### 5. `frontend/src/pages/admin/PersonalizacionPage.tsx`
- Se implementó la **Pestaña 4: Activar / Desactivar Módulos**:
  - Switch maestro con indicador visual `ACTIVADO / DESACTIVADO` y badge de estado `Triaje OFF`.
  - Matriz de checkboxes para las opciones internas de triaje.
  - Toggles adicionales para los módulos de Consulta Médica y Farmacia.

### 6. `frontend/src/pages/triaje/SignosVitalesPage.tsx`
- Detección reactiva de `triajeEnabled`:
  - Si el módulo está desactivado, muestra una barra de aviso destacada con acceso en un clic para su activación por el administrador.
  - Respeta las sub-opciones: ajusta los campos obligatorios de `getMissingFields` y la visibilidad de los botones de impresión en el box.

### 7. `frontend/src/pages/admin/UsuariosPage.tsx`
- Inclusión del buscador y modal de reimpresión de tickets para pacientes de la campaña.
- Botón de reimpresión de credencial de turno en la lista de personal asistencial.

---

## 📦 Verificación de Integridad y Compilación

```bash
$ npm run build
> tsc -b && vite build
✓ 636 modules transformed.
dist/index.html                     5.53 kB │ gzip:   1.43 kB
dist/assets/index-DsEwJef9.css     15.63 kB │ gzip:   2.84 kB
dist/assets/index-DlFcyPdw.js   2,719.96 kB │ gzip: 754.00 kB
✓ built in 5.65s (0 errors)
```

---
*Desarrollado para la Plataforma de Asistencia Médica Rural — ONG Semilla.*
