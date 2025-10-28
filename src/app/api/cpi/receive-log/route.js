// API para recibir logs desde SAP CPI
// Endpoint: POST /api/cpi/receive-log
// Acepta JSON o XML desde CPI y lo registra en la base de datos

import { getDatabase } from '@/lib/db-client';

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body;
    let tipo = 'json';
    
    // Detectar formato
    if (contentType.includes('application/json')) {
      body = await request.json();
      tipo = 'json';
    } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      body = await request.text();
      tipo = 'xml';
    } else {
      body = await request.text();
      tipo = 'text';
    }

    const db = getDatabase();
    
    // Extraer información del mensaje
    const mensaje = typeof body === 'string' ? body : JSON.stringify(body);
    const timestamp = new Date().toISOString();
    const correlationId = `CPI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Determinar tipo de log (buscar palabras clave)
    let tipoLog = 'INFO';
    const mensajeLower = mensaje.toLowerCase();
    if (mensajeLower.includes('error') || mensajeLower.includes('fail')) {
      tipoLog = 'ERROR';
    } else if (mensajeLower.includes('warning') || mensajeLower.includes('warn')) {
      tipoLog = 'WARNING';
    } else if (mensajeLower.includes('success') || mensajeLower.includes('ok')) {
      tipoLog = 'SUCCESS';
    }

    // Extraer proyecto/integración si viene en el body
    let integracionId = 'CPI-GENERIC';
    if (typeof body === 'object' && body.integracionId) {
      integracionId = body.integracionId;
    } else if (typeof body === 'object' && body.proyecto) {
      integracionId = `${body.proyecto.toUpperCase()}-LOG`;
    }

    // Verificar si la integración existe, si no, crearla
    const integResult = await db.execute(
      'SELECT id FROM integraciones WHERE id = ?',
      [integracionId]
    );

    if (!integResult.rows || integResult.rows.length === 0) {
      // Crear integración genérica para logs de CPI
      await db.execute(
        `INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, estado, activo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [integracionId, 'cpi-logs', `Logs CPI: ${integracionId}`, 'Integración para recibir logs desde CPI', 'success', 1]
      );
    }

    // Registrar el log
    await db.execute(
      `INSERT INTO logs (integracion_id, tipo, mensaje, detalles, correlation_id, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        integracionId,
        tipoLog,
        mensaje.substring(0, 500), // Limitar mensaje principal
        JSON.stringify({ 
          formato: tipo,
          contentType,
          bodySize: mensaje.length,
          fullMessage: mensaje 
        }),
        correlationId,
        timestamp
      ]
    );

    // Registrar ejecución
    await db.execute(
      `INSERT INTO ejecuciones (integracion_id, estado, fecha_inicio, fecha_fin, duracion, mensajes_procesados, mensajes_exitosos, correlation_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        integracionId,
        tipoLog === 'ERROR' ? 'error' : 'success',
        timestamp,
        timestamp,
        0,
        1,
        tipoLog === 'ERROR' ? 0 : 1,
        correlationId
      ]
    );

    return Response.json({
      success: true,
      mensaje: 'Log recibido y registrado exitosamente',
      correlationId,
      timestamp,
      tipo: tipoLog,
      integracionId
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Error recibiendo log desde CPI:', error);
    return Response.json(
      { 
        success: false,
        error: 'Error procesando log', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Manejar OPTIONS para CORS
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// También permitir GET para testing
export async function GET(request) {
  return Response.json({
    endpoint: '/api/cpi/receive-log',
    method: 'POST',
    description: 'Recibe logs desde SAP CPI en formato JSON o XML',
    example: {
      integracionId: 'TEACH-QAS-001',
      proyecto: 'teachlr',
      mensaje: 'Log desde CPI',
      nivel: 'INFO'
    }
  });
}
