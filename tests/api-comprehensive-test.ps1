# Suite de Tests Completa para APIs de SAP CPI Monitor
# Ejecutar después del deploy para validar que todas las APIs funcionen correctamente

param(
    [string]$BaseUrl = "https://apiscpisap.vercel.app",
    [switch]$Verbose,
    [switch]$StopOnError
)

$ErrorActionPreference = if ($StopOnError) { "Stop" } else { "Continue" }

# Colores y formato
$script:PassCount = 0
$script:FailCount = 0
$script:WarnCount = 0

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n" -NoNewline
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
}

function Write-TestSection {
    param([string]$Title)
    Write-Host "`n🧪 $Title" -ForegroundColor Yellow
    Write-Host "───────────────────────────────────────────────────────" -ForegroundColor DarkGray
}

function Test-Api {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [hashtable]$Headers = @{"Content-Type" = "application/json"},
        [int]$ExpectedStatus = 200,
        [string[]]$ExpectedProperties = @()
    )
    
    Write-Host "`n  📋 Test: " -NoNewline -ForegroundColor White
    Write-Host $Name -ForegroundColor Cyan
    
    if ($Verbose) {
        Write-Host "     URL: $Url" -ForegroundColor DarkGray
        Write-Host "     Method: $Method" -ForegroundColor DarkGray
    }
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params.Body = if ($Body -is [string]) { $Body } else { $Body | ConvertTo-Json -Depth 10 }
        }
        
        $startTime = Get-Date
        $response = Invoke-RestMethod @params -ErrorAction Stop
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        # Validar propiedades esperadas
        $allPropertiesFound = $true
        foreach ($prop in $ExpectedProperties) {
            if (-not (Get-Member -InputObject $response -Name $prop -MemberType Properties)) {
                $allPropertiesFound = $false
                Write-Host "     ⚠️  Propiedad faltante: $prop" -ForegroundColor Yellow
                $script:WarnCount++
            }
        }
        
        if ($allPropertiesFound -or $ExpectedProperties.Count -eq 0) {
            Write-Host "     ✅ PASÓ" -NoNewline -ForegroundColor Green
            Write-Host " (${duration}ms)" -ForegroundColor DarkGray
            $script:PassCount++
        } else {
            Write-Host "     ⚠️  PASÓ CON ADVERTENCIAS" -NoNewline -ForegroundColor Yellow
            Write-Host " (${duration}ms)" -ForegroundColor DarkGray
        }
        
        if ($Verbose -and $response) {
            Write-Host "     Respuesta: $($response | ConvertTo-Json -Compress -Depth 2)" -ForegroundColor DarkGray
        }
        
        return @{ Success = $true; Response = $response; Duration = $duration }
        
    } catch {
        Write-Host "     ❌ FALLÓ" -ForegroundColor Red
        Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.ErrorDetails.Message) {
            try {
                $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
                Write-Host "     Detalles: $($errorResponse | ConvertTo-Json -Compress)" -ForegroundColor Red
            } catch {
                Write-Host "     Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
            }
        }
        
        $script:FailCount++
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# ============================================
# INICIO DE TESTS
# ============================================

Write-TestHeader "🚀 SUITE DE TESTS COMPLETA - SAP CPI Monitor"
Write-Host "  Base URL: $BaseUrl" -ForegroundColor White
Write-Host "  Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host ""

# ============================================
# 1. HEALTH CHECK
# ============================================
Write-TestSection "1️⃣  Health Check"

Test-Api -Name "Health Check Principal" `
    -Url "$BaseUrl/api/health" `
    -ExpectedProperties @("status", "timestamp")

# ============================================
# 2. ADMIN APIS - GESTIÓN DE APIS PERSONALIZADAS
# ============================================
Write-TestSection "2️⃣  Admin - APIs Personalizadas"

# 2.1 Listar APIs existentes
Test-Api -Name "Listar APIs personalizadas" `
    -Url "$BaseUrl/api/admin/apis" `
    -ExpectedProperties @("apis")

# 2.2 Crear nueva API de prueba
$newApiBody = @{
    sistema = "testing"
    nombre = "Test API $(Get-Date -Format 'HHmmss')"
    descripcion = "API creada por suite de tests automáticos"
    tipo_integracion = "custom"
    proyecto_id = 1
}

$createResult = Test-Api -Name "Crear API personalizada" `
    -Url "$BaseUrl/api/admin/create-api" `
    -Method "POST" `
    -Body $newApiBody `
    -ExpectedProperties @("success", "api", "integracion")

