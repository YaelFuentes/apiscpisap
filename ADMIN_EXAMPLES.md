# 🎯 Ejemplos Prácticos - Panel de Administración

## 📋 Índice de Ejemplos

1. [Identificar API Disponible para PI3](#ejemplo-1-identificar-api-disponible-para-pi3)
2. [Crear PI3 en Evaluar](#ejemplo-2-crear-pi3-en-evaluar)
3. [Crear API para Webhook de SAP](#ejemplo-3-crear-api-para-webhook-de-sap)
4. [Limpiar Base de Datos Grande](#ejemplo-4-limpiar-base-de-datos-grande)
5. [Crear API para XML de SAP](#ejemplo-5-crear-api-para-xml-de-sap)

---

## Ejemplo 1: Identificar API Disponible para PI3

### Escenario:
Quieres saber qué API de Evaluar puedes usar sin conflictos para una nueva integración PI3.

### Pasos:

1. **Abre el panel de Admin**:
   ```
   http://localhost:3000
   Click en "⚙️ Admin"
   ```

2. **Busca en "APIs Disponibles"**:
   - Mira las APIs de Evaluar
   - Busca las que están en **VERDE** (disponibles)

3. **Ejemplo Visual**:
   ```
   🟥 /api/evaluar/qas-https-status    [En uso] [📋 Copiar]
      Última ejecución: 28/10/2025, 12:30:45
   
   🟩 /api/evaluar/qas-https-logs       [Disponible] [📋 Copiar]
   
   🟩 /api/evaluar/qas-https-metrics    [Disponible] [📋 Copiar]
   ```

4. **Copiar URL**:
   - Click en "📋 Copiar" de la API verde
   - URL copiada al portapapeles

5. **Resultado**:
   ✅ Sabes que `/api/evaluar/qas-https-logs` está disponible  
   ✅ Puedes usarla para PI3 sin conflictos

---

## Ejemplo 2: Crear PI3 en Evaluar

### Escenario:
Necesitas agregar "SAP PI - Eliminar Usuario" como PI3 en el proyecto Evaluar.

### Pasos:

1. **Ir a Gestión de Integraciones**:
   ```
   Admin > Gestión de Integraciones
   Click en "+ Nueva Integración"
   ```

2. **Llenar Formulario**:
   ```
   Nombre: SAP PI - Eliminar Usuario
   Descripción: Eliminación lógica de usuarios en SAP
   Proyecto: Evaluar ▼
   Criticidad: Alta ▼
   ```

3. **Crear**:
   - Click en botón "Crear"
   - Espera confirmación

4. **Resultado**:
   ```
   ✅ Integración creada:
   ID: EVALU-QAS-003
   Nombre: SAP PI - Eliminar Usuario
   ```

5. **Verificar**:
   - Ve a "📊 Monitor"
   - Selecciona "Evaluar"
   - Verás la nueva integración PI3

6. **Usar en API**:
   ```bash
   # Ahora puedes usarla
   curl "http://localhost:3000/api/evaluar/qas-https-logs?integracion=EVALU-QAS-003"
   ```

---

## Ejemplo 3: Crear API para Webhook de SAP

### Escenario:
Necesitas recibir notificaciones de SAP en formato JSON.

### Pasos:

1. **Crear API Genérica**:
   ```
   Admin > APIs Disponibles > "+ Nueva API"
   ```

2. **Configurar**:
   ```
   Nombre: sap-webhook
   Descripción: Recibe notificaciones de SAP PI
   Formato: JSON ▼
   ```

3. **Crear API**:
   - Click "Crear API"
   - Sistema muestra: "API creada: /api/generic/sap-webhook"

4. **Copiar URL**:
   - La API aparece en el panel
   - Click "📋 Copiar"

5. **Configurar en SAP**:
   ```
   URL: http://tu-dominio.vercel.app/api/generic/sap-webhook
   Método: POST
   Content-Type: application/json
   ```

6. **Probar**:
   ```bash
   curl -X POST http://localhost:3000/api/generic/sap-webhook \
     -H "Content-Type: application/json" \
     -d '{
       "evento": "usuario_creado",
       "usuario_id": 12345,
       "nombre": "Juan Pérez",
       "timestamp": "2025-10-28T12:00:00Z"
     }'
   ```

7. **Respuesta**:
   ```json
   {
     "success": true,
     "mensaje": "Datos recibidos exitosamente",
     "correlationId": "CORR-API-SAP-WEBHOOK-1730123456789",
     "formato": "json",
     "timestamp": "2025-10-28T12:30:45.123Z"
   }
   ```

8. **Consultar Ejecuciones**:
   ```bash
   curl http://localhost:3000/api/generic/sap-webhook
   ```

9. **Ver en Dashboard**:
   - Ve a "📋 Logs"
   - Filtra por integración "API-SAP-WEBHOOK"
   - Verás todos los datos recibidos

---

## Ejemplo 4: Limpiar Base de Datos Grande

### Escenario:
Tu base de datos tiene 15,000 logs y ocupa 25 MB. Quieres liberar espacio.

### Análisis Inicial:

1. **Ver Estadísticas**:
   ```
   Admin > Panel Superior
   
   ┌──────────────┬──────────────┬──────────────┬──────────────┐
   │ Total APIs   │ Integraciones│ Logs Totales │ Tamaño BD    │
   │     12       │      12      │   15,000     │   25.4 MB    │
   └──────────────┴──────────────┴──────────────┴──────────────┘
   ```

2. **Decidir Período**:
   - Logs > 7 días: Elimina demasiado (desarrollo activo)
   - Logs > 30 días: ✅ Balance ideal
   - Logs > 90 días: Muy conservador

### Pasos de Limpieza:

3. **Ejecutar Limpieza**:
   ```
   Admin > Limpieza de Datos
   Click en "Limpiar logs > 30 días"
   ```

4. **Confirmar**:
   ```
   ⚠️ ¿Eliminar logs mayores a 30 días?
   [Aceptar] [Cancelar]
   ```
   - Click "Aceptar"

5. **Resultado**:
   ```
   ✅ Eliminados: 12,500 logs y 3,200 ejecuciones mayores a 30 días
   ```

6. **Verificar Nuevo Tamaño**:
   ```
   ┌──────────────┬──────────────┬──────────────┬──────────────┐
   │ Total APIs   │ Integraciones│ Logs Totales │ Tamaño BD    │
   │     12       │      12      │   2,500      │   8.2 MB     │
   └──────────────┴──────────────┴──────────────┴──────────────┘
   ```

7. **Resultado**:
   - ✅ Espacio liberado: 17.2 MB (67%)
   - ✅ Logs conservados: 2,500 (últimos 30 días)
   - ✅ Sistema más rápido

---

## Ejemplo 5: Crear API para XML de SAP

### Escenario:
SAP envía datos en formato XML y necesitas una API para recibirlos.

### Pasos:

1. **Crear API XML**:
   ```
   Admin > "+ Nueva API"
   
   Nombre: sap-xml-receiver
   Descripción: Recibe documentos XML de SAP
   Formato: XML ▼
   ```

2. **Crear**:
   - Click "Crear API"
   - URL generada: `/api/generic/sap-xml-receiver`

3. **Enviar XML desde SAP**:
   ```xml
   POST http://localhost:3000/api/generic/sap-xml-receiver
   Content-Type: application/xml
   
   <?xml version="1.0" encoding="UTF-8"?>
   <notificacion>
     <evento>orden_creada</evento>
     <orden_id>ORD-12345</orden_id>
     <cliente>
       <id>CLI-789</id>
       <nombre>Empresa XYZ</nombre>
     </cliente>
     <monto>1500.00</monto>
     <moneda>USD</moneda>
     <timestamp>2025-10-28T12:00:00Z</timestamp>
   </notificacion>
   ```

4. **Respuesta de la API**:
   ```json
   {
     "success": true,
     "mensaje": "Datos recibidos exitosamente",
     "correlationId": "CORR-API-SAP-XML-RECEIVER-1730123456789",
     "formato": "xml",
     "timestamp": "2025-10-28T12:30:45.123Z"
   }
   ```

5. **Consultar Ejecuciones**:
   ```bash
   curl http://localhost:3000/api/generic/sap-xml-receiver
   ```

   ```json
   {
     "api": "sap-xml-receiver",
     "apiId": "API-SAP-XML-RECEIVER",
     "formato": "xml",
     "ejecuciones": [
       {
         "id": 1,
         "estado": "success",
         "fecha_inicio": "2025-10-28T12:30:45.123Z",
         "mensajes_procesados": 1,
         "correlation_id": "CORR-API-SAP-XML-RECEIVER-1730123456789"
       }
     ],
     "total": 1
   }
   ```

6. **Ver Logs**:
   ```
   Dashboard > 📋 Logs
   Filtrar por: API-SAP-XML-RECEIVER
   
   Verás:
   ✅ SUCCESS - Datos recibidos en formato xml
   ```

---

## 🎯 Caso Completo: Setup para Proyecto Nuevo

### Escenario:
Necesitas configurar todo para un nuevo proyecto "Facturación".

### Paso 1: Crear Integraciones

```
Admin > "+ Nueva Integración"

1. Nombre: SAP Facturación - Crear Factura
   Proyecto: Evaluar
   Criticidad: Alta
   → ID generado: EVALU-QAS-004

2. Nombre: SAP Facturación - Consultar Estado
   Proyecto: Evaluar
   Criticidad: Media
   → ID generado: EVALU-QAS-005

3. Nombre: SAP Facturación - Anular Factura
   Proyecto: Evaluar
   Criticidad: Alta
   → ID generado: EVALU-QAS-006
```

### Paso 2: Crear APIs Genéricas

```
Admin > "+ Nueva API"

1. Nombre: facturacion-webhook
   Formato: JSON
   → URL: /api/generic/facturacion-webhook

2. Nombre: facturacion-xml
   Formato: XML
   → URL: /api/generic/facturacion-xml
```

### Paso 3: Verificar APIs Disponibles

```
Admin > APIs Disponibles

Buscar APIs en VERDE:
✅ /api/evaluar/qas-https-logs
✅ /api/generic/facturacion-webhook
✅ /api/generic/facturacion-xml
```

### Paso 4: Copiar URLs

```
Para cada API verde:
1. Click "📋 Copiar"
2. Pegar en documento de configuración SAP
```

### Paso 5: Probar

```bash
# Test 1: Crear factura (webhook JSON)
curl -X POST http://localhost:3000/api/generic/facturacion-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "crear_factura",
    "cliente_id": "CLI-123",
    "monto": 500.00,
    "items": [...]
  }'

# Test 2: Consultar logs
curl "http://localhost:3000/api/evaluar/qas-https-logs?integracion=EVALU-QAS-004"

# Test 3: Ver en dashboard
# http://localhost:3000 > Evaluar > Monitor
```

### Resultado Final:

✅ 3 integraciones creadas  
✅ 2 APIs genéricas configuradas  
✅ URLs copiadas para SAP  
✅ Todo listo para recibir datos

---

## 💡 Tips Prácticos

### Tip 1: Nombres de APIs
```
❌ Mal: "Mi API 123" → /api/generic/mi-api-123
✅ Bien: "webhook-sap" → /api/generic/webhook-sap

✅ Usa guiones, no espacios
✅ Todo en minúsculas
✅ Descriptivo y corto
```

### Tip 2: Limpiar Regularmente
```
Desarrollo: Limpiar cada 7 días
Testing: Limpiar cada 30 días
Producción: Limpiar cada 90 días

Programar con cron:
0 0 * * 0 curl -X POST http://localhost:3000/api/admin/clean-logs -d '{"days":30}'
```

### Tip 3: Backup Antes de Eliminar
```powershell
# Backup local
Copy-Item ".\data\sap-cpi-monitor.db" ".\backups\backup-$(Get-Date -Format 'yyyyMMdd').db"

# Luego limpiar
Admin > Limpiar logs > 30 días
```

### Tip 4: Identificar APIs Rápido
```
Color = Estado
🟥 Rojo = Usada recientemente → Evitar
🟩 Verde = Disponible → Usar sin problemas
```

### Tip 5: Organizar Integraciones
```
Criticidad:
- Alta: Procesos críticos del negocio
- Media: Procesos importantes pero no críticos
- Baja: Testing y validaciones
```

---

## 🚀 Automatización con Scripts

### Script: Limpiar BD Semanalmente

```javascript
// scripts/weekly-cleanup.js
import fetch from 'node-fetch';

async function cleanupWeekly() {
  const res = await fetch('http://localhost:3000/api/admin/clean-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ days: 30 })
  });
  
  const data = await res.json();
  console.log(`✅ Limpieza completada: ${data.deleted} logs eliminados`);
}

cleanupWeekly();
```

```powershell
# Ejecutar cada domingo
node scripts/weekly-cleanup.js
```

---

**¡Ejemplos listos para usar!** 🎉

Copia y adapta estos ejemplos a tus necesidades específicas.
