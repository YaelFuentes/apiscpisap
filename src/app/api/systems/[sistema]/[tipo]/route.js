// Endpoint dinámico para recibir logs de APIs personalizadas por sistema
// Ruta: /api/systems/[sistema]/[tipo]/route.js
// Ejemplo: /api/systems/teachlr/altas
//          /api/systems/teachlr/bajas
//          /api/systems/evaluar/sincronizacion

import { getDatabase } from '@/lib/db-client';

export async function POST(request, context) {
  let db;
  
  try {
    // Next.js 15+ requiere await para params
    const params = await context.params;
    
    console.log('🔵 ============================================');
    console.log('🔵 API Sistema - Recibiendo petición');
    console.log('🔵 Params completos:', params);
    console.log('🔵 Sistema (raw):', params.sistema);
    console.log('🔵 Tipo (raw):', params.tipo);
    console.log('🔵 Timestamp:', new Date().toISOString());
    console.log('🔵 ============================================');
    
    // Normalizar parámetros (siempre en minúsculas para coincidir con el endpoint guardado)
    const sistema = params.sistema?.toLowerCase() || '';
    const tipo = params.tipo?.toLowerCase() || '';
    
    console.log('🔵 Sistema (normalizado):', sistema);
    console.log('🔵 Tipo (normalizado):', tipo);
    
    // Validar variables de entorno
    if (!process.env.database_TURSO_DATABASE_URL || !process.env.database_TURSO_AUTH_TOKEN) {
      console.error('❌ Variables de entorno NO configuradas');
      throw new Error('Base de datos no configurada correctamente');
    }
    console.log('✅ Variables de entorno validadas');
    
    const contentType = request.headers.get('content-type') || '';
    console.log('📥 Content-Type:', contentType);
    
    let body;
    let bodyRaw;
    let formato = 'json';
    
    // Leer y parsear body
    try {
      bodyRaw = await request.text();
      console.log('📦 Body recibido (length):', bodyRaw?.length || 0);
      console.log('📦 Body preview:', bodyRaw?.substring(0, 200));
      
      if (contentType.includes('application/json') && bodyRaw) {
        try {
          body = JSON.parse(bodyRaw);
          formato = 'json';
          console.log('✅ Body parseado como JSON');
        } catch (e) {
          console.warn('⚠️ Error parseando JSON, usando como texto:', e.message);
          body = bodyRaw;
          formato = 'text';
        }
      } else {
        body = bodyRaw;
        formato = contentType.includes('xml') ? 'xml' : 'text';
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
    } catch (dbError) {
      console.error('❌ Error fatal obteniendo conexión DB:', dbError);
      throw new Error(`Error de base de datos: ${dbError.message}`);
    }
    
    // Buscar la API personalizada
    const endpoint = `/api/systems/${sistema}/${tipo}`;
    console.log('🔍 Buscando API:', endpoint);
    
    const apiResult = await db.execute({
      sql: 'SELECT * FROM apis_personalizadas WHERE endpoint = ? AND activo = 1',
      args: [endpoint]
    });
    
    if (!apiResult.rows || apiResult.rows.length === 0) {
      console.error('❌ API no encontrada o inactiva:', endpoint);
      return Response.json(
        { 
          error: 'API no encontrada o inactiva',
          endpoint,
          sistema,
          tipo,
          ayuda: 'Debes crear esta API primero usando POST /api/admin/apis'
        },
        { status: 404 }
      );
    }
    
    const api = apiResult.rows[0];
    console.log('✅ API encontrada:', api.nombre);
    console.log('📊 Integración ID:', api.integracion_id);
    
    // Extraer información del mensaje
    const mensaje = bodyRaw || 'Sin contenido';
    const timestamp = new Date().toISOString();
    const correlationId = `${api.integracion_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🆔 Correlation ID:', correlationId);
    
    // Determinar tipo de log
    let tipoLog = 'INFO';
    const mensajeLower = mensaje.toLowerCase();
    
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
    
    // Capturar todos los headers
    const allHeaders = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    console.log('📋 Headers capturados:', Object.keys(allHeaders).length);
    
    // Extraer properties si vienen en el body
    let properties = {};
    if (typeof body === 'object' && body !== null) {
      if (body.properties) {
        properties = body.properties;
      }
      if (body.headers) {
        properties.headersFromBody = body.headers;
      }
    }
    
    console.log('💾 Guardando log en base de datos...');
    
    // Registrar el log
    try {
      await db.execute({
        sql: `INSERT INTO logs (integracion_id, tipo, mensaje, detalles, correlation_id, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          api.integracion_id,
          tipoLog,
          mensaje.substring(0, 500),
          JSON.stringify({ 
            formato,
            contentType,
            bodySize: mensaje.length,
            fullMessage: mensaje,
            bodyParsed: typeof body === 'object' ? body : null,
            headers: allHeaders,
            properties: properties,
            apiInfo: {
              id: api.id,
              sistema: api.sistema,
              nombre: api.nombre,
              tipoIntegracion: api.tipo_integracion,
              endpoint: api.endpoint
            },
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
          api.integracion_id,
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
    
    console.log('🎉 Proceso completado exitosamente');
    
    return Response.json({
      success: true,
      mensaje: 'Log recibido y registrado exitosamente',
      api: {
        sistema: api.sistema,
        nombre: api.nombre,
        tipoIntegracion: api.tipo_integracion,
        endpoint: api.endpoint
      },
      correlationId,
      timestamp,
      tipo: tipoLog,
      integracionId: api.integracion_id
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    console.error('❌ ERROR CRÍTICO en API Sistema:', error);
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Nombre:', error.name);
    
    return Response.json(
      { 
        success: false,
        error: 'Error procesando log', 
        details: error.message,
        errorName: error.name,
        sistema: params.sistema,
        tipo: params.tipo,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
}

// GET - Información sobre esta API
export async function GET(request, context) {
  try {
    // Next.js 15+ requiere await para params
    const params = await context.params;
    
    // Normalizar parámetros (siempre en minúsculas)
    const sistema = params.sistema?.toLowerCase() || '';
    const tipo = params.tipo?.toLowerCase() || '';
    const endpoint = `/api/systems/${sistema}/${tipo}`;
    
    const db = getDatabase();
    const apiResult = await db.execute({
      sql: 'SELECT * FROM apis_personalizadas WHERE endpoint = ?',
      args: [endpoint]
    });
    
    if (!apiResult.rows || apiResult.rows.length === 0) {
      return Response.json({
        error: 'API no encontrada',
        endpoint,
        sistema,
        tipo,
        ayuda: 'Debes crear esta API primero usando POST /api/admin/apis'
      }, { status: 404 });
    }
    
    const api = apiResult.rows[0];
    
    // Obtener estadísticas
    const statsResult = await db.execute({
      sql: `SELECT 
        COUNT(*) as total_logs,
        SUM(CASE WHEN tipo = 'SUCCESS' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN tipo = 'ERROR' THEN 1 ELSE 0 END) as error_count,
        SUM(CASE WHEN tipo = 'WARNING' THEN 1 ELSE 0 END) as warning_count
       FROM logs WHERE integracion_id = ?`,
      args: [api.integracion_id]
    });
    
    const stats = statsResult.rows?.[0] || {};
    
    return Response.json({
      api: {
        id: api.id,
        sistema: api.sistema,
        nombre: api.nombre,
        descripcion: api.descripcion,
        tipoIntegracion: api.tipo_integracion,
        endpoint: api.endpoint,
        activo: api.activo === 1
      },
      integracion: {
        id: api.integracion_id,
        proyectoId: api.proyecto_id
      },
      estadisticas: stats,
      uso: {
        metodo: 'POST',
        contentType: 'application/json',
        ejemplo: {
          mensaje: 'Tu mensaje aquí',
          nivel: 'SUCCESS',
          datos: {},
          properties: {},
          headers: {}
        }
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Error en GET API Sistema:', error);
    return Response.json(
      { error: 'Error obteniendo información de API', details: error.message },
      { status: 500 }
    );
  }
}

// OPTIONS para CORS
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
