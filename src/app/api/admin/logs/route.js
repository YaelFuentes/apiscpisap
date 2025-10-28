// src/app/api/admin/logs/route.js
// API para obtener logs del sistema

import { getDatabase } from '@/lib/db-client';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const limit = parseInt(searchParams.get('limit') || '100');
    const integracionId = searchParams.get('integracionId');

    const db = getDatabase();
    let query = `
      SELECT l.*, i.nombre as integracion_nombre 
      FROM logs l
      LEFT JOIN integraciones i ON l.integracion_id = i.id
    `;
    
    const conditions = [];
    const params = [];

    if (tipo && tipo !== 'ALL') {
      conditions.push('l.tipo = ?');
      params.push(tipo);
    }

    if (integracionId) {
      conditions.push('l.integracion_id = ?');
      params.push(integracionId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY l.timestamp DESC LIMIT ?';
    params.push(limit);

    const result = await db.execute(query, params);
    const logs = result.rows || [];

    return Response.json({
      logs,
      total: logs.length,
      filtros: { tipo, integracionId, limit }
    });

  } catch (error) {
    console.error('Error obteniendo logs:', error);
    return Response.json(
      { error: 'Error obteniendo logs', details: error.message },
      { status: 500 }
    );
  }
}
