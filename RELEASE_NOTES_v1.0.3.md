# Notas de Versión — Release v1.0.3
**Semilla Triaje Clínico & Campañas Médicas Rurales**  
*Fecha de Lanzamiento: 23 de Octubre de 2026*

---

## 📌 Resumen de la Versión 1.0.3

La versión **v1.0.3** incorpora la **Arquitectura y Guía Operativa para Despliegue de Servidor Local 100% Offline**, permitiendo a las brigadas médicas ejecutar la suite completa de triaje, admisión, consulta médica y farmacia en zonas rurales sin conexión a internet mediante una laptop que actúa como nodo servidor de campaña en red Wi-Fi local.

Asimismo, documenta las estrategias de emisión de correlativos de tickets térmicos sin colisiones y los protocolos de sincronización con la nube (cPanel/MySQL) al retornar de la misión médica.

---

## 🚀 Contenido y Mejoras Principales de la Versión

### 1. Documentación de Arquitectura de Servidor Local Offline
- Incorporación del documento maestro: [`GUIA_SERVIDOR_LOCAL_OFFLINE.md`](file:///c:/Users/sistemas3/Documents/APPS/triaje/GUIA_SERVIDOR_LOCAL_OFFLINE.md).
- **Topología de Red de Campo**: Esquema de router Wi-Fi portátil sin dependencia de chip ni cable de datos para interconectar tablets y laptops en la carpa.
- **Configuración de Servicios Locales**: Guía paso a paso para entorno MySQL/PHP local en laptop con Windows, variables de entorno en `.env` y arranque con un clic vía `iniciar_proyecto.bat`.

---

### 2. Especificación de Emisión de Tickets Térmicos Offline
- **Modelo de Servidor Centralizado de Carpa**: Mantiene correlativos idénticos entre el ticket impreso en papel (`MED-0001`, `PED-0002`) y la base de datos que se consolidará en la nube.
- **Modelo Multi-Mesa Desconectada**: Definición de prefijos de estación (`MED-A001`, `MED-B001`) y rangos de bloques para campañas masivas de alta concurrencia.

---

### 3. Protocolos de Sincronización y Consolidación con la Nube
- Procedimiento de exportación selectiva con sentencias `INSERT IGNORE` / `REPLACE` para evitar duplicados en cPanel.
- Hoja de ruta para sincronización automática bidireccional basada en UUIDs v4 y columna `sync_status`.

---

## 📦 Archivos Afectados en este Release

- `GUIA_SERVIDOR_LOCAL_OFFLINE.md` *(Nuevo documento técnico y operativo de campo)*
- `frontend/package.json` *(Actualización de versión a 1.0.3)*
- `RELEASE_NOTES_v1.0.3.md` *(Notas oficiales de la versión 1.0.3)*
