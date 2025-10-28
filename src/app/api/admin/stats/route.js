// src/app/api/admin/stats/route.js
// API para obtener estadísticas generales del sistema

import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    const db = getDatabase();

    // Contar APIs disponibles (endpoints fijos + dinámicos)
    const totalAPIs = 9; // 3 proyectos x 3 endpoints cada uno

    // Contar integraciones
    const totalIntegraciones = db.prepare(`
      SELECT COUNT(*) as count FROM integraciones
    `).get().count;

    // Contar logs
    const totalLogs = db.prepare(`
      SELECT COUNT(*) as count FROM logs
    `).get().count;

    // Contar ejecuciones
    const totalEjecuciones = db.prepare(`
      SELECT COUNT(*) as count FROM ejecuciones
    `).get().count;

    // Obtener tamaño aproximado de la BD (solo para SQLite local)
    let dbSize = 'N/A';
    try {
      const fs = await import('fs');
      const path = await import('path');
      const dbPath = path.join(process.cwd(), 'data', 'sap-cpi-monitor.db');
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        dbSize = `${sizeInMB} MB`;
      }
    } catch (error) {
      // En producción (Turso) no hay archivo físico
      dbSize = 'Cloud DB';
    }

    // Logs por tipo
    const logsByType = db.prepare(`
      SELECT tipo, COUNT(*) as count 
      FROM logs 
      GROUP BY tipo
    `).all();

    // Integraciones por proyecto
    const integsByProject = db.prepare(`
      SELECT proyecto_id, COUNT(*) as count 
      FROM integraciones 
      GROUP BY proyecto_id
    `).all();

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
      { error: 'Error obteniendo estadísticas' },
      { status: 500 }
    );
  }
}
