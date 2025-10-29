// src/app/api/admin/logs/route.js
// API para obtener logs del sistema

import { getDatabase } from '@/lib/db-client';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const sistema = searchParams.get('sistema');
    const tipoIntegracion = searchParams.get('tipoIntegracion');
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

    const result = await db.execute({
      sql: query,
      args: params
    });
    let logs = result.rows || [];
    
    // Filtrar por sistema y tipo de integración (post-procesamiento)
    // Esto es necesario porque están dentro del JSON de detalles
    if (sistema && sistema !== 'ALL') {
      logs = logs.filter(log => {
        try {
          const detalles = typeof log.detalles === 'string' 
            ? JSON.parse(log.detalles) 
            : log.detalles;
          return detalles?.apiInfo?.sistema === sistema;
        } catch (e) {
          return false;
        }
      });
    }
    
    if (tipoIntegracion && tipoIntegracion !== 'ALL') {
      logs = logs.filter(log => {
        try {
          const detalles = typeof log.detalles === 'string' 
            ? JSON.parse(log.detalles) 
            : log.detalles;
          return detalles?.apiInfo?.tipoIntegracion === tipoIntegracion;
        } catch (e) {
          return false;
        }
      });
    }

    return Response.json({
      logs,
      total: logs.length,
      filtros: { tipo, sistema, tipoIntegracion, integracionId, limit }
    });

  } catch (error) {
    console.error('Error obteniendo logs:', error);
    return Response.json(
      { error: 'Error obteniendo logs', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar TODOS los logs
export async function DELETE(request) {
  try {
    const db = getDatabase();

    // Eliminar todos los logs
    const result = await db.execute({
      sql: 'DELETE FROM logs',
      args: []
    });

    return Response.json({
      success: true,
      deletedCount: result.rowsAffected || 0,
      message: 'Todos los logs han sido eliminados'
    });

  } catch (error) {
    console.error('Error eliminando todos los logs:', error);
    return Response.json(
      { error: 'Error al eliminar los logs', details: error.message },
      { status: 500 }
    );
  }
}
