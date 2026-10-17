# Notas de Versión — Release v1.0.1
**Semilla Triaje Clínico & Campañas Médicas Rurales**  
*Fecha de Lanzamiento: 16 de Octubre de 2026*

---

## 📌 Resumen de la Versión 1.0.1

La versión **v1.0.1** marca un hito fundamental en el flujo de atención médica ambulatoria y brigadas rurales, completando el ciclo clínico desde la admisión y triaje hasta la consulta médica especializada, la prescripción farmacológica y la emisión de recetas en tickets térmicos de alta nitidez.

---

## 🚀 Nuevas Funcionalidades y Mejoras Principales

### 1. Módulo Integral de Consulta Médica & Prescripción Farmacológica
- **Doble Modalidad de Sesión Clínica**:
  - **Médico Tratante**: Visualiza exclusivamente los pacientes asignados a su turno y consultorio, precargando automáticamente su nombre y código CMP.
  - **Administrador General / Auditor**: Dispone de un selector interactivo para filtrar la cola por médico tratante o inspeccionar la atención global de toda la brigada médica.
- **Historia Clínica Orientada a Problemas**:
  - Registro de motivo de consulta, enfermedad actual estructurada y examen físico por sistemas.
  - Codificación diagnóstica **CIE-10** con clasificación (*Definitivo*, *Presuntivo*, *Repetido*) y accesos rápidos a patologías frecuentes.
- **Prescripción Farmacológica & Vademécum**:
  - Catálogo integrado de medicamentos con autocompletado de dosis usual, forma farmacéutica y vía de administración.
  - Dosificación y posología pormenorizada (frecuencia, duración, cantidad a despachar e indicaciones precisas de toma).

---

### 2. Flujo de Guardado y Cierre de Atención Perfeccionado
- **Botón "Solo Guardar Consulta"**:
  - Permite guardar avances clínicos, anamnesis y notas médicas como borrador de trabajo.
  - Mantiene al paciente en estado **`en_consulta`**, permitiendo retomar o ampliar la consulta en cualquier momento sin cerrar prematuramente la atención ni lanzar la impresión.
- **Botón "Finalizar Consulta & Imprimir Receta"**:
  - Valida el registro de diagnósticos CIE-10 y prescripción farmacológica.
  - Actualiza el estado de la atención a **`finalizado`** en la base de datos.
  - Estampa la firma digital y hash criptográfico (`signed_at`, `signature_hash`, `medico_end_at`).
  - Dispara en automático el motor de impresión térmica ESC/POS para la entrega inmediata del ticket al paciente.

---

### 3. Rediseño del Ticket Térmico de Receta Médica (80 mm / 58 mm)
- **Legibilidad y Tipografía Optimizada**:
  - Escala tipográfica ampliada (cuerpo de 13–14px, nombres de medicamentos y dosis en 15–16px con `font-black`, código de turno en `3xl`).
  - Eliminación de tonos grises y degradados que generaban impresiones borrosas; ahora se utiliza negro puro (`#000000`) de alto contraste apto para cabezales térmicos de campo.
- **Estructura Clínica Clara**:
  - Encabezado institucional configurable mediante el módulo de Personalización & Logos.
  - Datos completos de filiación del paciente (DNI, edad, sexo, comunidad, seguro, alergias destacadas).
  - Resumen de constantes vitales registradas en triaje (PA, FC, T°, SpO2, Peso, Talla, IMC).
  - Cuerpo de prescripción Rp. con posología e indicaciones legibles para el paciente y el módulo de farmacia.
- **Espacio para Sello y Firma Médica**:
  - Recuadro sólido delimitado de 46 mm de altura con espacio suficiente para sello húmedo y firma manual del médico, incorporando su nombre, CMP y especialidad.
  - Código QR de autenticidad institucional para verificación rápida.

---

### 4. Sincronización de Constantes Vitales de Triaje
- Corrección de la consulta unificada de atenciones para incluir todas las columnas clínicas de la tabla `triajes` (`presion_sistolica`, `presion_diastolica`, `temperatura_c`, `frecuencia_cardiaca`, `frecuencia_respiratoria`, `saturacion_o2_pct`, `glucosa_mg_dl`, `triaje_peso`, `triaje_talla`, `triaje_imc`).
- Normalización en la conversión de tallas (centímetros a metros) para evitar desbordamientos en campos decimales.
- Normalización de enumerados para compatibilidad estricta con MySQL (`tipo_seguro`, `idioma_principal`, `estado_civil`).

---

### 5. Personalización Institucional & Identidad Gráfica
- Configuración de títulos, subtítulos y membretes de cabecera y pie de página.
- Soporte para logotipos de cabecera y sellos gráficos institucionales aplicados automáticamente tanto a tickets de triaje como a recetas médicas.

---

## 📦 Archivos Clave del Release

```
├── backend/
│   ├── controllers/
│   │   ├── AtencionController.php       # Inclusión de signos vitales de triaje
│   │   ├── BeneficiarioController.php   # Normalización de datos demográficos
│   │   ├── ConsultaController.php       # Lógica de guardado borrador vs finalizado
│   │   └── TriajeController.php         # Validación de constantes vitales
│   └── database/
│       └── seed_simulacion_30_pacientes.sql # Simulación para pruebas de carga
├── frontend/
│   ├── src/
│   │   ├── pages/consulta/ConsultaPage.tsx # Módulo de consulta y nuevo ticket térmico
│   │   ├── pages/admin/CampanasPage.tsx    # Gestión de brigadas
│   │   ├── pages/admin/PacientesPage.tsx   # Padrón de beneficiarios
│   │   └── utils/printEngine.ts            # Motor térmico ESC/POS
│   └── dist/                               # Bundle compilado de producción
```

---

## 🛠️ Procedimiento de Despliegue en Servidores de Producción

1. **Backend**:
   - Subir los controladores actualizados a la carpeta `controllers/` del servidor API.
2. **Frontend**:
   - Subir el contenido de la carpeta `frontend/dist/` al directorio web público (`public_html`).
   - Verificar que el archivo `.htaccess` esté presente para el soporte de rutas SPA.
3. **Base de Datos**:
   - Asegurarse de que las tablas `atenciones`, `triajes` y `consultas` cuenten con los campos actualizados.
