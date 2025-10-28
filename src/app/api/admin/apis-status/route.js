// src/app/api/admin/apis-status/route.js
// API para obtener el estado de todas las APIs disponibles

import { getDatabase } from '@/lib/database';
import { IntegracionRepository } from '@/lib/repositories/IntegracionRepository';
import { EjecucionRepository } from '@/lib/repositories/EjecucionRepository';

export async function GET() {
  try {
    const db = getDatabase();
    const integracionRepo = new IntegracionRepository(db);
    const ejecucionRepo = new EjecucionRepository(db);

    // Obtener todas las integraciones
    const integraciones = integracionRepo.findAll();

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
    const genericAPIs = db.prepare(`
      SELECT DISTINCT id as nombre FROM integraciones 
      WHERE id LIKE 'API-%'
    `).all();

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

    const apisWithStatus = apis.map(api => {
      // Buscar integraciones relacionadas
      const integsRelacionadas = integraciones.filter(i => 
        i.proyecto_id === api.proyecto
      );

      let usado = false;
      let ultimaEjecucion = null;

      // Verificar si tiene ejecuciones recientes
      integsRelacionadas.forEach(integ => {
        const ultimaEjec = ejecucionRepo.getUltimaEjecucion(integ.id);
        if (ultimaEjec && new Date(ultimaEjec.fecha_inicio) > oneDayAgo) {
          usado = true;
          if (!ultimaEjecucion || new Date(ultimaEjec.fecha_inicio) > new Date(ultimaEjecucion)) {
            ultimaEjecucion = ultimaEjec.fecha_inicio;
          }
        }
      });

      return {
        ...api,
        usado,
        ultimaEjecucion,
        integraciones: integsRelacionadas.length
      };
    });

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
      { error: 'Error obteniendo estado de APIs' },
      { status: 500 }
    );
  }
}
