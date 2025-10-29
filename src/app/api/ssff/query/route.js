// API para ejecutar consultas OData a SuccessFactors desde el servidor
// Evita problemas de CORS ejecutando desde backend

export async function POST(request) {
  try {
    const body = await request.json();
    const { entidad, queryParams } = body;
    
    if (!entidad) {
      return Response.json(
        { error: 'Entidad requerida' },
        { status: 400 }
      );
    }
    
    // Credenciales fijas
    const BASE_URL = 'https://api17preview.sapsf.com/odata/v2/';
    const USERNAME = 'SFAPIUser@gerdaumetaT1';
    const PASSWORD = 'Agp.2025';
    
    const fullUrl = `${BASE_URL}${entidad}${queryParams || ''}`;
    
    console.log('🔷 Ejecutando consulta SSFF:', fullUrl);
    const startTime = Date.now();
    
    try {
      // Crear credenciales en Base64
      const credentials = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
      
      // Ejecutar la consulta OData
      const response = await fetch(fullUrl, {
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
          duration,
          url: fullUrl
        }, { status: response.status });
      }
      
      const data = await response.json();
      
      console.log('✅ Consulta SSFF exitosa');
      console.log('📊 Registros:', data.d?.results?.length || 0);
      console.log('⏱️ Duración:', duration + 'ms');
      
      return Response.json({
        success: true,
        data: data.d || data,
        count: data.d?.results?.length || 0,
        duration,
        url: fullUrl,
        timestamp: new Date().toISOString()
      });
      
    } catch (fetchError) {
      console.error('❌ Error ejecutando consulta SSFF:', fetchError);
      
      return Response.json({
        success: false,
        error: 'Error ejecutando consulta OData',
        details: fetchError.message,
        duration: Date.now() - startTime,
        url: fullUrl
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Error en endpoint query SSFF:', error);
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
