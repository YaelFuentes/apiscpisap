/**
 * Utilidades para optimizar el rendimiento de la aplicación
 */

/**
 * Debounce: Retrasa la ejecución de una función hasta que pase un tiempo sin ser llamada
 * Útil para inputs, búsquedas, resize, scroll
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle: Limita la frecuencia de ejecución de una función
 * Útil para scroll, resize, mousemove
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Cache simple para resultados de funciones
 */
export class SimpleCache {
  constructor(ttl = 60000) { // TTL por defecto 1 minuto
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Verificar si expiró
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  set(key, value, customTtl = null) {
    const expiry = Date.now() + (customTtl || this.ttl);
    this.cache.set(key, { value, expiry });
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    // Limpiar entradas expiradas
    for (const [key, item] of this.cache.entries()) {
      if (Date.now() > item.expiry) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

/**
 * Caché global para la aplicación
 */
export const appCache = new SimpleCache(60000); // 1 minuto

/**
 * Wrapper para fetch con caché automático
 */
export async function cachedFetch(url, options = {}, cacheTtl = 30000) {
  const cacheKey = `fetch_${url}_${JSON.stringify(options)}`;
  
  // Verificar si está en caché
  const cached = appCache.get(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit: ${url}`);
    return cached;
  }
  
  // Hacer fetch
  const response = await fetch(url, options);
  const data = await response.json();
  
  // Guardar en caché solo si fue exitoso
  if (response.ok) {
    appCache.set(cacheKey, data, cacheTtl);
  }
  
  return data;
}

/**
 * Formatear bytes a formato legible
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formatear duración en milisegundos
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

/**
 * Lazy loader para componentes pesados
 */
export function lazyLoadComponent(importFunc, fallback = null) {
  return {
    component: importFunc,
    fallback: fallback || (() => <div className="animate-pulse bg-gray-700 h-32 rounded" />)
  };
}

/**
 * Observer para carga diferida de imágenes
 */
export class LazyImageObserver {
  constructor() {
    this.observer = null;
    
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              const src = img.dataset.src;
              
              if (src) {
                img.src = src;
                img.removeAttribute('data-src');
                this.observer.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: '50px'
        }
      );
    }
  }

  observe(element) {
    if (this.observer) {
      this.observer.observe(element);
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Monitor de performance
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.maxMetrics = 100;
  }

  startMeasure(name) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  endMeasure(name) {
    if (typeof performance !== 'undefined') {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        
        const measure = performance.getEntriesByName(name)[0];
        this.metrics.push({
          name,
          duration: measure.duration,
          timestamp: Date.now()
        });
        
        // Limpiar marcas
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);
        
        // Limitar tamaño del array
        if (this.metrics.length > this.maxMetrics) {
          this.metrics.shift();
        }
        
        return measure.duration;
      } catch (error) {
        console.warn('Error midiendo performance:', error);
      }
    }
    return 0;
  }

  getMetrics(name = null) {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return this.metrics;
  }

  getAverageDuration(name) {
    const filtered = this.getMetrics(name);
    if (filtered.length === 0) return 0;
    
    const sum = filtered.reduce((acc, m) => acc + m.duration, 0);
    return sum / filtered.length;
  }

  clear() {
    this.metrics = [];
    if (typeof performance !== 'undefined') {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}

/**
 * Instancia global del monitor
 */
export const perfMonitor = new PerformanceMonitor();

/**
 * Hook personalizado para medir performance de componentes
 */
export function measureComponentRender(componentName, callback) {
  perfMonitor.startMeasure(componentName);
  const result = callback();
  perfMonitor.endMeasure(componentName);
  return result;
}

/**
 * Detectar si la conexión es lenta
 */
export function isSlowConnection() {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = navigator.connection;
    return connection.saveData || 
           connection.effectiveType === 'slow-2g' ||
           connection.effectiveType === '2g';
  }
  return false;
}

/**
 * Prefetch de recursos
 */
export function prefetchResource(url, type = 'fetch') {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = type === 'script' ? 'preload' : 'prefetch';
  link.href = url;
  
  if (type === 'script') {
    link.as = 'script';
  }
  
  document.head.appendChild(link);
}

/**
 * Batch de actualizaciones para evitar renders múltiples
 */
export class BatchUpdater {
  constructor(callback, delay = 50) {
    this.callback = callback;
    this.delay = delay;
    this.timer = null;
    this.updates = [];
  }

  add(update) {
    this.updates.push(update);
    
    if (this.timer) {
      clearTimeout(this.timer);
    }
    
    this.timer = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush() {
    if (this.updates.length > 0) {
      this.callback(this.updates);
      this.updates = [];
    }
    this.timer = null;
  }
}
