// API: QAS HTTPS Status - Proyecto TeachLR
// Nomenclatura: [ambiente]-[protocolo]-[funcionalidad]
// Retorna el estado de las integraciones HTTPS en QAS desde SQLite

import { IntegracionRepository } from '@/lib/repositories/IntegracionRepository';
import { EjecucionRepository } from '@/lib/repositories/EjecucionRepository';
import { ProyectoRepository } from '@/lib/repositories/ProyectoRepository';

export async function GET(request) {
  try {
    const proyectoRepo = new ProyectoRepository();
    const integracionRepo = new IntegracionRepository();
    const ejecucionRepo = new EjecucionRepository();

    const proyecto = proyectoRepo.findById('teachlr');
    if (!proyecto) return Response.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const integraciones = integracionRepo.findByProyecto('teachlr');
    const integracionesConDatos = integraciones.map(integracion => {
      const ultimaEjecucion = ejecucionRepo.findUltimaEjecucion(integracion.id);
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
    });

    return Response.json({
      proyecto: proyecto.nombre,
      ambiente: proyecto.ambiente,
      protocolo: proyecto.protocolo,
      timestamp: new Date().toISOString(),
      integraciones: integracionesConDatos
    }, { 
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
