# Verify Project Files

Write-Host "🔍 Checking project structure..." -ForegroundColor Cyan
Write-Host ""

# Check app/api/generate-website/ directory
Write-Host "📁 app/api/generate-website/ should contain:" -ForegroundColor Yellow
Write-Host "   ✅ route.ts (ONLY THIS FILE)" -ForegroundColor Green
Write-Host ""

if (Test-Path "app/api/generate-website") {
    $files = Get-ChildItem "app/api/generate-website" -File
    
    Write-Host "Files found:" -ForegroundColor Cyan
    foreach ($file in $files) {
        if ($file.Name -eq "route.ts") {
            Write-Host "  ✅ $($file.Name)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $($file.Name) (SHOULD BE REMOVED)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    
    if ($files.Count -eq 1 -and $files[0].Name -eq "route.ts") {
        Write-Host "✅ Perfect! Only route.ts exists" -ForegroundColor Green
    } else {
        Write-Host "❌ ERROR: Extra files found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "To fix:" -ForegroundColor Yellow
        Write-Host "1. Delete ALL files except route.ts" -ForegroundColor White
        Write-Host "2. Or run: ./cleanup-old-files.ps1" -ForegroundColor White
    }
} else {
    Write-Host "❌ ERROR: app/api/generate-website/ not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Other important files:" -ForegroundColor Cyan

$importantFiles = @{
    "app/dashboard/generate/page.tsx" = "Generation UI"
    "app/dashboard/preview/[id]/page.tsx" = "Preview page"
    "components/Preview.tsx" = "Preview component"
}

foreach ($file in $importantFiles.Keys) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (MISSING)" -ForegroundColor Red
    }
}

Write-Host ""
