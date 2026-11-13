# Semilla Triaje - Release v2.1.0 (13 de Noviembre de 2026)
## [ÚLTIMA Y MÁS ACTUALIZADA VERSIÓN DE PRODUCCIÓN]

- **Fecha de Publicación**: 13 de Noviembre de 2026 (2026-11-13)
- **Versión del Sistema**: v2.1.0-prod-latest
- **Ramas Principales**: `main` | `v0.3.0-runtime`
- **Estado de Pruebas**: 8/8 módulos aprobados al 100%

---

### Resumen de Funcionalidades y Actualizaciones Incorporadas

1. **Reinicio Diario Automático de Correlativos (Ticket 0001)**:
   - Los números correlativos se reinician automáticamente cada día calendario a partir del `0001`.
   - Soporte multievento en base de datos sin colisión entre fechas.

2. **Inclusión de Edad y Distrito en el Ticket de Admisión**:
   - Visualización y formato de **Edad** (ej. `42 años`) calculada dinámicamente desde la fecha de nacimiento.
   - Campo **Distrito** (ej. `Urubamba`) como procedencia principal en el ticket impreso y en pantalla.
   - Etiqueta clara como `Nro de Ticket` y retiro de la especialidad y subtítulos en el comprobante de turno.

3. **Seguridad y Cierre para Producción**:
   - Retiro total de cuentas de prueba automáticas (1 clic) en la pantalla de inicio de sesión.
   - Casillas en blanco por defecto; únicamente ingresan usuarios autorizados con sus credenciales.
   - Generación del documento maestro de credenciales: `CREDENCIALES_USUARIOS_PRODUCCION.md`.

4. **Farmacia, Dispensación y Stock en Tiempo Real**:
   - Vademécum dinámico con clasificación terapéutica y uso poblacional.
   - Descuento de stock en tiempo real y pantalla pública de inventario (`/farmacia/stock-publico`).
   - Búsqueda predictiva de pacientes por DNI o Apellidos.

5. **Infraestructura y Despliegue**:
   - Paquetes de distribución actualizados para cPanel: `frontend_dist_cpanel.zip` y `backend_update_cpanel.zip`.
   - Script de base de datos idempotente: `update_production.sql`.
   - Script de diagnóstico integral: `test/verify_system_health.php`.

