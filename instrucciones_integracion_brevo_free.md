# Instrucciones para integrar Brevo Free en una aplicación Node.js / Express

## 1. Objetivo

Integrar Brevo como proveedor de **correo electrónico transaccional** utilizando inicialmente el **plan Free**, manteniendo la integración desacoplada del resto de la aplicación.

La integración debe permitir:

- Enviar correos transaccionales desde el backend.
- Utilizar plantillas administradas en Brevo.
- Pasar parámetros dinámicos a las plantillas.
- Mantener las credenciales fuera del código fuente.
- Registrar el resultado del envío.
- Preparar la arquitectura para agregar webhooks y una cola de notificaciones posteriormente.
- No modificar ni recrear tablas existentes de la base de datos salvo que sea estrictamente necesario y se solicite explícitamente.
- Mantener la aplicación independiente de Brevo mediante un servicio propio.

---

## 2. Alcance inicial

### Implementar ahora

1. API Key de Brevo.
2. Sender verificado.
3. Dominio de envío, si está disponible.
4. Servicio `brevo.service.js`.
5. Variables de entorno.
6. Envío de emails transaccionales.
7. Uso de `templateId`.
8. Parámetros dinámicos (`params`).
9. Endpoint interno de prueba.
10. Manejo de errores.
11. Registro básico del resultado.
12. Control lógico del límite del plan Free.

### No implementar inicialmente

No agregar sin necesidad:

- SMS.
- WhatsApp.
- Conversations.
- eCommerce.
- Loyalty.
- Marketing Automation.
- Custom Objects.
- Integraciones de marketing.
- MCP.
- Múltiples proveedores de correo.
- Funcionalidades que no sean necesarias para el correo transaccional.

Los webhooks, cola avanzada y estadísticas detalladas pueden quedar preparados para una segunda etapa.

---

# 3. Información importante sobre Brevo Free

El plan Free permite actualmente **300 emails por día**.

Este límite debe tratarse como el límite operativo principal del sistema.

No asumir que la capacidad de la API equivale a la cantidad de correos que se pueden enviar gratuitamente.

Diseñar la aplicación considerando:

```text
Aplicación
    ↓
Control de notificaciones
    ↓
Límite diario
    ↓
Brevo
```

Si un día se alcanza el límite, las nuevas notificaciones deben poder quedar registradas como pendientes o rechazadas de forma controlada, en lugar de perderse silenciosamente.

No implementar una lógica que dependa de que Brevo acepte indefinidamente correos por encima del límite Free.

---

# 4. API de Brevo

El endpoint principal para enviar un email transaccional es:

```http
POST https://api.brevo.com/v3/smtp/email
```

La autenticación utiliza la cabecera:

```http
api-key: xkeysib-XXXXXXXX
```

También utilizar:

```http
Content-Type: application/json
Accept: application/json
```

La API Key nunca debe estar en el frontend.

---

# 5. Variables de entorno

Agregar al `.env`:

```env
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxx
BREVO_SENDER_EMAIL=notificaciones@dominio.com
BREVO_SENDER_NAME=Mi Sistema
```

Si se implementa control de cuota local:

```env
BREVO_DAILY_LIMIT=300
```

No colocar valores reales de API Key en Git, archivos públicos, frontend, documentación pública o código fuente.

Agregar las variables correspondientes al `.env.example` sin secretos:

```env
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=
BREVO_DAILY_LIMIT=300
```

---

# 6. Sender

Antes de enviar correos, configurar en Brevo un remitente autorizado.

Ejemplo:

```text
Nombre:
Comunidad Cristiana Agua Viva

Email:
notificaciones@dominio.com
```

El sistema debe utilizar únicamente un sender verificado.

No permitir que un usuario del frontend pueda cambiar arbitrariamente el remitente.

---

# 7. Dominio

Para producción, configurar y autenticar el dominio de envío en Brevo.

La configuración DNS debe realizarse en el proveedor que administra el dominio.

No inventar registros DNS.

Los valores exactos deben copiarse desde el panel de Brevo correspondiente a la cuenta.

Objetivo:

```text
dominio autenticado
        ↓
mejor configuración de autenticación
        ↓
mejor entregabilidad
```

---

# 8. Plantillas de Brevo

