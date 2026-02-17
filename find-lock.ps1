# Find which process is locking the file using WMI
$file = "C:\Users\socialmedia\Documents\GitHub\Digitalbigfive\dist-electron\win-unpacked\resources\app.asar"

# Method 1: Check for processes that have handles in the dist-electron directory
$distDir = "C:\Users\socialmedia\Documents\GitHub\Digitalbigfive\dist-electron"
Get-Process | ForEach-Object {
    $proc = $_
    try {
        $modules = $proc.Modules | Where-Object { $_.FileName -like "$distDir*" }
        if ($modules) {
            Write-Host "Process: $($proc.Name) (PID: $($proc.Id)) - $($proc.Path)"
            $modules | ForEach-Object { Write-Host "  Module: $($_.FileName)" }
        }
    } catch {}
}

# Method 2: Check for any electron-related processes
Write-Host "`n--- All electron/node related processes ---"
Get-Process | Where-Object { $_.Name -match 'electron|node|Big.Five' } | ForEach-Object {
    Write-Host "PID: $($_.Id) Name: $($_.Name) Path: $($_.Path)"
}

# Method 3: List any exe in the dist-electron folder that might be running
Write-Host "`n--- Processes from dist-electron ---"
Get-Process | Where-Object { $_.Path -and $_.Path.StartsWith($distDir) } | ForEach-Object {
    Write-Host "PID: $($_.Id) Name: $($_.Name) Path: $($_.Path)"
}
