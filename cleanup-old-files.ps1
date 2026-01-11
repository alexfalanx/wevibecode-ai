# Cleanup Script - Remove Old Files

Write-Host "🧹 Cleaning up old files..." -ForegroundColor Cyan

# List of old files to remove
$oldFiles = @(
    "app/api/generate-website/route-CONTEXT-FIXED.ts",
    "app/api/generate-website/route-MODERN-2024.ts",
    "app/api/generate-website/route-TEMPLATE-SYSTEM.ts",
    "app/api/generate-website/route-FIXED-MODERN.ts",
    "app/api/generate-website/route-REAL-PATTERNS.ts",
    "route-CONTEXT-FIXED.ts",
    "route-MODERN-2024.ts",
    "route-TEMPLATE-SYSTEM.ts",
    "route-FIXED-MODERN.ts",
    "route-REAL-PATTERNS.ts"
)

$removed = 0
$notFound = 0

foreach ($file in $oldFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "✅ Removed: $file" -ForegroundColor Green
        $removed++
    } else {
        $notFound++
    }
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  Removed: $removed files" -ForegroundColor Green
Write-Host "  Not found: $notFound files" -ForegroundColor Yellow

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure route.ts is the ONLY file in app/api/generate-website/" -ForegroundColor White
Write-Host "2. Run: npm run build" -ForegroundColor White
Write-Host "3. If successful, deploy: vercel --prod" -ForegroundColor White
