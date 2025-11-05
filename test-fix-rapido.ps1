# Script de validación rápida del fix de scope variables
# Ejecutar DESPUÉS del deploy a Vercel

Write-Host "🧪 VALIDACIÓN RÁPIDA - Fix ReferenceError Scope Variables" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://apiscpisap.vercel.app"
$endpoint = "$baseUrl/api/systems/teachlr/certwebhooks"

Write-Host "🎯 Endpoint: $endpoint" -ForegroundColor Yellow
Write-Host ""

# Test 1: Webhook completo
Write-Host "📋 Test 1: Webhook con datos completos" -ForegroundColor Green
$body1 = @{
    event = "certificate.issued"
    data = @{
        certificateId = "cert_12345"
        userId = "user_67890"
        courseName = "Curso de Testing"
    }
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri $endpoint -Method Post -Body $body1 -ContentType "application/json"
    if ($response1.success) {
        Write-Host "   ✅ Test 1 PASÓ - Respuesta: $($response1.mensaje)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Test 1 FALLÓ - Error: $($response1.error)" -ForegroundColor Red
        Write-Host "   Detalles: $($response1.details)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Test 1 FALLÓ - Excepción: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Webhook con errorDetails
Write-Host "📋 Test 2: Webhook con errorDetails (excepción CPI)" -ForegroundColor Green
$body2 = @{
    properties = @{
        errorDetails = "Error en certificación: Usuario no encontrado"
        errorCode = "USER_NOT_FOUND"
    }
    event = "certificate.failed"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri $endpoint -Method Post -Body $body2 -ContentType "application/json"
    if ($response2.success) {
        Write-Host "   ✅ Test 2 PASÓ - Tipo: $($response2.tipo)" -ForegroundColor Green
        if ($response2.tipo -eq "ERROR") {
            Write-Host "   ✅ Correctamente detectado como ERROR" -ForegroundColor Green
        }
    } else {
        Write-Host "   ❌ Test 2 FALLÓ - Error: $($response2.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Test 2 FALLÓ - Excepción: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Body vacío (excepción crítica de CPI)
Write-Host "📋 Test 3: Body vacío con errorDetails en headers" -ForegroundColor Green
$headers = @{
    "Content-Type" = "application/json"
    "x-exchange-properties" = '{"errorDetails":"Timeout en conexión SAP","errorCode":"TIMEOUT"}'
}

try {
    $response3 = Invoke-RestMethod -Uri $endpoint -Method Post -Body "" -Headers $headers
    if ($response3.success) {
        Write-Host "   ✅ Test 3 PASÓ - Manejo correcto de body vacío" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Test 3 FALLÓ - Error: $($response3.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Test 3 FALLÓ - Excepción: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "🏁 Validación completada" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Abre https://apiscpisap.vercel.app" -ForegroundColor White
Write-Host "   2. Ve a la pestaña 'Monitor CPI'" -ForegroundColor White
Write-Host "   3. Verifica que aparezcan los 3 logs de prueba" -ForegroundColor White
Write-Host "   4. El Test 2 debe aparecer en ROJO (tipo ERROR)" -ForegroundColor White
Write-Host ""
