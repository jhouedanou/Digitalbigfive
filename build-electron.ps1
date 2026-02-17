# Build script for Electron desktop app
# Usage: powershell -ExecutionPolicy Bypass -File build-electron.ps1 [win|mac|linux|all]

param(
    [string]$Target = "win"
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host "=== Big Five Digital - Electron Build ===" -ForegroundColor Cyan
Write-Host "Target: $Target" -ForegroundColor Yellow

# Kill processes
Get-Process -Name "electron","Big Five Digital" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Use temp dir for output to avoid Windows Defender locking files
$outDir = "$env:TEMP\bigfive-electron-build"
if (Test-Path $outDir) {
    Remove-Item -Recurse -Force $outDir -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

# Set env vars
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
$env:ELECTRON_BUILDER_CACHE = "$env:TEMP\electron-builder-cache"

# Compile TypeScript
Write-Host "`nCompiling Electron TypeScript..." -ForegroundColor Yellow
$ErrorActionPreference = "Continue"
npx tsc -p electron/tsconfig.json
if ($LASTEXITCODE -ne 0) {
    Write-Host "TypeScript compilation failed!" -ForegroundColor Red
    exit 1
}

# Build
Write-Host "`nBuilding for $Target..." -ForegroundColor Yellow

$builderArgs = @()
switch ($Target) {
    "win"   { $builderArgs = @("--win") }
    "mac"   { $builderArgs = @("--mac") }
    "linux" { $builderArgs = @("--linux") }
    "all"   { $builderArgs = @("--win", "--mac", "--linux") }
}

$allArgs = $builderArgs + @(
    "--config.directories.output=$outDir",
    "--config.forceCodeSigning=false",
    "--config.win.signAndEditExecutable=false"
)

& npx electron-builder @allArgs 2>&1

if ($LASTEXITCODE -eq 0) {
    # Copy installers to project dist-electron folder
    $projectOut = "dist-electron"
    if (-not (Test-Path $projectOut)) {
        New-Item -ItemType Directory -Path $projectOut -Force | Out-Null
    }

    Get-ChildItem $outDir -File | Where-Object {
        $_.Extension -in '.exe','.dmg','.AppImage','.deb','.blockmap','.yml'
    } | ForEach-Object {
        Copy-Item $_.FullName "$projectOut\" -Force
        Write-Host "  Copied: $($_.Name) ($([math]::Round($_.Length / 1MB, 1)) MB)" -ForegroundColor Green
    }

    Write-Host "`nBuild successful! Installers in: $projectOut" -ForegroundColor Green
} else {
    Write-Host "`nBuild failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
