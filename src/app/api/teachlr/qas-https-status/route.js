// API: QAS HTTPS Status - Proyecto TeachLR
// Nomenclatura: [ambiente]-[protocolo]-[funcionalidad]
// Retorna el estado de las integraciones HTTPS en QAS desde Turso

import { getDatabase } from '@/lib/db-client';

async function getStatusData() {
  const db = getDatabase();

  const proyectoResult = await db.execute('SELECT * FROM proyectos WHERE id = ?', ['teachlr']);
  const proyecto = proyectoResult.rows[0];
  if (!proyecto) return null;

  const integsResult = await db.execute(
    'SELECT * FROM integraciones WHERE proyecto_id = ? AND activo = 1 ORDER BY nombre',
    ['teachlr']
  );
  const integraciones = integsResult.rows || [];

  const integracionesConDatos = await Promise.all(integraciones.map(async (integracion) => {
    const ejecResult = await db.execute(
      'SELECT * FROM ejecuciones WHERE integracion_id = ? ORDER BY fecha_inicio DESC LIMIT 1',
      [integracion.id]
    );
    const ultimaEjecucion = ejecResult.rows[0];
    return {
      id: integracion.id,
      nombre: integracion.nombre,
      estado: integracion.estado,
      ultimaEjecucion: ultimaEjecucion?.fecha_inicio || new Date().toISOString(),
      proximaEjecucion: ultimaEjecucion 
        ? new Date(new Date(ultimaEjecucion.fecha_inicio).getTime() + integracion.intervalo).toISOString()
        : new Date(Date.now() + integracion.intervalo).toISOString(),
      duracion: ultimaEjecucion?.duracion || 0,
      mensajesProcesados: ultimaEjecucion?.mensajes_procesados || 0,
      errores: ultimaEjecucion?.errores || 0
    };
  }));

  return {
    proyecto: proyecto.nombre,
    ambiente: proyecto.ambiente,
    protocolo: proyecto.protocolo,
    timestamp: new Date().toISOString(),
    integraciones: integracionesConDatos
  };
}

export async function GET(request) {
  try {
    const data = await getStatusData();
    if (!data) return Response.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    return Response.json(data, { 
      status: 200,
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (error) {
    console.error('Error en API status:', error);
    return Response.json(
      { error: 'Error al obtener datos', details: error.message },
      { status: 500 }
    );
  }
}

// Agregar POST para compatibilidad con CPI
export async function POST(request) {
  try {
    const data = await getStatusData();
    if (!data) return Response.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    return Response.json(data, { 
      status: 200,
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (error) {
    console.error('Error en API status:', error);
    return Response.json(
      { error: 'Error al obtener datos', details: error.message },
      { status: 500 }
    );
  }
}
