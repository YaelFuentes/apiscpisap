// src/app/api/admin/logs/[id]/route.js
// API para eliminar un log específico por ID
import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db-client';

export async function DELETE(request, { params }) {
  const startTime = Date.now();
  
  try {
    console.log('🗑️ DELETE /api/admin/logs/[id] - Iniciando eliminación');
    
    // En Next.js 15+, params es una Promise que debe ser unwrapped
    const { id } = await params;
    console.log('📋 ID recibido:', id);

    // Validar que el ID existe
    if (!id) {
      console.warn('⚠️ ID no proporcionado');
      return NextResponse.json({
        success: false,
        error: 'MISSING_ID',
        mensaje: 'ID de log requerido',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validar que el ID es un número válido
    const logId = parseInt(id);
    if (isNaN(logId) || logId < 1) {
      console.warn('⚠️ ID inválido:', id);
      return NextResponse.json({
        success: false,
        error: 'INVALID_ID',
        mensaje: 'El ID debe ser un número positivo',
        providedId: id,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Obtener el cliente de base de datos
    let db;
    try {
      db = getDatabase();
      console.log('✅ Conexión a DB obtenida');
    } catch (dbError) {
      console.error('❌ Error conectando a DB:', dbError);
      return NextResponse.json({
        success: false,
        error: 'DATABASE_CONNECTION_FAILED',
        mensaje: 'No se pudo conectar a la base de datos',
        details: dbError.message,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // Verificar si el log existe antes de intentar eliminarlo
    let logExists = false;
    try {
      const checkResult = await db.execute({
        sql: 'SELECT id FROM logs WHERE id = ?',
        args: [logId]
      });
      logExists = checkResult.rows && checkResult.rows.length > 0;
      console.log('🔍 Log existe:', logExists);
    } catch (checkError) {
      console.warn('⚠️ Error verificando existencia del log:', checkError.message);
      // Continuar con la eliminación de todos modos
    }

    // Eliminar el log de la base de datos
    let result;
    try {
      result = await db.execute({
        sql: 'DELETE FROM logs WHERE id = ?',
        args: [logId]
      });
      console.log('✅ Query de eliminación ejecutado');
    } catch (deleteError) {
      console.error('❌ Error eliminando log:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'DELETE_FAILED',
        mensaje: 'Error al ejecutar la eliminación',
        details: deleteError.message,
        logId,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Verificar si se eliminó algún registro
    if (result.rowsAffected === 0) {
      console.warn('⚠️ Log no encontrado:', logId);
      return NextResponse.json({
        success: false,
        error: 'LOG_NOT_FOUND',
        mensaje: 'El log no existe o ya fue eliminado',
        logId,
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    const processingTime = Date.now() - startTime;
    console.log('✅ Log eliminado exitosamente en', processingTime, 'ms');

    return NextResponse.json({ 
      success: true, 
      mensaje: 'Log eliminado exitosamente',
      logId,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Error crítico eliminando log:', error);
    console.error('❌ Tipo:', error.name);
    console.error('❌ Mensaje:', error.message);
    console.error('❌ Stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      error: 'DELETE_CRITICAL_ERROR',
      mensaje: 'Error crítico al eliminar el log',
      details: error.message,
      errorType: error.name,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }, { status: 500 });
  }
}
