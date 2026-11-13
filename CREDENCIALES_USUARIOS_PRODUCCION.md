# Semilla Triaje - Credenciales de Acceso a Producción

Documento confidencial con los usuarios, contraseñas y roles autorizados para el ingreso al sistema en entorno de producción.

---

## 1. Relación de Cuentas Autorizadas

| ID | Nombre Completo | Rol | Usuario / Correo | Contraseña | PIN de Emergencia | Estación / Módulos Asignados |
|:--:|:---|:---:|:---|:---|:---:|:---|
| **1** | **Administrador Semilla** | `admin` | `admin@semilla.pe` | `Admin2025!` | `1234` | Todos los módulos (Admisión, Triaje, Consulta, Farmacia, Configuración, Estadísticas) |
| **2** | **Dr. Marco Huamán Quispe** | `medico` | `mhuaman@semilla.pe` *(o CMP: `CMP-89241` / DNI: `45892104`)* | `Med2025!` | `8247` | Consultorios Médicos, Historial Clínico, Prescripción de Fármacos y Cola de Espera |
| **3** | **Lic. Sofía Benavides Roca** | `triaje` | `sbenavides@semilla.pe` *(o CMP: `CMP-92017`)* | `Enf2025!` | `5519` | Box de Somatometría, Toma de Signos Vitales y Triaje Clínico |
| **4** | **Ana Torres Mamani** | `admision` | `atorres@semilla.pe` | `Adm2025!` | — | Admisión de Pacientes, Filiación RENIEC y Emisión de Tickets Térmicos |

---

## 2. Política de Ingreso y Seguridad en Producción

1. **Retiro de Accesos Automáticos (1 Clic)**:
   - Se han eliminado todos los botones de relleno automático y pruebas de la pantalla de inicio de sesión.
   - Los campos de **Usuario** y **Contraseña** inician completamente vacíos.
   - Solo podrán ingresar los operadores y profesionales que digiten manualmente sus credenciales válidas.

2. **Formatos Válidos de Identificador de Usuario**:
   - Se puede ingresar con el **Correo Electrónico** institucional (`ejemplo@semilla.pe`).
   - Para el personal médico y de enfermería, también se permite ingresar digitando su **DNI** (8 dígitos) o su **Código de Colegiatura Médica** (ej. `CMP-89241`).

3. **Recomendaciones de Seguridad**:
   - Cada profesional debe resguardar su contraseña y no compartirla.
   - En caso de requerir nuevos usuarios o actualizar contraseñas en terreno, el Administrador General puede gestionarlo desde el módulo de **Usuarios** (`/admin/usuarios`).
   - El PIN de 4 dígitos es exclusivo para contingencia offline de emergencia ante cortes severos de red.

