// src/app/api/admin/logs/route.js
// API para obtener logs del sistema

import { getDatabase } from '@/lib/db-client';

export async function GET(request) {
  const startTime = Date.now();
  
  try {
    console.log('📊 GET /api/admin/logs - Iniciando consulta');
    
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const sistema = searchParams.get('sistema');
    const tipoIntegracion = searchParams.get('tipoIntegracion');
    const limit = parseInt(searchParams.get('limit') || '100');
    const integracionId = searchParams.get('integracionId');

    console.log('📋 Filtros recibidos:', { tipo, sistema, tipoIntegracion, limit, integracionId });
    
    // Validar límite
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      console.warn('⚠️ Límite inválido:', limit);
      return Response.json({
        success: false,
        error: 'INVALID_LIMIT',
        mensaje: 'El límite debe ser un número entre 1 y 1000',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    let db;
    try {
      db = getDatabase();
      console.log('✅ Conexión a DB obtenida');
    } catch (dbError) {
      console.error('❌ Error conectando a DB:', dbError);
      return Response.json({
        success: false,
        error: 'DATABASE_CONNECTION_FAILED',
        mensaje: 'No se pudo conectar a la base de datos',
        details: dbError.message,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
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

    console.log('🔍 Ejecutando query SQL...');
    let result;
    try {
      result = await db.execute({
        sql: query,
        args: params
      });
      console.log('✅ Query ejecutado exitosamente');
    } catch (queryError) {
      console.error('❌ Error ejecutando query:', queryError);
      return Response.json({
        success: false,
        error: 'DATABASE_QUERY_FAILED',
        mensaje: 'Error al consultar los logs',
        details: queryError.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    let logs = result.rows || [];
    console.log('📦 Logs obtenidos de DB:', logs.length);
    
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
          console.warn('⚠️ Error parseando detalles de log:', e.message);
          return false;
        }
      });
    }
    
    const processingTime = Date.now() - startTime;
    console.log('✅ Consulta completada en', processingTime, 'ms');
    console.log('📊 Logs filtrados:', logs.length);

    return Response.json({
      success: true,
      logs,
      total: logs.length,
      filtros: { tipo, sistema, tipoIntegracion, integracionId, limit },
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Error obteniendo logs:', error);
    console.error('❌ Tipo:', error.name);
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Stack:', error.stack);
    
    return Response.json({
      success: false,
      error: 'LOGS_FETCH_FAILED',
      mensaje: 'Error al obtener los logs',
      details: error.message,
      errorType: error.name,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }, { status: 500 });
  }
}

// DELETE - Eliminar TODOS los logs
export async function DELETE(request) {
  const startTime = Date.now();
  
  try {
    console.log('🗑️ DELETE /api/admin/logs - Iniciando eliminación de todos los logs');
    
    let db;
    try {
      db = getDatabase();
      console.log('✅ Conexión a DB obtenida');
    } catch (dbError) {
      console.error('❌ Error conectando a DB:', dbError);
      return Response.json({
        success: false,
        error: 'DATABASE_CONNECTION_FAILED',
        mensaje: 'No se pudo conectar a la base de datos',
        details: dbError.message,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Contar logs antes de eliminar
    let countBefore = 0;
    try {
      const countResult = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM logs',
        args: []
      });
      countBefore = countResult.rows[0]?.count || 0;
      console.log('📊 Logs a eliminar:', countBefore);
    } catch (countError) {
      console.warn('⚠️ Error contando logs:', countError.message);
    }

    // Eliminar todos los logs
    let result;
    try {
      result = await db.execute({
        sql: 'DELETE FROM logs',
        args: []
      });
      console.log('✅ Logs eliminados exitosamente');
    } catch (deleteError) {
      console.error('❌ Error eliminando logs:', deleteError);
      return Response.json({
        success: false,
        error: 'DELETE_FAILED',
        mensaje: 'Error al eliminar los logs',
        details: deleteError.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    const processingTime = Date.now() - startTime;
    const deletedCount = result.rowsAffected || countBefore;
    console.log('✅ Eliminación completada en', processingTime, 'ms');
    console.log('📊 Logs eliminados:', deletedCount);

    return Response.json({
      success: true,
      deletedCount,
      message: 'Todos los logs han sido eliminados exitosamente',
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Error eliminando todos los logs:', error);
    console.error('❌ Tipo:', error.name);
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Stack:', error.stack);
    
    return Response.json({
      success: false,
      error: 'DELETE_ALL_FAILED',
      mensaje: 'Error crítico al eliminar los logs',
      details: error.message,
      errorType: error.name,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }, { status: 500 });
  }
}
