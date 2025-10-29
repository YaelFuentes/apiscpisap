'use client';

import { useState } from 'react';
import ProjectMonitor from '@/components/ProjectMonitor';
import MetricsPanel from '@/components/MetricsPanel';
import LogsViewer from '@/components/LogsViewer';
import AdminPanel from '@/components/AdminPanel';
import LogMonitor from '@/components/LogMonitor';
import GroovyScriptTester from '@/components/GroovyScriptTester';
import IntegrationGuide from '@/components/IntegrationGuide';

export default function Home() {
  const [proyectoActivo, setProyectoActivo] = useState('evaluar');
  const [vistaActiva, setVistaActiva] = useState('monitor');

  const proyectos = [
    {
      id: 'evaluar',
      nombre: 'Evaluar',
      color: 'from-blue-500 to-cyan-500',
      statusEndpoint: '/api/evaluar/qas-https-status',
      metricsEndpoint: '/api/evaluar/qas-https-metrics',
      logsEndpoint: '/api/evaluar/qas-https-logs'
    },
    {
      id: 'teachlr',
      nombre: 'TeachLR',
      color: 'from-purple-500 to-pink-500',
      statusEndpoint: '/api/teachlr/qas-https-status',
      metricsEndpoint: '/api/teachlr/qas-https-metrics',
      logsEndpoint: '/api/teachlr/qas-https-logs'
    },
    {
      id: 'pruebas',
      nombre: 'Pruebas',
      color: 'from-orange-500 to-red-500',
      statusEndpoint: '/api/pruebas/qas-https-status',
      metricsEndpoint: '/api/pruebas/qas-https-metrics',
      logsEndpoint: '/api/pruebas/qas-https-logs'
    }
  ];

  const proyectoSeleccionado = proyectos.find(p => p.id === proyectoActivo);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 shadow-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                🚀 Monitor SAP CPI
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Monitoreo en tiempo real de integraciones QAS HTTPS
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg font-medium">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Sistema Activo
              </div>
            </div>
          </div>

          {/* Selector de Proyectos */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {proyectos.map((proyecto) => (
              <button
                key={proyecto.id}
                onClick={() => setProyectoActivo(proyecto.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  proyectoActivo === proyecto.id
                    ? `bg-gradient-to-r ${proyecto.color} text-white shadow-lg scale-105`
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {proyecto.nombre}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-2 bg-white dark:bg-zinc-900 rounded-lg p-2 shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          {[
            { id: 'monitor', label: '📊 Monitor', icon: '📊' },
            { id: 'metrics', label: '📈 Métricas', icon: '📈' },
            { id: 'logs', label: '📋 Logs', icon: '📋' },
            { id: 'realtime', label: '🔴 Logs Real-Time', icon: '🔴' },
            { id: 'groovy', label: '🔧 Groovy Scripts', icon: '🔧' },
            { id: 'integration', label: '📘 Guía CPI', icon: '📘' },
            { id: 'admin', label: '⚙️ Admin', icon: '⚙️' }
          ].map((vista) => (
            <button
              key={vista.id}
              onClick={() => setVistaActiva(vista.id)}
              className={`flex-1 px-6 py-3 rounded-md font-medium transition-all whitespace-nowrap ${
                vistaActiva === vista.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {vista.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {vistaActiva === 'monitor' && (
          <ProjectMonitor
            proyecto={proyectoSeleccionado.nombre}
            apiEndpoint={proyectoSeleccionado.statusEndpoint}
          />
        )}

        {vistaActiva === 'metrics' && (
          <MetricsPanel
            proyecto={proyectoSeleccionado.nombre}
            apiEndpoint={proyectoSeleccionado.metricsEndpoint}
          />
        )}

        {vistaActiva === 'logs' && (
          <LogsViewer
            proyecto={proyectoSeleccionado.nombre}
            apiEndpoint={proyectoSeleccionado.logsEndpoint}
          />
        )}

        {vistaActiva === 'realtime' && (
          <LogMonitor />
        )}

        {vistaActiva === 'groovy' && (
          <GroovyScriptTester />
        )}

        {vistaActiva === 'integration' && (
          <IntegrationGuide />
        )}

        {vistaActiva === 'admin' && (
          <AdminPanel />
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-8 mt-12">
        <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>Monitor SAP CPI • Actualización automática cada 10 segundos</p>
        </div>
      </footer>
    </div>
  );
}
