// Configuración centralizada de proyectos e integraciones
// Este archivo facilita la gestión y expansión del sistema de monitoreo

export const PROYECTOS_CONFIG = {
  evaluar: {
    id: 'evaluar',
    nombre: 'Evaluar',
    descripcion: 'Sistema de evaluaciones y calificaciones',
    color: 'from-blue-500 to-cyan-500',
    ambiente: 'QAS',
    protocolo: 'HTTPS',
    integraciones: [
      {
        id: 'EVAL-QAS-001',
        nombre: 'Sincronización de Evaluaciones',
        descripcion: 'Sincroniza evaluaciones entre sistemas',
        intervalo: 300000, // 5 minutos en ms
        criticidad: 'alta'
      },
      {
        id: 'EVAL-QAS-002',
        nombre: 'Notificación de Resultados',
        descripcion: 'Envía notificaciones de resultados',
        intervalo: 600000, // 10 minutos en ms
        criticidad: 'media'
      }
    ],
    contactos: {
      responsable: 'Equipo Evaluar',
      email: 'evaluar@example.com'
    }
  },

  teachlr: {
    id: 'teachlr',
    nombre: 'TeachLR',
    descripcion: 'Plataforma de gestión de aprendizaje',
    color: 'from-purple-500 to-pink-500',
    ambiente: 'QAS',
    protocolo: 'HTTPS',
    integraciones: [
      {
        id: 'TCHLR-QAS-001',
        nombre: 'Sincronización de Cursos',
        descripcion: 'Sincroniza catálogo de cursos',
        intervalo: 300000, // 5 minutos
        criticidad: 'alta'
      },
      {
        id: 'TCHLR-QAS-002',
        nombre: 'Gestión de Usuarios',
        descripcion: 'Administra usuarios y permisos',
        intervalo: 600000, // 10 minutos
        criticidad: 'alta'
      },
      {
        id: 'TCHLR-QAS-003',
        nombre: 'Reporte de Asistencias',
        descripcion: 'Genera reportes de asistencia',
        intervalo: 600000, // 10 minutos
        criticidad: 'media'
      }
    ],
    contactos: {
      responsable: 'Equipo TeachLR',
      email: 'teachlr@example.com'
    }
  },

  pruebas: {
    id: 'pruebas',
    nombre: 'Pruebas',
    descripcion: 'Ambiente de testing y validación',
    color: 'from-orange-500 to-red-500',
    ambiente: 'QAS',
    protocolo: 'HTTPS',
    integraciones: [
      {
        id: 'PRUB-QAS-001',
        nombre: 'Test de Conectividad',
        descripcion: 'Valida conectividad entre sistemas',
        intervalo: 300000, // 5 minutos
        criticidad: 'baja'
      },
      {
        id: 'PRUB-QAS-002',
        nombre: 'Validación de Esquemas',
        descripcion: 'Valida esquemas de datos',
        intervalo: 600000, // 10 minutos
        criticidad: 'baja'
      },
      {
        id: 'PRUB-QAS-003',
        nombre: 'Prueba de Rendimiento',
        descripcion: 'Mide rendimiento del sistema',
        intervalo: 300000, // 5 minutos
        criticidad: 'media'
      },
      {
        id: 'PRUB-QAS-004',
        nombre: 'Test de Resiliencia',
        descripcion: 'Prueba capacidad de recuperación',
        intervalo: 600000, // 10 minutos
        criticidad: 'media'
      }
    ],
    contactos: {
      responsable: 'Equipo QA',
      email: 'qa@example.com'
    }
  }
};

// Configuración de ambientes
export const AMBIENTES = {
  QAS: {
    nombre: 'Quality Assurance',
    descripcion: 'Ambiente de pruebas',
    url: 'https://qas.sapcpi.example.com'
  },
  PRD: {
    nombre: 'Production',
    descripcion: 'Ambiente de producción',
    url: 'https://prd.sapcpi.example.com'
  },
  DEV: {
    nombre: 'Development',
    descripcion: 'Ambiente de desarrollo',
    url: 'https://dev.sapcpi.example.com'
  }
};

// Configuración de protocolos
export const PROTOCOLOS = ['HTTPS', 'SOAP', 'REST', 'ODATA', 'SFTP'];

// Niveles de criticidad
export const CRITICIDAD = {
  alta: {
    label: 'Alta',
    color: 'red',
    prioridad: 1
  },
  media: {
    label: 'Media',
    color: 'yellow',
    prioridad: 2
  },
  baja: {
    label: 'Baja',
    color: 'green',
    prioridad: 3
  }
};

// Estados de integración
export const ESTADOS = {
  success: {
    label: 'Exitoso',
    color: 'green',
    icon: '✅'
  },
  warning: {
    label: 'Advertencia',
    color: 'yellow',
    icon: '⚠️'
  },
  error: {
    label: 'Error',
    color: 'red',
    icon: '❌'
  },
  processing: {
    label: 'En Proceso',
    color: 'blue',
    icon: '🔄'
  }
};

// Tipos de logs
export const LOG_TYPES = {
  SUCCESS: { label: 'Éxito', color: 'green', icon: '✅' },
  INFO: { label: 'Información', color: 'blue', icon: 'ℹ️' },
  WARNING: { label: 'Advertencia', color: 'yellow', icon: '⚠️' },
  ERROR: { label: 'Error', color: 'red', icon: '❌' }
};

// Configuración de actualización
export const REFRESH_INTERVALS = {
  monitor: 10000,    // 10 segundos
  metrics: 15000,    // 15 segundos
  logs: 8000,        // 8 segundos
  alerts: 5000       // 5 segundos
};

// Utilidades
export function getProyectoConfig(proyectoId) {
  return PROYECTOS_CONFIG[proyectoId];
}

export function getAllProyectos() {
  return Object.values(PROYECTOS_CONFIG);
}

export function getIntegracionById(proyectoId, integracionId) {
  const proyecto = PROYECTOS_CONFIG[proyectoId];
  return proyecto?.integraciones.find(i => i.id === integracionId);
}

export function getProyectosByAmbiente(ambiente) {
  return Object.values(PROYECTOS_CONFIG).filter(
    p => p.ambiente === ambiente
  );
}

export function getProyectosByProtocolo(protocolo) {
  return Object.values(PROYECTOS_CONFIG).filter(
    p => p.protocolo === protocolo
  );
}
