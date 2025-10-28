// src/lib/seed.js
// Script para inicializar la base de datos con datos de ejemplo

import { getDatabase } from './database.js';
import { ProyectoRepository } from './repositories/ProyectoRepository.js';
import { IntegracionRepository } from './repositories/IntegracionRepository.js';
import { EjecucionRepository } from './repositories/EjecucionRepository.js';
import { LogRepository } from './repositories/LogRepository.js';

export function seedDatabase() {
  console.log('🌱 Iniciando seed de la base de datos...');

  const proyectoRepo = new ProyectoRepository();
  const integracionRepo = new IntegracionRepository();
  const ejecucionRepo = new EjecucionRepository();
  const logRepo = new LogRepository();

  // Verificar si ya hay datos
  const proyectosExistentes = proyectoRepo.findAll();
  if (proyectosExistentes.length > 0) {
    console.log('⚠️  La base de datos ya contiene datos. Saltando seed.');
    return;
  }

  const db = getDatabase();
  
  // Usar transacción para asegurar integridad
  const seed = db.transaction(() => {
    // PROYECTOS
    const proyectos = [
      {
        id: 'evaluar',
        nombre: 'Evaluar',
        descripcion: 'Sistema de evaluaciones y calificaciones',
        ambiente: 'QAS',
        protocolo: 'HTTPS',
        color: 'from-blue-500 to-cyan-500',
        contacto_responsable: 'Equipo Evaluar',
        contacto_email: 'evaluar@example.com'
      },
      {
        id: 'teachlr',
        nombre: 'TeachLR',
        descripcion: 'Plataforma de gestión de aprendizaje',
        ambiente: 'QAS',
        protocolo: 'HTTPS',
        color: 'from-purple-500 to-pink-500',
        contacto_responsable: 'Equipo TeachLR',
        contacto_email: 'teachlr@example.com'
      },
      {
        id: 'pruebas',
        nombre: 'Pruebas',
        descripcion: 'Ambiente de testing y validación',
        ambiente: 'QAS',
        protocolo: 'HTTPS',
        color: 'from-orange-500 to-red-500',
        contacto_responsable: 'Equipo QA',
        contacto_email: 'qa@example.com'
      }
    ];

    proyectos.forEach(p => proyectoRepo.create(p));
    console.log('✅ Proyectos creados');

    // INTEGRACIONES
    const integraciones = [
      // Evaluar
      {
        id: 'EVAL-QAS-001',
        proyecto_id: 'evaluar',
        nombre: 'Sincronización de Evaluaciones',
        descripcion: 'Sincroniza evaluaciones entre sistemas',
        intervalo: 300000,
        criticidad: 'alta',
        estado: 'success',
        activo: 1
      },
      {
        id: 'EVAL-QAS-002',
        proyecto_id: 'evaluar',
        nombre: 'Notificación de Resultados',
        descripcion: 'Envía notificaciones de resultados',
        intervalo: 600000,
        criticidad: 'media',
        estado: 'success',
        activo: 1
      },
      // TeachLR
      {
        id: 'TCHLR-QAS-001',
        proyecto_id: 'teachlr',
        nombre: 'Sincronización de Cursos',
        descripcion: 'Sincroniza catálogo de cursos',
        intervalo: 300000,
        criticidad: 'alta',
        estado: 'success',
        activo: 1
      },
      {
        id: 'TCHLR-QAS-002',
        proyecto_id: 'teachlr',
        nombre: 'Gestión de Usuarios',
        descripcion: 'Administra usuarios y permisos',
        intervalo: 600000,
        criticidad: 'alta',
        estado: 'success',
        activo: 1
      },
      {
        id: 'TCHLR-QAS-003',
        proyecto_id: 'teachlr',
        nombre: 'Reporte de Asistencias',
        descripcion: 'Genera reportes de asistencia',
        intervalo: 600000,
        criticidad: 'media',
        estado: 'success',
        activo: 1
      },
      // Pruebas
      {
        id: 'PRUB-QAS-001',
        proyecto_id: 'pruebas',
        nombre: 'Test de Conectividad',
        descripcion: 'Valida conectividad entre sistemas',
        intervalo: 300000,
        criticidad: 'baja',
        estado: 'success',
        activo: 1
      },
      {
        id: 'PRUB-QAS-002',
        proyecto_id: 'pruebas',
        nombre: 'Validación de Esquemas',
        descripcion: 'Valida esquemas de datos',
        intervalo: 600000,
        criticidad: 'baja',
        estado: 'success',
        activo: 1
      },
      {
        id: 'PRUB-QAS-003',
        proyecto_id: 'pruebas',
        nombre: 'Prueba de Rendimiento',
        descripcion: 'Mide rendimiento del sistema',
        intervalo: 300000,
        criticidad: 'media',
        estado: 'success',
        activo: 1
      },
      {
        id: 'PRUB-QAS-004',
        proyecto_id: 'pruebas',
        nombre: 'Test de Resiliencia',
        descripcion: 'Prueba capacidad de recuperación',
        intervalo: 600000,
        criticidad: 'media',
        estado: 'success',
        activo: 1
      }
    ];

    integraciones.forEach(i => integracionRepo.create(i));
    console.log('✅ Integraciones creadas');

    // EJECUCIONES Y LOGS DE EJEMPLO
    const estados = ['success', 'warning', 'error'];
    const tiposLog = ['SUCCESS', 'INFO', 'WARNING', 'ERROR'];
    
    integraciones.forEach(integracion => {
      // Crear 20 ejecuciones de ejemplo para cada integración
      for (let i = 0; i < 20; i++) {
        const fechaInicio = new Date(Date.now() - (i * 30 * 60 * 1000)); // Cada 30 minutos
        const duracion = Math.floor(Math.random() * 5000) + 500;
        const fechaFin = new Date(fechaInicio.getTime() + duracion);
        const estado = i < 17 ? 'success' : estados[Math.floor(Math.random() * estados.length)];
        
        const ejecucionResult = ejecucionRepo.create({
          integracion_id: integracion.id,
          estado: estado,
          fecha_inicio: fechaInicio.toISOString(),
          fecha_fin: fechaFin.toISOString(),
          duracion: duracion,
          mensajes_procesados: Math.floor(Math.random() * 100) + 10,
          mensajes_exitosos: Math.floor(Math.random() * 90) + 10,
          mensajes_fallidos: Math.floor(Math.random() * 5),
          errores: estado === 'error' ? Math.floor(Math.random() * 5) + 1 : 0,
          correlation_id: `CORR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        });

        const ejecucionId = ejecucionResult.lastInsertRowid;

        // Crear 3-5 logs por ejecución
        const numLogs = Math.floor(Math.random() * 3) + 3;
        for (let j = 0; j < numLogs; j++) {
          const tipoLog = estado === 'error' && j === numLogs - 1 ? 'ERROR' : 
                          tiposLog[Math.floor(Math.random() * tiposLog.length)];
          
          logRepo.create({
            integracion_id: integracion.id,
            ejecucion_id: ejecucionId,
            tipo: tipoLog,
            mensaje: `${tipoLog}: Procesamiento de integración ${integracion.nombre}`,
            detalles: `Detalles de log para ejecución ${ejecucionId}`,
            correlation_id: `CORR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            timestamp: new Date(fechaInicio.getTime() + (j * 1000)).toISOString()
          });
        }
      }
    });

    console.log('✅ Ejecuciones y logs de ejemplo creados');
  });

  // Ejecutar seed
  seed();
  console.log('🎉 Base de datos inicializada con éxito!');
}

// Ejecutar seed si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}
