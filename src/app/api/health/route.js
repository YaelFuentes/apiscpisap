// API Health Check
// Verifica que la API, base de datos y endpoints críticos están funcionando correctamente

import { getDatabase } from '@/lib/db-client';

/**
 * Health check mejorado con validación de APIs críticas
 */
export async function GET(request) {
  const startTime = Date.now();
  
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy', // healthy, degraded, unhealthy
    api: { status: 'ok', responseTime: 0 },
    database: { status: 'checking', responseTime: 0 },
    criticalEndpoints: [],
    environment: process.env.NODE_ENV || 'unknown',
    tursoConfigured: false,
    stats: {},
    errors: [],
    warnings: []
  };

  try {
    // 1. Verificar variables de entorno
    checks.tursoConfigured = !!(
      process.env.database_TURSO_DATABASE_URL && 
      process.env.database_TURSO_AUTH_TOKEN
    );

    if (!checks.tursoConfigured) {
      checks.database.status = 'error';
      checks.database.error = 'Variables de entorno no configuradas';
      checks.errors.push('Base de datos no configurada');
      checks.status = 'unhealthy';
      
      return Response.json(checks, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    // 2. Verificar conexión a base de datos
    const dbStartTime = Date.now();
    try {
      const db = getDatabase();
      const result = await db.execute('SELECT 1 as test');
      checks.database.responseTime = Date.now() - dbStartTime;
      
      if (result.rows && result.rows.length > 0) {
        checks.database.status = 'ok';
        
        if (checks.database.responseTime > 1000) {
          checks.warnings.push(`Base de datos lenta: ${checks.database.responseTime}ms`);
          checks.status = 'degraded';
        }
      } else {
        throw new Error('Query de prueba no retornó resultados');
      }
    } catch (dbError) {
      checks.database.status = 'error';
      checks.database.error = dbError.message;
      checks.database.responseTime = Date.now() - dbStartTime;
      checks.errors.push(`Error de base de datos: ${dbError.message}`);
      checks.status = 'unhealthy';
      
      return Response.json(checks, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    // 3. Obtener estadísticas de la base de datos
    try {
      const db = getDatabase();
      
      const proyectosResult = await db.execute('SELECT COUNT(*) as count FROM proyectos');
      const integracionesResult = await db.execute('SELECT COUNT(*) as count FROM integraciones');
      const logsResult = await db.execute('SELECT COUNT(*) as count FROM logs');
      const apisResult = await db.execute('SELECT COUNT(*) as count FROM apis_personalizadas WHERE activo = 1');
      
      // Logs de las últimas 24 horas
      const recentLogsResult = await db.execute(
        `SELECT COUNT(*) as count FROM logs 
         WHERE timestamp >= datetime('now', '-1 day')`
      );
      
      // Logs con errores recientes
      const recentErrorsResult = await db.execute(
        `SELECT COUNT(*) as count FROM logs 
         WHERE tipo = 'ERROR' AND timestamp >= datetime('now', '-1 hour')`
      );
      
      checks.stats = {
        totalProyectos: proyectosResult.rows[0]?.count || 0,
        totalIntegraciones: integracionesResult.rows[0]?.count || 0,
        totalLogs: logsResult.rows[0]?.count || 0,
        apisActivas: apisResult.rows[0]?.count || 0,
        logsLast24h: recentLogsResult.rows[0]?.count || 0,
        errorsLastHour: recentErrorsResult.rows[0]?.count || 0
      };
      
      // Alertar si hay muchos errores recientes
      if (checks.stats.errorsLastHour > 10) {
        checks.warnings.push(`${checks.stats.errorsLastHour} errores en la última hora`);
        checks.status = checks.status === 'healthy' ? 'degraded' : checks.status;
      }
      
    } catch (statsError) {
      console.warn('No se pudieron obtener estadísticas:', statsError.message);
      checks.warnings.push('Estadísticas no disponibles');
    }

    // 4. Verificar integridad de tablas críticas
    try {
      const db = getDatabase();
      const tables = ['proyectos', 'integraciones', 'logs', 'ejecuciones', 'apis_personalizadas'];
      const tableChecks = [];
      
      for (const table of tables) {
        try {
          await db.execute(`SELECT 1 FROM ${table} LIMIT 1`);
          tableChecks.push({ table, status: 'ok' });
        } catch (error) {
          tableChecks.push({ table, status: 'error', error: error.message });
          checks.errors.push(`Tabla ${table} no accesible`);
          checks.status = 'unhealthy';
        }
      }
      
      checks.tables = tableChecks;
    } catch (tableError) {
      checks.warnings.push('No se pudo verificar integridad de tablas');
    }

    // 5. Calcular tiempo total de respuesta
    checks.api.responseTime = Date.now() - startTime;
    
    if (checks.api.responseTime > 3000) {
      checks.warnings.push(`Health check lento: ${checks.api.responseTime}ms`);
      checks.status = checks.status === 'healthy' ? 'degraded' : checks.status;
    }

    // 6. Determinar código de estado HTTP
    const httpStatus = checks.status === 'healthy' ? 200 : 
                       checks.status === 'degraded' ? 200 : 
                       500;

    return Response.json(checks, { 
      status: httpStatus,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': checks.status,
        'X-Response-Time': `${checks.api.responseTime}ms`
      }
    });

  } catch (error) {
    checks.status = 'unhealthy';
    checks.api.status = 'error';
    checks.api.error = error.message;
    checks.errors.push(`Error crítico: ${error.message}`);
    
    return Response.json(checks, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'unhealthy'
      }
    });
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
