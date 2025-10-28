// API: QAS HTTPS Logs - Proyecto Evaluar
// Nomenclatura: [ambiente]-[protocolo]-[funcionalidad]
// Retorna los logs de las integraciones HTTPS en QAS desde SQLite

import { LogRepository } from '@/lib/repositories/LogRepository';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const integracionId = searchParams.get('id');
    const tipo = searchParams.get('tipo');
    const limit = parseInt(searchParams.get('limit') || '100');

    const logRepo = new LogRepository();
    let logs = [];

    if (integracionId) {
      // Logs de una integración específica
      if (tipo && tipo !== 'ALL') {
        logs = logRepo.findByTipo(integracionId, tipo, limit);
      } else {
        logs = logRepo.findByIntegracion(integracionId, limit);
      }
    } else {
      // Logs de todo el proyecto
      logs = logRepo.findByProyecto('evaluar', limit);
    }

    // Formatear logs para la respuesta
    const logsFormateados = logs.map(log => ({
      timestamp: log.timestamp,
      tipo: log.tipo,
      mensaje: log.mensaje,
      correlationId: log.correlation_id,
      integracionNombre: log.integracion_nombre
    }));

    return Response.json({
      proyecto: "Evaluar",
      integracionId: integracionId || "ALL",
      total: logsFormateados.length,
      logs: logsFormateados
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error) {
    console.error('Error en API logs:', error);
    return Response.json(
      { error: 'Error al obtener logs', details: error.message },
      { status: 500 }
    );
  }
}
