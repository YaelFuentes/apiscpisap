# Script de validación rápida post-deploy
# Verifica que todas las mejoras estén funcionando correctamente

param(
    [string]$BaseUrl = "https://apiscpisap.vercel.app"
)

Write-Host "🔍 VALIDACIÓN RÁPIDA - Post Deploy" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# 1. Health Check
Write-Host "1️⃣  Verificando Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -TimeoutSec 10
    
    if ($health.status -eq "healthy" -or $health.status -eq "degraded") {
        Write-Host "   ✅ Health Check: $($health.status)" -ForegroundColor Green
        Write-Host "   📊 Stats: $($health.stats.totalLogs) logs, $($health.stats.apisActivas) APIs activas" -ForegroundColor DarkGray
        
        if ($health.warnings -and $health.warnings.Count -gt 0) {
            Write-Host "   ⚠️  Advertencias: $($health.warnings.Count)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ Health Check: $($health.status)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ Error en Health Check: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# 2. Test de Logs API
Write-Host "2️⃣  Verificando Logs API..." -ForegroundColor Yellow
try {
    $logs = Invoke-RestMethod -Uri "$BaseUrl/api/admin/logs?limit=5" -TimeoutSec 10
    
    if ($logs.success) {
        Write-Host "   ✅ Logs API funcionando" -ForegroundColor Green
        Write-Host "   📋 Total logs: $($logs.total)" -ForegroundColor DarkGray
    } else {
        Write-Host "   ❌ Logs API falló" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ Error en Logs API: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# 3. Test de creación de log
Write-Host "3️⃣  Test de recepción de log..." -ForegroundColor Yellow
try {
    $testLog = @{
        integracion_id = 1
        tipo = "INFO"
        mensaje = "Test de validación - $(Get-Date -Format 'HH:mm:ss')"
        detalles = @{
            test = "validation"
            timestamp = (Get-Date).ToString("o")
        }
        correlation_id = "val-$(Get-Random -Maximum 99999)"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/cpi/receive-log" -Method Post -Body $testLog -ContentType "application/json" -TimeoutSec 10
    
    if ($response.success) {
        Write-Host "   ✅ Recepción de logs OK" -ForegroundColor Green
        Write-Host "   🆔 Log ID: $($response.logId)" -ForegroundColor DarkGray
    } else {
        Write-Host "   ❌ Recepción de logs falló" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ Error en recepción: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# 4. Test de Stats API
Write-Host "4️⃣  Verificando Stats API..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$BaseUrl/api/admin/stats" -TimeoutSec 10
    
    if ($stats.success -or $stats.totalLogs -ne $null) {
        Write-Host "   ✅ Stats API funcionando" -ForegroundColor Green
        Write-Host "   📊 Logs: $($stats.totalLogs), Ejecuciones: $($stats.totalEjecuciones)" -ForegroundColor DarkGray
    } else {
        Write-Host "   ❌ Stats API falló" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ Error en Stats API: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# 5. Test de API dinámica (TeachLR)
Write-Host "5️⃣  Test de API dinámica (TeachLR)..." -ForegroundColor Yellow
try {
    $webhookBody = @{
        event = "test.validation"
        data = @{
            testId = "val-$(Get-Random -Maximum 99999)"
            timestamp = (Get-Date).ToString("o")
        }
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/systems/teachlr/certwebhooks" -Method Post -Body $webhookBody -ContentType "application/json" -TimeoutSec 10
    
    if ($response.success) {
        Write-Host "   ✅ API dinámica OK (sin ReferenceError)" -ForegroundColor Green
        Write-Host "   🔗 Endpoint: /systems/teachlr/certwebhooks" -ForegroundColor DarkGray
    } else {
        Write-Host "   ❌ API dinámica falló" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ Error en API dinámica: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "✅ TODAS LAS VALIDACIONES PASARON" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
    Write-Host "   1. Abre $BaseUrl" -ForegroundColor White
    Write-Host "   2. Ve a 'Monitor CPI' y verifica logs en tiempo real" -ForegroundColor White
    Write-Host "   3. Elimina un log para probar notificaciones" -ForegroundColor White
    Write-Host "   4. Ejecuta la suite completa: .\tests\api-comprehensive-test.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 Sistema listo para producción!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ ALGUNAS VALIDACIONES FALLARON" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  Revisa los errores arriba y:" -ForegroundColor Yellow
    Write-Host "   1. Verifica que el deploy haya completado en Vercel" -ForegroundColor White
    Write-Host "   2. Revisa los logs de Vercel por errores" -ForegroundColor White
    Write-Host "   3. Ejecuta: .\tests\api-comprehensive-test.ps1 -Verbose" -ForegroundColor White
    Write-Host ""
    exit 1
}
