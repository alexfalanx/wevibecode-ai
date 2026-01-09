# install-phase1-custom.ps1
# WeVibeCode.ai - Phase 1 Installation Script
# CUSTOMIZED FOR YOUR PROJECT STRUCTURE
# Run this from your project root directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WeVibeCode.ai - Phase 1 Installation" -ForegroundColor Cyan
Write-Host "(Custom for Your Project)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from your project root." -ForegroundColor Red
    exit 1
}

Write-Host "Confirmed: Running in project root" -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Installing required npm packages..." -ForegroundColor Yellow
Write-Host "  Installing js-cookie and @types/js-cookie..." -ForegroundColor Gray
npm install js-cookie --save
npm install @types/js-cookie --save-dev

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Packages installed successfully" -ForegroundColor Green
}
else {
    Write-Host "  Package installation failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Updating Phase 1 files..." -ForegroundColor Yellow

$implPath = "wevibecode-custom-implementation"

if (-not (Test-Path $implPath)) {
    Write-Host "  Error: Implementation folder '$implPath' not found." -ForegroundColor Red
    Write-Host "  Please extract wevibecode-implementation.tar.gz first." -ForegroundColor Red
    exit 1
}

# File mappings specific to YOUR project structure
$files = @(
    @{
        Source = "$implPath/phase1/useAuth.ts"
        Dest = "lib/hooks/useAuth.ts"
        Action = "Replace"
    },
    @{
        Source = "$implPath/phase1/Header.tsx"
        Dest = "components/Header.tsx"
        Action = "Replace"
    },
    @{
        Source = "$implPath/phase1/LanguageSwitcher.tsx"
        Dest = "components/LanguageSwitcher.tsx"
        Action = "Replace"
    },
    @{
        Source = "$implPath/phase1/signup-page.tsx"
        Dest = "app/[locale]/auth/signup/page.tsx"
        Action = "Replace"
    },
    @{
        Source = "$implPath/phase1/i18n.config.ts"
        Dest = "i18n.config.ts"
        Action = "Replace"
    }
)

foreach ($file in $files) {
    if (Test-Path $file.Source) {
        # Create parent directory if it doesn't exist
        $destDir = Split-Path -Parent $file.Dest
        if ($destDir -and -not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        # Backup existing file if it exists
        if (Test-Path $file.Dest) {
            $backupPath = "$($file.Dest).backup"
            Copy-Item -Path $file.Dest -Destination $backupPath -Force
            Write-Host "  Backed up: $($file.Dest) to $backupPath" -ForegroundColor Gray
        }
        
        # Copy new file
        Copy-Item -Path $file.Source -Destination $file.Dest -Force
        Write-Host "  Updated: $($file.Dest)" -ForegroundColor Green
    }
    else {
        Write-Host "  Source not found: $($file.Source)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Step 3: Updating translation files..." -ForegroundColor Yellow

# Update English translations (merge)
$enSource = "$implPath/phase1/en-common.json"
$enDest = "public/locales/en/common.json"

if ((Test-Path $enSource) -and (Test-Path $enDest)) {
    try {
        $newTranslations = Get-Content $enSource -Raw | ConvertFrom-Json
        $existingTranslations = Get-Content $enDest -Raw | ConvertFrom-Json
        
        # Merge new keys into existing
        foreach ($prop in $newTranslations.PSObject.Properties) {
            if ($existingTranslations.PSObject.Properties[$prop.Name]) {
                # Key exists, update it
                $existingTranslations.($prop.Name) = $prop.Value
            }
            else {
                # Key doesn't exist, add it
                $existingTranslations | Add-Member -MemberType NoteProperty -Name $prop.Name -Value $prop.Value
            }
        }
        
        # Save merged translations
        $existingTranslations | ConvertTo-Json -Depth 10 | Set-Content $enDest -Encoding UTF8
        Write-Host "  Merged: English translations" -ForegroundColor Green
    }
    catch {
        Write-Host "  Error merging English translations: $_" -ForegroundColor Red
    }
}
elseif (Test-Path $enSource) {
    # If destination doesn't exist, create it
    Copy-Item -Path $enSource -Destination $enDest -Force
    Write-Host "  Created: English translations" -ForegroundColor Green
}

# Update German translations (replace)
$deSource = "$implPath/phase1/de-common.json"
$deDest = "public/locales/de/common.json"

if (Test-Path $deSource) {
    if (Test-Path $deDest) {
        Copy-Item -Path $deDest -Destination "$deDest.backup" -Force
        Write-Host "  Backed up: German translations" -ForegroundColor Gray
    }
    Copy-Item -Path $deSource -Destination $deDest -Force
    Write-Host "  Updated: German translations" -ForegroundColor Green
}

# Copy translations to other languages (optional - they can translate later)
foreach ($lang in @('it', 'pl', 'es')) {
    $langDest = "public/locales/$lang/common.json"
    if (Test-Path $langDest) {
        $langSource = "$implPath/phase1/en-common.json"
        if (Test-Path $langSource) {
            try {
                $newKeys = Get-Content $langSource -Raw | ConvertFrom-Json
                $existingLang = Get-Content $langDest -Raw | ConvertFrom-Json
                
                # Add missing keys (with English text - they'll translate later)
                foreach ($prop in $newKeys.PSObject.Properties) {
                    if (-not $existingLang.PSObject.Properties[$prop.Name]) {
                        $existingLang | Add-Member -MemberType NoteProperty -Name $prop.Name -Value $prop.Value
                    }
                }
                
                $existingLang | ConvertTo-Json -Depth 10 | Set-Content $langDest -Encoding UTF8
                Write-Host "  Updated: $lang translations (added missing keys)" -ForegroundColor Green
            }
            catch {
                Write-Host "  Warning: Could not update $lang translations" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 1 Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "MANUAL STEP REQUIRED:" -ForegroundColor Yellow
Write-Host ""
Write-Host "You must update your app/layout.tsx file:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Add this import at the top:" -ForegroundColor Gray
Write-Host "     import Header from '@/components/Header';" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Add Header component inside body tag:" -ForegroundColor Gray
$headerComponent = "     <Header />"
Write-Host $headerComponent -ForegroundColor Cyan
Write-Host ""
Write-Host "See: docs/YOUR-LAYOUT-MODIFICATION.md for detailed instructions" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Files installed and backed up" -ForegroundColor Green
Write-Host "2. Manually update app/layout.tsx (see above)" -ForegroundColor Yellow
Write-Host "3. Run SQL in Supabase:" -ForegroundColor White
Write-Host "     wevibecode-custom-implementation/sql/01-setup-profiles.sql" -ForegroundColor Gray
Write-Host "4. Test with: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Backups created with .backup extension" -ForegroundColor Gray
Write-Host "To rollback: Copy .backup files back to originals" -ForegroundColor Gray
Write-Host ""
