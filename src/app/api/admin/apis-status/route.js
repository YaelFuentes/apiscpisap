// src/app/api/admin/apis-status/route.js
// API para obtener el estado de todas las APIs disponibles

import { getDatabase } from '@/lib/db-client';

export async function GET() {
  try {
    const db = getDatabase();

    // Obtener todas las integraciones
    const integsResult = await db.execute({
      sql: 'SELECT * FROM integraciones ORDER BY nombre',
      args: []
    });
    const integraciones = integsResult.rows || [];

    // Definir todas las APIs del sistema
    const apis = [
      // Evaluar
      { endpoint: '/api/evaluar/qas-https-status', proyecto: 'evaluar', tipo: 'status' },
      { endpoint: '/api/evaluar/qas-https-logs', proyecto: 'evaluar', tipo: 'logs' },
      { endpoint: '/api/evaluar/qas-https-metrics', proyecto: 'evaluar', tipo: 'metrics' },
      
      // TeachLR
      { endpoint: '/api/teachlr/qas-https-status', proyecto: 'teachlr', tipo: 'status' },
      { endpoint: '/api/teachlr/qas-https-logs', proyecto: 'teachlr', tipo: 'logs' },
      { endpoint: '/api/teachlr/qas-https-metrics', proyecto: 'teachlr', tipo: 'metrics' },
      
      // Pruebas
      { endpoint: '/api/pruebas/qas-https-status', proyecto: 'pruebas', tipo: 'status' },
      { endpoint: '/api/pruebas/qas-https-logs', proyecto: 'pruebas', tipo: 'logs' },
      { endpoint: '/api/pruebas/qas-https-metrics', proyecto: 'pruebas', tipo: 'metrics' },
    ];

    // Obtener APIs genéricas dinámicas
    const genericResult = await db.execute({
      sql: `
      SELECT DISTINCT id as nombre FROM integraciones 
      WHERE id LIKE 'API-%'
    `,
      args: []
    });
    const genericAPIs = genericResult.rows || [];

    genericAPIs.forEach(api => {
      apis.push({
        endpoint: `/api/generic/${api.nombre.toLowerCase()}`,
        proyecto: 'generic',
        tipo: 'generic'
      });
    });

    // Determinar estado de cada API
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneDayAgoISO = oneDayAgo.toISOString();

    const apisWithStatus = await Promise.all(apis.map(async (api) => {
      // Buscar integraciones relacionadas
      const integsRelacionadas = integraciones.filter(i => 
        i.proyecto_id === api.proyecto
      );

      let usado = false;
      let ultimaEjecucion = null;

      // Verificar si tiene ejecuciones recientes
      for (const integ of integsRelacionadas) {
        const ejecResult = await db.execute(
          'SELECT fecha_inicio FROM ejecuciones WHERE integracion_id = ? ORDER BY fecha_inicio DESC LIMIT 1',
          [integ.id]
        );
        
        const ultimaEjec = ejecResult.rows[0];
        if (ultimaEjec && new Date(ultimaEjec.fecha_inicio) > oneDayAgo) {
          usado = true;
          if (!ultimaEjecucion || new Date(ultimaEjec.fecha_inicio) > new Date(ultimaEjecucion)) {
            ultimaEjecucion = ultimaEjec.fecha_inicio;
          }
        }
      }

      return {
        ...api,
        usado,
        ultimaEjecucion,
        integraciones: integsRelacionadas.length
      };
    }));

    // Ordenar: APIs en uso primero (rojas), luego disponibles (verdes)
    apisWithStatus.sort((a, b) => {
      if (a.usado && !b.usado) return -1;
      if (!a.usado && b.usado) return 1;
      return 0;
    });

    return Response.json({
      apis: apisWithStatus,
      total: apisWithStatus.length,
      enUso: apisWithStatus.filter(a => a.usado).length,
      disponibles: apisWithStatus.filter(a => !a.usado).length
    });

  } catch (error) {
    console.error('Error obteniendo estado de APIs:', error);
    return Response.json(
      { error: 'Error obteniendo estado de APIs', details: error.message },
      { status: 500 }
    );
  }
}
