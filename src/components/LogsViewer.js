'use client';

import { useState, useEffect } from 'react';

export default function LogsViewer({ proyecto, apiEndpoint }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        setLogs(data.logs || []);
      } catch (error) {
        console.error('Error al cargar logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 8000); // Actualizar cada 8 segundos
    return () => clearInterval(interval);
  }, [apiEndpoint]);

  const filteredLogs = filter === 'ALL' 
    ? logs 
    : logs.filter(log => log.tipo === filter);

  const getLogColor = (tipo) => {
    switch (tipo) {
      case 'SUCCESS':
        return 'border-green-400 bg-green-50 dark:bg-green-900/20';
      case 'INFO':
        return 'border-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'WARNING':
        return 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'ERROR':
        return 'border-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-zinc-400 bg-zinc-50 dark:bg-zinc-900/20';
    }
  };

  const getLogIcon = (tipo) => {
    switch (tipo) {
      case 'SUCCESS': return '✅';
      case 'INFO': return 'ℹ️';
      case 'WARNING': return '⚠️';
      case 'ERROR': return '❌';
      default: return '📝';
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          📋 Logs - {proyecto}
        </h3>
        
        <div className="flex gap-2">
          {['ALL', 'SUCCESS', 'INFO', 'WARNING', 'ERROR'].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFilter(tipo)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === tipo
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600'
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          Cargando logs...
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredLogs.map((log, index) => (
            <div
              key={index}
              className={`border-l-4 p-3 rounded ${getLogColor(log.tipo)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">{getLogIcon(log.tipo)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                      {new Date(log.timestamp).toLocaleString('es-ES')}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      log.tipo === 'SUCCESS' ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' :
                      log.tipo === 'INFO' ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200' :
                      log.tipo === 'WARNING' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' :
                      'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                    }`}>
                      {log.tipo}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {log.mensaje}
                  </p>
                  <p className="text-xs font-mono text-zinc-500 dark:text-zinc-500 mt-1">
                    ID: {log.correlationId}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
