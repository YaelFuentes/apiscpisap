// API: QAS HTTPS Status - Proyecto Evaluar
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

    // Obtener proyecto
    const proyecto = proyectoRepo.findById('evaluar');
    
    if (!proyecto) {
      return Response.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Obtener integraciones del proyecto
    const integraciones = integracionRepo.findByProyecto('evaluar');

    // Para cada integración, obtener la última ejecución
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

    const data = {
      proyecto: proyecto.nombre,
      ambiente: proyecto.ambiente,
      protocolo: proyecto.protocolo,
      timestamp: new Date().toISOString(),
      integraciones: integracionesConDatos
    };

    return Response.json(data, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error) {
    console.error('Error en API status:', error);
    return Response.json(
      { error: 'Error al obtener datos de la base de datos', details: error.message },
      { status: 500 }
    );
  }
}
