// API: QAS HTTPS Metrics - Proyecto Evaluar
// Nomenclatura: [ambiente]-[protocolo]-[funcionalidad]
// Retorna métricas y estadísticas de las integraciones desde Turso

import { getDatabase } from '@/lib/db-client';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const horas = parseInt(searchParams.get('horas') || '24');

    const db = getDatabase();

    // Calcular timestamp límite
    const horasAtras = new Date(Date.now() - (horas * 60 * 60 * 1000)).toISOString();

    // Obtener métricas en tiempo real
    const metricasResult = await db.execute(
      `SELECT 
        COUNT(*) as total_ejecuciones,
        SUM(CASE WHEN e.estado = 'success' THEN 1 ELSE 0 END) as exitosas,
        SUM(CASE WHEN e.estado = 'error' THEN 1 ELSE 0 END) as fallidas,
        SUM(CASE WHEN e.estado = 'processing' THEN 1 ELSE 0 END) as en_cola,
        AVG(e.duracion) as tiempo_promedio_ms
       FROM ejecuciones e
       JOIN integraciones i ON e.integracion_id = i.id
       WHERE i.proyecto_id = 'evaluar'
         AND e.fecha_inicio >= ?`,
      [horasAtras]
    );
    
    const metricas = metricasResult.rows[0] || {};
    const totalEjec = metricas.total_ejecuciones || 0;
    const exitosas = metricas.exitosas || 0;
    const disponibilidad = totalEjec > 0 ? ((exitosas / totalEjec) * 100).toFixed(2) : 0;

    // Obtener ejecuciones por hora
    const ejecucionesResult = await db.execute(
      `SELECT 
        strftime('%Y-%m-%d %H:00:00', e.fecha_inicio) as hora,
        COUNT(*) as ejecuciones
       FROM ejecuciones e
       JOIN integraciones i ON e.integracion_id = i.id
       WHERE i.proyecto_id = 'evaluar'
         AND e.fecha_inicio >= ?
       GROUP BY strftime('%Y-%m-%d %H:00:00', e.fecha_inicio)
       ORDER BY hora`,
      [horasAtras]
    );

    const ejecucionesPorHora = ejecucionesResult.rows || [];

    // Formatear para gráfico (últimas 24 horas)
    const horasArray = [];
    for (let i = 23; i >= 0; i--) {
      const fecha = new Date(Date.now() - (i * 60 * 60 * 1000));
      const hora = fecha.getHours();
      const horaStr = `${hora}:00`;
      
      const ejecucion = ejecucionesPorHora.find(e => {
        const ejecHora = new Date(e.hora).getHours();
        return ejecHora === hora;
      });

      horasArray.push({
        hora: horaStr,
        ejecuciones: ejecucion?.ejecuciones || 0
      });
    }

    const data = {
      proyecto: "Evaluar",
      periodo: `últimas ${horas} horas`,
      metricas: {
        totalEjecuciones: totalEjec,
        exitosas: exitosas,
        fallidas: metricas.fallidas || 0,
        enCola: metricas.en_cola || 0,
        tiempoPromedioMs: Math.round(metricas.tiempo_promedio_ms || 0),
        disponibilidad: `${disponibilidad}%`
      },
      integracionesPorHora: horasArray
    };

    return Response.json(data, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error) {
    console.error('Error en API metrics:', error);
    return Response.json(
      { error: 'Error al obtener métricas', details: error.message },
      { status: 500 }
    );
  }
}
