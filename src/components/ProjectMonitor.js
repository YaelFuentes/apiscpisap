'use client';

import { useState, useEffect, useCallback } from 'react';
import IntegrationCard from './IntegrationCard';

export default function ProjectMonitor({ proyecto, apiEndpoint }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(apiEndpoint);
      if (!response.ok) throw new Error('Error al cargar datos');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 10000); // Actualizar cada 10 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchData]);

  if (loading && !data) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-8 border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-zinc-600 dark:text-zinc-400">Cargando datos de {proyecto}...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
        <p className="text-red-700 dark:text-red-400">❌ Error: {error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const estadoGeneral = data?.integraciones?.every(i => i.estado === 'success') ? 'success' :
                        data?.integraciones?.some(i => i.estado === 'error') ? 'error' : 'warning';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{data?.proyecto}</h2>
            <p className="text-blue-100 text-sm">
              {data?.ambiente} • {data?.protocolo}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                autoRefresh 
                  ? 'bg-white/20 hover:bg-white/30' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {autoRefresh ? '🔄 Auto-actualización' : '⏸️ Pausado'}
            </button>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md font-medium transition-colors"
            >
              ↻ Actualizar
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${
            estadoGeneral === 'success' ? 'bg-green-400' :
            estadoGeneral === 'error' ? 'bg-red-400' : 'bg-yellow-400'
          } animate-pulse`}></div>
          <span className="text-lg font-semibold">
            {data?.integraciones?.length} Integraciones Monitoreadas
          </span>
        </div>
        
        {data?.timestamp && (
          <p className="text-blue-100 text-sm mt-2">
            Última actualización: {new Date(data.timestamp).toLocaleString('es-ES')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.integraciones?.map((integracion) => (
          <IntegrationCard
            key={integracion.id}
            integracion={integracion}
            proyecto={data.proyecto}
          />
        ))}
      </div>
    </div>
  );
}
