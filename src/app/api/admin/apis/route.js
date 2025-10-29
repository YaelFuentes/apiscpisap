// API para gestionar APIs personalizadas por sistema
// GET: Listar todas las APIs
// POST: Crear nueva API
// DELETE: Eliminar API

import { getDatabase } from '@/lib/db-client';

// GET - Listar todas las APIs personalizadas
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sistema = searchParams.get('sistema');
    
    const db = getDatabase();
    
    let query = 'SELECT * FROM apis_personalizadas WHERE 1=1';
    const args = [];
    
    if (sistema) {
      query += ' AND sistema = ?';
      args.push(sistema);
    }
    
    query += ' ORDER BY sistema, tipo_integracion, nombre';
    
    const result = await db.execute({ sql: query, args });
    const apis = result.rows || [];
    
    // Obtener sistemas únicos
    const sistemasResult = await db.execute({
      sql: 'SELECT DISTINCT sistema FROM apis_personalizadas ORDER BY sistema',
      args: []
    });
    const sistemas = sistemasResult.rows?.map(r => r.sistema) || [];
    
    return Response.json({
      success: true,
      apis,
      sistemas,
      total: apis.length
    });
    
  } catch (error) {
    console.error('Error obteniendo APIs:', error);
    return Response.json(
      { error: 'Error obteniendo APIs', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear nueva API personalizada
export async function POST(request) {
  try {
    const body = await request.json();
    const { sistema, nombre, descripcion, tipoIntegracion } = body;
    
    if (!sistema || !nombre || !tipoIntegracion) {
      return Response.json(
        { error: 'Campos requeridos: sistema, nombre, tipoIntegracion' },
        { status: 400 }
      );
    }
    
    // Limpiar nombres para IDs y endpoints
    const sistemaLimpio = sistema.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const tipoLimpio = tipoIntegracion.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const nombreLimpio = nombre.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const db = getDatabase();
    
    // Verificar si el proyecto del sistema existe, si no, crearlo
    const proyectoId = `sistema-${sistemaLimpio}`;
    const proyectoResult = await db.execute({
      sql: 'SELECT id FROM proyectos WHERE id = ?',
      args: [proyectoId]
    });
    
    if (!proyectoResult.rows || proyectoResult.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO proyectos (id, nombre, descripcion, ambiente, protocolo, color, contacto_responsable, contacto_email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          proyectoId,
          `Sistema ${sistema}`,
          `Proyecto para APIs del sistema ${sistema}`,
          'PRD',
          'HTTPS',
          'from-purple-500 to-pink-500',
          'Administrador',
          'admin@sistema.local'
        ]
      });
    }
    
    // Crear integración
    const integracionId = `${sistemaLimpio.toUpperCase()}-${tipoLimpio.toUpperCase()}`;
    const integResult = await db.execute({
      sql: 'SELECT id FROM integraciones WHERE id = ?',
      args: [integracionId]
    });
    
    if (!integResult.rows || integResult.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, estado, activo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          integracionId,
          proyectoId,
          `${sistema} - ${tipoIntegracion}`,
          descripcion || `Integración ${tipoIntegracion} del sistema ${sistema}`,
          'success',
          1
        ]
      });
    }
    
    // Crear API personalizada
    const apiId = `API-${sistemaLimpio.toUpperCase()}-${tipoLimpio.toUpperCase()}-${Date.now()}`;
    const endpoint = `/api/systems/${sistemaLimpio}/${tipoLimpio}`;
    
    // Verificar si el endpoint ya existe
    const endpointCheck = await db.execute({
      sql: 'SELECT id FROM apis_personalizadas WHERE endpoint = ?',
      args: [endpoint]
    });
    
    if (endpointCheck.rows && endpointCheck.rows.length > 0) {
      return Response.json(
        { 
          error: 'Este endpoint ya existe',
          endpoint,
          existingId: endpointCheck.rows[0].id
        },
        { status: 409 }
      );
    }
    
    await db.execute({
      sql: `INSERT INTO apis_personalizadas (id, sistema, nombre, descripcion, tipo_integracion, endpoint, proyecto_id, integracion_id, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        apiId,
        sistema,
        nombre,
        descripcion || '',
        tipoIntegracion,
        endpoint,
        proyectoId,
        integracionId,
        1
      ]
    });
    
    return Response.json({
      success: true,
      api: {
        id: apiId,
        sistema,
        nombre,
        tipoIntegracion,
        endpoint,
        integracionId,
        proyectoId
      },
      mensaje: 'API creada exitosamente'
    });
    
  } catch (error) {
    console.error('Error creando API:', error);
    return Response.json(
      { error: 'Error creando API', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar API personalizada
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
      sql: 'SELECT * FROM apis_personalizadas WHERE id = ?',
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
      sql: 'DELETE FROM apis_personalizadas WHERE id = ?',
      args: [apiId]
    });
    
    return Response.json({
      success: true,
      mensaje: 'API eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando API:', error);
    return Response.json(
      { error: 'Error eliminando API', details: error.message },
      { status: 500 }
    );
  }
}
