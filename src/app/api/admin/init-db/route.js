// Endpoint para inicializar o actualizar el esquema de la base de datos
// Solo debe ejecutarse cuando se necesite crear/actualizar tablas

import { initializeDatabase } from '@/lib/database-turso';

export async function POST(request) {
  try {
    console.log('🔧 Iniciando actualización de esquema de base de datos...');
    
    await initializeDatabase();
    
    console.log('✅ Esquema de base de datos actualizado exitosamente');
    
    return Response.json({
      success: true,
      mensaje: 'Esquema de base de datos actualizado correctamente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error actualizando esquema:', error);
    return Response.json(
      { 
        error: 'Error actualizando esquema de base de datos', 
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return Response.json({
    endpoint: '/api/admin/init-db',
    method: 'POST',
    description: 'Inicializa o actualiza el esquema de la base de datos',
    warning: 'Este endpoint crea/actualiza todas las tablas necesarias',
    usage: 'Ejecuta un POST a este endpoint para crear la tabla apis_personalizadas'
  });
}
