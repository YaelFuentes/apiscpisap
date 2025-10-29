// Componente para consultar APIs de SuccessFactors (SSFF) en tiempo real
'use client';

import { useState } from 'react';

export default function SSFFAPIManager() {
  const [ejecutando, setEjecutando] = useState(false);
  const [resultado, setResultado] = useState(null);
  
  // Constantes fijas
  const BASE_URL = 'https://api17preview.sapsf.com/odata/v2/';
  const USERNAME = 'SFAPIUser@gerdaumetaT1';
  const PASSWORD = 'Agp.2025';
  
  // Form state - solo entidad y query params
  const [formData, setFormData] = useState({
    entidad: 'EmpJob',
    queryParams: '?$select=userId,event,eventReason,lastModifiedDateTime,employmentNav/personNav/nationalIdNav/personIdExternal,company,location&$expand=employmentNav/personNav/nationalIdNav,employmentNav/personNav,employmentNav'
  });
  
  // Ejecutar consulta OData (ahora desde el servidor)
  const handleExecute = async (e) => {
    e.preventDefault();
    
    if (!formData.entidad) {
      alert('Por favor ingresa una entidad');
      return;
    }
    
    setEjecutando(true);
    setResultado(null);
    
    try {
      console.log('🔷 Ejecutando consulta SSFF...');
      
      // Llamar al endpoint del servidor
      const response = await fetch('/api/ssff/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entidad: formData.entidad,
          queryParams: formData.queryParams
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('❌ Error en respuesta:', data);
        setResultado(data);
        return;
      }
      
      console.log('✅ Consulta SSFF exitosa');
      console.log('📊 Registros:', data.count);
      
      setResultado(data);
      
    } catch (error) {
      console.error('❌ Error ejecutando consulta SSFF:', error);
      
      setResultado({
        success: false,
        error: 'Error de red o servidor',
        details: error.message
      });
    } finally {
      setEjecutando(false);
    }
  };
  
  // Copiar JSON de resultados
  const copyResults = () => {
    navigator.clipboard.writeText(JSON.stringify(resultado.data, null, 2));
    alert('✅ Resultados copiados al portapapeles');
  };
  
  // Limpiar resultados
  const clearResults = () => {
    setResultado(null);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🔷 Consulta SuccessFactors OData</h2>
        <p className="text-blue-100">
          Ejecuta consultas en tiempo real a la API de SuccessFactors
        </p>
      </div>
      
      {/* Información de credenciales */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
          🔒 Credenciales configuradas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-blue-700 dark:text-blue-400 font-medium">Base URL:</span>
            <span className="ml-2 text-blue-900 dark:text-blue-200 font-mono text-xs">{BASE_URL}</span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-400 font-medium">Usuario:</span>
            <span className="ml-2 text-blue-900 dark:text-blue-200 font-mono text-xs">{USERNAME}</span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-400 font-medium">Password:</span>
            <span className="ml-2 text-blue-900 dark:text-blue-200 font-mono text-xs">••••••••</span>
          </div>
        </div>
      </div>
      
      {/* Formulario de consulta */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          🔍 Ejecutar Consulta OData
        </h3>
        
        <form onSubmit={handleExecute} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Entidad *
            </label>
            <input
              type="text"
              value={formData.entidad}
              onChange={(e) => setFormData({ ...formData, entidad: e.target.value })}
              placeholder="EmpJob"
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-lg"
              required
            />
            <p className="text-xs text-zinc-500 mt-1">Ejemplos: EmpJob, User, PerPerson, FOCompany</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Parámetros de consulta (opcional)
            </label>
            <textarea
              value={formData.queryParams}
              onChange={(e) => setFormData({ ...formData, queryParams: e.target.value })}
              placeholder="?$select=userId,firstName,lastName&$top=10"
              rows={3}
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Usa $select, $expand, $filter, $top, etc. Debe empezar con ?
            </p>
          </div>
          
          {/* Preview de la URL */}
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">URL completa:</p>
            <p className="text-sm text-zinc-900 dark:text-zinc-100 font-mono break-all">
              {BASE_URL}<span className="text-blue-600 dark:text-blue-400 font-bold">{formData.entidad}</span><span className="text-green-600 dark:text-green-400">{formData.queryParams}</span>
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={ejecutando}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {ejecutando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Ejecutando...
                </>
              ) : (
                <>▶️ Ejecutar Consulta</>
              )}
            </button>
            
            {resultado && (
              <button
                type="button"
                onClick={clearResults}
                className="px-6 py-3 bg-zinc-500 text-white rounded-lg font-semibold hover:bg-zinc-600"
              >
                �️ Limpiar
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Resultados */}
      {resultado && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              � Resultados de la Consulta
            </h3>
            {resultado.success && (
              <button
                onClick={copyResults}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex items-center gap-2"
              >
                📋 Copiar JSON
              </button>
            )}
          </div>
          
          {resultado.success ? (
            <div className="space-y-4">
              {/* Métricas */}
              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg font-semibold">
                  ✅ {resultado.count} registro{resultado.count !== 1 ? 's' : ''}
                </div>
                <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-lg font-semibold">
                  ⏱️ {resultado.duration}ms
                </div>
                <div className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-lg font-mono text-xs">
                  🕐 {new Date(resultado.timestamp).toLocaleTimeString()}
                </div>
              </div>
              
              {/* URL ejecutada */}
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">URL ejecutada:</p>
                <p className="text-xs text-zinc-900 dark:text-zinc-100 font-mono break-all">
                  {resultado.url}
                </p>
              </div>
              
              {/* JSON Response */}
              <div className="bg-black rounded-lg p-4 overflow-x-auto" style={{ maxHeight: '600px' }}>
                <pre className="text-xs text-green-400">
                  {JSON.stringify(resultado.data, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-6">
              <h4 className="text-red-800 dark:text-red-400 font-bold text-lg mb-3">
                ❌ Error en la consulta
              </h4>
              <p className="text-red-800 dark:text-red-400 font-semibold mb-2">
                {resultado.error}
              </p>
              {resultado.details && (
                <div className="mt-3 bg-red-200 dark:bg-red-900/50 rounded p-3">
                  <p className="text-xs text-red-900 dark:text-red-300 font-mono whitespace-pre-wrap">
                    {resultado.details}
                  </p>
                </div>
              )}
              {resultado.url && (
                <div className="mt-3">
                  <p className="text-xs text-red-700 dark:text-red-500 mb-1">URL intentada:</p>
                  <p className="text-xs text-red-900 dark:text-red-300 font-mono break-all">
                    {resultado.url}
                  </p>
                </div>
              )}
              {resultado.duration && (
                <p className="text-xs text-red-700 dark:text-red-500 mt-2">
                  Duración: {resultado.duration}ms
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
