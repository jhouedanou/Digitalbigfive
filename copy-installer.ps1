$outDir = "$env:TEMP\bigfive-electron-build"
$projectOut = "dist-electron"

if (-not (Test-Path $projectOut)) {
    New-Item -ItemType Directory -Path $projectOut -Force | Out-Null
}

Get-ChildItem $outDir -File | Where-Object {
    $_.Extension -in '.exe','.blockmap','.yml'
} | Where-Object {
    $_.Name -notlike '*unpacked*' -and $_.Name -ne 'elevate.exe'
} | ForEach-Object {
    Copy-Item $_.FullName "$projectOut\" -Force
    Write-Host "Copied: $($_.Name) ($([math]::Round($_.Length / 1MB, 1)) MB)"
}
