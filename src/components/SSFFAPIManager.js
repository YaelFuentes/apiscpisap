// Componente para gestionar y ejecutar APIs de SuccessFactors (SSFF)
'use client';

import { useState, useEffect } from 'react';

export default function SSFFAPIManager() {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ejecutando, setEjecutando] = useState(null);
  const [resultados, setResultados] = useState({});
  const [creando, setCreando] = useState(false);
  
  // Form state para crear nueva API
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    url: '',
    username: '',
    password: ''
  });
  
  // Cargar APIs guardadas
  const fetchAPIs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ssff/apis');
      const data = await response.json();
      
      if (data.success) {
        setApis(data.apis);
      }
    } catch (error) {
      console.error('Error cargando APIs SSFF:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAPIs();
  }, []);
  
  // Crear nueva API
  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.url || !formData.username || !formData.password) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    
    setCreando(true);
    try {
      const response = await fetch('/api/ssff/apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('✅ API de SuccessFactors guardada exitosamente!');
        setFormData({
          nombre: '',
          descripcion: '',
          url: '',
          username: '',
          password: ''
        });
        fetchAPIs();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creando API:', error);
      alert('Error al guardar la API');
    } finally {
      setCreando(false);
    }
  };
  
  // Ejecutar API
  const handleExecute = async (apiId) => {
    setEjecutando(apiId);
    try {
      const response = await fetch(`/api/ssff/execute/${apiId}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      setResultados(prev => ({
        ...prev,
        [apiId]: data
      }));
      
      if (!data.success) {
        alert(`Error ejecutando API: ${data.error}`);
      }
    } catch (error) {
      console.error('Error ejecutando API:', error);
      alert('Error al ejecutar la API');
    } finally {
      setEjecutando(null);
    }
  };
  
  // Eliminar API
  const handleDelete = async (apiId, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar la API "${nombre}"?`)) return;
    
    try {
      const response = await fetch(`/api/ssff/apis?id=${apiId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('✅ API eliminada exitosamente');
        fetchAPIs();
        // Limpiar resultados
        setResultados(prev => {
          const newResults = { ...prev };
          delete newResults[apiId];
          return newResults;
        });
      } else {
        alert('Error al eliminar la API');
      }
    } catch (error) {
      console.error('Error eliminando API:', error);
      alert('Error al eliminar la API');
    }
  };
  
  // Copiar JSON de resultados
  const copyResults = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert('✅ Resultados copiados al portapapeles');
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🔷 APIs SuccessFactors (SSFF)</h2>
        <p className="text-blue-100">
          Guarda y ejecuta consultas OData a SuccessFactors
        </p>
      </div>
      
      {/* Formulario para crear nueva API */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          ➕ Nueva Consulta SSFF
        </h3>
        
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Empleos Modificados Hoy"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Descripción
              </label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción de la consulta"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              URL OData *
            </label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://api17preview.sapsf.com/odata/v2/EmpJob?$select=..."
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="SFAPIUser@company"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={creando}
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creando ? '⏳ Guardando...' : '💾 Guardar API'}
          </button>
        </form>
      </div>
      
      {/* Lista de APIs */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          📋 APIs Guardadas ({apis.length})
        </h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-zinc-600 dark:text-zinc-400 mt-4">Cargando APIs...</p>
          </div>
        ) : apis.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 dark:text-zinc-400">
            <p>No hay APIs guardadas aún</p>
            <p className="text-sm mt-2">Crea tu primera consulta arriba ⬆️</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apis.map((api) => (
              <div key={api.id} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {api.nombre}
                    </h4>
                    {api.descripcion && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        {api.descripcion}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExecute(api.id)}
                      disabled={ejecutando === api.id}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {ejecutando === api.id ? '⏳' : '▶️'} Ejecutar
                    </button>
                    <button
                      onClick={() => handleDelete(api.id, api.nombre)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded p-3 mb-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">URL:</p>
                  <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300 break-all">
                    {api.url}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>👤 {api.username}</span>
                  <span>📅 {new Date(api.created_at).toLocaleString()}</span>
                </div>
                
                {/* Resultados */}
                {resultados[api.id] && (
                  <div className="mt-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        📊 Resultados:
                      </h5>
                      <button
                        onClick={() => copyResults(resultados[api.id])}
                        className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        📋 Copiar JSON
                      </button>
                    </div>
                    
                    {resultados[api.id].success ? (
                      <div className="space-y-2">
                        <div className="flex gap-4 text-sm">
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded">
                            ✅ {resultados[api.id].count} registros
                          </span>
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded">
                            ⏱️ {resultados[api.id].duration}ms
                          </span>
                        </div>
                        
                        <div className="bg-black rounded-lg p-4 overflow-x-auto max-h-96">
                          <pre className="text-xs text-green-400">
                            {JSON.stringify(resultados[api.id].data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-400 font-semibold">
                          ❌ Error: {resultados[api.id].error}
                        </p>
                        {resultados[api.id].details && (
                          <p className="text-xs text-red-700 dark:text-red-500 mt-2">
                            {resultados[api.id].details}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
