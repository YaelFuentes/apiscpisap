/**
 * Utilidad para hacer llamadas a APIs con manejo automático de errores
 * y notificaciones integradas
 */

/**
 * Hace una petición fetch con manejo de errores y notificaciones automáticas
 * @param {string} url - URL del endpoint
 * @param {object} options - Opciones de fetch
 * @param {boolean} showNotifications - Si se deben mostrar notificaciones automáticas
 * @returns {Promise<object>} Respuesta de la API
 */
export async function apiFetch(url, options = {}, showNotifications = true) {
  const startTime = Date.now();
  const timeout = options.timeout || 30000; // 30 segundos por defecto
  
  // Agregar Content-Type por defecto si no existe
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Crear AbortController para timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    const duration = Date.now() - startTime;
    const endpoint = url.replace(window.location.origin, '');

    // Log de performance
    if (duration > 3000) {
      console.warn(`⏱️ API lenta: ${endpoint} tardó ${duration}ms`);
      if (showNotifications && window.notify) {
        window.notify.warning(
          `API lenta: ${endpoint}`,
          `Tiempo de respuesta: ${duration}ms`
        );
      }
    }

    // Manejar respuestas no exitosas
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Error desconocido' };
      }

      // Notificar según el código de estado
      if (showNotifications && window.notify) {
        if (response.status === 500) {
          window.notify.api500(
            endpoint,
            errorData.details || errorData.error || 'Error interno del servidor'
          );
        } else if (response.status === 404) {
          window.notify.warning(
            `API no encontrada: ${endpoint}`,
            'Verifica que el endpoint exista'
          );
        } else if (response.status === 400) {
          window.notify.warning(
            `Petición inválida: ${endpoint}`,
            errorData.error || errorData.mensaje || 'Datos incorrectos'
          );
        } else if (response.status === 401 || response.status === 403) {
          window.notify.error(
            `Acceso denegado: ${endpoint}`,
            'No tienes permisos para acceder a este recurso'
          );
        } else {
          window.notify.apiFailed(endpoint, response.status);
        }
      }

      // Lanzar error con información completa
      const error = new Error(`HTTP ${response.status}: ${errorData.error || errorData.mensaje || 'Error en la API'}`);
      error.status = response.status;
      error.data = errorData;
      error.endpoint = endpoint;
      throw error;
    }

    // Parsear respuesta exitosa
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Log de éxito en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API OK: ${endpoint} (${duration}ms)`, data);
    }

    return data;

  } catch (error) {
    clearTimeout(timeoutId);
    const endpoint = url.replace(window.location.origin, '');

    // Manejar timeout
    if (error.name === 'AbortError') {
      console.error(`⏱️ Timeout en ${endpoint}`);
      if (showNotifications && window.notify) {
        window.notify.apiTimeout(endpoint);
      }
      
      const timeoutError = new Error(`Timeout: ${endpoint} no respondió en ${timeout}ms`);
      timeoutError.isTimeout = true;
      timeoutError.endpoint = endpoint;
      throw timeoutError;
    }

    // Manejar error de red
    if (error.message.includes('Failed to fetch')) {
      console.error(`🌐 Error de red en ${endpoint}`);
      if (showNotifications && window.notify) {
        window.notify.error(
          `Error de conexión: ${endpoint}`,
          'Verifica tu conexión a internet'
        );
      }
    } else if (!error.status) {
      // Error no manejado previamente
      console.error(`❌ Error en ${endpoint}:`, error);
      if (showNotifications && window.notify) {
        window.notify.error(
          `Error inesperado: ${endpoint}`,
          error.message
        );
      }
    }

    throw error;
  }
}

/**
 * GET request helper
 */
export async function apiGet(url, showNotifications = true) {
  return apiFetch(url, { method: 'GET' }, showNotifications);
}

/**
 * POST request helper
 */
export async function apiPost(url, data, showNotifications = true) {
  return apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(data)
  }, showNotifications);
}

/**
 * PUT request helper
 */
export async function apiPut(url, data, showNotifications = true) {
  return apiFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  }, showNotifications);
}

/**
 * DELETE request helper
 */
export async function apiDelete(url, showNotifications = true) {
  return apiFetch(url, { method: 'DELETE' }, showNotifications);
}

/**
 * Monitoreo de salud de APIs críticas
 * Verifica periódicamente que las APIs principales estén funcionando
 */
export class ApiHealthMonitor {
  constructor(endpoints = []) {
    this.endpoints = endpoints;
    this.interval = null;
    this.checkInterval = 60000; // 1 minuto
    this.failureThreshold = 3;
    this.failures = new Map();
  }

  /**
   * Iniciar monitoreo
   */
  start() {
    if (this.interval) return;
    
    console.log('🏥 Iniciando monitor de salud de APIs');
    this.checkAll(); // Check inmediato
    
    this.interval = setInterval(() => {
      this.checkAll();
    }, this.checkInterval);
  }

  /**
   * Detener monitoreo
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('🏥 Monitor de salud detenido');
    }
  }

  /**
   * Verificar todos los endpoints
   */
  async checkAll() {
    for (const endpoint of this.endpoints) {
      await this.checkEndpoint(endpoint);
    }
  }

  /**
   * Verificar un endpoint específico
   */
  async checkEndpoint(endpoint) {
    try {
      await apiFetch(endpoint, { method: 'GET' }, false);
      
      // Resetear contador de fallos si había
      if (this.failures.has(endpoint)) {
        console.log(`✅ ${endpoint} recuperado`);
        this.failures.delete(endpoint);
      }
      
    } catch (error) {
      const failCount = (this.failures.get(endpoint) || 0) + 1;
      this.failures.set(endpoint, failCount);
      
      console.error(`❌ Health check falló para ${endpoint} (${failCount}/${this.failureThreshold})`);
      
      // Alertar solo después de alcanzar el umbral
      if (failCount === this.failureThreshold && window.notify) {
        window.notify.error(
          `🚨 API Crítica Caída`,
          `${endpoint} ha fallado ${failCount} veces consecutivas`
        );
      }
    }
  }

  /**
   * Agregar endpoint al monitoreo
   */
  addEndpoint(endpoint) {
    if (!this.endpoints.includes(endpoint)) {
      this.endpoints.push(endpoint);
    }
  }

  /**
   * Obtener estado de salud
   */
  getHealthStatus() {
    return {
      totalEndpoints: this.endpoints.length,
      healthy: this.endpoints.length - this.failures.size,
      failing: this.failures.size,
      failures: Array.from(this.failures.entries()).map(([endpoint, count]) => ({
        endpoint,
        consecutiveFailures: count,
        critical: count >= this.failureThreshold
      }))
    };
  }
}

/**
 * Instancia global del monitor
 */
export const healthMonitor = new ApiHealthMonitor([
  '/api/health',
  '/api/admin/stats',
  '/api/admin/logs?limit=1'
]);