# Guardar ID de la API creada para tests posteriores
$script:TestApiId = $null
$script:TestApiEndpoint = $null
if ($createResult.Success -and $createResult.Response.api) {
    $script:TestApiId = $createResult.Response.api.id
    $script:TestApiEndpoint = $createResult.Response.api.endpoint
    Write-Host "     📌 API creada con ID: $script:TestApiId" -ForegroundColor Cyan
    Write-Host "     📌 Endpoint: $script:TestApiEndpoint" -ForegroundColor Cyan
}

# 2.3 Obtener estado de APIs
Test-Api -Name "Estado de APIs" `
    -Url "$BaseUrl/api/admin/apis-status" `
    -ExpectedProperties @("totalApis")

# ============================================
# 3. ADMIN - GESTIÓN DE INTEGRACIONES
# ============================================
Write-TestSection "3️⃣  Admin - Integraciones"

Test-Api -Name "Listar integraciones" `
    -Url "$BaseUrl/api/admin/integraciones" `
    -ExpectedProperties @("integraciones", "totalIntegraciones")

# ============================================
# 4. ADMIN - LOGS
# ============================================
Write-TestSection "4️⃣  Admin - Logs"

Test-Api -Name "Obtener logs (limit 10)" `
    -Url "$BaseUrl/api/admin/logs?limit=10" `
    -ExpectedProperties @("logs", "total")

Test-Api -Name "Obtener logs con filtros" `
    -Url "$BaseUrl/api/admin/logs?limit=5&tipo=ERROR" `
    -ExpectedProperties @("logs", "total")

# ============================================
# 5. ADMIN - ESTADÍSTICAS
# ============================================
Write-TestSection "5️⃣  Admin - Estadísticas"

Test-Api -Name "Estadísticas generales" `
    -Url "$BaseUrl/api/admin/stats" `
    -ExpectedProperties @("totalLogs", "totalEjecuciones")

# ============================================
# 6. CPI - RECEPCIÓN DE LOGS
# ============================================
Write-TestSection "6️⃣  CPI - Recepción de Logs"

# 6.1 Log de prueba exitoso
$logBody = @{
    integracion_id = 1
    tipo = "INFO"
    mensaje = "Test log exitoso - Suite de tests $(Get-Date -Format 'HH:mm:ss')"
    detalles = @{
        test = "automated"
        timestamp = (Get-Date).ToString("o")
    }
    correlation_id = "test-$(Get-Random -Maximum 99999)"
}

Test-Api -Name "Enviar log INFO" `
    -Url "$BaseUrl/api/cpi/receive-log" `
    -Method "POST" `
    -Body $logBody `
    -ExpectedProperties @("success", "logId")

# 6.2 Log de error
$errorLogBody = @{
    integracion_id = 1
    tipo = "ERROR"
    mensaje = "Test log ERROR - Simulación de fallo"
    detalles = @{
        error = "Simulated error for testing"
        code = "TEST_ERROR"
    }
    correlation_id = "test-error-$(Get-Random -Maximum 99999)"
}

Test-Api -Name "Enviar log ERROR" `
    -Url "$BaseUrl/api/cpi/receive-log" `
    -Method "POST" `
    -Body $errorLogBody `
    -ExpectedProperties @("success", "logId")

