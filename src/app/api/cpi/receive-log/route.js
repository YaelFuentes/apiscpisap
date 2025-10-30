// API para recibir logs desde SAP CPI
// Endpoint: POST /api/cpi/receive-log
// Acepta JSON o XML desde CPI y lo registra en la base de datos

import { getDatabase } from '@/lib/db-client';

export async function POST(request) {
  let db;
  const startTime = Date.now();
  
  try {
    console.log('🔵 ============================================');
    console.log('🔵 Inicio - Recibiendo petición en /api/cpi/receive-log');
    console.log('🔵 Timestamp:', new Date().toISOString());
    console.log('🔵 ============================================');
    
    // Validar variables de entorno
    if (!process.env.database_TURSO_DATABASE_URL || !process.env.database_TURSO_AUTH_TOKEN) {
      console.error('❌ Variables de entorno NO configuradas');
      console.error('❌ DATABASE_URL:', process.env.database_TURSO_DATABASE_URL ? 'presente' : 'ausente');
      console.error('❌ AUTH_TOKEN:', process.env.database_TURSO_AUTH_TOKEN ? 'presente' : 'ausente');
      
      return Response.json({
        success: false,
        error: 'DATABASE_NOT_CONFIGURED',
        mensaje: 'La base de datos no está configurada correctamente',
        details: 'Faltan variables de entorno requeridas',
        timestamp: new Date().toISOString()
      }, { 
        status: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    console.log('✅ Variables de entorno validadas');
    
    const contentType = request.headers.get('content-type') || '';
    console.log('📥 Content-Type:', contentType);
    
    let body;
    let bodyRaw;
    let tipo = 'json';
    
    // Detectar formato y leer body
    try {
      bodyRaw = await request.text();
      console.log('📦 Body recibido (length):', bodyRaw?.length || 0);
      console.log('📦 Body preview:', bodyRaw?.substring(0, 200));
      
      if (contentType.includes('application/json') && bodyRaw) {
        try {
          body = JSON.parse(bodyRaw);
          tipo = 'json';
          console.log('✅ Body parseado como JSON');
        } catch (e) {
          console.warn('⚠️ Error parseando JSON, usando como texto:', e.message);
          body = bodyRaw;
          tipo = 'text';
        }
      } else {
        body = bodyRaw;
        tipo = contentType.includes('xml') ? 'xml' : 'text';
      }
    } catch (e) {
      console.error('❌ Error leyendo body:', e);
      body = '';
      bodyRaw = '';
    }

    console.log('🔗 Obteniendo conexión a base de datos...');
    try {
      db = getDatabase();
      console.log('✅ Conexión obtenida');
      
      // Verificar que la conexión funciona
      await db.execute({ sql: 'SELECT 1 as test', args: [] });
      console.log('✅ Conexión verificada y funcional');
    } catch (dbError) {
      console.error('❌ Error fatal obteniendo conexión DB:', dbError);
      console.error('❌ Tipo de error:', dbError.name);
      console.error('❌ Mensaje:', dbError.message);
      
      return Response.json({
        success: false,
        error: 'DATABASE_CONNECTION_FAILED',
        mensaje: 'No se pudo conectar a la base de datos',
        details: dbError.message,
        errorType: dbError.name,
        timestamp: new Date().toISOString()
      }, { 
        status: 503,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    // Extraer información del mensaje
    const mensaje = bodyRaw || 'Sin contenido';
    const timestamp = new Date().toISOString();
    const correlationId = `CPI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🆔 Correlation ID:', correlationId);
    
    // Determinar tipo de log
    let tipoLog = 'INFO';
    const mensajeLower = mensaje.toLowerCase();
    
    // Extraer nivel si viene en el body
    if (typeof body === 'object' && body.nivel) {
      tipoLog = body.nivel.toUpperCase();
      console.log('📊 Tipo extraído del body:', tipoLog);
    } else if (mensajeLower.includes('error') || mensajeLower.includes('fail')) {
      tipoLog = 'ERROR';
    } else if (mensajeLower.includes('warning') || mensajeLower.includes('warn')) {
      tipoLog = 'WARNING';
    } else if (mensajeLower.includes('success') || mensajeLower.includes('ok')) {
      tipoLog = 'SUCCESS';
    }
    
    console.log('🏷️ Tipo de log determinado:', tipoLog);

    // Extraer integración ID
    let integracionId = 'CPI-GENERIC';
    let proyectoId = 'cpi-logs';
    
    if (typeof body === 'object') {
      if (body.integracionId) {
        integracionId = body.integracionId;
        console.log('🔖 IntegracionId del body:', integracionId);
      } else if (body.proyecto) {
        proyectoId = body.proyecto;
        integracionId = `${body.proyecto.toUpperCase()}-LOG`;
        console.log('🔖 ProyectoId del body:', proyectoId);
      }
    }

    console.log('🔍 Verificando proyecto:', proyectoId);
    
    // Verificar/crear proyecto
    try {
      const proyectoResult = await db.execute({
        sql: 'SELECT id FROM proyectos WHERE id = ?',
        args: [proyectoId]
      });

      if (!proyectoResult.rows || proyectoResult.rows.length === 0) {
        console.log('➕ Creando nuevo proyecto:', proyectoId);
        
        await db.execute({
          sql: `INSERT INTO proyectos (id, nombre, descripcion, ambiente, protocolo, color, contacto_responsable, contacto_email)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            proyectoId, 
            'CPI Logs', 
            'Proyecto para recibir y almacenar logs desde SAP CPI', 
            'PRD', 
            'HTTPS', 
            'from-green-500 to-teal-500',
            'Administrador CPI',
            'admin@cpi.local'
          ]
        });
        
        console.log('✅ Proyecto creado');
      } else {
        console.log('✅ Proyecto ya existe');
      }
    } catch (error) {
      console.error('❌ Error verificando/creando proyecto:', error);
      throw new Error(`Error en proyecto: ${error.message}`);
    }
    
    console.log('🔍 Verificando si integración existe:', integracionId);
    
    // Verificar/crear integración
    try {
      const integResult = await db.execute({
        sql: 'SELECT id FROM integraciones WHERE id = ?',
        args: [integracionId]
      });

      if (!integResult.rows || integResult.rows.length === 0) {
        console.log('➕ Creando nueva integración:', integracionId);
        
        await db.execute({
          sql: `INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, estado, activo)
           VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            integracionId, 
            proyectoId, 
            `Logs CPI: ${integracionId}`, 
            'Integración para recibir logs desde CPI', 
            'success', 
            1
          ]
        });
        
        console.log('✅ Integración creada');
      } else {
        console.log('✅ Integración ya existe');
      }
    } catch (error) {
      console.error('❌ Error verificando/creando integración:', error);
      throw new Error(`Error en integración: ${error.message}`);
    }

    console.log('💾 Guardando log en base de datos...');
    
    // Capturar todos los headers
    const allHeaders = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    console.log('📋 Headers capturados:', Object.keys(allHeaders).length);
    
    // Extraer properties si vienen en el body
    let properties = {};
    if (typeof body === 'object' && body !== null) {
      // Si el body tiene una propiedad 'properties', la extraemos
      if (body.properties) {
        properties = body.properties;
      }
      // Si el body tiene una propiedad 'headers', también la guardamos
      if (body.headers) {
        properties.headersFromBody = body.headers;
      }
    }
    
    // Registrar el log
    try {
      await db.execute({
        sql: `INSERT INTO logs (integracion_id, tipo, mensaje, detalles, correlation_id, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          integracionId,
          tipoLog,
          mensaje.substring(0, 500),
          JSON.stringify({ 
            formato: tipo,
            contentType,
            bodySize: mensaje.length,
            fullMessage: mensaje,
            bodyParsed: typeof body === 'object' ? body : null,
            headers: allHeaders,
            properties: properties,
            requestInfo: {
              method: 'POST',
              url: request.url,
              timestamp: timestamp
            }
          }),
          correlationId,
          timestamp
        ]
      });
      
      console.log('✅ Log guardado exitosamente');
    } catch (error) {
      console.error('❌ Error guardando log:', error);
      throw new Error(`Error guardando log: ${error.message}`);
    }

    console.log('📊 Guardando ejecución...');
    
    // Registrar ejecución
    try {
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
      
      console.log('✅ Ejecución guardada');
    } catch (error) {
      console.error('❌ Error guardando ejecución:', error);
      // No lanzar error aquí, el log principal ya se guardó
    }

    const processingTime = Date.now() - startTime;
    console.log('🎉 Proceso completado exitosamente');
    console.log('⏱️ Tiempo de procesamiento:', processingTime, 'ms');

    return Response.json({
      success: true,
      mensaje: 'Log recibido y registrado exitosamente',
      correlationId,
      timestamp,
      tipo: tipoLog,
      integracionId,
      processingTime: `${processingTime}ms`,
      stats: {
        bodySize: mensaje.length,
        formato: tipo
      }
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Processing-Time': `${processingTime}ms`,
        'X-Correlation-Id': correlationId
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('❌ ============================================');
    console.error('❌ ERROR CRÍTICO en /api/cpi/receive-log');
    console.error('❌ ============================================');
    console.error('❌ Tipo de error:', error.name);
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Tiempo hasta el error:', processingTime, 'ms');
    console.error('❌ ============================================');
    
    // Determinar el tipo de error y código HTTP apropiado
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let statusCode = 500;
    let errorMessage = 'Error interno del servidor';
    
    if (error.message.includes('Base de datos no configurada')) {
      errorCode = 'DATABASE_NOT_CONFIGURED';
      statusCode = 503;
      errorMessage = 'Base de datos no configurada';
    } else if (error.message.includes('Error de base de datos')) {
      errorCode = 'DATABASE_ERROR';
      statusCode = 503;
      errorMessage = 'Error de base de datos';
    } else if (error.message.includes('guardando log')) {
      errorCode = 'LOG_INSERT_FAILED';
      statusCode = 500;
      errorMessage = 'Error al guardar el log';
    } else if (error.message.includes('proyecto')) {
      errorCode = 'PROJECT_ERROR';
      statusCode = 500;
      errorMessage = 'Error gestionando el proyecto';
    } else if (error.message.includes('integración')) {
      errorCode = 'INTEGRATION_ERROR';
      statusCode = 500;
      errorMessage = 'Error gestionando la integración';
    }
    
    // Intentar cerrar la conexión de DB si está abierta
    if (db) {
      try {
        // Turso no necesita cerrar conexión explícitamente
      } catch (dbError) {
        console.error('❌ Error cerrando DB:', dbError);
      }
    }
    
    // Respuesta de error estructurada
    return Response.json(
      { 
        success: false,
        error: errorCode,
        mensaje: errorMessage,
        details: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString(),
        processingTime: `${processingTime}ms`,
        // Solo incluir stack trace en desarrollo
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        // Información adicional para debugging
        debug: {
          endpoint: '/api/cpi/receive-log',
          method: 'POST',
          hadDbConnection: !!db
        }
      },
      { 
        status: statusCode,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'X-Error-Code': errorCode,
          'X-Processing-Time': `${processingTime}ms`
        }
      }
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
