# Script para probar el endpoint /api/cpi/receive-log

$url = "https://apiscpisap.vercel.app/api/cpi/receive-log"

Write-Host "`n🧪 Probando endpoint CPI..." -ForegroundColor Cyan
Write-Host "URL: $url`n" -ForegroundColor Yellow

# Test 1: JSON simple
Write-Host "📤 Test 1: Enviando JSON simple..." -ForegroundColor Green
$body1 = @{
    mensaje = "Prueba desde PowerShell - Test 1"
    nivel = "INFO"
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri $url -Method Post -Body $body1 -ContentType "application/json"
    Write-Host "✅ Respuesta:" -ForegroundColor Green
    $response1 | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalles:" $_.ErrorDetails.Message
    }
}

Start-Sleep -Seconds 2

# Test 2: JSON con integracionId personalizado
Write-Host "`n📤 Test 2: Enviando JSON con integracionId..." -ForegroundColor Green
$body2 = @{
    integracionId = "TEST-INTEGRATION-001"
    mensaje = "Prueba con integración personalizada"
    nivel = "SUCCESS"
    datos = @{
        usuario = "test_user"
        accion = "crear_pedido"
        resultado = "OK"
    }
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri $url -Method Post -Body $body2 -ContentType "application/json"
    Write-Host "✅ Respuesta:" -ForegroundColor Green
    $response2 | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Start-Sleep -Seconds 2

# Test 3: JSON con ERROR
Write-Host "`n📤 Test 3: Enviando JSON con ERROR..." -ForegroundColor Green
$body3 = @{
    mensaje = "Error de conexión con SAP - Timeout después de 30 segundos"
    nivel = "ERROR"
    proyecto = "test-proyecto"
    detalles = @{
        codigo_error = "TIMEOUT_ERROR"
        duracion = 30000
        intentos = 3
    }
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri $url -Method Post -Body $body3 -ContentType "application/json"
    Write-Host "✅ Respuesta:" -ForegroundColor Green
    $response3 | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Start-Sleep -Seconds 2

# Test 4: XML
Write-Host "`n📤 Test 4: Enviando XML..." -ForegroundColor Green
$body4 = @"
<?xml version="1.0" encoding="UTF-8"?>
<log>
    <mensaje>Prueba desde XML</mensaje>
    <nivel>WARNING</nivel>
    <timestamp>$(Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")</timestamp>
</log>
"@

try {
    $response4 = Invoke-RestMethod -Uri $url -Method Post -Body $body4 -ContentType "application/xml"
    Write-Host "✅ Respuesta:" -ForegroundColor Green
    $response4 | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Start-Sleep -Seconds 2

# Test 5: Texto plano
Write-Host "`n📤 Test 5: Enviando texto plano..." -ForegroundColor Green
$body5 = "LOG: Mensaje de prueba en texto plano desde PowerShell - $(Get-Date)"

try {
    $response5 = Invoke-RestMethod -Uri $url -Method Post -Body $body5 -ContentType "text/plain"
    Write-Host "✅ Respuesta:" -ForegroundColor Green
    $response5 | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n✅ Tests completados!" -ForegroundColor Cyan
Write-Host "Revisa los logs en: https://apiscpisap.vercel.app`n" -ForegroundColor Yellow
