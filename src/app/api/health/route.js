// API Health Check
// Verifica que la API y la base de datos están funcionando correctamente

import { getDatabase } from '@/lib/db-client';

export async function GET(request) {
  const checks = {
    timestamp: new Date().toISOString(),
    api: 'ok',
    database: 'checking',
    environment: process.env.NODE_ENV || 'unknown',
    tursoConfigured: false
  };

  try {
    // Verificar variables de entorno
    checks.tursoConfigured = !!(
      process.env.database_TURSO_DATABASE_URL && 
      process.env.database_TURSO_AUTH_TOKEN
    );

    if (!checks.tursoConfigured) {
      checks.database = 'error';
      checks.databaseError = 'Variables de entorno no configuradas';
      return Response.json(checks, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Verificar conexión a base de datos
    const db = getDatabase();
    const result = await db.execute('SELECT 1 as test');
    
    if (result.rows && result.rows.length > 0) {
      checks.database = 'ok';
      
      // Contar registros en tablas principales
      try {
        const proyectosResult = await db.execute('SELECT COUNT(*) as count FROM proyectos');
        const integracionesResult = await db.execute('SELECT COUNT(*) as count FROM integraciones');
        const logsResult = await db.execute('SELECT COUNT(*) as count FROM logs');
        
        checks.stats = {
          proyectos: proyectosResult.rows[0]?.count || 0,
          integraciones: integracionesResult.rows[0]?.count || 0,
          logs: logsResult.rows[0]?.count || 0
        };
      } catch (statsError) {
        console.warn('No se pudieron obtener estadísticas:', statsError.message);
      }
    } else {
      checks.database = 'error';
      checks.databaseError = 'No se pudo ejecutar query de prueba';
    }

    return Response.json(checks, { 
      status: checks.database === 'ok' ? 200 : 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    checks.database = 'error';
    checks.databaseError = error.message;
    
    return Response.json(checks, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
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
