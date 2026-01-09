# install-all.ps1
# WeVibeCode.ai - Master Installation Script
# Installs Phase 1 and Phase 2 sequentially

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   WeVibeCode.ai Implementation" -ForegroundColor Cyan
Write-Host "   Master Installation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found." -ForegroundColor Red
    Write-Host "Please run this script from your project root directory." -ForegroundColor Red
    exit 1
}

Write-Host "This script will install Phase 1 and Phase 2 automatically." -ForegroundColor Yellow
Write-Host ""
Write-Host "What will be installed:" -ForegroundColor White
Write-Host "  Phase 1: Login button fix, signup fix, German translation" -ForegroundColor Gray
Write-Host "  Phase 2: Language persistence (cookie + database)" -ForegroundColor Gray
Write-Host ""

$confirmation = Read-Host "Continue? (Y/N)"
if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host "Installation cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing Phase 1..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Run Phase 1 script
& ".\wevibecode-implementation\scripts\install-phase1.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Error: Phase 1 installation failed." -ForegroundColor Red
    Write-Host "Please check the errors above and fix them before continuing." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Pausing before Phase 2..." -ForegroundColor Yellow
Write-Host "Please:" -ForegroundColor Yellow
Write-Host "1. Run the SQL script in Supabase (sql/01-setup-profiles.sql)" -ForegroundColor White
Write-Host "2. Update your layout file to include <Header />" -ForegroundColor White
Write-Host "3. Test that Phase 1 works (npm run dev)" -ForegroundColor White
Write-Host ""
$continue = Read-Host "Have you completed these steps? Continue to Phase 2? (Y/N)"

if ($continue -ne 'Y' -and $continue -ne 'y') {
    Write-Host ""
    Write-Host "Installation paused." -ForegroundColor Yellow
    Write-Host "Run .\wevibecode-implementation\scripts\install-phase2.ps1 when ready." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing Phase 2..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Run Phase 2 script
& ".\wevibecode-implementation\scripts\install-phase2.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Error: Phase 2 installation failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Final Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Run Phase 2 SQL script:" -ForegroundColor White
Write-Host "   - Supabase Dashboard > SQL Editor" -ForegroundColor Gray
Write-Host "   - Run: wevibecode-implementation/sql/02-add-language-column.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test everything:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Verify all features work (see README.md testing checklist)" -ForegroundColor White
Write-Host ""
Write-Host "4. Commit and deploy:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Implement Phase 1 & 2: Core fixes and language persistence'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Manually redeploy in Vercel if needed" -ForegroundColor White
Write-Host ""
Write-Host "Need help? Check README.md for troubleshooting." -ForegroundColor Cyan
Write-Host ""