# 6.3 Log con body vacío (excepción)
Test-Api -Name "Enviar log con body vacío" `
    -Url "$BaseUrl/api/cpi/receive-log" `
    -Method "POST" `
    -Body ""

# ============================================
# 7. SYSTEMS - API DINÁMICA
# ============================================
Write-TestSection "7️⃣  Systems - APIs Dinámicas"

if ($script:TestApiEndpoint) {
    # 7.1 GET info de la API creada
    Test-Api -Name "GET info de API creada" `
        -Url "$BaseUrl$script:TestApiEndpoint" `
        -ExpectedProperties @("api", "uso")
    
    # 7.2 POST a la API creada
    $systemBody = @{
        mensaje = "Test de sistema dinámico"
        nivel = "SUCCESS"
        datos = @{
            test = "automated"
            timestamp = (Get-Date).ToString("o")
        }
    }
    
    Test-Api -Name "POST a API dinámica" `
        -Url "$BaseUrl$script:TestApiEndpoint" `
        -Method "POST" `
        -Body $systemBody `
        -ExpectedProperties @("success", "correlationId")
    
    # 7.3 POST con errorDetails
    $errorSystemBody = @{
        properties = @{
            errorDetails = "Error simulado para testing de alertas"
            errorCode = "TEST_ALERT"
        }
    }
    
    Test-Api -Name "POST con errorDetails (excepción)" `
        -Url "$BaseUrl$script:TestApiEndpoint" `
        -Method "POST" `
        -Body $errorSystemBody `
        -ExpectedProperties @("success", "tipo")
}

# ============================================
# 8. TEACHLR - APIs ESPECÍFICAS
# ============================================
Write-TestSection "8️⃣  TeachLR - APIs Específicas"

# 8.1 Logs
Test-Api -Name "TeachLR - Logs HTTPS" `
    -Url "$BaseUrl/api/teachlr/qas-https-logs" `
    -ExpectedProperties @("logs")

# 8.2 Métricas
Test-Api -Name "TeachLR - Métricas HTTPS" `
    -Url "$BaseUrl/api/teachlr/qas-https-metrics" `
    -ExpectedProperties @("metricas")

# 8.3 Status
Test-Api -Name "TeachLR - Status HTTPS" `
    -Url "$BaseUrl/api/teachlr/qas-https-status" `
    -ExpectedProperties @("status")

# 8.4 Webhook certwebhooks
$webhookBody = @{
    event = "test.automated"
    data = @{
        testId = "auto-$(Get-Random -Maximum 99999)"
        timestamp = (Get-Date).ToString("o")
    }
}

Test-Api -Name "TeachLR - Webhook certwebhooks" `
    -Url "$BaseUrl/api/systems/teachlr/certwebhooks" `
    -Method "POST" `
    -Body $webhookBody `
    -ExpectedProperties @("success")

# ============================================
# 9. EVALUAR - APIs ESPECÍFICAS
# ============================================
Write-TestSection "9️⃣  Evaluar - APIs Específicas"

Test-Api -Name "Evaluar - Logs HTTPS" `
    -Url "$BaseUrl/api/evaluar/qas-https-logs" `
    -ExpectedProperties @("logs")

Test-Api -Name "Evaluar - Métricas HTTPS" `
    -Url "$BaseUrl/api/evaluar/qas-https-metrics" `
    -ExpectedProperties @("metricas")

Test-Api -Name "Evaluar - Status HTTPS" `
    -Url "$BaseUrl/api/evaluar/qas-https-status" `
    -ExpectedProperties @("status")

# ============================================
# 10. SSFF - APIs DE SUCCESSFACTORS
# ============================================
Write-TestSection "🔟 SSFF - SuccessFactors APIs"

Test-Api -Name "SSFF - Listar APIs" `
    -Url "$BaseUrl/api/ssff/apis" `
    -ExpectedProperties @("apis")

Test-Api -Name "SSFF - Query" `
    -Url "$BaseUrl/api/ssff/query" `
    -ExpectedProperties @("success")

# ============================================
# 11. VALIDACIÓN DE ERRORES ESPERADOS
# ============================================
Write-TestSection "1️⃣1️⃣  Validación de Errores (Casos Negativos)"

# 11.1 API no encontrada (404)
Test-Api -Name "API inexistente (debe fallar 404)" `
    -Url "$BaseUrl/api/systems/noexiste/noexiste" `
    -ExpectedStatus 404

# 11.2 Log sin datos requeridos
Test-Api -Name "Log sin integracion_id (debe fallar 400)" `
    -Url "$BaseUrl/api/cpi/receive-log" `
    -Method "POST" `
    -Body @{ mensaje = "test sin id" } `
    -ExpectedStatus 400

# 11.3 Límite inválido en logs
Test-Api -Name "Logs con límite inválido (debe fallar 400)" `
    -Url "$BaseUrl/api/admin/logs?limit=99999" `
    -ExpectedStatus 400

# ============================================
# RESUMEN FINAL
# ============================================
Write-Host "`n"
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📊 RESUMEN DE TESTS" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✅ Tests Pasados:    " -NoNewline -ForegroundColor Green
Write-Host $script:PassCount -ForegroundColor White
Write-Host "  ❌ Tests Fallados:   " -NoNewline -ForegroundColor Red
Write-Host $script:FailCount -ForegroundColor White
Write-Host "  ⚠️  Advertencias:    " -NoNewline -ForegroundColor Yellow
Write-Host $script:WarnCount -ForegroundColor White
Write-Host ""

$totalTests = $script:PassCount + $script:FailCount
$successRate = if ($totalTests -gt 0) { [math]::Round(($script:PassCount / $totalTests) * 100, 2) } else { 0 }

Write-Host "  📈 Tasa de Éxito:    " -NoNewline -ForegroundColor Cyan
if ($successRate -ge 90) {
    Write-Host "$successRate%" -ForegroundColor Green
} elseif ($successRate -ge 70) {
    Write-Host "$successRate%" -ForegroundColor Yellow
} else {
    Write-Host "$successRate%" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Salir con código de error si hubo fallos
if ($script:FailCount -gt 0) {
    Write-Host "⚠️  Hay APIs con fallos que requieren atención" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Todas las APIs están funcionando correctamente" -ForegroundColor Green
    exit 0
}
