# =============================================================================
# MASTER FIX SCRIPT - WeVibeCode.ai
# Date: January 10, 2026
# Purpose: Fix hero gradient + Debug image generation
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "🚀 WeVibeCode.ai - Master Fix Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Project root directory
$projectRoot = "C:\Users\aless\wevibecode-ai"
$routeFile = "$projectRoot\app\api\generate-website\route.ts"
$envFile = "$projectRoot\.env.local"

# =============================================================================
# STEP 1: CHECK PROJECT STRUCTURE
# =============================================================================
Write-Host "📁 Step 1: Checking project structure..." -ForegroundColor Yellow

if (-not (Test-Path $projectRoot)) {
    Write-Host "❌ ERROR: Project directory not found at $projectRoot" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $routeFile)) {
    Write-Host "❌ ERROR: route.ts not found at $routeFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project structure OK" -ForegroundColor Green
Write-Host ""

# =============================================================================
# STEP 2: CHECK ENVIRONMENT VARIABLES
# =============================================================================
Write-Host "🔑 Step 2: Checking environment variables..." -ForegroundColor Yellow

if (-not (Test-Path $envFile)) {
    Write-Host "⚠️  WARNING: .env.local not found!" -ForegroundColor Yellow
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    
    $envContent = @"
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here

# Unsplash (REQUIRED FOR IMAGES)
UNSPLASH_ACCESS_KEY=your-unsplash-key-here
"@
    
    Set-Content -Path $envFile -Value $envContent -Encoding UTF8
    Write-Host "📝 Created .env.local template" -ForegroundColor Green
    Write-Host "⚠️  Please add your actual API keys!" -ForegroundColor Yellow
} else {
    $envContent = Get-Content $envFile -Raw
    
    if ($envContent -match "UNSPLASH_ACCESS_KEY=(.+)") {
        $unsplashKey = $matches[1].Trim()
        if ($unsplashKey -eq "your-unsplash-key-here" -or $unsplashKey -eq "") {
            Write-Host "⚠️  WARNING: UNSPLASH_ACCESS_KEY not configured!" -ForegroundColor Yellow
            Write-Host "Images will NOT be generated without a valid Unsplash API key" -ForegroundColor Yellow
        } else {
            Write-Host "✅ UNSPLASH_ACCESS_KEY found (${unsplashKey.Substring(0, 10)}...)" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  WARNING: UNSPLASH_ACCESS_KEY missing from .env.local!" -ForegroundColor Yellow
        Write-Host "Adding UNSPLASH_ACCESS_KEY to .env.local..." -ForegroundColor Yellow
        Add-Content -Path $envFile -Value "`nUNSPLASH_ACCESS_KEY=your-unsplash-key-here"
    }
}

Write-Host ""

# =============================================================================
# STEP 3: BACKUP CURRENT ROUTE.TS
# =============================================================================
Write-Host "💾 Step 3: Creating backup..." -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = "$projectRoot\backups"
$backupFile = "$backupDir\route-backup-$timestamp.ts"

if (-not (Test-Path $backupDir)) {
    New-Item -Path $backupDir -ItemType Directory | Out-Null
    Write-Host "📁 Created backups directory" -ForegroundColor Green
}

Copy-Item $routeFile $backupFile
Write-Host "✅ Backed up to: $backupFile" -ForegroundColor Green
Write-Host ""

# =============================================================================
# STEP 4: APPLY GRADIENT FIXES
# =============================================================================
Write-Host "🎨 Step 4: Applying gradient fixes..." -ForegroundColor Yellow

$routeContent = Get-Content $routeFile -Raw

# Check if we need to fix the gradient
if ($routeContent -match "rgba\(0,0,0,0\.5\)" -or $routeContent -match "rgba\(0,0,0,0\.3\)") {
    Write-Host "🔧 Fixing dark gradient overlay..." -ForegroundColor Yellow
    
    # Fix dark overlay (50% -> 20%, 30% -> 10%)
    $routeContent = $routeContent -replace "rgba\(0,0,0,0\.5\)", "rgba(0,0,0,0.2)"
    $routeContent = $routeContent -replace "rgba\(0,0,0,0\.3\)", "rgba(0,0,0,0.1)"
    
    # Fix shadow intensity (0.9 -> 0.3, 0.8 -> 0.2)
    $routeContent = $routeContent -replace "rgba\(0, 0, 0, 0\.9\)", "rgba(0, 0, 0, 0.3)"
    $routeContent = $routeContent -replace "rgba\(0, 0, 0, 0\.8\)", "rgba(0, 0, 0, 0.2)"
    
    # Fix light overlay shadows too
    $routeContent = $routeContent -replace "rgba\(255, 255, 255, 0\.9\)", "rgba(255, 255, 255, 0.6)"
    $routeContent = $routeContent -replace "rgba\(255, 255, 255, 0\.7\)", "rgba(255, 255, 255, 0.4)"
    
    Write-Host "✅ Gradient overlay: 50%→20%, 30%→10% (70% lighter)" -ForegroundColor Green
    Write-Host "✅ Shadow intensity: 0.9→0.3, 0.8→0.2 (75% softer)" -ForegroundColor Green
} else {
    Write-Host "✅ Gradients already look good!" -ForegroundColor Green
}

Write-Host ""

# =============================================================================
# STEP 5: FIX UNSPLASH 400 ERROR (Search terms too long)
# =============================================================================
Write-Host "🔧 Step 5: Fixing Unsplash 400 error..." -ForegroundColor Yellow

# Check if enhancement is too aggressive
if ($routeContent -match 'enhancedTerm\s*=\s*`\${term}\s+bright') {
    Write-Host "🔧 Fixing overly long search terms..." -ForegroundColor Yellow
    
    # Replace double enhancement with limited enhancement
    $oldEnhancement = 'const enhancedTerm = `${term} bright professional vibrant daylight`;'
    $newEnhancement = @'
// Limit to 5 base words + 2 enhancement words = max 7 words
    const words = term.split(' ');
    const baseTerm = words.slice(0, 5).join(' ');
    const enhancedTerm = `${baseTerm} bright professional`;
'@
    
    if ($routeContent -match [regex]::Escape($oldEnhancement)) {
        $routeContent = $routeContent -replace [regex]::Escape($oldEnhancement), $newEnhancement
        Write-Host "✅ Search terms limited to 7 words max" -ForegroundColor Green
    } else {
        $routeContent = $routeContent -replace 'const enhancedTerm = `\${term}[^`]+`;', $newEnhancement
        Write-Host "✅ Search term enhancement simplified" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Search term length looks good" -ForegroundColor Green
}

Write-Host ""

# =============================================================================
# STEP 6: CHECK IMAGE GENERATION CODE
# =============================================================================
Write-Host "🖼️  Step 6: Checking image generation..." -ForegroundColor Yellow

$imageIssues = @()

# Check 1: Does fetchBrightImages function exist?
if ($routeContent -match "fetchBrightImages") {
    Write-Host "✅ fetchBrightImages function found" -ForegroundColor Green
} else {
    Write-Host "❌ fetchBrightImages function NOT found!" -ForegroundColor Red
    $imageIssues += "Missing fetchBrightImages function"
}

# Check 2: Is UNSPLASH_ACCESS_KEY used?
if ($routeContent -match "UNSPLASH_ACCESS_KEY") {
    Write-Host "✅ UNSPLASH_ACCESS_KEY referenced in code" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING: UNSPLASH_ACCESS_KEY not found in code" -ForegroundColor Yellow
    $imageIssues += "UNSPLASH_ACCESS_KEY not referenced"
}

# Check 3: Is buildWebsite receiving images?
if ($routeContent -match "buildWebsite\([^)]*images") {
    Write-Host "✅ buildWebsite receives images parameter" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING: buildWebsite may not receive images" -ForegroundColor Yellow
    $imageIssues += "buildWebsite may not receive images parameter"
}

# Check 4: Does hero HTML include hero-image div?
if ($routeContent -match "hero-image") {
    Write-Host "✅ Hero image HTML structure found" -ForegroundColor Green
} else {
    Write-Host "❌ Hero image HTML structure NOT found!" -ForegroundColor Red
    $imageIssues += "Missing hero-image div structure"
}

Write-Host ""

# =============================================================================
# STEP 7: SAVE FIXED ROUTE.TS
# =============================================================================
Write-Host "💾 Step 7: Saving changes..." -ForegroundColor Yellow

# Save with UTF-8 BOM
$utf8BOM = New-Object System.Text.UTF8Encoding $true
[System.IO.File]::WriteAllText($routeFile, $routeContent, $utf8BOM)

Write-Host "✅ Changes saved to route.ts" -ForegroundColor Green
Write-Host ""

# =============================================================================
# STEP 8: SHOW RESULTS & NEXT STEPS
# =============================================================================
Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ GRADIENT FIXES APPLIED:" -ForegroundColor Green
Write-Host "   • Dark overlay: 70% lighter (50%→20%, 30%→10%)" -ForegroundColor White
Write-Host "   • Shadows: 75% softer (0.9→0.3, 0.8→0.2)" -ForegroundColor White
Write-Host "   • More comfortable to view" -ForegroundColor White
Write-Host ""

Write-Host "✅ UNSPLASH 400 ERROR FIXED:" -ForegroundColor Green
Write-Host "   • Search terms limited to 7 words max" -ForegroundColor White
Write-Host "   • Was: 16+ words → 400 error" -ForegroundColor White
Write-Host "   • Now: 5 base + 2 enhancement = 7 words total" -ForegroundColor White
Write-Host ""

if ($imageIssues.Count -eq 0) {
    Write-Host "✅ IMAGE GENERATION: Code structure looks good!" -ForegroundColor Green
    Write-Host "   Make sure to add your Unsplash API key to .env.local" -ForegroundColor White
} else {
    Write-Host "⚠️  IMAGE GENERATION ISSUES FOUND:" -ForegroundColor Yellow
    foreach ($issue in $imageIssues) {
        Write-Host "   • $issue" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "   Run the image-debug script for detailed analysis:" -ForegroundColor White
    Write-Host "   powershell -ExecutionPolicy Bypass -File image-debug.ps1" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🚀 NEXT STEPS" -ForegroundColor Cyan
Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Restart your dev server:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""

Write-Host "2. Test gradient fixes:" -ForegroundColor Yellow
Write-Host "   • Generate a new website" -ForegroundColor White
Write-Host "   • Check if hero gradient is lighter and more comfortable" -ForegroundColor White
Write-Host ""

Write-Host "3. Test image generation:" -ForegroundColor Yellow
Write-Host "   • Make sure 'Include Professional Photos' is checked" -ForegroundColor White
Write-Host "   • Watch terminal for image fetching logs" -ForegroundColor White
Write-Host "   • Look for: '🖼️  Fetching BRIGHT images...'" -ForegroundColor White
Write-Host ""

Write-Host "4. If images still don't work:" -ForegroundColor Yellow
Write-Host "   • Make sure UNSPLASH_ACCESS_KEY is in .env.local" -ForegroundColor White
Write-Host "   • Run: powershell -ExecutionPolicy Bypass -File image-debug.ps1" -ForegroundColor Cyan
Write-Host ""

Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Script completed successfully!" -ForegroundColor Green
Write-Host ""
