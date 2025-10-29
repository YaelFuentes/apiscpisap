// src/components/GroovyScriptTester.js
// Componente para probar y analizar Groovy Scripts en tiempo real
'use client';

import { useState } from 'react';

export default function GroovyScriptTester() {
  const [body, setBody] = useState('{\n  "nombre": "Juan",\n  "edad": 25,\n  "ciudad": "Madrid"\n}');
  const [script, setScript] = useState(`// Script Groovy - Manipula el mensaje
def message = body;

// Agregar timestamp
message.timestamp = new Date().getTime();

// Transformar datos
message.nombreCompleto = message.nombre.toUpperCase();
message.esMayorDeEdad = message.edad >= 18;

// Retornar mensaje transformado
return message;`);
  
  const [response, setResponse] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);

  const executeScript = async () => {
    setExecuting(true);
    setError(null);
    setResponse(null);

    try {
      // Validar JSON del body
      JSON.parse(body);

      const res = await fetch('/api/tools/groovy-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, script })
      });

      const data = await res.json();

      if (res.ok) {
        setResponse(data);
      } else {
        setError(data.error || 'Error ejecutando script');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  const loadExample = (example) => {
    switch (example) {
      case 'simple':
        setBody('{\n  "valor": 100\n}');
        setScript('// Script simple\ndef message = body;\nmessage.doble = message.valor * 2;\nreturn message;');
        break;
      case 'transform':
        setBody('{\n  "items": ["a", "b", "c"]\n}');
        setScript('// Transformar array\ndef message = body;\nmessage.itemsUpper = message.items.collect { it.toUpperCase() };\nreturn message;');
        break;
      case 'filter':
        setBody('{\n  "numeros": [1, 2, 3, 4, 5, 6]\n}');
        setScript('// Filtrar números\ndef message = body;\nmessage.pares = message.numeros.findAll { it % 2 == 0 };\nreturn message;');
        break;
      case 'sapcpi':
        setBody('{\n  "nombre": "Juan Pérez",\n  "email": "juan@ejemplo.com",\n  "edad": 30\n}');
        setScript(`import com.sap.gateway.ip.core.customdev.util.Message
import groovy.json.*

Message processData(Message message) {
    def body = message.getBody(String)
    def jsonSlurper = new JsonSlurper()
    def jsonBody
    
    try {
        jsonBody = jsonSlurper.parseText(body)
    } catch (Exception e) {
        message.setBody(JsonOutput.toJson(["error": "Error: \${e.message}"]))
        return message
    }
    
    // Transformar datos
    def result = [
        nombreCompleto: jsonBody.nombre?.toUpperCase() ?: "",
        correo: jsonBody.email ?: "",
        esMayorDeEdad: (jsonBody.edad ?: 0) >= 18,
        timestamp: new Date().getTime()
    ]
    
    message.setBody(JsonOutput.prettyPrint(JsonOutput.toJson(result)))
    return message
}`);
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            🔧 Analizador de Groovy Scripts
          </h2>
          <p className="text-sm text-zinc-400">
            Prueba y analiza scripts Groovy en tiempo real con datos de entrada personalizados
          </p>
        </div>
        
        {/* Ejemplos rápidos */}
        <div className="flex gap-2">
          <button
            onClick={() => loadExample('simple')}
            className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition"
          >
            📝 Simple
          </button>
          <button
            onClick={() => loadExample('transform')}
            className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition"
          >
            🔄 Transform
          </button>
          <button
            onClick={() => loadExample('filter')}
            className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition"
          >
            🔍 Filter
          </button>
          <button
            onClick={() => loadExample('sapcpi')}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-lg transition font-semibold"
          >
            🚀 SAP CPI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel Izquierdo: Entrada */}
        <div className="space-y-4">
          {/* Body JSON */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              📥 Body de Entrada (JSON)
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-48 bg-black/50 border border-zinc-700 rounded-lg p-3 font-mono text-sm text-zinc-300 focus:border-blue-500 focus:outline-none resize-none"
              placeholder='{\n  "key": "value"\n}'
            />
            <div className="mt-2 text-xs text-zinc-500">
              Variable disponible en script: <code className="bg-zinc-800 px-2 py-0.5 rounded">body</code>
            </div>
          </div>

          {/* Script Groovy */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <label className="block text-sm font-semibold text-zinc-300 mb-2">
              ⚙️ Script Groovy
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="w-full h-80 bg-black/50 border border-zinc-700 rounded-lg p-3 font-mono text-sm text-green-400 focus:border-blue-500 focus:outline-none resize-none"
              placeholder="// Tu código Groovy aquí"
            />
            <div className="mt-2 text-xs text-zinc-500 space-y-1">
              <div>💡 Usa <code className="bg-zinc-800 px-2 py-0.5 rounded">body</code> para acceder al JSON</div>
              <div>💡 Usa <code className="bg-zinc-800 px-2 py-0.5 rounded">return message;</code> para retornar el resultado</div>
              <div>🚀 Soporta sintaxis SAP CPI con <code className="bg-zinc-800 px-2 py-0.5 rounded">Message processData()</code></div>
            </div>
          </div>

          {/* Botón ejecutar */}
          <button
            onClick={executeScript}
            disabled={executing}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {executing ? '⏳ Ejecutando...' : '▶️ Ejecutar Script'}
          </button>
        </div>

        {/* Panel Derecho: Resultado */}
        <div className="space-y-4">
          {/* Respuesta */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-full">
            <label className="block text-sm font-semibold text-zinc-300 mb-3">
              📤 Resultado de la Ejecución
            </label>

            {!response && !error && (
              <div className="h-[calc(100%-2rem)] flex items-center justify-center text-zinc-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎯</div>
                  <div>Ejecuta un script para ver el resultado aquí</div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">❌</div>
                  <div className="flex-1">
                    <div className="text-red-400 font-semibold mb-2">Error en la Ejecución</div>
                    <pre className="text-xs text-red-300 whitespace-pre-wrap break-words">
                      {error}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {response && (
              <div className="space-y-4">
                {/* Estado */}
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  response.success 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-red-500/20 border border-red-500/30'
                }`}>
                  <span className="text-2xl">
                    {response.success ? '✅' : '❌'}
                  </span>
                  <div>
                    <div className={`font-bold ${response.success ? 'text-green-400' : 'text-red-400'}`}>
                      {response.success ? 'Ejecución Exitosa' : 'Ejecución Fallida'}
                    </div>
                    <div className="text-xs text-zinc-400">
                      Tiempo: {response.executionTime}ms
                    </div>
                  </div>
                </div>

                {/* Resultado */}
                {response.result && (
                  <div>
                    <div className="text-sm font-semibold text-zinc-300 mb-2">
                      📦 Objeto Resultante
                    </div>
                    <div className="bg-black/50 border border-zinc-700 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-xs text-green-300">
                        {JSON.stringify(response.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Variables usadas */}
                {response.variables && (
                  <div>
                    <div className="text-sm font-semibold text-zinc-300 mb-2">
                      🔤 Variables Detectadas
                    </div>
                    <div className="bg-black/50 border border-zinc-700 rounded-lg p-3">
                      <div className="flex flex-wrap gap-2">
                        {response.variables.map((v, i) => (
                          <span key={i} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 font-mono">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Logs de consola */}
                {response.logs && response.logs.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-zinc-300 mb-2">
                      📋 Logs de Consola
                    </div>
                    <div className="bg-black/50 border border-zinc-700 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
                      {response.logs.map((log, i) => (
                        <div key={i} className="text-xs font-mono text-zinc-400">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info adicional */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-xl">💡</div>
          <div className="text-sm text-blue-300 space-y-1">
            <div className="font-semibold">Características disponibles:</div>
            <ul className="list-disc list-inside space-y-1 text-xs text-blue-200/80">
              <li>✅ Scripts SAP CPI con <strong>Message processData(Message message)</strong></li>
              <li>✅ Clases SAP: JsonSlurper, JsonOutput, Message.getBody/setBody</li>
              <li>✅ Manipulación de objetos JSON con sintaxis Groovy</li>
              <li>✅ Métodos de colecciones: collect(), findAll(), find(), each()</li>
              <li>✅ Operadores: Elvis (?:), Safe Navigation (?.)</li>
              <li>✅ Closures y métodos funcionales</li>
              <li>✅ Transformaciones y validaciones de datos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
