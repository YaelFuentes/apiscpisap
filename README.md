# 🚀 Monitor SAP CPI - Sistema de Monitoreo en Tiempo Real

Dashboard profesional para monitorear integraciones de **SAP Cloud Platform Integration (CPI)** con actualización automática, base de datos persistente y visualización en tiempo real.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38bdf8?style=flat-square&logo=tailwindcss)
![SQLite](https://img.shields.io/badge/SQLite-Turso-003B57?style=flat-square&logo=sqlite)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=flat-square&logo=vercel)

## ✨ Características Principales

- 🔄 **Actualización en Tiempo Real** - Datos actualizados cada 5-10 segundos
- �️ **Base de Datos Persistente** - SQLite con Turso para producción
- �📊 **Dashboard Interactivo** - Visualización clara del estado de integraciones
- 📈 **Métricas y Estadísticas** - Gráficos y métricas de rendimiento
- 📋 **Visor de Logs** - Sistema de logs con filtrado avanzado
- 🎨 **Interfaz Moderna** - UI responsive con modo oscuro
- ☁️ **Cloud Ready** - Desplegable en Vercel con un comando
- 🏗️ **Arquitectura Escalable** - Fácil agregar nuevos proyectos

## 🎯 Proyectos Monitoreados

### 1. **Evaluar** 
Sistema de evaluaciones con 2 integraciones activas
- Sincronización de Evaluaciones
- Notificación de Resultados

### 2. **TeachLR**
Plataforma de aprendizaje con 3 integraciones activas
- Sincronización de Cursos
- Gestión de Usuarios
- Reporte de Asistencias

### 3. **Pruebas**
Ambiente de testing con 4 integraciones activas
- Test de Conectividad
- Validación de Esquemas
- Prueba de Rendimiento
- Test de Resiliencia

## 🚀 Inicio Rápido

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Inicializar base de datos local
npm run db:init

# Iniciar en modo desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver el dashboard.

### Despliegue en Vercel

```bash
# 1. Migrar datos a Turso
npm run turso:migrate

# 2. Instalar Vercel CLI
npm install -g vercel

# 3. Desplegar
vercel --prod
```

Ver **QUICKSTART.md** para guía completa de despliegue.

### Producción Local

```bash
# Build para producción
npm run build

# Iniciar servidor de producción
npm start
```

## 📁 Estructura del Proyecto

```
cpiapis/
├── src/
│   ├── app/
│   │   ├── api/              # APIs REST organizadas por proyecto
│   │   │   ├── evaluar/      # Proyecto Evaluar (2 integraciones)
│   │   │   ├── teachlr/      # Proyecto TeachLR (3 integraciones)
│   │   │   └── pruebas/      # Proyecto Pruebas (4 integraciones)
│   │   ├── page.js           # Dashboard principal
│   │   └── layout.js
│   ├── components/           # Componentes React reutilizables
│   │   ├── IntegrationCard.js
│   │   ├── ProjectMonitor.js
│   │   ├── MetricsPanel.js
│   │   └── LogsViewer.js
│   └── lib/                  # Base de datos y repositorios
│       ├── database.js       # SQLite local
│       ├── database-turso.js # Cliente Turso (producción)
│       ├── db-client.js      # Selector automático
│       ├── seed.js           # Seed local
│       ├── seed-turso.js     # Seed Turso
│       └── repositories/     # Acceso a datos
│           ├── ProyectoRepository.js
│           ├── IntegracionRepository.js
│           ├── EjecucionRepository.js
│           ├── LogRepository.js
│           └── MetricasRepository.js
├── scripts/
│   └── migrate-turso.js      # Script de migración a Turso
├── data/                     # Base de datos local (gitignored)
├── public/
├── .env.local                # Variables de entorno (Turso)
├── vercel.json               # Configuración Vercel
├── DATABASE.md               # Documentación de BD
├── QUICKSTART.md             # Guía rápida de despliegue
├── VERCEL_DEPLOYMENT.md      # Guía completa de Vercel
├── API_TESTING_GUIDE.md      # Guía de testing de APIs
├── DOCUMENTATION.md          # Documentación completa
└── README.md
```

## 🔌 APIs Disponibles

### Nomenclatura: `[ambiente]-[protocolo]-[funcionalidad]`

Cada proyecto tiene 3 endpoints principales:

#### Status - Estado de Integraciones
```
GET /api/[proyecto]/qas-https-status
```

#### Logs - Registro de Eventos
```
GET /api/[proyecto]/qas-https-logs?id=[integracionId]
```

#### Metrics - Métricas y Estadísticas
```
GET /api/[proyecto]/qas-https-metrics
```

### Ejemplos de Uso

```bash
# PowerShell
Invoke-RestMethod http://localhost:3000/api/evaluar/qas-https-status

# curl
curl http://localhost:3000/api/teachlr/qas-https-logs

# JavaScript/Fetch
fetch('/api/pruebas/qas-https-metrics')
  .then(res => res.json())
  .then(data => console.log(data));
```

## 🎨 Componentes del Dashboard

### 1. Monitor de Proyecto
- Vista de tarjetas con estado de cada integración
- Indicadores en tiempo real (success/warning/error)
- Control de auto-actualización
- Última y próxima ejecución

### 2. Panel de Métricas
- Total de ejecuciones (24h)
- Tasa de éxito/fallo
- Disponibilidad del sistema
- Gráfico de ejecuciones por hora
- Tiempo promedio de procesamiento

### 3. Visor de Logs
- Logs en tiempo real
- Filtros por tipo (SUCCESS, INFO, WARNING, ERROR)
- Correlation IDs para trazabilidad
- Timestamps y mensajes detallados

## ⚙️ Configuración

### Intervalos de Actualización

```javascript
// src/config/proyectos.js
export const REFRESH_INTERVALS = {
  monitor: 10000,   // 10 segundos
  metrics: 15000,   // 15 segundos
  logs: 8000        // 8 segundos
};
```

### Agregar Nuevo Proyecto

1. Crear carpeta de APIs: `src/app/api/nuevo-proyecto/`
2. Implementar endpoints siguiendo nomenclatura estándar
3. Agregar configuración en `src/config/proyectos.js`
4. Registrar en dashboard `src/app/page.js`

Ver **FOLDER_STRUCTURE.md** para guía detallada.

## 🔗 Integración con SAP CPI Real

Actualmente usa datos simulados. Para conectar con SAP CPI:

1. Configurar variables de entorno (`.env.local`)
2. Instalar `axios` para llamadas HTTP
3. Implementar cliente SAP CPI
4. Actualizar endpoints con llamadas reales

Ver **SAP_CPI_INTEGRATION.md** para guía completa con ejemplos.

## 📚 Documentación Completa

### Base de Datos
- **DATABASE.md** - Esquema completo de la base de datos
- **DATABASE_IMPLEMENTATION.md** - Detalles de implementación

### Despliegue
- **QUICKSTART.md** - Guía rápida de despliegue en Vercel
- **VERCEL_DEPLOYMENT.md** - Guía completa de despliegue
- **API_TESTING_GUIDE.md** - Cómo probar las APIs

### Desarrollo
- **DOCUMENTATION.md** - Documentación técnica completa
- **SAP_CPI_INTEGRATION.md** - Guía de integración con SAP CPI
- **FOLDER_STRUCTURE.md** - Estructura y nomenclatura
- **TESTING_GUIDE.md** - Guía de testing y debugging

## 🧪 Testing

```bash
# Verificar que las APIs funcionan
curl http://localhost:3000/api/evaluar/qas-https-status

# Testing completo
npm run dev
# Abrir http://localhost:3000
# Verificar actualización automática cada 10s
```

Ver **TESTING_GUIDE.md** para casos de testing completos.

## 🛠️ Tecnologías

### Frontend
- **Next.js 16.0** - Framework React con App Router
- **React 19.2** - Biblioteca UI con hooks modernos
- **Tailwind CSS 4** - Framework de estilos utility-first

### Backend
- **SQLite** - Base de datos local (desarrollo)
- **Turso** - SQLite en la nube (producción)
- **better-sqlite3** - Cliente SQLite sincrónico
- **@libsql/client** - Cliente para Turso

### DevOps
- **Vercel** - Platform de despliegue
- **JavaScript ES6+** - Lenguaje moderno con módulos ESM

## 📊 Estados de Integración

| Estado | Color | Descripción |
|--------|-------|-------------|
| 🟢 Success | Verde | Funcionando correctamente |
| 🟡 Warning | Amarillo | Advertencias o problemas menores |
| 🔴 Error | Rojo | Fallo en la integración |

## 🎯 Características Técnicas

- ✅ Server-Side Rendering (SSR)
- ✅ Client-Side Data Fetching
- ✅ Base de datos SQLite persistente
- ✅ Repository pattern para acceso a datos
- ✅ Soporte para SQLite local y Turso (cloud)
- ✅ Polling automático configurable
- ✅ Cache-Control optimizado
- ✅ Manejo de errores robusto
- ✅ TypeScript-ready (jsconfig.json)
- ✅ ESLint configurado
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Edge-ready con Vercel

## 🗄️ Base de Datos

### Desarrollo (SQLite local)
```bash
# Inicializar base de datos
npm run db:init

# Reiniciar base de datos
npm run db:reset
```

### Producción (Turso)
```bash
# Migrar a Turso
npm run turso:migrate
```

### Esquema
- **proyectos** - Proyectos monitoreados
- **integraciones** - Integraciones SAP CPI
- **ejecuciones** - Historial de ejecuciones
- **logs** - Logs detallados
- **metricas_diarias** - Métricas agregadas por día
- **metricas_horarias** - Métricas por hora
- **alertas** - Sistema de alertas

Ver **DATABASE.md** para detalles completos del esquema.

## 🚧 Próximas Mejoras

- [ ] Integración real con SAP CPI
- [ ] Sistema de alertas y notificaciones push
- [ ] Exportación de reportes (PDF/Excel)
- [ ] Autenticación y roles de usuario
- [ ] Gráficos históricos avanzados con Chart.js
- [ ] WebSockets para updates en tiempo real
- [ ] Soporte para múltiples ambientes (DEV/QAS/PRD)
- [ ] API REST completa para CRUD de integraciones
- [ ] Dashboard de administración

## 🌐 Demo en Vivo

Una vez desplegado en Vercel:
```
https://tu-app.vercel.app
```

## 🔐 Variables de Entorno

Crea un archivo `.env.local`:

```bash
# Turso (SQLite en la nube)
TURSO_DATABASE_URL="libsql://tu-database.turso.io"
TURSO_AUTH_TOKEN="tu-token-de-autenticacion"
```

## 📄 Licencia

Proyecto privado de uso interno.

## 👥 Soporte

Para preguntas o problemas, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ para monitoreo de integraciones SAP CPI**
