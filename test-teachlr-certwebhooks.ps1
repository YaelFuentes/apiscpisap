# Script para probar la API de TeachLR Cert Webhooks
# Prueba específica para /api/systems/teachlr/certwebhooks

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🧪 TEST - API TeachLR Cert Webhooks" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# URL de producción
$baseUrl = "https://apiscpisap.vercel.app"
$endpoint = "$baseUrl/api/systems/teachlr/certwebhooks"

Write-Host "🌐 URL: $endpoint" -ForegroundColor Yellow
Write-Host ""

# Función helper para hacer requests
function Test-API {
    param(
        [string]$TestName,
        [object]$Body,
        [string]$ContentType = "application/json"
    )
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "🔍 TEST: $TestName" -ForegroundColor Green
    Write-Host ""
    
    try {
        $bodyJson = if ($Body) { $Body | ConvertTo-Json -Depth 10 } else { "" }
        
        Write-Host "📤 Enviando petición..." -ForegroundColor Gray
        if ($bodyJson) {
            Write-Host "📦 Body (primeros 200 caracteres):" -ForegroundColor Gray
            Write-Host $bodyJson.Substring(0, [Math]::Min(200, $bodyJson.Length)) -ForegroundColor DarkGray
        }
        Write-Host ""
        
        $response = Invoke-RestMethod -Uri $endpoint `
                                      -Method POST `
                                      -Body $bodyJson `
                                      -ContentType $ContentType `
                                      -ErrorAction Stop
        
        Write-Host "✅ ÉXITO" -ForegroundColor Green
        Write-Host "📥 Respuesta:" -ForegroundColor Cyan
        Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor White
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ ERROR: $statusCode" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            $errorJson = $errorBody | ConvertFrom-Json
            Write-Host "📥 Error Response:" -ForegroundColor Cyan
            Write-Host ($errorJson | ConvertTo-Json -Depth 5) -ForegroundColor White
        } catch {
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

# ============================================
# TEST 1: Webhook de certificación exitosa
# ============================================
Test-API -TestName "Webhook de certificación exitosa" -Body @{
    event = "certificate.issued"
    nivel = "SUCCESS"
    data = @{
        certificateId = "cert-12345"
        userId = "user-67890"
        courseId = "course-abc123"
        courseName = "Curso de Prueba"
        issuedAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")
    }
    properties = @{
        webhookId = "wh-$(Get-Random)"
        timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")
    }
}

Start-Sleep -Seconds 1

# ============================================
# TEST 2: Error en el webhook (con errorDetails)
# ============================================
Test-API -TestName "Webhook con error de validación" -Body @{
    event = "certificate.failed"
    properties = @{
        errorDetails = "Validation failed: User does not meet course completion requirements"
        userId = "user-99999"
        courseId = "course-xyz789"
        reason = "incomplete_course"
        completionPercentage = 75
    }
}

Start-Sleep -Seconds 1

# ============================================
# TEST 3: Body vacío (simular excepción)
# ============================================
Test-API -TestName "Body vacío (excepción)" -Body $null

Start-Sleep -Seconds 1

# ============================================
# TEST 4: Webhook con datos mínimos
# ============================================
Test-API -TestName "Webhook con datos mínimos" -Body @{
    event = "test.webhook"
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")
}

Start-Sleep -Seconds 1

# ============================================
# TEST 5: Webhook con estructura compleja
# ============================================
Test-API -TestName "Webhook con estructura compleja" -Body @{
    event = "certificate.revoked"
    nivel = "WARNING"
    data = @{
        certificateId = "cert-revoked-001"
        userId = "user-12345"
        reason = "policy_violation"
        revokedBy = "admin-001"
        revokedAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")
        previousStatus = "active"
        newStatus = "revoked"
    }
    metadata = @{
        ipAddress = "192.168.1.100"
        userAgent = "Mozilla/5.0"
        requestId = "req-$(Get-Random)"
    }
    properties = @{
        notificationSent = "true"
        emailDelivered = "true"
        smsDelivered = "false"
    }
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ TESTS COMPLETADOS" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Verifica los resultados:" -ForegroundColor Yellow
Write-Host "   1. Todos los tests deberían completarse sin error" -ForegroundColor Gray
Write-Host "   2. Los logs deberían estar en la app" -ForegroundColor Gray
Write-Host "   3. Ve a: $baseUrl" -ForegroundColor Gray
Write-Host "   4. Pestaña: Monitor CPI" -ForegroundColor Gray
Write-Host "   5. Busca los logs de 'teachlr' / 'certwebhooks'" -ForegroundColor Gray
Write-Host ""

Write-Host "🔍 Para verificar la API:" -ForegroundColor Yellow
Write-Host "   GET $endpoint" -ForegroundColor Cyan
Write-Host ""

# Opcional: Hacer GET para ver información de la API
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "📋 Información de la API (GET)" -ForegroundColor Blue
Write-Host ""

try {
    $apiInfo = Invoke-RestMethod -Uri $endpoint -Method GET -ErrorAction Stop
    Write-Host "✅ API Info:" -ForegroundColor Green
    Write-Host ($apiInfo | ConvertTo-Json -Depth 5) -ForegroundColor White
} catch {
    Write-Host "⚠️ No se pudo obtener información de la API" -ForegroundColor Yellow
    Write-Host "   Esto es normal si la API aún no está creada en la BD" -ForegroundColor Gray
    Write-Host "   Primero debes crear la API usando POST /api/admin/apis" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎉 Script completado!" -ForegroundColor Green
Write-Host ""
