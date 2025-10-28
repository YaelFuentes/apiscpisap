// src/components/AdminPanel.js
'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AdminPanel() {
  const [apis, setApis] = useState([]);
  const [integraciones, setIntegraciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateAPI, setShowCreateAPI] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [stats, setStats] = useState(null);

  // Formulario nueva integración
  const [newIntegration, setNewIntegration] = useState({
    nombre: '',
    descripcion: '',
    proyecto_id: 'evaluar',
    criticidad: 'media',
    intervalo: 600000
  });

  // Formulario nueva API
  const [newAPI, setNewAPI] = useState({
    nombre: '',
    descripcion: '',
    formato: 'json'
  });

  // Cargar datos
  const fetchData = useCallback(async () => {
    try {
      const [apisRes, integracionesRes, statsRes] = await Promise.all([
        fetch('/api/admin/apis-status'),
        fetch('/api/admin/integraciones'),
        fetch('/api/admin/stats')
      ]);

      const [apisData, integracionesData, statsData] = await Promise.all([
        apisRes.json(),
        integracionesRes.json(),
        statsRes.json()
      ]);

      setApis(apisData.apis || []);
      setIntegraciones(integracionesData.integraciones || []);
      setStats(statsData);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Crear integración
  const handleCreateIntegration = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/integraciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIntegration)
      });

      if (res.ok) {
        setShowCreateForm(false);
        setNewIntegration({
          nombre: '',
          descripcion: '',
          proyecto_id: 'evaluar',
          criticidad: 'media',
          intervalo: 600000
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error creando integración:', error);
    }
  };

  // Crear API genérica
  const handleCreateAPI = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/create-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAPI)
      });

      if (res.ok) {
        const data = await res.json();
        alert(`API creada: ${data.endpoint}`);
        setShowCreateAPI(false);
        setNewAPI({ nombre: '', descripcion: '', formato: 'json' });
        fetchData();
      }
    } catch (error) {
      console.error('Error creando API:', error);
    }
  };

  // Eliminar integración
  const handleDeleteIntegration = async (id) => {
    try {
      const res = await fetch(`/api/admin/integraciones?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setDeleteConfirm(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error eliminando integración:', error);
    }
  };

  // Limpiar logs antiguos
  const handleCleanLogs = async (days) => {
    if (!confirm(`¿Eliminar logs mayores a ${days} días?`)) return;

    try {
      const res = await fetch('/api/admin/clean-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Eliminados: ${data.deleted} logs`);
        fetchData();
      }
    } catch (error) {
      console.error('Error limpiando logs:', error);
    }
  };

  // Copiar al portapapeles
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copiado al portapapeles');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Total APIs</div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{stats.totalAPIs}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Integraciones</div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{stats.totalIntegraciones}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Logs Totales</div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{stats.totalLogs}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Tamaño BD</div>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{stats.dbSize}</div>
          </div>
        </div>
      )}

      {/* Panel de APIs Disponibles */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            🔌 APIs Disponibles
          </h2>
          <button
            onClick={() => setShowCreateAPI(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            + Nueva API
          </button>
        </div>

        <div className="space-y-2">
          {apis.map((api) => (
            <div
              key={api.endpoint}
              className={`p-4 rounded-lg border-2 ${
                api.usado
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                  : 'bg-green-50 dark:bg-green-900/20 border-green-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-mono bg-white dark:bg-zinc-800 px-3 py-1 rounded">
                      {api.endpoint}
                    </code>
                    {api.usado ? (
                      <span className="text-xs px-2 py-1 bg-red-500 text-white rounded">
                        En uso
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-green-500 text-white rounded">
                        Disponible
                      </span>
                    )}
                  </div>
                  {api.ultimaEjecucion && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                      Última ejecución: {new Date(api.ultimaEjecucion).toLocaleString('es-ES')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => copyToClipboard(window.location.origin + api.endpoint)}
                  className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                >
                  📋 Copiar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gestión de Integraciones */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            🔗 Gestión de Integraciones
          </h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            + Nueva Integración
          </button>
        </div>

        <div className="space-y-3">
          {integraciones.map((integracion) => (
            <div
              key={integracion.id}
              className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {integracion.id} - {integracion.nombre}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    {integracion.descripcion}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                      {integracion.proyecto_id}
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded">
                      {integracion.criticidad}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteConfirm(integracion.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Limpieza de Logs */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          🧹 Limpieza de Datos
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => handleCleanLogs(7)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Limpiar logs &gt; 7 días
          </button>
          <button
            onClick={() => handleCleanLogs(30)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Limpiar logs &gt; 30 días
          </button>
          <button
            onClick={() => handleCleanLogs(90)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Limpiar logs &gt; 90 días
          </button>
        </div>
      </div>

      {/* Modal: Crear Integración */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
              Nueva Integración
            </h3>
            <form onSubmit={handleCreateIntegration} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={newIntegration.nombre}
                  onChange={(e) => setNewIntegration({ ...newIntegration, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newIntegration.descripcion}
                  onChange={(e) => setNewIntegration({ ...newIntegration, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Proyecto
                </label>
                <select
                  value={newIntegration.proyecto_id}
                  onChange={(e) => setNewIntegration({ ...newIntegration, proyecto_id: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="evaluar">Evaluar</option>
                  <option value="teachlr">TeachLR</option>
                  <option value="pruebas">Pruebas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Criticidad
                </label>
                <select
                  value={newIntegration.criticidad}
                  onChange={(e) => setNewIntegration({ ...newIntegration, criticidad: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 bg-zinc-500 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear API */}
      {showCreateAPI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
              Nueva API Genérica
            </h3>
            <form onSubmit={handleCreateAPI} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={newAPI.nombre}
                  onChange={(e) => setNewAPI({ ...newAPI, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  placeholder="mi-api"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newAPI.descripcion}
                  onChange={(e) => setNewAPI({ ...newAPI, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Formato
                </label>
                <select
                  value={newAPI.formato}
                  onChange={(e) => setNewAPI({ ...newAPI, formato: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                  <option value="any">Cualquiera</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Crear API
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateAPI(false)}
                  className="flex-1 px-4 py-2 bg-zinc-500 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
              ⚠️ Confirmar Eliminación
            </h3>
            <p className="text-zinc-700 dark:text-zinc-300 mb-6">
              ¿Estás seguro de eliminar la integración <strong>{deleteConfirm}</strong>?
              <br />
              <span className="text-red-500">Esta acción no se puede deshacer.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteIntegration(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-zinc-500 text-white rounded-lg hover:bg-zinc-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
