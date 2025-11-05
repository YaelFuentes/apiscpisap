# Script para probar el proxy automático a SAP CPI
# Endpoint: /api/systems/teachlr/certwebhooks
# Reenvía automáticamente a: https://e0980-iflmap.hcisbt.us2.hana.ondemand.com/http/Certificate/user

param(
    [string]$BaseUrl = "https://apiscpisap.vercel.app",
    [switch]$Local
)

if ($Local) {
    $BaseUrl = "http://localhost:3000"
}

$endpoint = "$BaseUrl/api/systems/teachlr/certwebhooks"

Write-Host "🧪 TEST: Proxy Automático a SAP CPI" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Endpoint: $endpoint" -ForegroundColor White
Write-Host "Target CPI: https://e0980-iflmap.hcisbt.us2.hana.ondemand.com/http/Certificate/user" -ForegroundColor White
Write-Host ""

# ============================================
# Test 1: Webhook de certificado emitido
# ============================================
Write-Host "📋 Test 1: Certificado Emitido (certificate.issued)" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────" -ForegroundColor DarkGray

$body1 = @{
    event = "certificate.issued"
    timestamp = (Get-Date).ToString("o")
    data = @{
        certificateId = "CERT-$(Get-Random -Maximum 99999)"
        userId = "user_12345"
        userName = "Juan Pérez"
        userEmail = "juan.perez@gerdau.com"
        courseName = "Seguridad Industrial"
        courseId = "course_001"
        issueDate = (Get-Date).ToString("yyyy-MM-dd")
        expirationDate = (Get-Date).AddYears(1).ToString("yyyy-MM-dd")
        certificateUrl = "https://teachlr.com/certificates/cert-12345"
        grade = 95.5
        completionPercentage = 100
    }
    metadata = @{
        platform = "TeachLR"
        version = "1.0"
        environment = "production"
    }
} | ConvertTo-Json -Depth 10

Write-Host "📤 Enviando webhook..." -ForegroundColor White

try {
    $response1 = Invoke-RestMethod -Uri $endpoint -Method Post -Body $body1 -ContentType "application/json" -TimeoutSec 60
    
    Write-Host "✅ Respuesta recibida:" -ForegroundColor Green
    Write-Host ($response1 | ConvertTo-Json -Depth 5) -ForegroundColor Gray
    
    if ($response1.success) {
        Write-Host "✅ Test 1 PASÓ - Webhook procesado exitosamente" -ForegroundColor Green
        if ($response1.mensaje -like "*CPI*") {
            Write-Host "✅ Proxy a SAP CPI ejecutado correctamente" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  Test 1 - Respuesta no exitosa" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Test 1 FALLÓ" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# ============================================
# Test 2: Webhook de certificado fallido
# ============================================
Write-Host "📋 Test 2: Certificado Fallido (certificate.failed)" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────" -ForegroundColor DarkGray

$body2 = @{
    event = "certificate.failed"
    timestamp = (Get-Date).ToString("o")
    data = @{
        userId = "user_67890"
        userName = "María González"
        userEmail = "maria.gonzalez@gerdau.com"
        courseName = "Prevención de Riesgos"
        courseId = "course_002"
        failureReason = "Curso no completado"
        completionPercentage = 78
        attemptsCount = 3
    }
    error = @{
        code = "INCOMPLETE_COURSE"
        message = "El usuario no completó el 80% requerido del curso"
    }
} | ConvertTo-Json -Depth 10

Write-Host "📤 Enviando webhook de fallo..." -ForegroundColor White

try {
    $response2 = Invoke-RestMethod -Uri $endpoint -Method Post -Body $body2 -ContentType "application/json" -TimeoutSec 60
    
    Write-Host "✅ Respuesta recibida:" -ForegroundColor Green
    Write-Host ($response2 | ConvertTo-Json -Depth 5) -ForegroundColor Gray
    
    if ($response2.success) {
        Write-Host "✅ Test 2 PASÓ - Webhook de fallo procesado" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Test 2 FALLÓ" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================
# Test 3: Webhook con datos mínimos
# ============================================
Write-Host "📋 Test 3: Datos Mínimos" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────" -ForegroundColor DarkGray

$body3 = @{
    event = "certificate.test"
    data = @{
        testId = "test-$(Get-Random -Maximum 99999)"
    }
} | ConvertTo-Json

Write-Host "📤 Enviando webhook mínimo..." -ForegroundColor White

try {
    $response3 = Invoke-RestMethod -Uri $endpoint -Method Post -Body $body3 -ContentType "application/json" -TimeoutSec 60
    
    Write-Host "✅ Respuesta recibida:" -ForegroundColor Green
    Write-Host ($response3 | ConvertTo-Json -Depth 5) -ForegroundColor Gray
    
    if ($response3.success) {
        Write-Host "✅ Test 3 PASÓ - Datos mínimos procesados" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Test 3 FALLÓ" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================
# Test 4: Webhook complejo con arrays
# ============================================
Write-Host "📋 Test 4: Datos Complejos (Arrays y Nested Objects)" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────" -ForegroundColor DarkGray

$body4 = @{
    event = "certificate.batch"
    timestamp = (Get-Date).ToString("o")
    batch = @{
        batchId = "batch-$(Get-Random -Maximum 99999)"
        totalCertificates = 5
        certificates = @(
            @{
                userId = "user_001"
                userName = "Carlos Rodríguez"
                certificateId = "CERT-001"
                courseName = "Curso A"
            },
            @{
                userId = "user_002"
                userName = "Ana Martínez"
                certificateId = "CERT-002"
                courseName = "Curso B"
            },
            @{
                userId = "user_003"
                userName = "Luis Fernández"
                certificateId = "CERT-003"
                courseName = "Curso C"
            }
        )
    }
    metadata = @{
        processedBy = "automated-system"
        department = "Capacitación"
        tags = @("batch", "monthly", "mandatory")
    }
} | ConvertTo-Json -Depth 10

Write-Host "📤 Enviando webhook complejo..." -ForegroundColor White

try {
    $response4 = Invoke-RestMethod -Uri $endpoint -Method Post -Body $body4 -ContentType "application/json" -TimeoutSec 60
    
    Write-Host "✅ Respuesta recibida:" -ForegroundColor Green
    Write-Host ($response4 | ConvertTo-Json -Depth 5) -ForegroundColor Gray
    
    if ($response4.success) {
        Write-Host "✅ Test 4 PASÓ - Datos complejos procesados" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Test 4 FALLÓ" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================
# RESUMEN
# ============================================
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE TESTS" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Tests completados" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Verifica los logs en https://apiscpisap.vercel.app" -ForegroundColor White
Write-Host "   2. Revisa que los webhooks aparezcan en el Monitor CPI" -ForegroundColor White
Write-Host "   3. Valida en SAP CPI que los datos llegaron correctamente" -ForegroundColor White
Write-Host "   4. Verifica la tabla Certificate/user en SAP" -ForegroundColor White
Write-Host ""
Write-Host "🔗 URLs de verificación:" -ForegroundColor Cyan
Write-Host "   - Monitor: https://apiscpisap.vercel.app (pestaña Monitor CPI)" -ForegroundColor White
Write-Host "   - SAP CPI: https://e0980-iflmap.hcisbt.us2.hana.ondemand.com" -ForegroundColor White
Write-Host ""
