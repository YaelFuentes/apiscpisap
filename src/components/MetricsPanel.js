'use client';

import { useState, useEffect } from 'react';

export default function MetricsPanel({ proyecto, apiEndpoint }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error al cargar métricas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000); // Actualizar cada 15 segundos
    return () => clearInterval(interval);
  }, [apiEndpoint]);

  if (loading || !metrics) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-zinc-200 dark:border-zinc-700">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-zinc-200 dark:border-zinc-700">
      <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
        📊 Métricas - {proyecto}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Ejecuciones</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {metrics.metricas.totalEjecuciones}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400 mb-1">Exitosas</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {metrics.metricas.exitosas}
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400 mb-1">Fallidas</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
            {metrics.metricas.fallidas}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Disponibilidad</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {metrics.metricas.disponibilidad}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">Tiempo Promedio</p>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {metrics.metricas.tiempoPromedioMs}ms
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">En Cola</p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            {metrics.metricas.enCola}
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
          Ejecuciones por Hora (Últimas 24h)
        </h4>
        <div className="flex items-end gap-1 h-32">
          {metrics.integracionesPorHora.slice(0, 24).reverse().map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t hover:from-blue-600 hover:to-blue-400 transition-colors cursor-pointer"
                style={{ height: `${(item.ejecuciones / 100) * 100}%`, minHeight: '4px' }}
                title={`${item.hora}: ${item.ejecuciones} ejecuciones`}
              ></div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-zinc-500 dark:text-zinc-500">
          <span>24h atrás</span>
          <span>Ahora</span>
        </div>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4">
        Período: {metrics.periodo}
      </p>
    </div>
  );
}
