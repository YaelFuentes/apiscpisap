// src/app/api/admin/clean-logs/route.js
// API para limpiar logs antiguos

import { getDatabase } from '@/lib/db-client';

export async function POST(request) {
  try {
    const body = await request.json();
    const { days } = body;

    if (!days || days < 1) {
      return Response.json(
        { error: 'Número de días inválido' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Calcular fecha límite
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffISO = cutoffDate.toISOString();

    // Eliminar logs antiguos
    const logsResult = await db.execute(
      'DELETE FROM logs WHERE timestamp < ?',
      [cutoffISO]
    );

    // Eliminar ejecuciones antiguas
    const ejecResult = await db.execute(
      'DELETE FROM ejecuciones WHERE fecha_inicio < ?',
      [cutoffISO]
    );

    const deletedLogs = logsResult.rowsAffected || 0;
    const deletedEjecuciones = ejecResult.rowsAffected || 0;

    return Response.json({
      success: true,
      deletedLogs,
      deletedEjecuciones,
      mensaje: `Eliminados ${deletedLogs} logs y ${deletedEjecuciones} ejecuciones mayores a ${days} días`
    });

  } catch (error) {
    console.error('Error limpiando logs:', error);
    return Response.json(
      { error: 'Error limpiando logs', details: error.message },
      { status: 500 }
    );
  }
}
