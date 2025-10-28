# 🚀 Guía de Despliegue en Vercel

## ✅ Pasos Completados

- ✅ Instalado `@libsql/client` para conectar con Turso
- ✅ Creado adaptador de base de datos para Turso
- ✅ Configurado `.env.local` con credenciales
- ✅ Creado script de migración
- ✅ Configurado `vercel.json`
- ✅ Configurado `.vercelignore`

---

## 📋 Pasos para Desplegar

### 1. **Migrar Datos a Turso**

Primero, vamos a poblar tu base de datos Turso con los datos iniciales:

```powershell
npm run turso:migrate
```

Este comando:
- ✅ Crea todas las tablas en Turso
- ✅ Inserta 3 proyectos
- ✅ Inserta 9 integraciones
- ✅ Inserta 180 ejecuciones
- ✅ Inserta ~720 logs

### 2. **Instalar Vercel CLI**

Si no lo tienes instalado:

```powershell
npm install -g vercel
```

### 3. **Login en Vercel**

```powershell
vercel login
```

### 4. **Configurar Variables de Entorno en Vercel**

Hay dos formas:

#### Opción A: Desde la CLI (Automático)
```powershell
vercel env add TURSO_DATABASE_URL
# Pegar: libsql://sap-cpi-monitor-vercel-icfg-gx9hc0pgf9xud4e6dvl8bu5j.aws-us-east-1.turso.io

vercel env add TURSO_AUTH_TOKEN
# Pegar tu token completo
```

#### Opción B: Desde el Dashboard de Vercel
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto (o créalo)
3. Ve a **Settings** > **Environment Variables**
4. Agrega:
   - `TURSO_DATABASE_URL`: `libsql://sap-cpi-monitor-vercel-icfg-gx9hc0pgf9xud4e6dvl8bu5j.aws-us-east-1.turso.io`
   - `TURSO_AUTH_TOKEN`: `tu-token-completo`

### 5. **Desplegar a Vercel**

#### Primera vez (crear proyecto):
```powershell
vercel
```

Te preguntará:
- **Set up and deploy?** → Yes
- **Which scope?** → Tu cuenta
- **Link to existing project?** → No
- **Project name?** → sap-cpi-monitor (o el que prefieras)
- **Directory?** → ./
- **Override settings?** → No

#### Despliegues siguientes:
```powershell
npm run vercel:deploy
```

O simplemente:
```powershell
vercel --prod
```

---

## 🌐 URLs Después del Despliegue

Vercel te dará URLs como:

```
✅ Production: https://sap-cpi-monitor.vercel.app
```

### APIs Disponibles:

#### Evaluar:
- `https://tu-app.vercel.app/api/evaluar/qas-https-status`
- `https://tu-app.vercel.app/api/evaluar/qas-https-logs`
- `https://tu-app.vercel.app/api/evaluar/qas-https-metrics`

#### TeachLR:
- `https://tu-app.vercel.app/api/teachlr/qas-https-status`
- `https://tu-app.vercel.app/api/teachlr/qas-https-logs`
- `https://tu-app.vercel.app/api/teachlr/qas-https-metrics`

#### Pruebas:
- `https://tu-app.vercel.app/api/pruebas/qas-https-status`
- `https://tu-app.vercel.app/api/pruebas/qas-https-logs`
- `https://tu-app.vercel.app/api/pruebas/qas-https-metrics`

---

## 🧪 Probar las APIs

### Desde PowerShell:
```powershell
# Reemplaza con tu URL de Vercel
$baseUrl = "https://tu-app.vercel.app"

# Status de Evaluar
curl "$baseUrl/api/evaluar/qas-https-status"

# Logs de PI2
curl "$baseUrl/api/evaluar/qas-https-logs?integracion=EVAL-QAS-002"

# Métricas
curl "$baseUrl/api/evaluar/qas-https-metrics"
```

### Desde el Navegador:
```
https://tu-app.vercel.app
```

---

## 🔧 Comandos Útiles

