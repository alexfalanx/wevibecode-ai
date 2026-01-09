# install-phase4-FIXED.ps1
# WeVibeCode.ai - Phase 4: Live Preview System Installation

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WeVibeCode.ai - Phase 4 Installation" -ForegroundColor Cyan
Write-Host "Live Preview System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from your project root." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Confirmed: Running in project root" -ForegroundColor Green
Write-Host ""

$phase4Path = "phase4-preview-system"

if (-not (Test-Path $phase4Path)) {
    Write-Host "Error: Phase 4 folder '$phase4Path' not found." -ForegroundColor Red
    Write-Host "Please extract the phase4-preview-system folder to your project root." -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Creating directories..." -ForegroundColor Yellow

# Create necessary directories if they don't exist
$directories = @(
    "app/api/preview/[id]",
    "app/dashboard/preview/[id]",
    "app/dashboard/test-preview",
    "lib"
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

Write-Host "Step 2: Installing Preview component..." -ForegroundColor Yellow
Copy-Item "$phase4Path/components/Preview.tsx" "components/Preview.tsx" -Force
Write-Host "  [OK] Installed: components/Preview.tsx" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Installing API route..." -ForegroundColor Yellow
Copy-Item "$phase4Path/app/api/preview/[id]/route.ts" "app/api/preview/[id]/route.ts" -Force
Write-Host "  [OK] Installed: app/api/preview/[id]/route.ts" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Installing preview page..." -ForegroundColor Yellow
Copy-Item "$phase4Path/app/dashboard/preview/[id]/page.tsx" "app/dashboard/preview/[id]/page.tsx" -Force
Write-Host "  [OK] Installed: app/dashboard/preview/[id]/page.tsx" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Installing test page..." -ForegroundColor Yellow
Copy-Item "$phase4Path/app/dashboard/test-preview/page.tsx" "app/dashboard/test-preview/page.tsx" -Force
Write-Host "  [OK] Installed: app/dashboard/test-preview/page.tsx" -ForegroundColor Green
Write-Host ""

Write-Host "Step 6: Installing preview utilities..." -ForegroundColor Yellow
Copy-Item "$phase4Path/lib/preview.ts" "lib/preview.ts" -Force
Write-Host "  [OK] Installed: lib/preview.ts" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Phase 4 Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Restart dev server: npm run dev" -ForegroundColor White
Write-Host "2. Visit: http://localhost:3000/dashboard/test-preview" -ForegroundColor White
Write-Host "3. Click 'Create Sample Preview' to test" -ForegroundColor White
Write-Host ""
Write-Host "Features Installed:" -ForegroundColor Cyan
Write-Host "  [OK] Preview Component (Desktop/Tablet/Mobile views)" -ForegroundColor Green
Write-Host "  [OK] Preview API Route" -ForegroundColor Green
Write-Host "  [OK] Preview Page with fullscreen mode" -ForegroundColor Green
Write-Host "  [OK] Preview Utilities (create, update, delete)" -ForegroundColor Green
Write-Host "  [OK] Test Page for demos" -ForegroundColor Green
Write-Host ""
