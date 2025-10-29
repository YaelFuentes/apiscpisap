# Guía de Configuración CPI para Enviar Logs

## Problema Común: Error de Tipo de Datos

Si recibes el error:
```
org.apache.camel.InvalidPayloadException: No body available of type: java.io.InputStream
Type Converter failed to convert from type: org.codehaus.groovy.runtime.GStringImpl
```

Significa que estás intentando enviar un **String de Groovy** directamente, pero CPI necesita convertirlo primero.

---

## Solución: Usar Content Modifier

### Paso 1: Crear el JSON en Groovy Script

```groovy
import com.sap.gateway.ip.core.customdev.util.Message
import groovy.json.JsonOutput

def Message processData(Message message) {
    try {
        // Obtener información del mensaje
        def headers = message.getHeaders()
        def properties = message.getProperties()
        def body = message.getBody(String.class)
        
        // Capturar properties personalizadas (filtrar las de Camel)
        def customProperties = [:]
        properties.each { key, value ->
            if (!key.startsWith("CamelHttp") && !key.startsWith("Camel")) {
                customProperties[key] = value?.toString()
            }
        }
        
        // Crear el objeto de log
        def logData = [
            integracionId: 'TU-INTEGRACION-ID',
            proyecto: 'tu-proyecto',
            mensaje: 'Mensaje procesado exitosamente',
            nivel: 'SUCCESS',
            detalles: [
                timestamp: new Date().format("yyyy-MM-dd'T'HH:mm:ss'Z'"),
                bodySize: body?.length() ?: 0
            ],
            properties: customProperties,
            headers: headers.collectEntries { k, v -> [k, v?.toString()] }
        ]
        
        // Convertir a JSON String
        def jsonString = JsonOutput.toJson(logData)
        
        // IMPORTANTE: Guardar en una propiedad, NO en el body directamente
        message.setProperty("logPayload", jsonString)
        
        return message
        
    } catch (Exception e) {
        // En caso de error, crear log de error
        def errorLog = [
            integracionId: 'TU-INTEGRACION-ID',
            proyecto: 'tu-proyecto',
            mensaje: 'Error en procesamiento: ' + e.getMessage(),
            nivel: 'ERROR',
            detalles: [
                timestamp: new Date().format("yyyy-MM-dd'T'HH:mm:ss'Z'"),
                error: e.toString()
            ]
        ]
        
        message.setProperty("logPayload", JsonOutput.toJson(errorLog))
        return message
    }
}
```

### Paso 2: Agregar Content Modifier

Después del Groovy Script, antes del HTTP Adapter:

**Content Modifier - Message Body**
- Type: `Expression`
- Body: `${property.logPayload}`

**Content Modifier - Message Header**
- Header Name: `Content-Type`
- Type: `Constant`
- Value: `application/json`

### Paso 3: Configurar HTTP Receiver Adapter

- **Address**: `https://apiscpisap.vercel.app/api/cpi/receive-log`
- **Method**: `POST`
- **Authentication**: `None` (o según tu configuración)
- **Request Headers**:
  - `Content-Type`: `application/json`

---

## Configuración del Exception Handler

Para que los errores también se envíen a la API:

### 1. En el Exception Subprocess - Groovy Script:

```groovy
import com.sap.gateway.ip.core.customdev.util.Message
import groovy.json.JsonOutput

def Message processData(Message message) {
    // Obtener información del error
    def errorMsg = message.getProperty("CamelExceptionCaught")?.getMessage() ?: "Error desconocido"
    def errorClass = message.getProperty("CamelExceptionCaught")?.getClass()?.getName() ?: "Unknown"
    
    // Crear log de error
    def errorLog = [
        integracionId: 'TU-INTEGRACION-ID',
        proyecto: 'tu-proyecto',
        mensaje: 'Se ha producido un error en la integración',
        nivel: 'ERROR',
        detalles: [
            timestamp: new Date().format("yyyy-MM-dd'T'HH:mm:ss'Z'"),
            errorMessage: errorMsg,
            errorClass: errorClass,
            headers: message.getHeaders().collectEntries { k, v -> [k, v.toString()] }
        ]
    ]
    
    // IMPORTANTE: Guardar en propiedad
    message.setProperty("errorLogPayload", JsonOutput.toJson(errorLog))
    
    return message
}
```

### 2. Content Modifier en Exception Handler:

**Message Body**
- Type: `Expression`
- Body: `${property.errorLogPayload}`

**Message Header**
- Header Name: `Content-Type`
- Type: `Constant`
- Value: `application/json`

### 3. HTTP Receiver en Exception Handler:

Misma configuración que antes.

---

## Estructura JSON Esperada por la API

```json
{
  "integracionId": "TEACH-QAS-001",
  "proyecto": "teachlr",
  "mensaje": "Tu mensaje aquí",
  "nivel": "SUCCESS",
  "detalles": {
    "timestamp": "2024-01-01T12:00:00Z",
    "cualquier": "otro campo"
  },
  "properties": {
    "correlationId": "ABC-123",
    "businessKey": "ORDER-456",
    "customField": "valor personalizado"
  },
  "headers": {
    "Content-Type": "application/json",
    "X-Custom-Header": "valor"
  }
}
```

### Campos:

- `integracionId` (opcional): ID único de tu integración
- `proyecto` (opcional): Nombre del proyecto
- `mensaje` (requerido): Mensaje principal del log
- `nivel` (opcional): SUCCESS, INFO, WARNING, ERROR (se auto-detecta si no se especifica)
- `detalles` (opcional): Objeto con información adicional
- `properties` (opcional): Properties del mensaje de CPI que quieras guardar
- `headers` (opcional): Headers del mensaje de CPI

**Nota**: La API también captura automáticamente todos los headers HTTP de la petición.

---

## Verificación

### 1. Probar Health Check:
```bash
curl https://apiscpisap.vercel.app/api/health
```

### 2. Probar envío manual:
```bash
curl -X POST https://apiscpisap.vercel.app/api/cpi/receive-log \
  -H "Content-Type: application/json" \
  -d '{
    "integracionId": "TEST-001",
    "proyecto": "test",
    "mensaje": "Prueba desde curl",
    "nivel": "INFO"
  }'
```

### 3. Verificar logs en la plataforma:
- Accede a https://apiscpisap.vercel.app
- Ve a la pestaña "Logs en Tiempo Real"
- Activa "Auto-actualizar" (cada 1 segundo)

---

## Checklist de Debugging

- [ ] El Groovy Script guarda el JSON en una **propiedad** (no en el body directamente)
- [ ] Hay un **Content Modifier** después del Groovy Script
- [ ] El Content Modifier lee `${property.logPayload}`
- [ ] El header `Content-Type` está configurado como `application/json`
- [ ] La URL del HTTP Adapter es correcta
- [ ] El método HTTP es POST
- [ ] El mismo flujo está en el Success Handler Y en el Exception Handler

---

## Contacto

Si sigues teniendo problemas, revisa:
1. Los logs de Vercel en https://vercel.com/[tu-proyecto]/logs
2. El endpoint de health: https://apiscpisap.vercel.app/api/health
3. Los logs en tiempo real en la plataforma
