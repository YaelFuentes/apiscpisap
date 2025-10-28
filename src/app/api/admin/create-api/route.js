// src/app/api/admin/create-api/route.js
// API para crear APIs genéricas dinámicas

import { getDatabase } from '@/lib/database';
import { IntegracionRepository } from '@/lib/repositories/IntegracionRepository';
import { ProyectoRepository } from '@/lib/repositories/ProyectoRepository';

export async function POST(request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, formato } = body;

    if (!nombre) {
      return Response.json(
        { error: 'Nombre de API requerido' },
        { status: 400 }
      );
    }

    // Limpiar nombre (sin espacios, minúsculas, guiones)
    const nombreLimpio = nombre.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const db = getDatabase();
    const proyectoRepo = new ProyectoRepository(db);
    const integracionRepo = new IntegracionRepository(db);

    // Crear proyecto "generic" si no existe
    let genericProject = proyectoRepo.findById('generic');
    if (!genericProject) {
      proyectoRepo.create({
        id: 'generic',
        nombre: 'APIs Genéricas',
        descripcion: 'APIs creadas dinámicamente para recibir datos',
        ambiente: 'QAS',
        protocolo: 'HTTPS',
        color: 'from-gray-500 to-zinc-500'
      });
    }

    // Crear integración para esta API
    const apiId = `API-${nombreLimpio.toUpperCase()}`;
    
    integracionRepo.create({
      id: apiId,
      proyecto_id: 'generic',
      nombre: `API Genérica: ${nombre}`,
      descripcion: descripcion || `API para recibir datos en formato ${formato || 'JSON/XML'}`,
      intervalo: 0, // Sin intervalo (recibe datos externos)
      criticidad: 'media',
      estado: 'success',
      activo: 1
    });

    // Crear el archivo de la API
    await createAPIFile(nombreLimpio, apiId, formato);

    return Response.json({
      success: true,
      endpoint: `/api/generic/${nombreLimpio}`,
      apiId,
      mensaje: 'API genérica creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando API:', error);
    return Response.json(
      { error: 'Error creando API genérica' },
      { status: 500 }
    );
  }
}

// Función para crear el archivo de la API dinámicamente
async function createAPIFile(nombre, apiId, formato) {
  const fs = await import('fs');
  const path = await import('path');

  const apiDir = path.join(process.cwd(), 'src', 'app', 'api', 'generic', nombre);
  const routeFile = path.join(apiDir, 'route.js');

  // Crear directorio si no existe
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }

  // Contenido del archivo de la API
  const content = `// API Genérica: ${nombre}
// Creada automáticamente - Recibe ${formato.toUpperCase()}

import { getDatabase } from '@/lib/database';
import { EjecucionRepository } from '@/lib/repositories/EjecucionRepository';
import { LogRepository } from '@/lib/repositories/LogRepository';

// GET - Obtener últimas ejecuciones
export async function GET() {
  try {
    const db = getDatabase();
    const ejecucionRepo = new EjecucionRepository(db);
    
    const ejecuciones = ejecucionRepo.findByIntegracion('${apiId}', 20);
    
    return Response.json({
      api: '${nombre}',
      apiId: '${apiId}',
      formato: '${formato}',
      ejecuciones: ejecuciones || [],
      total: ejecuciones ? ejecuciones.length : 0
    });
  } catch (error) {
    console.error('Error en GET ${nombre}:', error);
    return Response.json({ error: 'Error obteniendo datos' }, { status: 500 });
  }
}

// POST - Recibir datos (JSON o XML)
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let data;
    let tipo = 'json';
    
    if (contentType.includes('application/json')) {
      data = await request.json();
      tipo = 'json';
    } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      data = await request.text();
      tipo = 'xml';
    } else {
      data = await request.text();
      tipo = 'text';
    }
    
    const db = getDatabase();
    const ejecucionRepo = new EjecucionRepository(db);
    const logRepo = new LogRepository(db);
    
    // Crear ejecución
    const correlationId = \`CORR-\${apiId}-\${Date.now()}\`;
    const ejecucionId = ejecucionRepo.create({
      integracion_id: '${apiId}',
      estado: 'success',
      fecha_inicio: new Date().toISOString(),
      fecha_fin: new Date().toISOString(),
      duracion: 0,
      mensajes_procesados: 1,
      mensajes_exitosos: 1,
      mensajes_fallidos: 0,
      errores: 0,
      correlation_id: correlationId
    });
    
    // Crear log
    logRepo.create({
      integracion_id: '${apiId}',
      ejecucion_id: ejecucionId,
      tipo: 'SUCCESS',
      mensaje: \`Datos recibidos en formato \${tipo}\`,
      detalles: JSON.stringify({ 
        contentType, 
        dataSize: typeof data === 'string' ? data.length : JSON.stringify(data).length 
      }),
      correlation_id: correlationId
    });
    
    return Response.json({
      success: true,
      mensaje: 'Datos recibidos exitosamente',
      correlationId,
      formato: tipo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en POST ${nombre}:', error);
    
    // Registrar error
    try {
      const db = getDatabase();
      const logRepo = new LogRepository(db);
      logRepo.create({
        integracion_id: '${apiId}',
        ejecucion_id: null,
        tipo: 'ERROR',
        mensaje: \`Error procesando datos: \${error.message}\`,
        correlation_id: \`ERROR-\${Date.now()}\`
      });
    } catch (logError) {
      console.error('Error registrando log:', logError);
    }
    
    return Response.json(
      { error: 'Error procesando datos', detalles: error.message },
      { status: 500 }
    );
  }
}
`;

  // Escribir archivo
  fs.writeFileSync(routeFile, content, 'utf-8');
  
  console.log(`✅ API creada: ${routeFile}`);
}
