// Componente para gestionar APIs personalizadas por sistema
'use client';

import { useState, useEffect } from 'react';

export default function APIManager() {
  const [apis, setApis] = useState([]);
  const [sistemas, setSistemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creando, setCreando] = useState(false);
  const [filtroSistema, setFiltroSistema] = useState('ALL');
  const [inicializandoDB, setInicializandoDB] = useState(false);
  const [errorTabla, setErrorTabla] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    sistema: '',
    nombre: '',
    descripcion: '',
    tipoIntegracion: ''
  });
  
  // Inicializar base de datos
  const handleInitDB = async () => {
    if (!confirm('¿Deseas inicializar/actualizar el esquema de la base de datos?\n\nEsto creará las tablas necesarias si no existen.')) return;
    
    setInicializandoDB(true);
    try {
      const response = await fetch('/api/admin/init-db', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('✅ Base de datos inicializada correctamente!\n\nYa puedes crear APIs.');
        fetchAPIs();
      } else {
        alert(`Error: ${data.error}\n${data.details || ''}`);
      }
    } catch (error) {
      console.error('Error inicializando DB:', error);
      alert('Error al inicializar la base de datos');
    } finally {
      setInicializandoDB(false);
    }
  };
  
  // Cargar APIs
  const fetchAPIs = async () => {
    setLoading(true);
    setErrorTabla(false);
    try {
      const params = filtroSistema !== 'ALL' ? `?sistema=${filtroSistema}` : '';
      const response = await fetch(`/api/admin/apis${params}`);
      const data = await response.json();
      
      if (data.success) {
        setApis(data.apis);
        setSistemas(data.sistemas);
      } else if (data.error && data.error.includes('no such table')) {
        // Si la tabla no existe, mostrar mensaje de error
        setErrorTabla(true);
        console.warn('Tabla apis_personalizadas no existe. Necesitas inicializar la base de datos.');
      }
    } catch (error) {
      console.error('Error cargando APIs:', error);
      if (error.message && error.message.includes('no such table')) {
        setErrorTabla(true);
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAPIs();
  }, [filtroSistema]);
  
  // Crear API
  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.sistema || !formData.nombre || !formData.tipoIntegracion) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    
    setCreando(true);
    try {
      const response = await fetch('/api/admin/apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        alert(`✅ API creada exitosamente!\n\nEndpoint: ${data.api.endpoint}`);
        setFormData({
          sistema: '',
          nombre: '',
          descripcion: '',
          tipoIntegracion: ''
        });
        fetchAPIs();
      } else {
        alert(`Error: ${data.error}\n${data.endpoint ? 'Endpoint: ' + data.endpoint : ''}`);
      }
    } catch (error) {
      console.error('Error creando API:', error);
      alert('Error al crear la API');
    } finally {
      setCreando(false);
    }
  };
  
  // Eliminar API
  const handleDelete = async (apiId, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar la API "${nombre}"?`)) return;
    
    try {
      const response = await fetch(`/api/admin/apis?id=${apiId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('✅ API eliminada exitosamente');
        fetchAPIs();
      } else {
        alert('Error al eliminar la API');
      }
    } catch (error) {
      console.error('Error eliminando API:', error);
      alert('Error al eliminar la API');
    }
  };
  
  // Copiar endpoint
  const copyEndpoint = (endpoint) => {
    const fullUrl = `${window.location.origin}${endpoint}`;
    navigator.clipboard.writeText(fullUrl);
    alert(`✅ Endpoint copiado al portapapeles:\n${fullUrl}`);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">🔧 Gestión de APIs por Sistema</h2>
            <p className="text-purple-100">
              Crea y gestiona APIs personalizadas organizadas por sistema (TeachLR, Evaluar, etc.)
            </p>
          </div>
          
          <button
            onClick={handleInitDB}
            disabled={inicializandoDB}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg font-semibold transition disabled:opacity-50 whitespace-nowrap"
            title="Inicializar esquema de base de datos (crear tabla apis_personalizadas)"
          >
            {inicializandoDB ? '⟳ Inicializando...' : '🔧 Inicializar DB'}
          </button>
        </div>
      </div>
      
      {/* Mensaje de error si la tabla no existe */}
      {errorTabla && (
        <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-400 mb-2">Tabla de Base de Datos No Encontrada</h3>
              <p className="text-red-200 mb-3">
                La tabla <code className="bg-red-900/50 px-2 py-1 rounded">apis_personalizadas</code> no existe en la base de datos.
              </p>
              <p className="text-red-200 mb-4">
                <strong>Solución:</strong> Haz clic en el botón <strong>"🔧 Inicializar DB"</strong> en la esquina superior derecha para crear la tabla.
              </p>
              <button
                onClick={handleInitDB}
                disabled={inicializandoDB}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {inicializandoDB ? '⟳ Inicializando...' : '🔧 Inicializar Base de Datos Ahora'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Formulario de creación */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">➕ Crear Nueva API</h3>
        
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Sistema * <span className="text-xs text-zinc-500">(ej: teachlr, evaluar)</span>
              </label>
              <input
                type="text"
                value={formData.sistema}
                onChange={(e) => setFormData({...formData, sistema: e.target.value})}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                placeholder="teachlr"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Tipo de Integración * <span className="text-xs text-zinc-500">(ej: altas, bajas, modificaciones)</span>
              </label>
              <input
                type="text"
                value={formData.tipoIntegracion}
                onChange={(e) => setFormData({...formData, tipoIntegracion: e.target.value})}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                placeholder="altas"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Nombre Descriptivo *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
              placeholder="API de Altas de Empleados"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
              placeholder="Descripción de la API..."
              rows={2}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={creando}
              className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {creando ? '⟳ Creando...' : '✓ Crear API'}
            </button>
            
            <div className="text-xs text-zinc-500">
              Endpoint generado: <code className="bg-zinc-800 px-2 py-1 rounded">/api/systems/{'{sistema}'}/{'{tipo}'}</code>
            </div>
          </div>
        </form>
      </div>
      
      {/* Filtros y lista */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">📋 APIs Existentes ({apis.length})</h3>
          
          <div className="flex items-center gap-3">
            <select
              value={filtroSistema}
              onChange={(e) => setFiltroSistema(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
            >
              <option value="ALL">Todos los sistemas</option>
              {sistemas.map(sistema => (
                <option key={sistema} value={sistema}>{sistema}</option>
              ))}
            </select>
            
            <button
              onClick={fetchAPIs}
              disabled={loading}
              className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-sm transition"
            >
              {loading ? '⟳ Cargando...' : '↻ Actualizar'}
            </button>
          </div>
        </div>
        
        {apis.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <div className="text-4xl mb-2">📭</div>
            <p>No hay APIs creadas todavía</p>
            <p className="text-sm mt-2">Crea tu primera API usando el formulario de arriba</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apis.map(api => (
              <div key={api.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-semibold rounded">
                        {api.sistema}
                      </span>
                      <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded">
                        {api.tipo_integracion}
                      </span>
                      {api.activo === 1 && (
                        <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded">
                          ✓ Activa
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-white font-semibold mb-1">{api.nombre}</h4>
                    {api.descripcion && (
                      <p className="text-sm text-zinc-400 mb-2">{api.descripcion}</p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs">
                      <code className="px-2 py-1 bg-zinc-900 rounded text-green-400 font-mono">
                        {api.endpoint}
                      </code>
                      <button
                        onClick={() => copyEndpoint(api.endpoint)}
                        className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded transition"
                        title="Copiar URL completa"
                      >
                        📋
                      </button>
                    </div>
                    
                    <div className="mt-2 text-xs text-zinc-500">
                      Integración ID: <code className="text-zinc-400">{api.integracion_id}</code>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(api.id, api.nombre)}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-sm transition"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Ayuda */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-400 mb-3">💡 Cómo usar</h3>
        <ul className="space-y-2 text-sm text-blue-200">
          <li className="flex items-start gap-2">
            <span>1️⃣</span>
            <span>Crea una API especificando el <strong>sistema</strong> (ej: teachlr) y el <strong>tipo de integración</strong> (ej: altas, bajas, modificaciones)</span>
          </li>
          <li className="flex items-start gap-2">
            <span>2️⃣</span>
            <span>El endpoint se genera automáticamente: <code className="bg-blue-900/50 px-2 py-0.5 rounded">/api/systems/teachlr/altas</code></span>
          </li>
          <li className="flex items-start gap-2">
            <span>3️⃣</span>
            <span>Desde CPI, envía logs a ese endpoint usando POST con JSON</span>
          </li>
          <li className="flex items-start gap-2">
            <span>4️⃣</span>
            <span>En el <strong>Monitor de Logs</strong> podrás filtrar por sistema y tipo de integración</span>
          </li>
          <li className="flex items-start gap-2">
            <span>5️⃣</span>
            <span>Ejemplo: puedes ver solo las <strong>altas</strong> del sistema <strong>TeachLR</strong></span>
          </li>
        </ul>
      </div>
    </div>
  );
}
