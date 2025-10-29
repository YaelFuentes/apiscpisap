// API: QAS HTTPS Status - Proyecto TeachLR
// Nomenclatura: [ambiente]-[protocolo]-[funcionalidad]
// Retorna el estado de las integraciones HTTPS en QAS desde Turso

import { getDatabase } from '@/lib/db-client';

async function getStatusData() {
  const db = getDatabase();

  const proyectoResult = await db.execute({
    sql: 'SELECT * FROM proyectos WHERE id = ?',
    args: ['teachlr']
  });
  const proyecto = proyectoResult.rows[0];
  if (!proyecto) return null;

  const integsResult = await db.execute({
    sql: 'SELECT * FROM integraciones WHERE proyecto_id = ? AND activo = 1 ORDER BY nombre',
    args: ['teachlr']
  });
  const integraciones = integsResult.rows || [];

  const integracionesConDatos = await Promise.all(integraciones.map(async (integracion) => {
    const ejecResult = await db.execute({
      sql: 'SELECT * FROM ejecuciones WHERE integracion_id = ? ORDER BY fecha_inicio DESC LIMIT 1',
      args: [integracion.id]
    });
    const ultimaEjecucion = ejecResult.rows[0];
    return {
      id: integracion.id,
      nombre: integracion.nombre,
      estado: integracion.estado,
      ultimaEjecucion: ultimaEjecucion?.fecha_inicio || new Date().toISOString(),
      proximaEjecucion: ultimaEjecucion 
        ? new Date(new Date(ultimaEjecucion.fecha_inicio).getTime() + integracion.intervalo).toISOString()
        : new Date(Date.now() + integracion.intervalo).toISOString(),
      duracion: ultimaEjecucion?.duracion || 0,
      mensajesProcesados: ultimaEjecucion?.mensajes_procesados || 0,
      errores: ultimaEjecucion?.errores || 0
    };
  }));

  return {
    proyecto: proyecto.nombre,
    ambiente: proyecto.ambiente,
    protocolo: proyecto.protocolo,
    timestamp: new Date().toISOString(),
    integraciones: integracionesConDatos
  };
}

export async function GET(request) {
  try {
    const data = await getStatusData();
    if (!data) return Response.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    return Response.json(data, { 
      status: 200,
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (error) {
    console.error('Error en API status:', error);
    return Response.json(
      { error: 'Error al obtener datos', details: error.message },
      { status: 500 }
    );
  }
}

// Agregar POST para compatibilidad con CPI
export async function POST(request) {
  try {
    const db = getDatabase();
    
    // Capturar TODOS los datos posibles
    const contentType = request.headers.get('content-type') || 'unknown';
    let body = '';
    let parsedBody = null;
    
    try {
      body = await request.text();
      if (body && contentType.includes('json')) {
        parsedBody = JSON.parse(body);
      }
    } catch (e) {
      body = '(no se pudo leer el body)';
    }

    const timestamp = new Date().toISOString();
    const correlationId = `TEACHLR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Capturar headers importantes
    const headers = {
      'content-type': contentType,
      'content-length': request.headers.get('content-length'),
      'user-agent': request.headers.get('user-agent'),
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'x-real-ip': request.headers.get('x-real-ip')
    };

    // Registrar el log de la petición recibida
    const integracionId = 'TEACHLR-STATUS-LOG';
    
    // Verificar/crear integración para logs
    const integResult = await db.execute({
      sql: 'SELECT id FROM integraciones WHERE id = ?',
      args: [integracionId]
    });

    if (!integResult.rows || integResult.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, estado, activo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        args: [integracionId, 'teachlr', 'Logs TeachLR Status', 'Logs de peticiones al endpoint status', 'success', 1]
      });
    }

    // Determinar si es éxito o error basado en el body
    const bodyLower = body.toLowerCase();
    const tipoLog = bodyLower.includes('error') || bodyLower.includes('exception') || bodyLower.includes('fail')
      ? 'ERROR'
      : 'SUCCESS';

    // Registrar log COMPLETO
    await db.execute({
      sql: `INSERT INTO logs (integracion_id, tipo, mensaje, detalles, correlation_id, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        integracionId,
        tipoLog,
        body ? body.substring(0, 500) : 'POST recibido sin body',
        JSON.stringify({ 
          bodyCompleto: body,
          bodyParsed: parsedBody,
          contentType,
          headers,
          bodySize: body?.length || 0,
          method: 'POST',
          url: request.url,
          timestamp
        }),
        correlationId,
        timestamp
      ]
    });

    // También registrar ejecución
    await db.execute({
      sql: `INSERT INTO ejecuciones (integracion_id, estado, fecha_inicio, fecha_fin, duracion, mensajes_procesados, mensajes_exitosos, correlation_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        integracionId,
        tipoLog === 'ERROR' ? 'error' : 'success',
        timestamp,
        timestamp,
        0,
        1,
        tipoLog === 'ERROR' ? 0 : 1,
        correlationId
      ]
    });

    console.log(`✅ Log registrado: ${correlationId} - Tipo: ${tipoLog} - Body length: ${body?.length || 0}`);

    // Obtener datos del status
    const data = await getStatusData();
    if (!data) return Response.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    return Response.json({
      ...data,
      correlationId,
      logRegistrado: true,
      tipoLog,
      mensaje: `Log registrado exitosamente con ID: ${correlationId}`
    }, { 
      status: 200,
      headers: { 
        'Cache-Control': 'no-store, max-age=0',
        'X-Correlation-Id': correlationId
      }
    });
  } catch (error) {
    console.error('❌ Error en API status POST:', error);
    
    // Registrar error en logs
    try {
      const db = getDatabase();
      const errorCorrelationId = `ERROR-${Date.now()}`;
      await db.execute({
        sql: `INSERT INTO logs (integracion_id, tipo, mensaje, detalles, correlation_id, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          'TEACHLR-STATUS-LOG', 
          'ERROR', 
          `Error en POST: ${error.message}`,
          JSON.stringify({ error: error.message, stack: error.stack }),
          errorCorrelationId, 
          new Date().toISOString()
        ]
      });
    } catch (logError) {
      console.error('Error registrando log de error:', logError);
    }

    return Response.json(
      { error: 'Error al obtener datos', details: error.message },
      { status: 500 }
    );
  }
}
