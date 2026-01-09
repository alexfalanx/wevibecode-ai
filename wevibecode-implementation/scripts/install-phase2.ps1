# install-phase2.ps1
# WeVibeCode.ai - Phase 2 Installation Script (Language Persistence)
# Run this from your project root directory

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

Write-Host "Step 1: Updating LanguageSwitcher component..." -ForegroundColor Yellow
$implPath = "wevibecode-implementation"
$switcherSource = Join-Path $implPath "phase2/LanguageSwitcher-persistent.tsx"
$switcherDest = "components/LanguageSwitcher.tsx"

if (Test-Path $switcherSource) {
    Copy-Item -Path $switcherSource -Destination $switcherDest -Force
    Write-Host "  Updated: LanguageSwitcher.tsx with persistence" -ForegroundColor Green
} else {
    Write-Host "  Error: Source file not found - $switcherSource" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Updating middleware..." -ForegroundColor Yellow
$middlewareSource = Join-Path $implPath "phase2/middleware.ts"
$middlewareDest = "middleware.ts"

if (Test-Path $middlewareSource) {
    # Backup existing middleware
    if (Test-Path $middlewareDest) {
        $backupPath = "middleware.ts.backup"
        Copy-Item -Path $middlewareDest -Destination $backupPath -Force
        Write-Host "  Created backup: middleware.ts.backup" -ForegroundColor Gray
    }
    
    Copy-Item -Path $middlewareSource -Destination $middlewareDest -Force
    Write-Host "  Updated: middleware.ts" -ForegroundColor Green
} else {
    Write-Host "  Error: Source file not found - $middlewareSource" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Checking npm packages..." -ForegroundColor Yellow
Write-Host "  Verifying js-cookie is installed..." -ForegroundColor Gray
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json

if (-not $packageJson.dependencies.'js-cookie') {
    Write-Host "  Installing js-cookie..." -ForegroundColor Yellow
    npm install js-cookie
    npm install --save-dev @types/js-cookie
    Write-Host "  Installed: js-cookie" -ForegroundColor Green
} else {
    Write-Host "  Already installed: js-cookie" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 2 Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run the SQL script in Supabase:" -ForegroundColor White
Write-Host "   - Open Supabase Dashboard > SQL Editor" -ForegroundColor Gray
Write-Host "   - Run: wevibecode-implementation/sql/02-add-language-column.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test the changes:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Verify:" -ForegroundColor White
Write-Host "   - Language choice persists for guests (cookie)" -ForegroundColor Gray
Write-Host "   - Language choice saves to database for logged-in users" -ForegroundColor Gray
Write-Host "   - Refresh keeps selected language" -ForegroundColor Gray
Write-Host "   - Auto-redirect works on first visit" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Check Supabase:" -ForegroundColor White
Write-Host "   - Verify preferred_language column exists in profiles table" -ForegroundColor Gray
Write-Host "   - Test language switching updates the database" -ForegroundColor Gray
Write-Host ""
