# Script de prueba para validar el manejo de errores mejorado
# PowerShell Script para probar las APIs con diferentes escenarios

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🧪 TEST DE MANEJO DE ERRORES - APIs CPI" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Función para hacer requests y mostrar resultados
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [string]$ContentType = "application/json"
    )
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "🔍 TEST: $Name" -ForegroundColor Green
    Write-Host "   Método: $Method" -ForegroundColor Gray
    Write-Host "   URL: $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = $ContentType
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            Write-Host "   Body: $($params.Body)" -ForegroundColor Gray
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        
        Write-Host "✅ ÉXITO" -ForegroundColor Green
        Write-Host "   Respuesta:" -ForegroundColor Cyan
        Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor White
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ ERROR: $statusCode" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            $errorJson = $errorBody | ConvertFrom-Json
            Write-Host "   Error Response:" -ForegroundColor Cyan
            Write-Host ($errorJson | ConvertTo-Json -Depth 5) -ForegroundColor White
        } catch {
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

Write-Host "📝 Asegúrate de que la app esté corriendo en $baseUrl" -ForegroundColor Yellow
Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# TEST 1: Enviar un log válido
# ============================================
Test-Endpoint `
    -Name "Enviar log válido (SUCCESS)" `
    -Method "POST" `
    -Url "$baseUrl/api/cpi/receive-log" `
    -Body @{
        integracionId = "TEST-QAS-001"
        proyecto = "test-errors"
        mensaje = "Test de manejo de errores - Log exitoso"
        nivel = "SUCCESS"
    }

# ============================================
# TEST 2: Enviar un log de error
# ============================================
Test-Endpoint `
    -Name "Enviar log de ERROR" `
    -Method "POST" `
    -Url "$baseUrl/api/cpi/receive-log" `
    -Body @{
        integracionId = "TEST-QAS-002"
        proyecto = "test-errors"
        mensaje = "Test de error - Simulando fallo en integración"
        nivel = "ERROR"
    }

# ============================================
# TEST 3: Obtener logs con filtros válidos
# ============================================
Test-Endpoint `
    -Name "Obtener logs (filtro: SUCCESS)" `
    -Method "GET" `
    -Url "$baseUrl/api/admin/logs?tipo=SUCCESS&limit=10"

# ============================================
# TEST 4: Obtener logs con límite inválido
# ============================================
Test-Endpoint `
    -Name "Obtener logs (límite inválido)" `
    -Method "GET" `
    -Url "$baseUrl/api/admin/logs?limit=9999"

# ============================================
# TEST 5: Eliminar un log que no existe
# ============================================
Test-Endpoint `
    -Name "Eliminar log inexistente" `
    -Method "DELETE" `
    -Url "$baseUrl/api/admin/logs/999999"

# ============================================
# TEST 6: Eliminar un log con ID inválido
# ============================================
Test-Endpoint `
    -Name "Eliminar log (ID inválido)" `
    -Method "DELETE" `
    -Url "$baseUrl/api/admin/logs/abc"

# ============================================
# TEST 7: Enviar log con body XML
# ============================================
Test-Endpoint `
    -Name "Enviar log con XML" `
    -Method "POST" `
    -Url "$baseUrl/api/cpi/receive-log" `
    -Body @"
<?xml version="1.0" encoding="UTF-8"?>
<log>
    <integracion>TEST-QAS-003</integracion>
    <mensaje>Test con formato XML</mensaje>
    <nivel>INFO</nivel>
</log>
"@ `
    -ContentType "application/xml"

# ============================================
# TEST 8: Obtener logs sin filtros
# ============================================
Test-Endpoint `
    -Name "Obtener todos los logs" `
    -Method "GET" `
    -Url "$baseUrl/api/admin/logs?limit=5"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ TESTS COMPLETADOS" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Revisa los resultados arriba para verificar:" -ForegroundColor Yellow
Write-Host "   - Códigos de error apropiados (400, 404, 500, 503)" -ForegroundColor Gray
Write-Host "   - Mensajes de error descriptivos" -ForegroundColor Gray
Write-Host "   - Campos 'success', 'error', 'mensaje' en respuestas" -ForegroundColor Gray
Write-Host "   - Timestamps y processing time" -ForegroundColor Gray
Write-Host ""
