// API: QAS HTTPS Metrics - Proyecto Evaluar
// Nomenclatura: [ambiente]-[protocolo]-[funcionalidad]
// Retorna métricas y estadísticas de las integraciones desde SQLite

import { MetricasRepository } from '@/lib/repositories/MetricasRepository';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const horas = parseInt(searchParams.get('horas') || '24');

    const metricasRepo = new MetricasRepository();

    // Obtener métricas en tiempo real
    const metricas = metricasRepo.calculateRealtimeMetrics('evaluar', horas);
    
    // Obtener ejecuciones por hora
    const ejecucionesPorHora = metricasRepo.getEjecucionesPorHora('evaluar', horas);

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
        totalEjecuciones: metricas.total_ejecuciones || 0,
        exitosas: metricas.exitosas || 0,
        fallidas: metricas.fallidas || 0,
        enCola: metricas.en_cola || 0,
        tiempoPromedioMs: Math.round(metricas.tiempo_promedio_ms || 0),
        disponibilidad: `${metricas.disponibilidad || 0}%`
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
