// API para gestionar APIs de SuccessFactors OData
// GET: Listar todas las APIs SSFF
// POST: Crear nueva API SSFF
// DELETE: Eliminar API SSFF

import { getDatabase } from '@/lib/db-client';

// GET - Listar todas las APIs SSFF
export async function GET(request) {
  try {
    const db = getDatabase();
    
    const result = await db.execute({
      sql: 'SELECT * FROM ssff_apis ORDER BY nombre',
      args: []
    });
    
    const apis = result.rows || [];
    
    return Response.json({
      success: true,
      apis,
      total: apis.length
    });
    
  } catch (error) {
    console.error('Error obteniendo APIs SSFF:', error);
    return Response.json(
      { error: 'Error obteniendo APIs SSFF', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear nueva API SSFF
export async function POST(request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, url, username, password } = body;
    
    if (!nombre || !url || !username || !password) {
      return Response.json(
        { error: 'Campos requeridos: nombre, url, username, password' },
        { status: 400 }
    );
    }
    
    const db = getDatabase();
    const apiId = `SSFF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db.execute({
      sql: `INSERT INTO ssff_apis (id, nombre, descripcion, url, username, password, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        apiId,
        nombre,
        descripcion || '',
        url,
        username,
        password,
        1
      ]
    });
    
    return Response.json({
      success: true,
      api: {
        id: apiId,
        nombre,
        descripcion,
        url
      },
      mensaje: 'API SSFF creada exitosamente'
    });
    
  } catch (error) {
    console.error('Error creando API SSFF:', error);
    return Response.json(
      { error: 'Error creando API SSFF', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar API SSFF
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiId = searchParams.get('id');
    
    if (!apiId) {
      return Response.json(
        { error: 'ID de API requerido' },
        { status: 400 }
      );
    }
    
    const db = getDatabase();
    
    // Verificar si existe
    const apiResult = await db.execute({
      sql: 'SELECT * FROM ssff_apis WHERE id = ?',
      args: [apiId]
    });
    
    if (!apiResult.rows || apiResult.rows.length === 0) {
      return Response.json(
        { error: 'API no encontrada' },
        { status: 404 }
      );
    }
    
    // Eliminar API
    await db.execute({
      sql: 'DELETE FROM ssff_apis WHERE id = ?',
      args: [apiId]
    });
    
    return Response.json({
      success: true,
      mensaje: 'API SSFF eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando API SSFF:', error);
    return Response.json(
      { error: 'Error eliminando API SSFF', details: error.message },
      { status: 500 }
    );
  }
}
