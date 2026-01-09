# install-phase2-FIXED.ps1
# WeVibeCode.ai - Phase 2 Installation Script
# Language Persistence Implementation

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WeVibeCode.ai - Phase 2 Installation" -ForegroundColor Cyan
Write-Host "Language Persistence" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from your project root." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Confirmed: Running in project root" -ForegroundColor Green
Write-Host ""

# Set implementation path
$implPath = "wevibecode-custom-implementation"

if (-not (Test-Path $implPath)) {
    Write-Host "Error: Implementation folder '$implPath' not found." -ForegroundColor Red
    Write-Host "Please extract the wevibecode-custom-implementation folder to your project root." -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Installing dependencies..." -ForegroundColor Yellow
npm install js-cookie @types/js-cookie
Write-Host "  ✓ Installed js-cookie" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Updating LanguageSwitcher with persistence..." -ForegroundColor Yellow
$switcherSource = "$implPath/phase2/LanguageSwitcher-persistent.tsx"
$switcherDest = "components/LanguageSwitcher.tsx"

if (Test-Path $switcherSource) {
    # Backup existing file
    if (Test-Path $switcherDest) {
        Copy-Item -Path $switcherDest -Destination "$switcherDest.phase2.backup" -Force
        Write-Host "  Backed up: $switcherDest.phase2.backup" -ForegroundColor Gray
    }
    
    # Copy new version
    Copy-Item -Path $switcherSource -Destination $switcherDest -Force
    Write-Host "  ✓ Updated: LanguageSwitcher.tsx" -ForegroundColor Green
} else {
    Write-Host "  ✗ Source not found: $switcherSource" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Creating middleware.ts..." -ForegroundColor Yellow
$middlewareSource = "$implPath/phase2/middleware.ts"
$middlewareDest = "middleware.ts"

if (Test-Path $middlewareSource) {
    # Backup if exists
    if (Test-Path $middlewareDest) {
        Copy-Item -Path $middlewareDest -Destination "$middlewareDest.phase2.backup" -Force
        Write-Host "  Backed up: $middlewareDest.phase2.backup" -ForegroundColor Gray
    }
    
    # Copy new version
    Copy-Item -Path $middlewareSource -Destination $middlewareDest -Force
    Write-Host "  ✓ Created: middleware.ts" -ForegroundColor Green
} else {
    Write-Host "  ✗ Source not found: $middlewareSource" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Phase 2 Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run SQL migration: sql/02-add-language-column.sql in Supabase" -ForegroundColor White
Write-Host "2. Restart dev server: npm run dev" -ForegroundColor White
Write-Host "3. Test language persistence (guest and logged-in)" -ForegroundColor White
Write-Host ""
Write-Host "Rollback if needed:" -ForegroundColor Gray
Write-Host "  Copy-Item components/LanguageSwitcher.tsx.phase2.backup components/LanguageSwitcher.tsx -Force" -ForegroundColor Gray
Write-Host "  Copy-Item middleware.ts.phase2.backup middleware.ts -Force" -ForegroundColor Gray
Write-Host ""
