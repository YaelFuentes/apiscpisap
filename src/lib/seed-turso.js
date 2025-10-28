// src/lib/seed-turso.js
// Script para poblar la base de datos Turso con datos de ejemplo

import { getDatabase } from './database-turso.js';

export async function seedDatabase() {
  const db = getDatabase();

  try {
    console.log('🌱 Iniciando seed de la base de datos...\n');

    // Verificar si ya hay datos
    const existingProjects = await db.execute('SELECT COUNT(*) as count FROM proyectos');
    if (existingProjects.rows[0].count > 0) {
      console.log('⚠️  La base de datos ya contiene datos. Saltando seed.');
      return;
    }

    // 1. Insertar Proyectos
    console.log('📁 Insertando proyectos...');
    await db.execute({
      sql: 'INSERT INTO proyectos (id, nombre, descripcion, ambiente, protocolo, color, contacto_responsable, contacto_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: ['evaluar', 'Evaluar', 'Proyecto de evaluación académica', 'QAS', 'HTTPS', 'from-blue-500 to-cyan-500', 'Juan Pérez', 'juan.perez@empresa.com'],
    });

    await db.execute({
      sql: 'INSERT INTO proyectos (id, nombre, descripcion, ambiente, protocolo, color, contacto_responsable, contacto_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: ['teachlr', 'TeachLR', 'Plataforma de gestión de aprendizaje', 'QAS', 'HTTPS', 'from-purple-500 to-pink-500', 'María García', 'maria.garcia@empresa.com'],
    });

    await db.execute({
      sql: 'INSERT INTO proyectos (id, nombre, descripcion, ambiente, protocolo, color, contacto_responsable, contacto_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: ['pruebas', 'Pruebas', 'Ambiente de pruebas y testing', 'QAS', 'HTTPS', 'from-orange-500 to-red-500', 'Carlos López', 'carlos.lopez@empresa.com'],
    });

    console.log('✅ 3 proyectos insertados\n');

    // 2. Insertar Integraciones
    console.log('🔗 Insertando integraciones...');

    // Evaluar
    await db.execute({
      sql: 'INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, intervalo, criticidad, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: ['EVAL-QAS-001', 'evaluar', 'SAP PI - Crear Usuario', 'Integración para crear usuarios en SAP PI', 600000, 'alta', 'success'],
    });

    await db.execute({
      sql: 'INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, intervalo, criticidad, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: ['EVAL-QAS-002', 'evaluar', 'SAP PI - Actualizar Perfil', 'Integración para actualizar perfiles de usuario', 600000, 'media', 'success'],
    });

    // TeachLR
    await db.execute({
      sql: 'INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, intervalo, criticidad, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: ['TCHLR-QAS-001', 'teachlr', 'SAP Cursos - Sincronizar Cursos', 'Sincronización de catálogo de cursos', 900000, 'alta', 'success'],
    });

    await db.execute({
      sql: 'INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, intervalo, criticidad, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: ['TCHLR-QAS-002', 'teachlr', 'SAP Estudiantes - Matricular Estudiante', 'Proceso de matriculación de estudiantes', 300000, 'alta', 'success'],
    });

    await db.execute({
      sql: 'INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, intervalo, criticidad, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: ['TCHLR-QAS-003', 'teachlr', 'SAP Calificaciones - Registrar Notas', 'Registro de calificaciones en SAP', 600000, 'media', 'success'],
    });

    // Pruebas
    await db.execute({
      sql: 'INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, intervalo, criticidad, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: ['PRB-QAS-001', 'pruebas', 'SAP Test - Validar Conexión', 'Validación de conectividad con SAP', 120000, 'baja', 'success'],
    });

    await db.execute({
      sql: 'INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, intervalo, criticidad, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: ['PRB-QAS-002', 'pruebas', 'SAP Test - Prueba de Carga', 'Pruebas de carga y rendimiento', 1800000, 'media', 'success'],
    });

    await db.execute({
      sql: 'INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, intervalo, criticidad, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: ['PRB-QAS-003', 'pruebas', 'SAP Test - Validar Credenciales', 'Validación de credenciales de acceso', 300000, 'alta', 'success'],
    });

    await db.execute({
      sql: 'INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, intervalo, criticidad, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: ['PRB-QAS-004', 'pruebas', 'SAP Test - Health Check', 'Verificación de salud del sistema', 60000, 'baja', 'success'],
    });

    console.log('✅ 9 integraciones insertadas\n');

    // 3. Insertar Ejecuciones y Logs
    console.log('⚙️  Insertando ejecuciones y logs...');

    const integraciones = ['EVAL-QAS-001', 'EVAL-QAS-002', 'TCHLR-QAS-001', 'TCHLR-QAS-002', 'TCHLR-QAS-003', 'PRB-QAS-001', 'PRB-QAS-002', 'PRB-QAS-003', 'PRB-QAS-004'];
    const estados = ['success', 'success', 'success', 'success', 'error', 'warning'];
    const tiposLog = ['SUCCESS', 'INFO', 'WARNING', 'ERROR'];
    
    const now = Date.now();
    let totalEjecuciones = 0;
    let totalLogs = 0;

    for (const integracionId of integraciones) {
      // 20 ejecuciones por integración
      for (let i = 0; i < 20; i++) {
        const estado = estados[Math.floor(Math.random() * estados.length)];
        const fechaInicio = new Date(now - (i * 30 * 60 * 1000)).toISOString(); // Cada 30 min
        const duracion = 500 + Math.floor(Math.random() * 2000);
        const mensajesProcesados = Math.floor(Math.random() * 50) + 1;
        const mensajesExitosos = estado === 'success' ? mensajesProcesados : Math.floor(mensajesProcesados * 0.7);
        const mensajesFallidos = mensajesProcesados - mensajesExitosos;
        const errores = estado === 'error' ? Math.floor(Math.random() * 5) + 1 : 0;
        const correlationId = `CORR-${integracionId}-${Date.now()}-${i}`;

        const result = await db.execute({
          sql: `INSERT INTO ejecuciones (
            integracion_id, estado, fecha_inicio, fecha_fin, duracion,
            mensajes_procesados, mensajes_exitosos, mensajes_fallidos, errores, correlation_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            integracionId,
            estado,
            fechaInicio,
            new Date(new Date(fechaInicio).getTime() + duracion).toISOString(),
            duracion,
            mensajesProcesados,
            mensajesExitosos,
            mensajesFallidos,
            errores,
            correlationId,
          ],
        });

        totalEjecuciones++;
        const ejecucionId = Number(result.lastInsertRowid);

        // Generar 3-5 logs por ejecución
        const numLogs = Math.floor(Math.random() * 3) + 3;
        for (let j = 0; j < numLogs; j++) {
          const tipoLog = estado === 'error' && j === numLogs - 1 ? 'ERROR' : 
                         estado === 'warning' && j === numLogs - 1 ? 'WARNING' : 
                         tiposLog[Math.floor(Math.random() * tiposLog.length)];
          
          const mensajes = {
            SUCCESS: 'Procesamiento completado exitosamente',
            INFO: 'Procesando mensajes en el flujo',
            WARNING: 'Latencia elevada detectada en la conexión',
            ERROR: 'Error de conexión con el sistema SAP',
          };

          await db.execute({
            sql: 'INSERT INTO logs (integracion_id, ejecucion_id, tipo, mensaje, correlation_id, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
            args: [
              integracionId,
              ejecucionId,
              tipoLog,
              mensajes[tipoLog],
              correlationId,
              new Date(new Date(fechaInicio).getTime() + (j * 100)).toISOString(),
            ],
          });

          totalLogs++;
        }
      }
    }

    console.log(`✅ ${totalEjecuciones} ejecuciones insertadas`);
    console.log(`✅ ${totalLogs} logs insertados\n`);

    console.log('🎉 Base de datos poblada exitosamente!');
  } catch (error) {
    console.error('❌ Error poblando la base de datos:', error);
    throw error;
  }
}
