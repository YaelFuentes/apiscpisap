// Endpoint dinámico para recibir logs de APIs personalizadas por sistema
// Ruta: /api/systems/[sistema]/[tipo]/route.js
// Ejemplo: /api/systems/teachlr/altas
//          /api/systems/teachlr/bajas
//          /api/systems/evaluar/sincronizacion

import { getDatabase } from '@/lib/db-client';

export async function POST(request, context) {
  let db;
  let params;
  let sistema = '';
  let tipo = '';
  
  try {
    // Next.js 15+ requiere await para params
    params = await context.params;
    
    console.log('🔵 ============================================');
    console.log('🔵 API Sistema - Recibiendo petición');
    console.log('🔵 Params completos:', params);
    console.log('🔵 Sistema (raw):', params.sistema);
    console.log('🔵 Tipo (raw):', params.tipo);
    console.log('🔵 Timestamp:', new Date().toISOString());
    console.log('🔵 ============================================');
    
    // Normalizar parámetros (siempre en minúsculas para coincidir con el endpoint guardado)
    sistema = params.sistema?.toLowerCase() || '';
    tipo = params.tipo?.toLowerCase() || '';
    
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
      
      // Si el body está vacío, puede ser una excepción de CPI
      if (!bodyRaw || bodyRaw.trim() === '') {
        console.log('⚠️ Body vacío - Puede ser una excepción de CPI');
        bodyRaw = '';
        body = null;
        formato = 'empty';
      } else {
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
      }
    } catch (e) {
      console.error('❌ Error leyendo body:', e);
      body = null;
      bodyRaw = '';
      formato = 'empty';
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
    // Si hay errorDetails, úsalo como mensaje; si no, usa el body
    let mensaje = '';
    if (allProperties.errorDetails) {
      mensaje = typeof allProperties.errorDetails === 'string' 
        ? allProperties.errorDetails 
        : JSON.stringify(allProperties.errorDetails);
      console.log('📝 Mensaje extraído de errorDetails');
    } else if (bodyRaw && bodyRaw.trim() !== '') {
      mensaje = bodyRaw;
      console.log('📝 Mensaje extraído del body');
    } else {
      // Si no hay body ni errorDetails, crear un mensaje descriptivo
      mensaje = `Excepción en integración ${api.nombre} - Sin payload`;
      console.log('📝 Mensaje generado por defecto (sin payload)');
    }
    
    const timestamp = new Date().toISOString();
    const correlationId = `${api.integracion_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🆔 Correlation ID:', correlationId);
    
    // Determinar tipo de log
    let tipoLog = 'INFO';
    
    // 1. Si hay errorDetails en properties, es un ERROR
    if (hasError) {
      tipoLog = 'ERROR';
      console.log('🔴 Tipo determinado: ERROR (por errorDetails en properties)');
    }
    // 2. Si viene explícitamente en el body
    else if (typeof body === 'object' && body !== null && body.nivel) {
      tipoLog = body.nivel.toUpperCase();
      console.log('📊 Tipo extraído del body.nivel:', tipoLog);
    }
    // 3. Detectar por contenido del mensaje
    else {
      const mensajeLower = mensaje.toLowerCase();
      if (mensajeLower.includes('error') || mensajeLower.includes('fail') || mensajeLower.includes('exception')) {
        tipoLog = 'ERROR';
      } else if (mensajeLower.includes('warning') || mensajeLower.includes('warn')) {
        tipoLog = 'WARNING';
      } else if (mensajeLower.includes('success') || mensajeLower.includes('ok')) {
        tipoLog = 'SUCCESS';
      }
    }
    
    console.log('🏷️ Tipo de log final:', tipoLog);
    
    // Capturar todos los headers
    const allHeaders = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    console.log('📋 Headers capturados:', Object.keys(allHeaders).length);
    
    // Extraer properties de múltiples fuentes
    let properties = {};
    let exchangeProperties = {};
    
    // 1. Si vienen en el body como objeto directo
    if (typeof body === 'object' && body !== null) {
      if (body.properties) {
        properties = body.properties;
        console.log('📊 Properties encontradas en body.properties');
      }
      if (body.exchangeProperties) {
        exchangeProperties = body.exchangeProperties;
        console.log('📊 Exchange Properties encontradas en body');
      }
      if (body.headers) {
        properties.headersFromBody = body.headers;
      }
      // Si el body directamente contiene errorDetails
      if (body.errorDetails) {
        properties.errorDetails = body.errorDetails;
        console.log('🔴 errorDetails encontrado en body directamente');
      }
    }
    
    // 2. Buscar en headers por si CPI envía properties ahí
    const propertiesHeader = request.headers.get('x-exchange-properties') || 
                            request.headers.get('exchangeproperties');
    if (propertiesHeader) {
      try {
        const parsedProperties = JSON.parse(propertiesHeader);
        exchangeProperties = { ...exchangeProperties, ...parsedProperties };
        console.log('📊 Properties encontradas en headers');
      } catch (e) {
        console.warn('⚠️ Error parseando properties del header:', e.message);
      }
    }
    
    // 3. Combinar properties y exchange properties
    const allProperties = { ...properties, ...exchangeProperties };
    console.log('📊 Total properties capturadas:', Object.keys(allProperties).length);
    
    // 4. Detectar si hay errorDetails en properties (indica excepción de CPI)
    const hasError = allProperties.errorDetails || properties.errorDetails;
    if (hasError) {
      console.log('🔴 EXCEPCIÓN DETECTADA - errorDetails presente:', 
        typeof hasError === 'string' ? hasError.substring(0, 100) : 'objeto');
    }
    
    console.log('💾 Guardando log en base de datos...');
    
    // Crear objeto de detalles completo
    const detallesLog = { 
      formato,
      contentType,
      bodySize: bodyRaw?.length || 0,
      bodyEmpty: !bodyRaw || bodyRaw.trim() === '',
      fullMessage: mensaje,
      bodyParsed: typeof body === 'object' ? body : null,
      bodyRaw: bodyRaw || null,
      headers: allHeaders,
      properties: allProperties,
      hasError: !!hasError,
      errorDetails: allProperties.errorDetails || null,
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
    };
    
    console.log('📦 Detalles a guardar:', {
      formato,
      bodyEmpty: detallesLog.bodyEmpty,
      hasError: detallesLog.hasError,
      propertiesCount: Object.keys(allProperties).length
    });
    
    // Registrar el log
    try {
      await db.execute({
        sql: `INSERT INTO logs (integracion_id, tipo, mensaje, detalles, correlation_id, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          api.integracion_id,
          tipoLog,
          mensaje.substring(0, 500),
          JSON.stringify(detallesLog),
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
    
    // Usar las variables que ya declaramos fuera del try
    return Response.json(
      { 
        success: false,
        error: 'Error procesando log', 
        details: error.message,
        errorName: error.name,
        sistema: sistema || params?.sistema || 'unknown',
        tipo: tipo || params?.tipo || 'unknown',
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
