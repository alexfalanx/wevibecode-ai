# install-phase3.ps1
# WeVibeCode.ai - Phase 3: AI Website Generation Installation

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WeVibeCode.ai - Phase 3 Installation" -ForegroundColor Cyan
Write-Host "AI Website Generation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from your project root." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Confirmed: Running in project root" -ForegroundColor Green
Write-Host ""

$phase3Path = "phase3-website-generation"

if (-not (Test-Path $phase3Path)) {
    Write-Host "Error: Phase 3 folder '$phase3Path' not found." -ForegroundColor Red
    Write-Host "Please extract the phase3-website-generation folder to your project root." -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Installing OpenAI package..." -ForegroundColor Yellow
npm install openai
Write-Host "  [OK] OpenAI package installed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Creating directories..." -ForegroundColor Yellow
$directories = @(
    "app/api/generate-website",
    "app/dashboard/generate",
    "app/dashboard/history"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  Created: $dir" -ForegroundColor Gray
    } else {
        Write-Host "  Exists: $dir" -ForegroundColor Gray
    }
}

Write-Host "  [OK] All directories ready" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Installing API route..." -ForegroundColor Yellow
Copy-Item "$phase3Path/app/api/generate-website/route.ts" "app/api/generate-website/route.ts" -Force
Write-Host "  [OK] Installed: app/api/generate-website/route.ts" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Installing generation page..." -ForegroundColor Yellow
Copy-Item "$phase3Path/app/dashboard/generate/page.tsx" "app/dashboard/generate/page.tsx" -Force
Write-Host "  [OK] Installed: app/dashboard/generate/page.tsx" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Installing history page..." -ForegroundColor Yellow
Copy-Item "$phase3Path/app/dashboard/history/page.tsx" "app/dashboard/history/page.tsx" -Force
Write-Host "  [OK] Installed: app/dashboard/history/page.tsx" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Phase 3 Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Next Steps" -ForegroundColor Yellow
Write-Host "1. Run SQL migration in Supabase:" -ForegroundColor White
Write-Host "   Open: $phase3Path/sql/phase3-migration.sql" -ForegroundColor Gray
Write-Host "   Copy SQL and run in Supabase SQL Editor" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verify OpenAI API key in .env.local:" -ForegroundColor White
Write-Host "   OPENAI_API_KEY=sk-..." -ForegroundColor Gray
Write-Host ""
Write-Host "3. Restart dev server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Visit: http://localhost:3000/dashboard/generate" -ForegroundColor White
Write-Host ""
Write-Host "Features Installed:" -ForegroundColor Cyan
Write-Host "  [OK] AI Website Generation API (GPT-4)" -ForegroundColor Green
Write-Host "  [OK] Generation Dashboard with prompt input" -ForegroundColor Green
Write-Host "  [OK] Website type selector (6 types)" -ForegroundColor Green
Write-Host "  [OK] Color scheme picker" -ForegroundColor Green
Write-Host "  [OK] Credits system integration" -ForegroundColor Green
Write-Host "  [OK] Generation history page" -ForegroundColor Green
Write-Host "  [OK] Auto-preview integration (Phase 4)" -ForegroundColor Green
Write-Host ""
