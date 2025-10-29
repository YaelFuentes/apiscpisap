// src/app/api/admin/stats/route.js
// API para obtener estadísticas generales del sistema

import { getDatabase } from '@/lib/db-client';

export async function GET() {
  try {
    const db = getDatabase();

    // Contar APIs disponibles (endpoints fijos + dinámicos)
    const totalAPIs = 9; // 3 proyectos x 3 endpoints cada uno

    // Contar integraciones (Turso es asíncrono)
    const integResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM integraciones',
      args: []
    });
    const totalIntegraciones = integResult.rows[0]?.count || 0;

    // Contar logs
    const logsResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM logs',
      args: []
    });
    const totalLogs = logsResult.rows[0]?.count || 0;

    // Contar ejecuciones
    const ejecResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM ejecuciones',
      args: []
    });
    const totalEjecuciones = ejecResult.rows[0]?.count || 0;

    // En Turso (cloud) no hay archivo físico
    const dbSize = 'Cloud DB (Turso)';

    // Logs por tipo
    const logsByTypeResult = await db.execute({
      sql: `
      SELECT tipo, COUNT(*) as count 
      FROM logs 
      GROUP BY tipo
    `,
      args: []
    });
    const logsByType = logsByTypeResult.rows || [];

    // Integraciones por proyecto
    const integsByProjectResult = await db.execute({
      sql: `
      SELECT proyecto_id, COUNT(*) as count 
      FROM integraciones 
      GROUP BY proyecto_id
    `,
      args: []
    });
    const integsByProject = integsByProjectResult.rows || [];

    return Response.json({
      totalAPIs,
      totalIntegraciones,
      totalLogs,
      totalEjecuciones,
      dbSize,
      logsByType,
      integsByProject
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return Response.json(
      { error: 'Error obteniendo estadísticas', details: error.message },
      { status: 500 }
    );
  }
}
