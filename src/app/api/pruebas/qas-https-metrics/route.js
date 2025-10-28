// API: QAS HTTPS Metrics - Proyecto Pruebas
// Nomenclatura: [ambiente]-[protocolo]-[funcionalidad]
// Retorna métricas y estadísticas de las integraciones

export async function GET(request) {
  try {
    const data = {
      proyecto: "Pruebas",
      periodo: "últimas 24 horas",
      metricas: {
        totalEjecuciones: Math.floor(Math.random() * 800) + 300,
        exitosas: Math.floor(Math.random() * 700) + 280,
        fallidas: Math.floor(Math.random() * 40),
        enCola: Math.floor(Math.random() * 8),
        tiempoPromedioMs: Math.floor(Math.random() * 2000) + 500,
        disponibilidad: (96 + Math.random() * 4).toFixed(2) + "%"
      },
      integracionesPorHora: Array.from({ length: 24 }, (_, i) => ({
        hora: `${23 - i}:00`,
        ejecuciones: Math.floor(Math.random() * 40) + 10
      }))
    };

    return Response.json(data, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error) {
    return Response.json(
      { error: 'Error al obtener métricas', details: error.message },
      { status: 500 }
    );
  }
}
