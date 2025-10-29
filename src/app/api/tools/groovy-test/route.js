// src/app/api/tools/groovy-test/route.js
// API para ejecutar y probar scripts Groovy en tiempo real
import { NextResponse } from 'next/server';

export async function POST(request) {
  const startTime = Date.now();
  
  try {
    const { body, script } = await request.json();

    if (!script) {
      return NextResponse.json(
        { success: false, error: 'Script es requerido' },
        { status: 400 }
      );
    }

    // Parsear el body JSON
    let parsedBody;
    try {
      parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
    } catch (e) {
      return NextResponse.json(
        { success: false, error: `Error parseando JSON del body: ${e.message}` },
        { status: 400 }
      );
    }

    // Simular ejecución de script Groovy con JavaScript
    // En producción real, esto se ejecutaría en un entorno Groovy/Java
    const logs = [];
    const result = await executeGroovyScript(script, parsedBody, logs);

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      result,
      executionTime,
      logs,
      variables: extractVariables(script)
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      error: error.message,
      executionTime,
      stack: error.stack
    }, { status: 500 });
  }
}

// Función para ejecutar script Groovy simulado con JavaScript
async function executeGroovyScript(script, bodyData, logs) {
  // Detectar si es script SAP CPI (con imports y Message processData)
  const isSAPCPIScript = script.includes('import com.sap.gateway') || 
                          script.includes('Message processData');

  if (isSAPCPIScript) {
    return await executeSAPCPIScript(script, bodyData, logs);
  }

  // Script Groovy genérico
  const context = {
    body: JSON.parse(JSON.stringify(bodyData)),
    message: JSON.parse(JSON.stringify(bodyData)),
    Date: Date,
    Math: Math,
    console: {
      log: (...args) => logs.push(args.join(' '))
    }
  };

  let jsScript = groovyToJavaScript(script);
  const func = new Function(...Object.keys(context), jsScript);
  const result = func(...Object.values(context));

  return result;
}

// Ejecutar scripts SAP CPI (con clase Message)
async function executeSAPCPIScript(script, bodyData, logs) {
  // Simular clase Message de SAP CPI
  class Message {
    constructor(body) {
      this._body = typeof body === 'string' ? body : JSON.stringify(body);
      this._bodyObject = typeof body === 'object' ? body : null;
    }

    getBody(type) {
      if (type === String || type === 'String') {
        return this._body;
      }
      return this._bodyObject || this._body;
    }

    setBody(newBody) {
      this._body = newBody;
      try {
        this._bodyObject = typeof newBody === 'string' ? JSON.parse(newBody) : newBody;
      } catch (e) {
        this._bodyObject = newBody;
      }
    }

    getResult() {
      try {
        return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
      } catch (e) {
        return this._body;
      }
    }
  }

  // Simular JsonSlurper
  class JsonSlurper {
    parseText(text) {
      return JSON.parse(text);
    }
  }

  // Simular JsonOutput
  const JsonOutput = {
    toJson: (obj) => JSON.stringify(obj),
    prettyPrint: (json) => {
      try {
        const obj = typeof json === 'string' ? JSON.parse(json) : json;
        return JSON.stringify(obj, null, 2);
      } catch (e) {
        return json;
      }
    }
  };

  // Limpiar imports
  let cleanScript = script
    .replace(/import\s+.*?(\r?\n|$)/g, '')
    .replace(/^[\s\n]+/, '');

  // Extraer función processData
  const processDataMatch = cleanScript.match(/Message\s+processData\s*\(Message\s+message\)\s*\{([\s\S]*)\}/);
  
  if (!processDataMatch) {
    throw new Error('No se encontró la función processData(Message message)');
  }

  const functionBody = processDataMatch[1];

  // Convertir sintaxis Groovy a JavaScript
  let jsCode = groovyToJavaScript(functionBody);

  // Crear contexto de ejecución
  const message = new Message(bodyData);
  
  try {
    // Crear función ejecutable con contexto SAP CPI
    const func = new Function(
      'message',
      'JsonSlurper',
      'JsonOutput',
      'console',
      jsCode + '\nreturn message;'
    );

    // Ejecutar
    const result = func(
      message,
      JsonSlurper,
      JsonOutput,
      { log: (...args) => logs.push(args.join(' ')) }
    );

    return result.getResult();
  } catch (error) {
    logs.push(`Error: ${error.message}`);
    throw error;
  }
}

// Convertir sintaxis Groovy básica a JavaScript
function groovyToJavaScript(groovyScript) {
  let js = groovyScript;

  // Convertir def a let/const
  js = js.replace(/\bdef\s+/g, 'let ');

  // Convertir println a console.log
  js = js.replace(/println\s*\(/g, 'console.log(');

  // Convertir operador Elvis ?: a ||
  js = js.replace(/\?\:/g, '||');

  // Convertir navigation operator ?. a ?.
  // Ya es compatible con JavaScript moderno (opcional chaining)

  // Convertir .each { } a .forEach(function() {})
  js = js.replace(/\.each\s*\{\s*([^}]+)\s*\}/g, (match, content) => {
    return `.forEach(function(it) { ${content} })`;
  });

  // Convertir .collect { } a .map(function() {})
  js = js.replace(/\.collect\s*\{\s*([^}]+)\s*\}/g, (match, content) => {
    return `.map(function(it) { return ${content} })`;
  });

  // Convertir .findAll { } a .filter(function() {})
  js = js.replace(/\.findAll\s*\{\s*([^}]+)\s*\}/g, (match, content) => {
    return `.filter(function(it) { return ${content} })`;
  });

  // Convertir .find { } a .find(function() {})
  js = js.replace(/\.find\s*\{\s*([^}]+)\s*\}/g, (match, content) => {
    return `.find(function(it) { return ${content} })`;
  });

  // Convertir instanceof a instanceof (ya compatible)
  // No requiere cambios

  // Manejar toString() explícito
  js = js.replace(/\.toString\(\)/g, '.toString()');

  // Convertir toLowerCase() y toUpperCase() (ya compatible)

  // Asegurar que hay un return si no existe
  if (!js.includes('return ') && !js.includes('message.setBody')) {
    js += '\nreturn message;';
  }

  return js;
}

// Extraer variables usadas en el script
function extractVariables(script) {
  const variables = new Set();
  
  // Buscar declaraciones def/let/const
  const defMatches = script.match(/\b(?:def|let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
  if (defMatches) {
    defMatches.forEach(match => {
      const varName = match.split(/\s+/)[1];
      variables.add(varName);
    });
  }

  // Variables conocidas
  ['body', 'message'].forEach(v => {
    if (script.includes(v)) variables.add(v);
  });

  return Array.from(variables);
}

// Endpoint GET para documentación
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/tools/groovy-test',
    method: 'POST',
    description: 'Ejecuta scripts Groovy en tiempo real con datos de entrada',
    request: {
      body: 'string | object - JSON con datos de entrada',
      script: 'string - Script Groovy a ejecutar'
    },
    response: {
      success: 'boolean',
      result: 'object - Resultado de la ejecución',
      executionTime: 'number - Tiempo en ms',
      logs: 'array - Logs de consola',
      variables: 'array - Variables detectadas'
    },
    examples: {
      simple: {
        body: { valor: 100 },
        script: 'def message = body; message.doble = message.valor * 2; return message;'
      },
      transform: {
        body: { items: ['a', 'b', 'c'] },
        script: 'def message = body; message.itemsUpper = message.items.collect { it.toUpperCase() }; return message;'
      }
    }
  });
}
