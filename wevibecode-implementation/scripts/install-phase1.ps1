# install-phase1.ps1
# WeVibeCode.ai - Phase 1 Installation Script
# Run this from your project root directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WeVibeCode.ai - Phase 1 Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run this script from your project root." -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Creating necessary directories..." -ForegroundColor Yellow
$directories = @(
    "lib/hooks",
    "components",
    "app/[locale]/auth/signup"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "  Exists: $dir" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Step 2: Installing required npm packages..." -ForegroundColor Yellow
Write-Host "  Installing js-cookie and types..." -ForegroundColor Gray
npm install js-cookie
npm install --save-dev @types/js-cookie

Write-Host ""
Write-Host "Step 3: Copying Phase 1 files..." -ForegroundColor Yellow

# Define source files from the implementation package
$files = @(
    @{Source="phase1/useAuth.ts"; Dest="lib/hooks/useAuth.ts"},
    @{Source="phase1/Header.tsx"; Dest="components/Header.tsx"},
    @{Source="phase1/signup-page.tsx"; Dest="app/[locale]/auth/signup/page.tsx"},
    @{Source="phase1/i18n.config.ts"; Dest="i18n.config.ts"},
    @{Source="phase1/LanguageSwitcher.tsx"; Dest="components/LanguageSwitcher.tsx"}
)

# Note: This assumes you've extracted the implementation files to a folder called "wevibecode-implementation"
$implPath = "wevibecode-implementation"

if (Test-Path $implPath) {
    foreach ($file in $files) {
        $sourcePath = Join-Path $implPath $file.Source
        $destPath = $file.Dest
        
        if (Test-Path $sourcePath) {
            Copy-Item -Path $sourcePath -Destination $destPath -Force
            Write-Host "  Copied: $($file.Dest)" -ForegroundColor Green
        } else {
            Write-Host "  Warning: Source not found - $sourcePath" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  Error: Implementation folder 'wevibecode-implementation' not found." -ForegroundColor Red
    Write-Host "  Please extract the implementation files first." -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 4: Updating translation files..." -ForegroundColor Yellow

# Update English translations
$enPath = "public/locales/en/common.json"
if (Test-Path $enPath) {
    $enSource = Join-Path $implPath "phase1/en-common.json"
    if (Test-Path $enSource) {
        $enContent = Get-Content $enSource -Raw | ConvertFrom-Json
        $existingEn = Get-Content $enPath -Raw | ConvertFrom-Json
        
        # Merge the new keys
        foreach ($prop in $enContent.PSObject.Properties) {
            $existingEn | Add-Member -MemberType NoteProperty -Name $prop.Name -Value $prop.Value -Force
        }
        
        $existingEn | ConvertTo-Json -Depth 10 | Set-Content $enPath
        Write-Host "  Updated: English translations" -ForegroundColor Green
    }
}

# Update German translations
$dePath = "public/locales/de/common.json"
if (Test-Path $dePath) {
    $deSource = Join-Path $implPath "phase1/de-common.json"
    if (Test-Path $deSource) {
        Copy-Item -Path $deSource -Destination $dePath -Force
        Write-Host "  Updated: German translations" -ForegroundColor Green
    }
} else {
    Write-Host "  Warning: German translation file not found at $dePath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 5: Updating Header component in layout..." -ForegroundColor Yellow
Write-Host "  Note: You may need to manually import Header component in your layout file" -ForegroundColor Cyan
Write-Host "  Add this to app/[locale]/layout.tsx:" -ForegroundColor Cyan
Write-Host "  import Header from '@/components/Header';" -ForegroundColor White
Write-Host "  <Header /> // Add in your layout's return statement" -ForegroundColor White

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 1 Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run the SQL script in Supabase:" -ForegroundColor White
Write-Host "   - Open Supabase Dashboard > SQL Editor" -ForegroundColor Gray
Write-Host "   - Run: wevibecode-implementation/sql/01-setup-profiles.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Update your layout file to include the Header component" -ForegroundColor White
Write-Host ""
Write-Host "3. Test the changes:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Verify:" -ForegroundColor White
Write-Host "   - Login button appears on homepage" -ForegroundColor Gray
Write-Host "   - New user signup works" -ForegroundColor Gray
Write-Host "   - German (DE) language works" -ForegroundColor Gray
Write-Host ""
