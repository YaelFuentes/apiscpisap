// src/app/api/admin/create-api/route.js
// API para crear APIs genéricas dinámicas

import { getDatabase } from '@/lib/db-client';

export async function POST(request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, formato } = body;

    if (!nombre) {
      return Response.json(
        { error: 'Nombre de API requerido' },
        { status: 400 }
      );
    }

    // Limpiar nombre (sin espacios, minúsculas, guiones)
    const nombreLimpio = nombre.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const db = getDatabase();

    // Verificar si proyecto "generic" existe
    const proyectoResult = await db.execute({
      sql: 'SELECT * FROM proyectos WHERE id = ?',
      args: ['generic']
    });
    
    // Crear proyecto "generic" si no existe
    if (!proyectoResult.rows || proyectoResult.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO proyectos (id, nombre, descripcion, ambiente, protocolo, color)
         VALUES (?, ?, ?, ?, ?, ?)`,
        args: ['generic', 'APIs Genéricas', 'APIs creadas dinámicamente para recibir datos', 'QAS', 'HTTPS', 'from-gray-500 to-zinc-500']
      });
    }

    // Crear integración para esta API
    const apiId = `API-${nombreLimpio.toUpperCase()}`;
    
    await db.execute({
      sql: `INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, intervalo, criticidad, estado, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        apiId,
        'generic',
        `API Genérica: ${nombre}`,
        descripcion || `API para recibir datos en formato ${formato || 'JSON/XML'}`,
        0, // Sin intervalo (recibe datos externos)
        'media',
        'success',
        1
      ]
    });

    // NOTA: En Vercel (serverless) no se pueden crear archivos dinámicamente
    // La API está registrada en la base de datos solamente

    return Response.json({
      success: true,
      endpoint: `/api/generic/${nombreLimpio}`,
      apiId,
      mensaje: 'API genérica registrada exitosamente',
      nota: 'La API está registrada en la base de datos. Para crear el endpoint físico, debes crearlo manualmente en: src/app/api/generic/' + nombreLimpio + '/route.js'
    });

  } catch (error) {
    console.error('Error creando API:', error);
    return Response.json(
      { error: 'Error creando API genérica', details: error.message },
      { status: 500 }
    );
  }
}

