// API: QAS HTTPS Logs - Proyecto Evaluar
// Nomenclatura: [ambiente]-[protocolo]-[funcionalidad]
// Retorna los logs de las integraciones HTTPS en QAS desde Turso

import { getDatabase } from '@/lib/db-client';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const integracionId = searchParams.get('id');
    const tipo = searchParams.get('tipo');
    const limit = parseInt(searchParams.get('limit') || '100');

    const db = getDatabase();
    let logs = [];

    if (integracionId) {
      // Logs de una integración específica
      if (tipo && tipo !== 'ALL') {
        const result = await db.execute(
          `SELECT l.*, i.nombre as integracion_nombre 
           FROM logs l 
           JOIN integraciones i ON l.integracion_id = i.id 
           WHERE l.integracion_id = ? AND l.tipo = ? 
           ORDER BY l.timestamp DESC 
           LIMIT ?`,
          [integracionId, tipo, limit]
        );
        logs = result.rows || [];
      } else {
        const result = await db.execute(
          `SELECT l.*, i.nombre as integracion_nombre 
           FROM logs l 
           JOIN integraciones i ON l.integracion_id = i.id 
           WHERE l.integracion_id = ? 
           ORDER BY l.timestamp DESC 
           LIMIT ?`,
          [integracionId, limit]
        );
        logs = result.rows || [];
      }
    } else {
      // Logs de todo el proyecto
      const result = await db.execute(
        `SELECT l.*, i.nombre as integracion_nombre 
         FROM logs l 
         JOIN integraciones i ON l.integracion_id = i.id 
         WHERE i.proyecto_id = 'evaluar' 
         ORDER BY l.timestamp DESC 
         LIMIT ?`,
        [limit]
      );
      logs = result.rows || [];
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
