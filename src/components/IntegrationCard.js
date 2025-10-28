'use client';

import { useState, useEffect } from 'react';

export default function IntegrationCard({ integracion, proyecto }) {
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'success':
        return 'Exitoso';
      case 'warning':
        return 'Advertencia';
      case 'error':
        return 'Error';
      default:
        return 'Desconocido';
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-zinc-200 dark:border-zinc-700 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full ${getEstadoColor(integracion.estado)} animate-pulse`}></div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {integracion.nombre}
            </h3>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">
            {integracion.id}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          integracion.estado === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
          integracion.estado === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {getEstadoTexto(integracion.estado)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-zinc-500 dark:text-zinc-400 mb-1">Última Ejecución</p>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {formatearFecha(integracion.ultimaEjecucion)}
          </p>
        </div>
        <div>
          <p className="text-zinc-500 dark:text-zinc-400 mb-1">Próxima Ejecución</p>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {formatearFecha(integracion.proximaEjecucion)}
          </p>
        </div>
        <div>
          <p className="text-zinc-500 dark:text-zinc-400 mb-1">Duración</p>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {integracion.duracion}ms
          </p>
        </div>
        <div>
          <p className="text-zinc-500 dark:text-zinc-400 mb-1">Mensajes</p>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {integracion.mensajesProcesados}
          </p>
        </div>
      </div>

      {integracion.errores > 0 && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">
            ⚠️ {integracion.errores} error{integracion.errores > 1 ? 'es' : ''} detectado{integracion.errores > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