```powershell
# Ver logs en tiempo real
vercel logs

# Ver información del proyecto
vercel inspect

# Ver dominios
vercel domains ls

# Eliminar despliegue
vercel remove [deployment-url]

# Ver lista de despliegues
vercel ls
```

---

## 📊 Verificar Turso

Puedes verificar que tus datos están en Turso:

1. Ve a: https://turso.tech/app
2. Inicia sesión
3. Selecciona tu base de datos: `sap-cpi-monitor-vercel-icfg`
4. Ve a **SQL Editor**
5. Ejecuta consultas:

```sql
-- Ver proyectos
SELECT * FROM proyectos;

-- Ver integraciones
SELECT * FROM integraciones;

-- Ver últimas ejecuciones
SELECT * FROM ejecuciones ORDER BY fecha_inicio DESC LIMIT 10;

-- Ver logs recientes
SELECT * FROM logs ORDER BY timestamp DESC LIMIT 20;
```

---

## 🔄 Actualizar la Aplicación

Cuando hagas cambios en el código:

```powershell
# 1. Commit tus cambios (opcional pero recomendado)
git add .
git commit -m "Actualización"

# 2. Desplegar
vercel --prod
```

Vercel automáticamente:
- ✅ Instala dependencias
- ✅ Hace build
- ✅ Despliega
- ✅ Conecta con Turso usando las variables de entorno

---

## 🐛 Troubleshooting

### Error: "Faltan variables de entorno"
**Solución**: Verifica que agregaste las variables en Vercel:
```powershell
vercel env ls
```

### Error: "Cannot connect to Turso"
**Solución**: Verifica tu token y URL en `.env.local`:
```powershell
turso db show sap-cpi-monitor-vercel-icfg
```

### Build falla en Vercel
**Solución**: Ver logs:
```powershell
vercel logs
```

### APIs retornan 500
**Solución**: 
1. Verifica que ejecutaste `npm run turso:migrate`
2. Verifica las variables de entorno en Vercel
3. Revisa los logs: `vercel logs`

---

## 📱 Integración con GitHub (Opcional)

Para despliegues automáticos:

1. Ve a https://vercel.com/dashboard
2. **New Project** > **Import Git Repository**
3. Conecta tu repositorio
4. Vercel desplegará automáticamente en cada push

---

## 🎯 Checklist de Despliegue

- [ ] Ejecutar `npm run turso:migrate`
- [ ] Verificar datos en Turso dashboard
- [ ] Instalar Vercel CLI: `npm install -g vercel`
- [ ] Login: `vercel login`
- [ ] Configurar variables de entorno en Vercel
- [ ] Primer despliegue: `vercel`
- [ ] Configurar dominio de producción
- [ ] Probar APIs en producción
- [ ] Verificar dashboard en navegador
- [ ] Configurar despliegues automáticos (opcional)

---

## 🌟 Ventajas de Turso + Vercel

✅ **Edge Computing**: Base de datos cerca de tus usuarios
✅ **Escalabilidad**: Turso escala automáticamente
✅ **Velocidad**: Latencia mínima
✅ **Costo**: Tier gratuito generoso
✅ **Simplicidad**: No necesitas configurar servidor de BD
✅ **Backups**: Turso hace backups automáticos
✅ **Replicación**: Datos replicados en múltiples regiones

---

## 📈 Monitoreo

### Vercel Analytics
```powershell
# Ver métricas de uso
vercel analytics
```

### Turso Metrics
1. Ve a: https://turso.tech/app
2. Selecciona tu base de datos
3. Ve a **Metrics** para ver:
   - Queries ejecutadas
   - Latencia promedio
   - Storage usado
   - Conexiones activas

---

## 🚀 ¡Listo para Desplegar!

Ejecuta estos comandos en orden:

```powershell
# 1. Migrar a Turso
npm run turso:migrate

# 2. Desplegar a Vercel
vercel
```

Luego abre tu app en el navegador y prueba las APIs! 🎉
