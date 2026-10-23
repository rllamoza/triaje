# Notas de Versión — Release v1.0.2
**Semilla Triaje Clínico & Campañas Médicas Rurales**  
*Fecha de Lanzamiento: 23 de Octubre de 2026*

---

## 📌 Resumen de la Versión 1.0.2

La versión **v1.0.2** introduce el **Sistema de Gestión, Carga e Importación de Medicamentos por Campaña Médica**, permitiendo a los administradores asignar catálogos farmacológicos específicos para cada misión rural sin alterar el inventario global del almacén central. 

Incorpora dos modalidades independientes de aprovisionamiento: **Importación por Plantilla Excel Corporativa** y **Sincronización Directa de Stock con Base de Datos Externa**, además de dotar al módulo de Consulta Médica de visibilidad en tiempo real del stock disponible en el botiquín de campaña.

---

## 🚀 Nuevas Funcionalidades y Mejoras Principales

### 1. Gestión de Medicamentos Aislada por Campaña Médica
- **Selector Activo de Campaña**: La pantalla de administración `/admin/medicamentos` permite alternar entre misiones médicas. Toda importación, modificación y sincronización se circunscribe a la campaña seleccionada.
- **Vademécum Específico para el Médico**: El médico tratante solo visualiza y prescribe los medicamentos asignados a la campaña en la que inició sesión, evitando la prescripción de fármacos no disponibles en el botiquín local.
- **Herramienta de Copia entre Campañas**: Permite clonar catálogos farmacéuticos de campañas previas a una nueva misión (con o sin stock), optimizando los tiempos de preparación operativa.

---

### 2. Importación y Formato Excel Corporativo (Opción A)
- **Generación Dinámica de Plantilla en Blanco**:
  - Descarga directa de archivo `.xlsx` estructurado institucionalmente.
  - Diseño tipográfico limpio y legible (Segoe UI) en tonos azul corporativo, metadatos dinámicos de campaña y fecha de emisión.
  - Rayado alternado con validaciones de tipo de datos (formatos numéricos de millares en stock y códigos centrados).
  - Hoja anexa de instrucciones operativas con el catálogo estandarizado de Formas Farmacéuticas (tableta, jarabe, inyectable, etc.) y Vías de Administración.
- **Motor de Carga y Procesamiento Inteligente**:
  - Detección automática de encabezados tanto en fila 1 como en formato corporativo con banner superior (fila 6).
  - Dos modalidades de importación:
    - **Agregar / Actualizar**: Crea medicamentos nuevos y refresca atributos de los existentes (por código SKU o por tripleta nombre/concentración/forma).
    - **Reemplazar Catálogo**: Desactiva medicamentos fuera de la lista para la campaña activa, preservando íntegro el histórico de recetas emitidas.
  - Validación con reporte pormenorizado de errores por número de fila.

---

### 3. Sincronización de Stock con Base de Datos Externa (Opción B)
- **Conector MySQL Externo (Solo Lectura)**:
  - Permite enlazar de forma segura con el sistema o base de datos del almacén central para consultar existencias.
  - Parámetros configurables por campaña: host, puerto, base de datos, usuario, contraseña (almacenada con cifrado AES-256-CBC), tabla y nombres de columnas de código SKU y stock.
  - Pruebas de conectividad en vivo (`Probar conexión`) antes de ejecutar sincronizaciones.
  - **Sincronización Selectiva**: Solo actualiza las existencias de los medicamentos asignados a la campaña que coincidan por código SKU, ignorando el resto del catálogo del almacén.

---

### 4. Visibilidad de Stock en Consulta Médica
- El selector del vademécum en la Consulta Médica (`/consulta`) muestra la disponibilidad física en tiempo real junto al nombre del medicamento (ej. *Paracetamol 500mg • tableta — stock: 150*).
- Alertas visuales inmediatas de stock mínimo para el personal médico y de farmacia.

---

## 🗄️ Actualizaciones en la Base de Datos

Para actualizar la base de datos de producción desde la versión v1.0.1 a la v1.0.2:

```sql
-- 1. Nuevas columnas en tabla medicamentos
ALTER TABLE `medicamentos`
  ADD COLUMN `campaign_id` BIGINT UNSIGNED NULL AFTER `id`,
  ADD COLUMN `codigo` VARCHAR(60) NULL AFTER `campaign_id`,
  ADD COLUMN `origen` VARCHAR(20) NOT NULL DEFAULT 'manual',
  ADD COLUMN `stock_updated_at` TIMESTAMP NULL DEFAULT NULL,
  ADD INDEX `idx_med_campaign` (`campaign_id`),
  ADD INDEX `idx_med_codigo` (`codigo`);

-- 2. Tabla de configuración de sincronización externa por campaña
CREATE TABLE IF NOT EXISTS `medicamentos_config` (
  `clave` VARCHAR(60) NOT NULL PRIMARY KEY,
  `valor` TEXT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Vincular medicamentos preexistentes a la campaña activa
UPDATE `medicamentos`
SET `campaign_id` = (SELECT id FROM `campaigns` ORDER BY (status='active') DESC, id DESC LIMIT 1)
WHERE `campaign_id` IS NULL;
```

---

## 📦 Archivos Afectados

### Backend (PHP Nativo):
- `backend/controllers/MedicamentoController.php` *(Nuevo controlador de vademécum y sincronización)*
- `backend/controllers/ConsultaController.php` *(Filtro de medicamentos por campaña y exposición de stock)*
- `backend/index.php` *(Registro de endpoints administrativos y de sincronización)*

### Frontend (React + TypeScript):
- `frontend/src/pages/admin/MedicamentosPage.tsx` *(Nueva vista de gestión, carga Excel y sincronización)*
- `frontend/src/api/hooks.ts` *(Hooks y mutations para catálogo y sincronización)*
- `frontend/src/pages/consulta/ConsultaPage.tsx` *(Exposición de stock en selector de prescripción)*
- `frontend/src/components/layout/AppLayout.tsx` & `Navbar.tsx` *(Navegación administrativa)*
- `frontend/package.json` *(Versión 1.0.2 y dependencia exceljs)*
