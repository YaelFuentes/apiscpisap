// src/app/api/admin/create-api/route.js
// API para crear APIs genéricas dinámicas

import { getDatabase } from '@/lib/db-client';

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

    // Verificar si proyecto "generic" existe
    const proyectoResult = await db.execute('SELECT * FROM proyectos WHERE id = ?', ['generic']);
    
    // Crear proyecto "generic" si no existe
    if (!proyectoResult.rows || proyectoResult.rows.length === 0) {
      await db.execute(
        `INSERT INTO proyectos (id, nombre, descripcion, ambiente, protocolo, color)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['generic', 'APIs Genéricas', 'APIs creadas dinámicamente para recibir datos', 'QAS', 'HTTPS', 'from-gray-500 to-zinc-500']
      );
    }

    // Crear integración para esta API
    const apiId = `API-${nombreLimpio.toUpperCase()}`;
    
    await db.execute(
      `INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, intervalo, criticidad, estado, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        apiId,
        'generic',
        `API Genérica: ${nombre}`,
        descripcion || `API para recibir datos en formato ${formato || 'JSON/XML'}`,
        0, // Sin intervalo (recibe datos externos)
        'media',
        'success',
        1
      ]
    );

    // Crear el archivo de la API
    await createAPIFile(nombreLimpio, apiId, formato || 'JSON');

    return Response.json({
      success: true,
      endpoint: `/api/generic/${nombreLimpio}`,
      apiId,
      mensaje: 'API genérica creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando API:', error);
    return Response.json(
      { error: 'Error creando API genérica', details: error.message },
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

import { getDatabase } from '@/lib/db-client';

// GET - Obtener últimas ejecuciones
export async function GET() {
  try {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT * FROM ejecuciones WHERE integracion_id = ? ORDER BY fecha_inicio DESC LIMIT 20',
      ['${apiId}']
    );
    const ejecuciones = result.rows || [];
    
    return Response.json({
      api: '${nombre}',
      apiId: '${apiId}',
      formato: '${formato}',
      ejecuciones,
      total: ejecuciones.length
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
    
    // Crear ejecución
    const correlationId = \`CORR-\${apiId}-\${Date.now()}\`;
    const now = new Date().toISOString();
    
    const ejecResult = await db.execute(
      \`INSERT INTO ejecuciones (integracion_id, estado, fecha_inicio, fecha_fin, duracion, 
        mensajes_procesados, mensajes_exitosos, mensajes_fallidos, errores, correlation_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      ['${apiId}', 'success', now, now, 0, 1, 1, 0, 0, correlationId]
    );
    
    // Crear log
    await db.execute(
      \`INSERT INTO logs (integracion_id, ejecucion_id, tipo, mensaje, detalles, correlation_id)
       VALUES (?, ?, ?, ?, ?, ?)\`,
      [
        '${apiId}',
        ejecResult.lastInsertRowid,
        'SUCCESS',
        \`Datos recibidos en formato \${tipo}\`,
        JSON.stringify({ 
          contentType, 
          dataSize: typeof data === 'string' ? data.length : JSON.stringify(data).length 
        }),
        correlationId
      ]
    );
    
    return Response.json({
      success: true,
      mensaje: 'Datos recibidos exitosamente',
      correlationId,
      formato: tipo,
      timestamp: now
    });
    
  } catch (error) {
    console.error('Error en POST ${nombre}:', error);
    
    // Registrar error
    try {
      const db = getDatabase();
      await db.execute(
        \`INSERT INTO logs (integracion_id, tipo, mensaje, correlation_id)
         VALUES (?, ?, ?, ?)\`,
        ['${apiId}', 'ERROR', \`Error procesando datos: \${error.message}\`, \`ERROR-\${Date.now()}\`]
      );
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
