# install-phase3-enhanced.ps1
# WeVibeCode.ai - Enhanced Phase 3: Visual Styles + AI Images

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WeVibeCode.ai - Enhanced Phase 3" -ForegroundColor Cyan
Write-Host "Visual Styles + AI Images" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Running in project root" -ForegroundColor Green
Write-Host ""

$phase3Path = "phase3-enhanced"

if (-not (Test-Path $phase3Path)) {
    Write-Host "Error: phase3-enhanced folder not found" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Verifying OpenAI package..." -ForegroundColor Yellow
npm list openai 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Installing OpenAI package..." -ForegroundColor Gray
    npm install openai
}
Write-Host "  [OK] OpenAI package ready" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Installing enhanced API route..." -ForegroundColor Yellow
Copy-Item "$phase3Path/app/api/generate-website/route.ts" "app/api/generate-website/route.ts" -Force
Write-Host "  [OK] API route updated" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Installing enhanced generation page..." -ForegroundColor Yellow
Copy-Item "$phase3Path/app/dashboard/generate/page.tsx" "app/dashboard/generate/page.tsx" -Force
Write-Host "  [OK] Generation page updated" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEW FEATURES:" -ForegroundColor Cyan
Write-Host "  [OK] 6 Visual Styles (Bold, Elegant, Playful, etc)" -ForegroundColor Green
Write-Host "  [OK] AI Image Generation (DALL-E 3)" -ForegroundColor Green
Write-Host "  [OK] Dynamic Font Loading (Google Fonts)" -ForegroundColor Green
Write-Host "  [OK] Enhanced Credit System" -ForegroundColor Green
Write-Host "  [OK] Radically Different Designs" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Restart dev server: npm run dev" -ForegroundColor White
Write-Host "2. Visit: http://localhost:3000/dashboard/generate" -ForegroundColor White
Write-Host "3. Try different visual styles!" -ForegroundColor White
Write-Host ""
Write-Host "CREDITS SYSTEM:" -ForegroundColor Yellow
Write-Host "  - Website (no images): 1 credit" -ForegroundColor White
Write-Host "  - Per AI image: 2 credits" -ForegroundColor White
Write-Host "  - Landing page with images: 11 credits (1 + 5x2)" -ForegroundColor White
Write-Host ""
