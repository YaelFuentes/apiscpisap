// src/components/LogMonitor.js
// Componente para monitoreo visual de logs en tiempo real
'use client';

import { useState, useEffect, useCallback } from 'react';

export default function LogMonitor() {
  const [logs, setLogs] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('ALL');
  const [filtroSistema, setFiltroSistema] = useState('ALL');
  const [filtroIntegracion, setFiltroIntegracion] = useState('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  const [deleting, setDeleting] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [sistemas, setSistemas] = useState([]);
  const [tiposIntegracion, setTiposIntegracion] = useState([]);

  // Función para obtener logs
  const fetchLogs = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroTipo !== 'ALL') params.append('tipo', filtroTipo);
      if (filtroSistema !== 'ALL') params.append('sistema', filtroSistema);
      if (filtroIntegracion !== 'ALL') params.append('tipoIntegracion', filtroIntegracion);
      params.append('limit', '100');

      const response = await fetch(`/api/admin/logs?${params}`);
      const data = await response.json();
      
      if (data.logs) {
        setLogs(data.logs);
        
        // Extraer sistemas y tipos de integración únicos de los logs
        const sistemasSet = new Set();
        const tiposSet = new Set();
        
        data.logs.forEach(log => {
          try {
            const detalles = typeof log.detalles === 'string' 
              ? JSON.parse(log.detalles) 
              : log.detalles;
            
            if (detalles?.apiInfo?.sistema) {
              sistemasSet.add(detalles.apiInfo.sistema);
            }
            if (detalles?.apiInfo?.tipoIntegracion) {
              tiposSet.add(detalles.apiInfo.tipoIntegracion);
            }
          } catch (e) {
            // Ignorar errores de parseo
          }
        });
        
        setSistemas(Array.from(sistemasSet).sort());
        setTiposIntegracion(Array.from(tiposSet).sort());
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroTipo, filtroSistema, filtroIntegracion, loading]);

  // Función para eliminar un log
  const deleteLog = async (logId, e) => {
    e.stopPropagation(); // Evitar que se expanda al hacer click en eliminar
    
    if (!confirm('¿Estás seguro de eliminar este log?')) return;
    
    setDeleting(logId);
    try {
      const response = await fetch(`/api/admin/logs/${logId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remover del estado local
        setLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
        // Remover de expandidos si estaba expandido
        setExpandedLogs(prev => {
          const newSet = new Set(prev);
          newSet.delete(logId);
          return newSet;
        });
      } else {
        alert('Error al eliminar el log');
      }
    } catch (error) {
      console.error('Error eliminando log:', error);
      alert('Error al eliminar el log');
    } finally {
      setDeleting(null);
    }
  };

  // Función para eliminar TODOS los logs
  const deleteAllLogs = async () => {
    if (!confirm('⚠️ ¿Estás seguro de eliminar TODOS los logs? Esta acción no se puede deshacer.')) return;
    
    setDeletingAll(true);
    try {
      const response = await fetch('/api/admin/logs', {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        setLogs([]);
        setExpandedLogs(new Set());
        alert(`✅ ${data.deletedCount} logs eliminados exitosamente`);
      } else {
        alert('Error al eliminar los logs');
      }
    } catch (error) {
      console.error('Error eliminando todos los logs:', error);
      alert('Error al eliminar todos los logs');
    } finally {
      setDeletingAll(false);
    }
  };

  // Auto-refresh cada 5 segundos
  useEffect(() => {
    fetchLogs();
    
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 1000); // Actualización cada 1 segundo
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchLogs]);

  // Toggle expandir/contraer log
  const toggleExpanded = (logId) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  // Obtener color según tipo de log
  const getLogColor = (tipo) => {
    switch (tipo) {
      case 'SUCCESS': return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'ERROR': return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'WARNING': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'INFO': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      default: return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  // Obtener icono según tipo
  const getLogIcon = (tipo) => {
    switch (tipo) {
      case 'SUCCESS': return '✓';
      case 'ERROR': return '✕';
      case 'WARNING': return '⚠';
      case 'INFO': return 'ℹ';
      default: return '•';
    }
  };

  // Formatear timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  };

  // Parsear detalles JSON
  const parseDetalles = (detalles) => {
    try {
      if (typeof detalles === 'string') {
        return JSON.parse(detalles);
      }
      return detalles;
    } catch {
      return null;
    }
  };

  // Estadísticas rápidas
  const stats = {
    total: logs.length,
    success: logs.filter(l => l.tipo === 'SUCCESS').length,
    error: logs.filter(l => l.tipo === 'ERROR').length,
    warning: logs.filter(l => l.tipo === 'WARNING').length,
    info: logs.filter(l => l.tipo === 'INFO').length
  };

  return (
    <div className="space-y-4">
      {/* Header con controles */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">
            📊 Monitor de Logs
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition disabled:opacity-50"
            >
              {loading ? '⟳ Actualizando...' : '↻ Actualizar'}
            </button>
            
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span>Auto-refresh (5s)</span>
            </label>
            
            <button
              onClick={deleteAllLogs}
              disabled={deletingAll || logs.length === 0}
              className="px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition disabled:opacity-50 font-semibold text-red-400"
            >
              {deletingAll ? '⟳ Eliminando...' : '🗑️ Eliminar Todos'}
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-1 text-sm bg-zinc-800 border border-zinc-700 rounded-lg"
          >
            <option value="ALL">📋 Todos los tipos</option>
            <option value="SUCCESS">✓ Success</option>
            <option value="ERROR">✕ Error</option>
            <option value="WARNING">⚠ Warning</option>
            <option value="INFO">ℹ Info</option>
          </select>
          
          <select
            value={filtroSistema}
            onChange={(e) => setFiltroSistema(e.target.value)}
            className="px-3 py-1 text-sm bg-zinc-800 border border-zinc-700 rounded-lg"
          >
            <option value="ALL">🏢 Todos los sistemas</option>
            {sistemas.map(sistema => (
              <option key={sistema} value={sistema}>{sistema}</option>
            ))}
          </select>
          
          <select
            value={filtroIntegracion}
            onChange={(e) => setFiltroIntegracion(e.target.value)}
            className="px-3 py-1 text-sm bg-zinc-800 border border-zinc-700 rounded-lg"
          >
            <option value="ALL">🔧 Todos los tipos</option>
            {tiposIntegracion.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
          <div className="text-xs text-zinc-400 mb-1">Total</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="text-xs text-green-400 mb-1">✓ Success</div>
          <div className="text-2xl font-bold text-green-400">{stats.success}</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <div className="text-xs text-red-400 mb-1">✕ Error</div>
          <div className="text-2xl font-bold text-red-400">{stats.error}</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <div className="text-xs text-yellow-400 mb-1">⚠ Warning</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.warning}</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="text-xs text-blue-400 mb-1">ℹ Info</div>
          <div className="text-2xl font-bold text-blue-400">{stats.info}</div>
        </div>
      </div>

      {/* Lista de logs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <div className="text-4xl mb-2">📭</div>
              <div>No hay logs para mostrar</div>
              <div className="text-sm mt-1">Los logs aparecerán aquí en tiempo real</div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {logs.map((log, index) => {
                const detalles = parseDetalles(log.detalles);
                const logId = log.id || `log-${index}`;
                const isExpanded = expandedLogs.has(logId);
                
                return (
                  <div
                    key={logId}
                    className={`transition border-l-4 ${getLogColor(log.tipo)}`}
                  >
                    {/* Header del log - Clickeable */}
                    <div className="flex items-start gap-4 p-4 hover:bg-zinc-800/50 transition">
                      <button
                        onClick={() => toggleExpanded(logId)}
                        className="flex-1 flex items-start gap-4 text-left"
                      >
                        {/* Timestamp */}
                        <div className="flex-shrink-0 text-center min-w-20">
                          <div className="text-xs text-zinc-500 font-mono">
                            {formatDate(log.timestamp)}
                          </div>
                          <div className="text-lg font-bold text-white font-mono">
                            {formatTime(log.timestamp)}
                          </div>
                        </div>

                        {/* Icono y Tipo */}
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-lg ${getLogColor(log.tipo)} flex items-center justify-center text-xl font-bold`}>
                            {getLogIcon(log.tipo)}
                          </div>
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          {/* Header del log */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getLogColor(log.tipo)}`}>
                              {log.tipo}
                            </span>
                            {log.integracion_nombre && (
                              <span className="px-2 py-0.5 text-xs bg-zinc-700 rounded text-zinc-300">
                                {log.integracion_nombre}
                              </span>
                            )}
                            {log.correlation_id && (
                              <span className="text-xs text-zinc-500 font-mono">
                                {log.correlation_id}
                              </span>
                            )}
                          </div>

                          {/* Mensaje principal */}
                          <div className="text-white mb-2 break-words">
                            {log.mensaje}
                          </div>
                        </div>

                        {/* Icono de expandir/contraer */}
                        <div className="flex-shrink-0">
                          <div className="text-zinc-400 text-xl transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                            ▶
                          </div>
                        </div>
                      </button>

                      {/* Botón de eliminar */}
                      <button
                        onClick={(e) => deleteLog(logId, e)}
                        disabled={deleting === logId}
                        className="flex-shrink-0 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm transition disabled:opacity-50"
                        title="Eliminar log"
                      >
                        {deleting === logId ? '⟳' : '🗑️'}
                      </button>
                    </div>

                    {/* Detalles expandibles */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 bg-black/20">
                        {/* Información del Request */}
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                            📥 Información de la Solicitud
                          </h4>
                          
                          <div className="space-y-2">
                            {log.correlation_id && (
                              <div className="flex gap-2">
                                <span className="text-xs text-zinc-500 min-w-[120px]">Correlation ID:</span>
                                <span className="text-xs text-white font-mono">{log.correlation_id}</span>
                              </div>
                            )}
                            {log.integracion_id && (
                              <div className="flex gap-2">
                                <span className="text-xs text-zinc-500 min-w-[120px]">Integración ID:</span>
                                <span className="text-xs text-white font-mono">{log.integracion_id}</span>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <span className="text-xs text-zinc-500 min-w-[120px]">Timestamp:</span>
                              <span className="text-xs text-white font-mono">{new Date(log.timestamp).toISOString()}</span>
                            </div>
                            {log.ejecucion_id && (
                              <div className="flex gap-2">
                                <span className="text-xs text-zinc-500 min-w-[120px]">Ejecución ID:</span>
                                <span className="text-xs text-white font-mono">{log.ejecucion_id}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Body del mensaje */}
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                            📄 Cuerpo del Mensaje (Body)
                          </h4>
                          <div className="bg-black/50 rounded p-3 overflow-x-auto">
                            <pre className="text-xs text-zinc-300 whitespace-pre-wrap break-words">
                              {log.mensaje}
                            </pre>
                          </div>
                        </div>

                        {/* Detalles técnicos */}
                        {detalles && (
                          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                              🔧 Propiedades y Detalles Técnicos
                            </h4>
                            
                            <div className="space-y-2 mb-3">
                              {detalles.formato && (
                                <div className="flex gap-2">
                                  <span className="text-xs text-zinc-500 min-w-[120px]">Formato:</span>
                                  <span className="text-xs text-white font-mono uppercase">{detalles.formato}</span>
                                </div>
                              )}
                              {detalles.contentType && (
                                <div className="flex gap-2">
                                  <span className="text-xs text-zinc-500 min-w-[120px]">Content-Type:</span>
                                  <span className="text-xs text-white font-mono">{detalles.contentType}</span>
                                </div>
                              )}
                              {detalles.bodySize && (
                                <div className="flex gap-2">
                                  <span className="text-xs text-zinc-500 min-w-[120px]">Tamaño:</span>
                                  <span className="text-xs text-white font-mono">{detalles.bodySize} bytes</span>
                                </div>
                              )}
                            </div>

                            <div className="bg-black/50 rounded p-3 overflow-x-auto">
                              <pre className="text-xs text-zinc-400">
                                {JSON.stringify(detalles, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Headers */}
                        {detalles && detalles.headers && (
                          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                              📋 Headers HTTP
                            </h4>
                            <div className="bg-black/50 rounded p-3 overflow-x-auto">
                              <pre className="text-xs text-zinc-400">
                                {JSON.stringify(detalles.headers, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Estado de respuesta */}
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                            {log.tipo === 'ERROR' ? '❌' : '✅'} Estado de Respuesta
                          </h4>
                          
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                              log.tipo === 'SUCCESS' 
                                ? 'bg-green-500/20 border border-green-500/30' 
                                : log.tipo === 'ERROR'
                                ? 'bg-red-500/20 border border-red-500/30'
                                : log.tipo === 'WARNING'
                                ? 'bg-yellow-500/20 border border-yellow-500/30'
                                : 'bg-blue-500/20 border border-blue-500/30'
                            }`}>
                              <span className="text-2xl">
                                {log.tipo === 'SUCCESS' ? '✅' : log.tipo === 'ERROR' ? '❌' : log.tipo === 'WARNING' ? '⚠️' : 'ℹ️'}
                              </span>
                              <div>
                                <div className={`font-bold ${
                                  log.tipo === 'SUCCESS' ? 'text-green-400' :
                                  log.tipo === 'ERROR' ? 'text-red-400' :
                                  log.tipo === 'WARNING' ? 'text-yellow-400' :
                                  'text-blue-400'
                                }`}>
                                  {log.tipo}
                                </div>
                                <div className="text-xs text-zinc-400">
                                  {log.tipo === 'SUCCESS' ? 'Procesado exitosamente' :
                                   log.tipo === 'ERROR' ? 'Error en el procesamiento' :
                                   log.tipo === 'WARNING' ? 'Completado con advertencias' :
                                   'Información registrada'}
                                </div>
                              </div>
                            </div>

                            {detalles && detalles.fullMessage && detalles.fullMessage !== log.mensaje && (
                              <div className="flex-1">
                                <div className="text-xs text-zinc-500 mb-1">Mensaje completo:</div>
                                <div className="bg-black/50 rounded p-2 max-h-32 overflow-y-auto">
                                  <pre className="text-xs text-zinc-300 whitespace-pre-wrap break-words">
                                    {detalles.fullMessage}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer con info */}
      <div className="text-center text-xs text-zinc-500">
        <div>Última actualización: {new Date().toLocaleTimeString('es-ES')}</div>
        <div className="mt-1">
          Endpoint CPI: <code className="bg-zinc-800 px-2 py-0.5 rounded">/api/cpi/receive-log</code>
        </div>
      </div>
    </div>
  );
}
