# 🎛️ Panel de Administración - Documentación

## 📋 Índice

1. [Acceso al Panel](#acceso-al-panel)
2. [Panel de APIs Disponibles](#panel-de-apis-disponibles)
3. [Gestión de Integraciones](#gestión-de-integraciones)
4. [Limpieza de Datos](#limpieza-de-datos)
5. [APIs Genéricas](#apis-genéricas)
6. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🚀 Acceso al Panel

### Desde la UI:

1. Abre tu aplicación: `http://localhost:3000`
2. Haz clic en la pestaña **⚙️ Admin**
3. Verás 4 secciones principales:
   - **Estadísticas generales**
   - **APIs Disponibles**
   - **Gestión de Integraciones**
   - **Limpieza de Datos**

---

## 🔌 Panel de APIs Disponibles

### Características:

- ✅ **Visualización de todas las APIs** del sistema
- ✅ **Estado visual**:
  - 🟥 **Rojo**: API en uso (recibió peticiones en las últimas 24 horas)
  - 🟩 **Verde**: API disponible (sin uso reciente)
- ✅ **Botón de copiar**: Copia la URL completa al portapapeles
- ✅ **Última ejecución**: Muestra cuándo fue la última petición

### APIs Incluidas:

#### Evaluar:
```
/api/evaluar/qas-https-status
/api/evaluar/qas-https-logs
/api/evaluar/qas-https-metrics
```

#### TeachLR:
```
/api/teachlr/qas-https-status
/api/teachlr/qas-https-logs
/api/teachlr/qas-https-metrics
```

#### Pruebas:
```
/api/pruebas/qas-https-status
/api/pruebas/qas-https-logs
/api/pruebas/qas-https-metrics
```

#### APIs Genéricas (creadas dinámicamente):
```
/api/generic/[nombre-api]
```

### Cómo Usar:

1. **Ver todas las APIs**: Automáticamente se cargan al abrir el panel
2. **Copiar URL**: Click en "📋 Copiar" para copiar al portapapeles
3. **Identificar disponibilidad**: 
   - Verde = Lista para usar
   - Rojo = Ya está siendo usada

---

## 🔗 Gestión de Integraciones

### Crear Nueva Integración:

1. Click en **"+ Nueva Integración"**
2. Llena el formulario:
   - **Nombre**: Nombre descriptivo
   - **Descripción**: Detalles opcionales
   - **Proyecto**: Evaluar, TeachLR o Pruebas
   - **Criticidad**: Baja, Media o Alta
3. Click en **"Crear"**

#### Ejemplo:
```
Nombre: SAP PI - Enviar Notificaciones
Descripción: Integración para enviar notificaciones push
Proyecto: Evaluar
Criticidad: Alta
```

Se generará automáticamente un ID único como: `EVALU-QAS-003`

### Eliminar Integración:

1. Busca la integración en la lista
2. Click en **"🗑️ Eliminar"**
3. Confirma la eliminación

⚠️ **IMPORTANTE**: Esto eliminará:
- La integración
- Todas sus ejecuciones (CASCADE)
- Todos sus logs (CASCADE)
- Esta acción **NO se puede deshacer**

### Ver Integraciones:

Cada integración muestra:
- **ID y Nombre**
- **Descripción**
- **Proyecto** (badge azul)
- **Criticidad** (badge morado)
- **Botón de eliminar**

---

## 🧹 Limpieza de Datos

### Opciones Disponibles:

#### 1. Limpiar logs > 7 días
- Elimina logs mayores a 1 semana
- Mantiene datos recientes para análisis
- **Recomendado**: Para sistemas en desarrollo

#### 2. Limpiar logs > 30 días
- Elimina logs mayores a 1 mes
- Balance entre historial y espacio
- **Recomendado**: Para sistemas en producción

#### 3. Limpiar logs > 90 días
- Elimina logs mayores a 3 meses
- Mantiene historial largo
- **Recomendado**: Para auditoría

### Cómo Usar:

1. Click en el botón según los días que quieras conservar
2. Confirma la acción en el diálogo
3. El sistema muestra cuántos registros fueron eliminados

### Ejemplo de Resultado:
```
Eliminados: 245 logs y 67 ejecuciones mayores a 30 días
```

---

## 🌐 APIs Genéricas

### ¿Qué son?

APIs creadas dinámicamente desde la UI que pueden recibir datos en cualquier formato (JSON, XML, o texto plano).

### Crear API Genérica:

1. En el panel "APIs Disponibles", click en **"+ Nueva API"**
2. Llena el formulario:
   - **Nombre**: Nombre sin espacios (se convierte a URL)
   - **Descripción**: Propósito de la API
   - **Formato**: JSON, XML o Cualquiera
3. Click en **"Crear API"**

#### Ejemplo:
```
Nombre: webhook-sap
Descripción: Recibe notificaciones de SAP
Formato: JSON
```

Se creará: `/api/generic/webhook-sap`

### Usar API Genérica:

#### Enviar Datos (POST):

##### JSON:
```bash
curl -X POST http://localhost:3000/api/generic/webhook-sap \
  -H "Content-Type: application/json" \
  -d '{"evento": "usuario_creado", "id": 123}'
```

##### XML:
```bash
curl -X POST http://localhost:3000/api/generic/webhook-sap \
  -H "Content-Type: application/xml" \
  -d '<datos><evento>usuario_creado</evento><id>123</id></datos>'
```

##### Respuesta:
```json
{
  "success": true,
  "mensaje": "Datos recibidos exitosamente",
  "correlationId": "CORR-API-WEBHOOK-SAP-1730123456789",
  "formato": "json",
  "timestamp": "2025-10-28T12:30:45.123Z"
}
```

#### Consultar Ejecuciones (GET):

```bash
curl http://localhost:3000/api/generic/webhook-sap
```

**Respuesta:**
```json
{
  "api": "webhook-sap",
  "apiId": "API-WEBHOOK-SAP",
  "formato": "json",
  "ejecuciones": [
    {
      "id": 1,
      "estado": "success",
      "fecha_inicio": "2025-10-28T12:30:45.123Z",
      "mensajes_procesados": 1,
      "correlation_id": "CORR-API-WEBHOOK-SAP-1730123456789"
    }
  ],
  "total": 1
}
```

### Características de APIs Genéricas:

- ✅ **Creación dinámica**: No requiere código manual
- ✅ **Multi-formato**: Acepta JSON, XML, texto
- ✅ **Registro automático**: Cada petición se guarda en la BD
- ✅ **Trazabilidad**: Correlation IDs únicos
- ✅ **Consulta histórica**: GET para ver ejecuciones
- ✅ **Integración completa**: Aparecen en el panel de Admin

---

## 📊 Estadísticas

El panel muestra:

### Total APIs
- Cantidad de endpoints disponibles
- Incluye fijas + genéricas

### Integraciones
- Total de integraciones configuradas
- Distribuidas por proyecto

### Logs Totales
- Cantidad total de logs en la BD
- Incluye todos los tipos (SUCCESS, ERROR, WARNING, INFO)

### Tamaño BD
- Espacio ocupado por la base de datos
- Solo disponible en SQLite local
- En Turso muestra "Cloud DB"

---

## 🎯 Casos de Uso

### Caso 1: Crear API para Webhook de SAP

```
Objetivo: Recibir notificaciones de SAP PI

Pasos:
1. Admin > "+ Nueva API"
2. Nombre: "sap-notifications"
3. Formato: JSON
4. Crear

URL generada: /api/generic/sap-notifications

Uso en SAP:
POST http://tu-dominio.vercel.app/api/generic/sap-notifications
Content-Type: application/json
Body: {
  "tipo": "notificacion",
  "mensaje": "Usuario creado",
  "timestamp": "2025-10-28T12:00:00Z"
}
```

### Caso 2: Limpiar Base de Datos

```
Escenario: La BD tiene 10,000 logs y ocupa mucho espacio

Solución:
1. Admin > Limpieza de Datos
2. Click "Limpiar logs > 30 días"
3. Confirmar

Resultado:
- Eliminados: 7,500 logs antiguos
- Espacio liberado: ~15 MB
- Logs recientes conservados: 2,500
```

### Caso 3: Agregar Nueva Integración

```
Necesidad: Agregar "SAP PI - Eliminar Usuario" a Evaluar

Pasos:
1. Admin > "+ Nueva Integración"
2. Nombre: "SAP PI - Eliminar Usuario"
3. Descripción: "Eliminación lógica de usuarios"
4. Proyecto: Evaluar
5. Criticidad: Alta
6. Crear

Resultado:
- ID: EVALU-QAS-003
- Aparece en Monitor de Evaluar
- Lista para recibir ejecuciones
```

### Caso 4: Identificar APIs Disponibles

```
Situación: Necesitas saber qué APIs puedes usar sin conflictos

Solución:
1. Admin > Panel de APIs Disponibles
2. Buscar APIs en VERDE (disponibles)
3. Copiar URL con "📋 Copiar"
4. Usar en tu integración

Ejemplo:
✅ /api/pruebas/qas-https-status (Verde - Disponible)
❌ /api/evaluar/qas-https-status (Rojo - En uso)
```

---

## 📱 Acceso desde API REST

### Obtener Estado de APIs:
```bash
GET /api/admin/apis-status
```

### Listar Integraciones:
```bash
GET /api/admin/integraciones
```

### Crear Integración:
```bash
POST /api/admin/integraciones
Content-Type: application/json

{
  "nombre": "Nueva Integración",
  "descripcion": "Descripción",
  "proyecto_id": "evaluar",
  "criticidad": "media",
  "intervalo": 600000
}
```

### Eliminar Integración:
```bash
DELETE /api/admin/integraciones?id=EVALU-QAS-003
```

### Limpiar Logs:
```bash
POST /api/admin/clean-logs
Content-Type: application/json

{
  "days": 30
}
```

### Crear API Genérica:
```bash
POST /api/admin/create-api
Content-Type: application/json

{
  "nombre": "mi-api",
  "descripcion": "Mi API personalizada",
  "formato": "json"
}
```

### Obtener Estadísticas:
```bash
GET /api/admin/stats
```

---

## ⚠️ Consideraciones Importantes

### Seguridad:
- ⚠️ Actualmente **NO hay autenticación** en el panel de Admin
- 🔒 Se recomienda agregar autenticación antes de producción
- 🔐 Considera usar middleware para proteger `/api/admin/*`

### Rendimiento:
- 🚀 La limpieza de logs es **instantánea** para SQLite local
- ☁️ En Turso puede tardar unos segundos con grandes volúmenes
- 📊 Monitorea el tamaño de la BD regularmente

### Respaldos:
- 💾 **Siempre haz backup** antes de eliminar datos
- ⏰ Programa limpiezas automáticas con cron jobs
- 🔄 Considera exportar datos importantes antes de limpiar

---

## 🎨 Personalización

### Cambiar Colores de Estado:

En `src/components/AdminPanel.js`:

```javascript
// API en uso (rojo)
className="bg-red-50 dark:bg-red-900/20 border-red-500"

// API disponible (verde)
className="bg-green-50 dark:bg-green-900/20 border-green-500"
```

### Agregar Más Opciones de Limpieza:

```javascript
<button
  onClick={() => handleCleanLogs(180)}
  className="px-4 py-2 bg-orange-500 text-white rounded-lg"
>
  Limpiar logs > 180 días
</button>
```

---

## 🚀 Próximas Mejoras

- [ ] Autenticación con usuarios y roles
- [ ] Exportar logs a CSV/JSON
- [ ] Programar limpiezas automáticas
- [ ] Gráficos de uso de APIs
- [ ] Alertas cuando APIs no reciben datos
- [ ] Backup automático antes de limpiar
- [ ] Restaurar integraciones eliminadas (papelera)
- [ ] API para desactivar/activar integraciones

---

## 📞 Soporte

Si tienes problemas con el panel de administración:

1. Revisa la consola del navegador (F12)
2. Verifica los logs del servidor
3. Consulta `DATABASE.md` para estructura de BD
4. Revisa permisos de escritura en el directorio

---

**¡Panel de Administración listo para usar!** 🎉
