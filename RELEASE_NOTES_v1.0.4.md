# Release 1.0.4 – 2026-11-02

## Nuevas funcionalidades
- **Login simplificado**: por defecto solo se muestra la columna derecha (entorno operativo). Se incluye botón de administrador para alternar la visualización del formulario de credenciales.
- **Módulo Triaje activable/desactivable**: se añadió una bandera de características (`isTriajeEnabled`) gestionada desde la página de Personalización. Los usuarios pueden activar o desactivar el módulo de Triaje sin eliminar la opción.
- **Registro de beneficiario**: al completar exitosamente el registro se guarda automáticamente el ticket asignado y se muestra un modal de impresión del ticket térmico.
- **Re‑impresión de ticket**: en la gestión de usuarios se agregó botón “Re‑imprimir” que abre el mismo modal de ticket para imprimir nuevamente.
- **Feature Store**: nuevo store de Zustand (`featureStore.ts`) para gestionar flags globales con persistencia en `localStorage`.
- **TicketModal**: componente reutilizable que muestra la información del ticket y permite imprimir usando `printThermalElement`.

## Mejoras
- Refactorización de componentes y lógica de estado para mayor claridad.
- Añadido `adminToggle` en la página de login para mayor flexibilidad operativa.

## Corrección de errores
- Se ajustó la lógica de limpieza del formulario de registro.
- Se corrigieron problemas de visualización en la UI al desactivar el módulo de Triaje.

---

Para más detalles, consulte la documentación en `README.md` y los comentarios en el código fuente.