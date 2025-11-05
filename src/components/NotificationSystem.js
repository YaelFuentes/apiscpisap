'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Sistema de Notificaciones Toast
 * Muestra alertas en tiempo real para errores, advertencias y éxitos
 */
export default function NotificationSystem() {
  const [notifications, setNotifications] = useState([]);

  // Remover notificación (declarado primero para evitar error de acceso)
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Agregar notificación
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-eliminar después de la duración especificada
    const duration = notification.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  // Exponer funciones globalmente para uso desde cualquier componente
  useEffect(() => {
    window.notify = {
      error: (message, details = null) => addNotification({
        type: 'error',
        title: 'Error',
        message,
        details,
        duration: 8000
      }),
      warning: (message, details = null) => addNotification({
        type: 'warning',
        title: 'Advertencia',
        message,
        details,
        duration: 6000
      }),
      success: (message, details = null) => addNotification({
        type: 'success',
        title: 'Éxito',
        message,
        details,
        duration: 4000
      }),
      info: (message, details = null) => addNotification({
        type: 'info',
        title: 'Información',
        message,
        details,
        duration: 5000
      }),
      api500: (endpoint, error) => addNotification({
        type: 'error',
        title: '🚨 API Error 500',
        message: `Error en ${endpoint}`,
        details: error,
        duration: 10000
      }),
      apiTimeout: (endpoint) => addNotification({
        type: 'warning',
        title: '⏱️ Timeout',
        message: `Timeout en ${endpoint}`,
        details: 'La API no respondió en el tiempo esperado',
        duration: 8000
      }),
      apiFailed: (endpoint, statusCode) => addNotification({
        type: 'error',
        title: `❌ API Error ${statusCode}`,
        message: `Fallo en ${endpoint}`,
        details: `Código de estado: ${statusCode}`,
        duration: 8000
      })
    };

    return () => {
      delete window.notify;
    };
  }, [addNotification]);

  return (
    <div className="fixed top-4 right-4 z-9999 max-w-md space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

/**
 * Componente individual de notificación toast
 */
function NotificationToast({ notification, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Animación de entrada
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getStyles = () => {
    switch (notification.type) {
      case 'error':
        return {
          bg: 'bg-red-500',
          border: 'border-red-600',
          text: 'text-white',
          icon: '❌'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500',
          border: 'border-yellow-600',
          text: 'text-gray-900',
          icon: '⚠️'
        };
      case 'success':
        return {
          bg: 'bg-green-500',
          border: 'border-green-600',
          text: 'text-white',
          icon: '✅'
        };
      case 'info':
        return {
          bg: 'bg-blue-500',
          border: 'border-blue-600',
          text: 'text-white',
          icon: 'ℹ️'
        };
      default:
        return {
          bg: 'bg-gray-500',
          border: 'border-gray-600',
          text: 'text-white',
          icon: '📢'
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`
        ${styles.bg} ${styles.border} ${styles.text}
        border-l-4 rounded-lg shadow-2xl
        transform transition-all duration-300 ease-out
        pointer-events-auto
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        max-w-md w-full
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <span className="text-2xl shrink-0">{styles.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm truncate">
              {notification.title}
            </h4>
            <p className="text-sm mt-1 wrap-break-word">
              {notification.message}
            </p>
            
            {/* Timestamp */}
            <p className="text-xs opacity-75 mt-1">
              {new Date(notification.timestamp).toLocaleTimeString('es-ES')}
            </p>
          </div>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className="ml-2 shrink-0 text-xl opacity-75 hover:opacity-100 transition-opacity"
          aria-label="Cerrar notificación"
        >
          ×
        </button>
      </div>

      {/* Detalles expandibles */}
      {notification.details && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs underline opacity-75 hover:opacity-100 transition-opacity"
          >
            {isExpanded ? '▼ Ocultar detalles' : '▶ Ver detalles'}
          </button>
          
          {isExpanded && (
            <div className="mt-2 p-2 bg-black bg-opacity-20 rounded text-xs font-mono overflow-auto max-h-40">
              {typeof notification.details === 'string' 
                ? notification.details 
                : JSON.stringify(notification.details, null, 2)}
            </div>
          )}
        </div>
      )}

      {/* Barra de progreso */}
      {notification.duration > 0 && (
        <div className="h-1 bg-black bg-opacity-20 overflow-hidden rounded-b-lg">
          <div
            className="h-full bg-white bg-opacity-40"
            style={{
              animation: `shrink ${notification.duration}ms linear`
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Hook personalizado para usar notificaciones
 */
export function useNotifications() {
  return {
    error: (message, details) => window.notify?.error(message, details),
    warning: (message, details) => window.notify?.warning(message, details),
    success: (message, details) => window.notify?.success(message, details),
    info: (message, details) => window.notify?.info(message, details),
    api500: (endpoint, error) => window.notify?.api500(endpoint, error),
    apiTimeout: (endpoint) => window.notify?.apiTimeout(endpoint),
    apiFailed: (endpoint, statusCode) => window.notify?.apiFailed(endpoint, statusCode)
  };
}