Preferir plantillas de Brevo en lugar de generar HTML directamente desde el código.

Ejemplo conceptual:

```text
Brevo
│
├── Plantilla: Recuperación de contraseña
├── Plantilla: Bienvenida
├── Plantilla: Confirmación
├── Plantilla: Notificación
├── Plantilla: Reporte
└── Plantilla: Alerta administrativa
```

Desde Node.js enviar:

```json
{
  "to": [
    {
      "email": "usuario@correo.com",
      "name": "Juan"
    }
  ],
  "templateId": 15,
  "params": {
    "nombre": "Juan",
    "codigo": "482931"
  }
}
```

No colocar el HTML completo de cada correo dentro de los controladores.

---

# 9. Arquitectura recomendada

La integración debe quedar desacoplada.

Estructura sugerida:

```text
proyecto/
│
├── config/
│
├── controllers/
│
├── routes/
│
├── services/
│   └── brevo.service.js
│
├── middleware/
│
├── public/
│
├── .env
├── .env.example
└── server.js
```

Flujo:

```text
Route
  ↓
Controller
  ↓
NotificationService
  ↓
BrevoService
  ↓
Brevo API
```

La aplicación no debe llamar directamente a Brevo desde múltiples controladores.

---

# 10. Servicio Brevo

Crear:

```text
services/brevo.service.js
```

Responsabilidades:

- Leer configuración desde variables de entorno.
- Validar que exista `BREVO_API_KEY`.
- Validar sender.
- Construir solicitudes.
- Enviar emails.
- Manejar errores.
- Devolver un resultado uniforme.
- No exponer la API Key.
- Permitir posteriormente cambiar de proveedor sin modificar toda la aplicación.

La interfaz conceptual debe parecerse a:

```javascript
await brevoService.sendTemplateEmail({
    to: {
        email: usuario.email,
        name: usuario.nombre
    },
    templateId: 15,
    params: {
        nombre: usuario.nombre,
        codigo: codigo
    }
});
```

---

# 11. Crear una capa de notificaciones

Además de `brevo.service.js`, se recomienda crear una capa superior:

```text
services/
├── brevo.service.js
└── notification.service.js
```

El resto de la aplicación debería utilizar:

```javascript
await notificationService.send({
    type: 'RECUPERAR_PASSWORD',
    email: usuario.email,
    name: usuario.nombre,
    params: {
        nombre: usuario.nombre,
        codigo: codigo
    }
});
```

El `notification.service.js` decide qué plantilla corresponde.

Ejemplo:

```text
RECUPERAR_PASSWORD
        ↓
templateId = 15
```

Esto evita que los controladores dependan directamente de los IDs de Brevo.

---

# 12. Ejemplo de diseño lógico

```javascript
const templates = {
    RECUPERAR_PASSWORD: 15,
    BIENVENIDA: 16,
    CONFIRMACION: 17,
    NOTIFICACION: 18
};
```

Luego:

```javascript
await notificationService.send({
    type: 'BIENVENIDA',
    email: usuario.email,
    name: usuario.nombre,
    params: {
        nombre: usuario.nombre
    }
});
```

No utilizar números de plantilla directamente repartidos por todo el proyecto.

---

# 13. Endpoint de prueba

Crear temporalmente un endpoint protegido para comprobar la integración.

Ejemplo conceptual:

```http
POST /api/notifications/test
```

Body:

```json
{
  "email": "correo-de-prueba@dominio.com"
}
```

El endpoint debe enviar una plantilla de prueba.

Una vez validada la integración, mantenerlo protegido por autenticación administrativa o eliminarlo si ya no es necesario.

Nunca crear un endpoint público que permita a cualquier persona utilizar Brevo para enviar correos arbitrarios.

---

# 14. Manejo de errores

El servicio debe diferenciar al menos:

### Configuración

```text
BREVO_API_KEY inexistente
Sender inexistente
Template inexistente
```

### Validación

```text
Email inválido
Template no válido
Parámetros faltantes
```

### Brevo

```text
401 / 403
400
429
5xx
```

### Red

```text
Timeout
Connection error
DNS error
```

El error no debe provocar que toda la aplicación se caiga.

Ejemplo conceptual:

