# Script para configurar variables de entorno en Vercel
# Ejecuta este script después de instalar Vercel CLI: npm i -g vercel

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   CONFIGURAR VARIABLES DE ENTORNO CPI   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Este script configurará las variables de entorno para SAP CPI en Vercel" -ForegroundColor Yellow
Write-Host ""

# Verificar si Vercel CLI está instalado
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI no está instalado" -ForegroundColor Red
    Write-Host "Instálalo con: npm i -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Vercel CLI detectado" -ForegroundColor Green
Write-Host ""

# Leer credenciales
Write-Host "Ingresa las credenciales de SAP CPI:" -ForegroundColor Cyan
Write-Host ""

$cpiUrl = Read-Host "URL de CPI [Enter para usar default]"
if ([string]::IsNullOrWhiteSpace($cpiUrl)) {
    $cpiUrl = "https://e0980-iflmap.hcisbt.us2.hana.ondemand.com/http/Certificate/user"
}

$cpiUsername = Read-Host "Usuario CPI [Enter para usar default]"
if ([string]::IsNullOrWhiteSpace($cpiUsername)) {
    $cpiUsername = "SFAPIUser@gerdaumetaT1"
}

$cpiPassword = Read-Host "Password CPI [Enter para usar default]"
if ([string]::IsNullOrWhiteSpace($cpiPassword)) {
    $cpiPassword = "Agp.2025"
}

Write-Host ""
Write-Host "Configurando variables en Vercel..." -ForegroundColor Yellow

# Configurar variables para todos los entornos (production, preview, development)
try {
    Write-Host "🔧 Configurando CPI_CERTIFICATE_URL..." -ForegroundColor Cyan
    vercel env add CPI_CERTIFICATE_URL production preview development --force
    Write-Output $cpiUrl | vercel env add CPI_CERTIFICATE_URL production
    Write-Output $cpiUrl | vercel env add CPI_CERTIFICATE_URL preview
    Write-Output $cpiUrl | vercel env add CPI_CERTIFICATE_URL development
    
    Write-Host "🔧 Configurando CPI_USERNAME..." -ForegroundColor Cyan
    Write-Output $cpiUsername | vercel env add CPI_USERNAME production
    Write-Output $cpiUsername | vercel env add CPI_USERNAME preview
    Write-Output $cpiUsername | vercel env add CPI_USERNAME development
    
    Write-Host "🔧 Configurando CPI_PASSWORD..." -ForegroundColor Cyan
    Write-Output $cpiPassword | vercel env add CPI_PASSWORD production
    Write-Output $cpiPassword | vercel env add CPI_PASSWORD preview
    Write-Output $cpiPassword | vercel env add CPI_PASSWORD development
    
    Write-Host ""
    Write-Host "✅ Variables configuradas exitosamente en Vercel" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANTE: Redeploya la aplicación para aplicar los cambios:" -ForegroundColor Yellow
    Write-Host "  vercel --prod" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "O desde el dashboard de Vercel:" -ForegroundColor Yellow
    Write-Host "  https://vercel.com/yaelfuentes/apiscpisap/settings/environment-variables" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "❌ Error configurando variables: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Configúralas manualmente en:" -ForegroundColor Yellow
    Write-Host "https://vercel.com/yaelfuentes/apiscpisap/settings/environment-variables" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Variables a configurar:" -ForegroundColor Yellow
    Write-Host "  CPI_CERTIFICATE_URL = $cpiUrl" -ForegroundColor White
    Write-Host "  CPI_USERNAME = $cpiUsername" -ForegroundColor White
    Write-Host "  CPI_PASSWORD = ********" -ForegroundColor White
}
