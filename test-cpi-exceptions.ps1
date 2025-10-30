# Script para probar la API de excepciones de CPI
# Simula diferentes escenarios de logs desde SAP CPI

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🧪 TEST - API CPI Excepciones" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://apiscpisap.vercel.app"
# $baseUrl = "http://localhost:3000"  # Descomentar para pruebas locales

Write-Host "🌐 URL Base: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# ============================================
# TEST 1: Body vacío con errorDetails en properties (típico de excepciones CPI)
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "🔴 TEST 1: Excepción CPI - Body vacío con errorDetails en properties" -ForegroundColor Red
Write-Host ""

$body1 = @{
    properties = @{
        errorDetails = "java.lang.NullPointerException: Cannot invoke method getValue() on null object"
        hasMoreRecords = "false"
        processId = "1e2b9b9d-8d05-4762-8c1d-3c3202d732b2"
        personId = "7109655"
        evaluationsStatus = "ENDED"
    }
} | ConvertTo-Json -Depth 10

try {
    Write-Host "📤 Enviando petición..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "$baseUrl/api/systems/evaluar/pi6" `
                                  -Method POST `
                                  -Body $body1 `
                                  -ContentType "application/json" `
                                  -ErrorAction Stop
    
    Write-Host "✅ ÉXITO" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor White
} catch {
    Write-Host "❌ ERROR" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        $errorJson = $errorBody | ConvertFrom-Json
        Write-Host ($errorJson | ConvertTo-Json -Depth 5) -ForegroundColor White
    } catch {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# TEST 2: Body vacío sin properties (excepción sin detalles)
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "⚠️ TEST 2: Body vacío sin properties" -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "📤 Enviando petición con body vacío..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "$baseUrl/api/systems/evaluar/pi6" `
                                  -Method POST `
                                  -Body "" `
                                  -ContentType "application/json" `
                                  -ErrorAction Stop
    
    Write-Host "✅ ÉXITO" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor White
} catch {
    Write-Host "❌ ERROR" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        $errorJson = $errorBody | ConvertFrom-Json
        Write-Host ($errorJson | ConvertTo-Json -Depth 5) -ForegroundColor White
    } catch {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# TEST 3: Body con datos + properties con errorDetails
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "🔴 TEST 3: Body con XML + errorDetails en properties" -ForegroundColor Red
Write-Host ""

$body3 = @{
    payload = @"
<root>
    <data>
        <processPerson>
            <id>DNjxlU7A2Qu5qGZnxz04RZqOA6cOwDiO8N3oKAHQc1mZJUkBejwzde3RaORrzrG8</id>
            <personId>7109655</personId>
        </processPerson>
    </data>
</root>
"@
    properties = @{
        errorDetails = "Connection timeout: Could not connect to SAP backend system after 3 retry attempts"
        processId = "1e2b9b9d-8d05-4762-8c1d-3c3202d732b2"
        retryCount = "3"
        lastRetryTime = "2025-10-30T12:30:45Z"
    }
} | ConvertTo-Json -Depth 10

try {
    Write-Host "📤 Enviando petición..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "$baseUrl/api/systems/evaluar/pi6" `
                                  -Method POST `
                                  -Body $body3 `
                                  -ContentType "application/json" `
                                  -ErrorAction Stop
    
    Write-Host "✅ ÉXITO" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor White
} catch {
    Write-Host "❌ ERROR" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        $errorJson = $errorBody | ConvertFrom-Json
        Write-Host ($errorJson | ConvertTo-Json -Depth 5) -ForegroundColor White
    } catch {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# TEST 4: Log exitoso con body normal (sin error)
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "✅ TEST 4: Log exitoso - Sin errores" -ForegroundColor Green
Write-Host ""

$body4 = @{
    nivel = "SUCCESS"
    mensaje = "Proceso completado exitosamente"
    datos = @{
        registrosProcesados = 150
        registrosExitosos = 150
        tiempo = "45ms"
    }
    properties = @{
        processId = "abc-123-success"
        hasMoreRecords = "false"
    }
} | ConvertTo-Json -Depth 10

try {
    Write-Host "📤 Enviando petición..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "$baseUrl/api/systems/evaluar/pi6" `
                                  -Method POST `
                                  -Body $body4 `
                                  -ContentType "application/json" `
                                  -ErrorAction Stop
    
    Write-Host "✅ ÉXITO" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor White
} catch {
    Write-Host "❌ ERROR" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        $errorJson = $errorBody | ConvertFrom-Json
        Write-Host ($errorJson | ConvertTo-Json -Depth 5) -ForegroundColor White
    } catch {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ TESTS COMPLETADOS" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Ahora verifica en tu app:" -ForegroundColor Yellow
Write-Host "   1. Ve a Monitor CPI" -ForegroundColor Gray
Write-Host "   2. Deberías ver los 4 logs creados" -ForegroundColor Gray
Write-Host "   3. Los que tienen errorDetails deben mostrarse como ERROR (rojo)" -ForegroundColor Gray
Write-Host "   4. Expande cada log para ver los detalles completos" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 URL de la app: $baseUrl" -ForegroundColor Cyan
Write-Host ""