```javascript
try {
    const result = await brevoService.sendTemplateEmail(data);
    return result;
} catch (error) {
    logger.error(error);
    return {
        success: false,
        error: 'No se pudo enviar el correo'
    };
}
```

No devolver la API Key ni información sensible en la respuesta HTTP.

---

# 15. Registro de envíos

Si el sistema ya tiene una tabla de notificaciones, utilizarla.

Si no existe y se necesita persistencia, proponer primero el cambio antes de modificar la base de datos.

No ejecutar:

```sql
DROP TABLE
```

No ejecutar:

```sql
CREATE TABLE
```

sobre tablas que ya existen simplemente para adaptar la integración.

Si faltan columnas, preparar un `ALTER TABLE` únicamente para las columnas necesarias.

Campos conceptuales útiles:

```text
id
usuario_id
email
tipo
fecha_envio
estado
brevo_message_id
error
```

Estados sugeridos:

```text
PENDIENTE
ENVIANDO
ENVIADO
ERROR
```

Los nombres definitivos deben adaptarse al esquema real del proyecto.

---

# 16. Message ID

Cuando Brevo devuelva un identificador del mensaje, guardarlo si existe.

Ejemplo conceptual:

```text
brevo_message_id
```

Esto permitirá posteriormente relacionar el envío con eventos de Brevo.

---

# 17. Control del límite diario

Implementar una estrategia que considere:

```text
BREVO_DAILY_LIMIT=300
```

La aplicación debería conocer cuántos envíos ha realizado durante el día.

Arquitectura recomendada:

```text
Solicitud de correo
       ↓
¿Se puede enviar?
       │
       ├── Sí → Brevo
       │
       └── No → PENDIENTE
```

No depender únicamente de la respuesta de Brevo para controlar la cuota.

Si ya existe una tabla de notificaciones, aprovecharla.

Si se necesita una tabla nueva para contabilizar cuota, primero analizar la estructura actual de la base de datos.

---

# 18. Cola de correos

Para una primera versión no es obligatorio implementar Redis, BullMQ u otra infraestructura.

Puede utilizarse inicialmente un registro de pendientes.

Arquitectura futura:

```text
Aplicación
    ↓
NotificationService
    ↓
Cola
    ↓
Worker
    ↓
Brevo
```

Esto permitirá controlar:

- límite diario,
- reintentos,
- errores temporales,
- prioridad,
- envío diferido.

No agregar esta infraestructura si el requerimiento actual no la necesita.

---

# 19. Webhooks, segunda etapa

Posteriormente se pueden implementar webhooks de Brevo.

Eventos útiles:

```text
delivered
opened
clicked
hardBounce
softBounce
blocked
```

Arquitectura:

```text
Brevo
   ↓
Webhook
   ↓
POST /api/webhooks/brevo
   ↓
Base de datos
```

Esto permitiría conocer el estado real del correo.

No es necesario para demostrar inicialmente que el envío funciona.

---

# 20. Seguridad

Reglas obligatorias:

### Nunca

```javascript
const API_KEY = 'xkeysib-...';
```

### Nunca

Enviar la API Key al frontend.

### Nunca

Guardar la API Key en Git.

### Nunca

Registrar la API Key en logs.

### Nunca

Permitir que el cliente defina:

```text
sender.email
api-key
endpoint
```

El backend debe controlar toda la configuración.

---

# 21. Dependencias

Se puede utilizar:

### Opción recomendada

SDK oficial de Brevo para Node.js:

```bash
npm install @getbrevo/brevo
```

O utilizar directamente `fetch`/HTTP contra:

```text
https://api.brevo.com/v3/smtp/email
```

No instalar ambas opciones sin motivo.

Si el proyecto ya dispone de un cliente HTTP estándar, reutilizarlo.

---

# 22. No romper el proyecto existente

Antes de modificar código:

1. Revisar `package.json`.
2. Revisar estructura actual.
3. Revisar `.env`.
4. Revisar configuración de base de datos.
5. Revisar rutas existentes.
6. Revisar servicios existentes.
7. Identificar si ya existe sistema de notificaciones.
8. Identificar si ya existe servicio de email.
9. Reutilizar componentes existentes cuando sea correcto.

No reemplazar código funcional innecesariamente.

