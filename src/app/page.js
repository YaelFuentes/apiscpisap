'use client';

import { useState } from 'react';
import LogMonitor from '@/components/LogMonitor';
import GroovyScriptTester from '@/components/GroovyScriptTester';
import IntegrationGuide from '@/components/IntegrationGuide';
import APIManager from '@/components/APIManager';
import SSFFAPIManager from '@/components/SSFFAPIManager';

export default function Home() {
  const [vistaActiva, setVistaActiva] = useState('logs');

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 shadow-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                🚀 Monitor SAP CPI
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Gestión de integraciones y APIs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg font-medium">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Sistema Activo
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-2 bg-white dark:bg-zinc-900 rounded-lg p-2 shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          {[
            { id: 'logs', label: '� Monitor CPI', icon: '�' },
            { id: 'apis', label: '� Crear APIs', icon: '�' },
            { id: 'ssff', label: '� APIs SSFF', icon: '�' },
            { id: 'groovy', label: '🔧 Groovy Scripts', icon: '🔧' },
            { id: 'integration', label: '📘 Guía CPI', icon: '📘' }
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
        {vistaActiva === 'logs' && <LogMonitor />}
        {vistaActiva === 'apis' && <APIManager />}
        {vistaActiva === 'ssff' && <SSFFAPIManager />}
        {vistaActiva === 'groovy' && <GroovyScriptTester />}
        {vistaActiva === 'integration' && <IntegrationGuide />}
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
