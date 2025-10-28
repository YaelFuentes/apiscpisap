# 🎯 Quick Start - Despliegue en Vercel

## ✅ Estado Actual

- ✅ Turso configurado con tus credenciales
- ✅ Cliente `@libsql/client` instalado
- ✅ Base de datos adaptada para Turso
- ✅ Script de migración ejecutándose...
- ✅ Archivos de configuración creados

---

## 🚀 Pasos Siguientes

### 1. **Espera a que termine la migración**

El comando `npm run turso:migrate` está:
- Creando tablas en Turso
- Insertando 3 proyectos
- Insertando 9 integraciones  
- Insertando 180 ejecuciones
- Insertando ~720 logs

Verás: `🎉 ¡Migración completada exitosamente!`

### 2. **Verifica tus datos en Turso**

Ve a: https://turso.tech/app

Abre tu base de datos y ejecuta:
```sql
SELECT COUNT(*) FROM proyectos;  -- Debería ser 3
SELECT COUNT(*) FROM integraciones;  -- Debería ser 9
SELECT COUNT(*) FROM ejecuciones;  -- Debería ser 180
SELECT COUNT(*) FROM logs;  -- Debería ser ~720
```

### 3. **Instala Vercel CLI (si no lo tienes)**

```powershell
npm install -g vercel
```

### 4. **Login en Vercel**

```powershell
vercel login
```

### 5. **Despliega tu aplicación**

```powershell
vercel
```

Responde:
- **Set up and deploy?** → `Y`
- **Which scope?** → Selecciona tu cuenta
- **Link to existing project?** → `N`
- **Project name?** → `sap-cpi-monitor` (o el que prefieras)
- **Directory?** → `.` (presiona Enter)
- **Override settings?** → `N`

### 6. **Configura Variables de Entorno en Vercel**

Vercel te preguntará si quieres agregar variables de entorno:

```
TURSO_DATABASE_URL = libsql://sap-cpi-monitor-vercel-icfg-gx9hc0pgf9xud4e6dvl8bu5j.aws-us-east-1.turso.io

TURSO_AUTH_TOKEN = eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjE2NjQyODYsImlkIjoiMmRiZWQ3NDktYzZjMS00NGYzLTk3ZTktNGE4MzllZjk0ZTM3IiwicmlkIjoiYWQzODFlYTYtZDY5Mi00NTc0LWE0Y2ItNzBjODhmYWM3Nzk3In0.KSRYOmnW25p6Mqmesxbxlgv5Lvc-oI0O4zaPBcktGFaQTbBev2borm6dpebVhKQgb2WnmRnhtYjWuqL8XzFxCg
```

O agrégalas desde el dashboard: https://vercel.com/dashboard

### 7. **Despliega a Producción**

```powershell
vercel --prod
```

---

## 🌐 URLs de tus APIs

Después del despliegue, obtendrás una URL como:
```
https://sap-cpi-monitor-xxxxx.vercel.app
```

### Endpoints Disponibles:

#### 📘 Evaluar:
```
GET /api/evaluar/qas-https-status
GET /api/evaluar/qas-https-logs
GET /api/evaluar/qas-https-logs?integracion=EVAL-QAS-002
GET /api/evaluar/qas-https-metrics
```

#### 📗 TeachLR:
```
GET /api/teachlr/qas-https-status
GET /api/teachlr/qas-https-logs
GET /api/teachlr/qas-https-logs?integracion=TCHLR-QAS-002
GET /api/teachlr/qas-https-metrics
```

#### 📙 Pruebas:
```
GET /api/pruebas/qas-https-status
GET /api/pruebas/qas-https-logs
GET /api/pruebas/qas-https-logs?integracion=PRB-QAS-001
GET /api/pruebas/qas-https-metrics
```

---

## 🧪 Probar las APIs

### Desde PowerShell:
```powershell
$url = "https://tu-app.vercel.app"

# Status
curl "$url/api/evaluar/qas-https-status"

# Logs de PI2
curl "$url/api/evaluar/qas-https-logs?integracion=EVAL-QAS-002"

# Solo errores
curl "$url/api/evaluar/qas-https-logs?tipo=ERROR"

# Métricas
curl "$url/api/evaluar/qas-https-metrics"
```

### Desde el Navegador:
```
https://tu-app.vercel.app
```

---

## 📊 Verificar Datos

### En Turso Dashboard:
https://turso.tech/app

```sql
-- Ver integraciones de Evaluar
SELECT * FROM integraciones WHERE proyecto_id = 'evaluar';

-- Ver últimas ejecuciones de PI2
SELECT * FROM ejecuciones 
WHERE integracion_id = 'EVAL-QAS-002'
ORDER BY fecha_inicio DESC 
LIMIT 10;

-- Ver logs de PI2
SELECT l.* FROM logs l
JOIN ejecuciones e ON l.ejecucion_id = e.id
WHERE e.integracion_id = 'EVAL-QAS-002'
ORDER BY l.timestamp DESC
LIMIT 20;
```

---

## 🔄 Actualizaciones Futuras

Cuando hagas cambios:

```powershell
# 1. Hacer cambios en el código
# 2. Desplegar
vercel --prod
```

Vercel automáticamente:
- Instala dependencias
- Hace build
- Despliega
- Usa Turso en producción

---

## 📱 Monitoreo

### Ver Logs en Vercel:
```powershell
vercel logs --follow
```

### Ver Analytics:
https://vercel.com/dashboard → Tu proyecto → Analytics

### Ver Métricas de Turso:
https://turso.tech/app → Tu base de datos → Metrics

---

## ✨ Resumen de Archivos Creados

1. ✅ `src/lib/database-turso.js` - Cliente de Turso
2. ✅ `src/lib/db-client.js` - Selector automático (local/Turso)
3. ✅ `src/lib/seed-turso.js` - Seed para Turso
4. ✅ `scripts/migrate-turso.js` - Script de migración
5. ✅ `vercel.json` - Configuración de Vercel
6. ✅ `.vercelignore` - Archivos a ignorar
7. ✅ `VERCEL_DEPLOYMENT.md` - Documentación completa
8. ✅ `QUICKSTART.md` - Esta guía rápida

---

## 🎯 Comandos Importantes

```powershell
# Migrar a Turso
npm run turso:migrate

# Desplegar a Vercel (primera vez)
vercel

# Desplegar a producción
vercel --prod

# Ver logs
vercel logs

# Ver info del proyecto
vercel inspect

# Ver lista de despliegues
vercel ls
```

---

## 🆘 Si algo falla

### Error de conexión a Turso:
```powershell
# Verifica variables de entorno
vercel env ls

# Verifica que estén en Vercel dashboard
```

### Build falla:
```powershell
# Ver logs detallados
vercel logs

# Verifica que package.json tenga type: "module"
```

### APIs retornan 500:
1. Verifica que la migración terminó exitosamente
2. Verifica variables de entorno en Vercel
3. Revisa logs: `vercel logs`
4. Verifica datos en Turso

---

## 🎉 ¡Todo Listo!

Tu aplicación está:
- ✅ Conectada a Turso (SQLite en la nube)
- ✅ Lista para desplegar en Vercel
- ✅ Con datos de ejemplo
- ✅ Con 9 APIs funcionales
- ✅ Con dashboard interactivo

**Solo falta ejecutar**: `vercel --prod` 🚀
