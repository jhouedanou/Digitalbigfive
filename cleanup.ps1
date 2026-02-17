$asarPath = "C:\Users\socialmedia\Documents\GitHub\Digitalbigfive\dist-electron\win-unpacked\resources\app.asar"

# Check what process holds the file
$handleOutput = (cmd /c "handle.exe $asarPath" 2>&1)
Write-Host "Handle output: $handleOutput"

# Try to find process using OpenFilesView or handle
try {
    $file = [System.IO.File]::Open($asarPath, 'Open', 'ReadWrite', 'None')
    $file.Close()
    Write-Host "File is not locked"
} catch {
    Write-Host "File IS locked: $($_.Exception.Message)"
}

# Force delete attempt
try {
    Remove-Item -Force $asarPath -ErrorAction Stop
    Write-Host "Successfully deleted"
} catch {
    Write-Host "Delete failed: $($_.Exception.Message)"
}

# Check if it still exists
if (Test-Path $asarPath) {
    Write-Host "File still exists - trying cmd /c del"
    cmd /c "del /f /q `"$asarPath`""
    if (Test-Path $asarPath) {
        Write-Host "Still exists after cmd del"
    } else {
        Write-Host "Deleted via cmd"
    }
} else {
    Write-Host "File removed"
}