No recrear la base de datos.

No eliminar datos existentes.

No cambiar autenticación, usuarios o permisos sin requerimiento.

---

# 23. Criterios de aceptación

La integración se considera correctamente implementada cuando:

### Configuración

- [ ] API Key está en `.env`.
- [ ] `.env` no se incluye en Git.
- [ ] Sender está configurado.
- [ ] Dominio está configurado para producción cuando corresponda.

### Código

- [ ] Existe `brevo.service.js`.
- [ ] Existe una capa de notificaciones.
- [ ] Los controladores no llaman directamente a la API de Brevo.
- [ ] No existen API Keys hardcodeadas.
- [ ] Los errores están controlados.

### Prueba

- [ ] Se puede enviar un email de prueba.
- [ ] El correo llega al destinatario.
- [ ] La plantilla funciona.
- [ ] Los parámetros dinámicos aparecen correctamente.
- [ ] Se obtiene y registra el identificador del mensaje cuando Brevo lo devuelve.

### Seguridad

- [ ] La API Key no aparece en frontend.
- [ ] La API Key no aparece en logs.
- [ ] El endpoint de prueba está protegido.

### Base de datos

- [ ] No se eliminaron tablas.
- [ ] No se recrearon tablas existentes.
- [ ] No se alteraron datos existentes.
- [ ] Cualquier cambio estructural se realizó mediante migración/ALTER controlado.

---

# 24. Flujo final esperado

```text
Usuario
   │
   ▼
Aplicación
   │
   ▼
Controller
   │
   ▼
NotificationService
   │
   ├── determina tipo de correo
   ├── determina templateId
   ├── valida destinatario
   └── verifica cuota
             │
             ▼
       BrevoService
             │
             ▼
        Brevo API
             │
             ▼
     Transactional Email
             │
             ▼
        Destinatario
```

---

# 25. Ejemplo de uso

El código de negocio debería verse aproximadamente así:

```javascript
await notificationService.send({
    type: 'RECUPERAR_PASSWORD',
    email: usuario.email,
    name: usuario.nombre,
    params: {
        nombre: usuario.nombre,
        codigo: codigoRecuperacion
    }
});
```

El controlador no debería conocer:

```text
https://api.brevo.com
api-key
headers
templateId
estructura HTTP
```

Todo eso debe permanecer dentro de los servicios.

---

# 26. Documentación oficial

Utilizar como referencia principal la documentación oficial de Brevo:

- Getting Started:
  https://developers.brevo.com/docs/getting-started

- Send transactional email:
  https://developers.brevo.com/docs/send-a-transactional-email

- Send transactional email API:
  https://developers.brevo.com/reference/send-transac-email

- Batch transactional emails:
  https://developers.brevo.com/docs/batch-send-transactional-emails

- API limits:
  https://developers.brevo.com/docs/api-limits

- Límites del plan Free:
  https://help.brevo.com/hc/es/articles/208580669-FAQ-Cu%C3%A1les-son-los-l%C3%ADmites-del-plan-Gratis

Cuando exista diferencia entre esta guía y la documentación actual de Brevo, verificar primero la documentación oficial actual.

---

# 27. Instrucción final para la IA desarrolladora

Antes de escribir código, analiza el proyecto existente.

No asumas nombres de tablas, rutas, controladores ni servicios.

Primero identifica:

```text
1. Framework
2. Versión de Node.js
3. package.json
4. estructura de carpetas
5. sistema de configuración
6. .env
7. base de datos
8. autenticación
9. sistema actual de notificaciones
10. rutas existentes
```

Después propone los cambios mínimos.

La prioridad es:

```text
NO ROMPER LO EXISTENTE
        ↓
INTEGRACIÓN AISLADA
        ↓
BREVO TRANSACCIONAL
        ↓
PLANTILLAS
        ↓
SEGURIDAD
        ↓
PRUEBA
        ↓
PREPARAR ESCALABILIDAD
```

No modificar partes no relacionadas con la integración.

No recrear la base de datos.

No eliminar datos.

No introducir dependencias innecesarias.

El objetivo de la primera versión es tener un envío transaccional Brevo Free **funcional, seguro, mantenible y desacoplado** del resto del sistema.
