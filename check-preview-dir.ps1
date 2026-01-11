# Check Preview Directory Structure

Write-Host "🔍 Checking preview directory structure..." -ForegroundColor Cyan
Write-Host ""

# Check if preview directory exists
if (Test-Path "app\dashboard\preview") {
    Write-Host "✅ app\dashboard\preview exists" -ForegroundColor Green
    
    # Check what's inside
    Write-Host ""
    Write-Host "Contents of app\dashboard\preview:" -ForegroundColor Yellow
    Get-ChildItem "app\dashboard\preview" -Recurse | ForEach-Object {
        $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "")
        if ($_.PSIsContainer) {
            Write-Host "  📁 $relativePath" -ForegroundColor Cyan
        } else {
            Write-Host "  📄 $relativePath" -ForegroundColor White
        }
    }
} else {
    Write-Host "❌ app\dashboard\preview does NOT exist" -ForegroundColor Red
    Write-Host ""
    Write-Host "Creating directory structure..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "app\dashboard\preview\[id]" -Force | Out-Null
    Write-Host "✅ Created app\dashboard\preview\[id]" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Required structure:" -ForegroundColor Cyan
Write-Host "app/" -ForegroundColor White
Write-Host "  └─ dashboard/" -ForegroundColor White
Write-Host "      └─ preview/" -ForegroundColor White
Write-Host "          └─ [id]/" -ForegroundColor Yellow
Write-Host "              └─ page.tsx" -ForegroundColor Green
Write-Host ""

# Check if the specific file exists
$targetFile = "app\dashboard\preview\[id]\page.tsx"
if (Test-Path $targetFile) {
    Write-Host "✅ File exists: $targetFile" -ForegroundColor Green
    
    # Show first few lines
    Write-Host ""
    Write-Host "First 5 lines of file:" -ForegroundColor Yellow
    Get-Content $targetFile -Head 5
} else {
    Write-Host "❌ File MISSING: $targetFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix, run:" -ForegroundColor Yellow
    Write-Host "  Copy-Item preview-id-page.tsx app\dashboard\preview\[id]\page.tsx -Force" -ForegroundColor White
}

Write-Host ""
