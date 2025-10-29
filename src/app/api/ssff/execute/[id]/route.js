// API para ejecutar consultas OData de SuccessFactors
// POST: Ejecutar API guardada

import { getDatabase } from '@/lib/db-client';

export async function POST(request, context) {
  try {
    // Next.js 15+ requiere await para params
    const params = await context.params;
    const apiId = params.id;
    
    if (!apiId) {
      return Response.json(
        { error: 'ID de API requerido' },
        { status: 400 }
      );
    }
    
    const db = getDatabase();
    
    // Obtener la API
    const apiResult = await db.execute({
      sql: 'SELECT * FROM ssff_apis WHERE id = ? AND activo = 1',
      args: [apiId]
    });
    
    if (!apiResult.rows || apiResult.rows.length === 0) {
      return Response.json(
        { error: 'API no encontrada o inactiva' },
        { status: 404 }
      );
    }
    
    const api = apiResult.rows[0];
    
    console.log('🔷 Ejecutando API SSFF:', api.nombre);
    console.log('🔗 URL:', api.url);
    
    const startTime = Date.now();
    
    try {
      // Crear credenciales en Base64
      const credentials = Buffer.from(`${api.username}:${api.password}`).toString('base64');
      
      // Ejecutar la consulta OData
      const response = await fetch(api.url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta SSFF:', response.status, errorText);
        
        return Response.json({
          success: false,
          error: `Error HTTP ${response.status}`,
          details: errorText,
          duration
        }, { status: response.status });
      }
      
      const data = await response.json();
      
      // Actualizar estadísticas de la API
      await db.execute({
        sql: `UPDATE ssff_apis 
              SET ultima_ejecucion = ?, 
                  total_ejecuciones = total_ejecuciones + 1,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
        args: [new Date().toISOString(), apiId]
      });
      
      console.log('✅ API SSFF ejecutada exitosamente');
      console.log('📊 Registros:', data.d?.results?.length || 0);
      console.log('⏱️ Duración:', duration + 'ms');
      
      return Response.json({
        success: true,
        data: data.d || data,
        count: data.d?.results?.length || 0,
        duration,
        api: {
          id: api.id,
          nombre: api.nombre
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (fetchError) {
      console.error('❌ Error ejecutando consulta SSFF:', fetchError);
      
      return Response.json({
        success: false,
        error: 'Error ejecutando consulta OData',
        details: fetchError.message,
        duration: Date.now() - startTime
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Error en endpoint execute SSFF:', error);
    return Response.json(
      { 
        success: false,
        error: 'Error procesando solicitud', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
