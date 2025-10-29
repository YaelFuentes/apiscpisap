// src/components/IntegrationGuide.js
// Componente con guía de integración CPI
'use client';

import { useState } from 'react';

export default function IntegrationGuide() {
  const [copiedText, setCopiedText] = useState('');

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const endpoints = [
    {
      name: 'Endpoint Principal para Logs',
      url: 'https://apiscpisap.vercel.app/api/cpi/receive-log',
      method: 'POST',
      recommended: true,
      description: 'Diseñado específicamente para recibir logs desde SAP CPI',
      contentTypes: ['application/json', 'application/xml', 'text/plain']
    },
    {
      name: 'Endpoint de Status TeachLR',
      url: 'https://apiscpisap.vercel.app/api/teachlr/qas-https-status',
      method: 'GET/POST',
      recommended: false,
      description: 'Consulta estado + registra log de la petición',
      contentTypes: ['application/json']
    },
    {
      name: 'Endpoint de Status Evaluar',
      url: 'https://apiscpisap.vercel.app/api/evaluar/qas-https-status',
      method: 'GET/POST',
      recommended: false,
      description: 'Consulta estado del proyecto Evaluar',
      contentTypes: ['application/json']
    }
  ];

  const jsonExample = `{
  "integracionId": "TEACHLR-ATLAS-001",
  "proyecto": "teachlr",
  "mensaje": "Procesamiento exitoso",
  "nivel": "SUCCESS",
  "datos": {
    "registros": 150,
    "tiempo": "2.5s"
  },
  "properties": {
    "correlationId": "ABC123",
    "businessKey": "ORDER-456",
    "customField": "valor personalizado"
  }
}`;

  const curlExample = `curl -X POST https://apiscpisap.vercel.app/api/cpi/receive-log \\
  -H "Content-Type: application/json" \\
  -d '${jsonExample}'`;

  const groovyExample = `import com.sap.gateway.ip.core.customdev.util.Message
import groovy.json.*

Message processData(Message message) {
    def body = message.getBody(String)
    def headers = message.getHeaders()
    def properties = message.getProperties()
    
    // Capturar properties específicas
    def customProperties = [:]
    properties.each { key, value ->
        // Filtrar solo las properties que te interesan
        if (!key.startsWith("CamelHttp") && !key.startsWith("Camel")) {
            customProperties[key] = value?.toString()
        }
    }
    
    // Preparar log con headers y properties
    def logData = [
        integracionId: "SSFF-TEACHLR-ATLAS",
        proyecto: "teachlr",
        mensaje: "Integración completada",
        nivel: "SUCCESS",
        datos: body,
        properties: customProperties,
        headers: headers.collectEntries { k, v -> [k, v?.toString()] }
    ]
    
    // ⚠️ IMPORTANTE: Guardar en PROPIEDAD (no en body)
    // Esto evita el error: GStringImpl cannot convert to InputStream
    message.setProperty("logPayload", JsonOutput.toJson(logData))
    
    return message
}

// Después de este script, agregar Content Modifier:
// - Message Body: Type=Expression, Body=\${property.logPayload}
// - Message Header: Name=Content-Type, Value=application/json`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">📘 Guía de Integración SAP CPI</h2>
        <p className="text-blue-100">
          Aprende cómo conectar tus flujos de SAP CPI con el sistema de monitoreo
        </p>
      </div>

      {/* Endpoints disponibles */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">🎯 Endpoints Disponibles</h3>
        
        <div className="space-y-4">
          {endpoints.map((endpoint, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-4 ${
                endpoint.recommended
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-zinc-800/50 border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white">{endpoint.name}</h4>
                    {endpoint.recommended && (
                      <span className="px-2 py-0.5 text-xs bg-green-500 text-white rounded font-semibold">
                        RECOMENDADO
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs rounded font-semibold ${
                      endpoint.method === 'POST' ? 'bg-blue-500 text-white' : 'bg-zinc-600 text-white'
                    }`}>
                      {endpoint.method}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">{endpoint.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-black/50 rounded p-3 font-mono text-sm">
                <code className="flex-1 text-green-400">{endpoint.url}</code>
                <button
                  onClick={() => copyToClipboard(endpoint.url, endpoint.name)}
                  className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs transition"
                >
                  {copiedText === endpoint.name ? '✓ Copiado' : '📋 Copiar'}
                </button>
              </div>

              <div className="mt-2 flex gap-2">
                {endpoint.contentTypes.map((ct, i) => (
                  <span key={i} className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">
                    {ct}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ejemplo JSON */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">📦 Ejemplo de Body JSON</h3>
        
        <div className="bg-black/50 border border-zinc-700 rounded-lg p-4">
          <pre className="text-sm text-green-400 overflow-x-auto">
            {jsonExample}
          </pre>
        </div>

        <button
          onClick={() => copyToClipboard(jsonExample, 'json')}
          className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm"
        >
          {copiedText === 'json' ? '✓ Copiado' : '📋 Copiar JSON'}
        </button>
      </div>

      {/* Ejemplo cURL */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">🧪 Prueba con cURL</h3>
        
        <div className="bg-black/50 border border-zinc-700 rounded-lg p-4">
          <pre className="text-sm text-yellow-400 overflow-x-auto whitespace-pre-wrap">
            {curlExample}
          </pre>
        </div>

        <button
          onClick={() => copyToClipboard(curlExample, 'curl')}
          className="mt-3 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg transition text-sm font-semibold"
        >
          {copiedText === 'curl' ? '✓ Copiado' : '📋 Copiar comando cURL'}
        </button>
      </div>

      {/* Ejemplo Groovy */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">🔧 Script Groovy para CPI</h3>
        
        <div className="bg-black/50 border border-zinc-700 rounded-lg p-4">
          <pre className="text-sm text-green-400 overflow-x-auto">
            {groovyExample}
          </pre>
        </div>

        <button
          onClick={() => copyToClipboard(groovyExample, 'groovy')}
          className="mt-3 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition text-sm"
        >
          {copiedText === 'groovy' ? '✓ Copiado' : '📋 Copiar Script Groovy'}
        </button>
      </div>

      {/* Pasos de configuración */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">🔧 Configuración en SAP CPI</h3>
        
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-amber-400 mb-2">⚠️ IMPORTANTE: Usar Content Modifier</h4>
            <div className="text-sm text-zinc-300 space-y-2">
              <p className="font-semibold">Si recibes el error: <code className="bg-zinc-800 px-1 rounded text-red-400">GStringImpl cannot convert to InputStream</code></p>
              <p className="mt-2">Debes agregar un <strong>Content Modifier</strong> después del Groovy Script y antes del HTTP Receiver:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1 ml-2">
                <li>En Groovy: guarda el JSON en una propiedad: <code className="bg-zinc-800 px-1 rounded">message.setProperty("logPayload", JsonOutput.toJson(logData))</code></li>
                <li>Agrega <strong>Content Modifier</strong> después del Groovy Script</li>
                <li>En Message Body: Type = <code className="bg-zinc-800 px-1 rounded">Expression</code>, Body = <code className="bg-zinc-800 px-1 rounded">${`\${property.logPayload}`}</code></li>
                <li>En Message Header: Name = <code className="bg-zinc-800 px-1 rounded">Content-Type</code>, Value = <code className="bg-zinc-800 px-1 rounded">application/json</code></li>
              </ol>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2">✅ Para flujos SUCCESS:</h4>
            <ol className="list-decimal list-inside text-sm text-zinc-300 space-y-1">
              <li>Agregar <strong>Groovy Script</strong> (guarda JSON en propiedad)</li>
              <li>Agregar <strong>Content Modifier</strong> (lee la propiedad)</li>
              <li>Agregar <strong>Request Reply</strong> con HTTP Receiver</li>
              <li>URL: <code className="bg-zinc-800 px-2 py-0.5 rounded">/api/cpi/receive-log</code></li>
              <li>Método: POST, Content-Type: application/json</li>
            </ol>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-red-400 mb-2">❌ Para Exception Handler:</h4>
            <ol className="list-decimal list-inside text-sm text-zinc-300 space-y-1">
              <li>En el subprocess de Exception: <strong>Groovy Script</strong> (captura error)</li>
              <li>Agregar <strong>Content Modifier</strong> (lee propiedad de error)</li>
              <li>Agregar <strong>Request Reply</strong> con mismo HTTP Receiver</li>
              <li>Body con nivel: <code className="bg-zinc-800 px-2 py-0.5 rounded">"ERROR"</code></li>
            </ol>
          </div>
        </div>
      </div>

      {/* Debugging */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-yellow-400 mb-4">🔍 ¿No ves los logs?</h3>
        
        <ul className="space-y-2 text-sm text-yellow-200">
          <li className="flex items-start gap-2">
            <span>1.</span>
            <span>Verifica que uses <strong>/api/cpi/receive-log</strong> (no /status)</span>
          </li>
          <li className="flex items-start gap-2">
            <span>2.</span>
            <span>Content-Type debe ser <strong>application/json</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span>3.</span>
            <span>El body no debe estar vacío</span>
          </li>
          <li className="flex items-start gap-2">
            <span>4.</span>
            <span>Verifica status code 200 en logs de CPI</span>
          </li>
          <li className="flex items-start gap-2">
            <span>5.</span>
            <span>Revisa la pestaña <strong>🔴 Logs Real-Time</strong> con auto-refresh activado</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
