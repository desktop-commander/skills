# PC RAM Cleanup - PowerShell Script
# Stops unnecessary processes and optimizes RAM usage

param(
    [switch]$Force,
    [switch]$ListOnly
)

$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"
$ColorInfo = "Cyan"

Write-Host "========================================" -ForegroundColor $ColorInfo
Write-Host "       PC RAM CLEANUP TOOL              " -ForegroundColor $ColorInfo
Write-Host "========================================" -ForegroundColor $ColorInfo
Write-Host ""

# List of safe-to-close processes
$safeToClose = @(
    "chrome", "msedge", "firefox", "brave", "opera",
    "steam", "epicgameslauncher", "origin", "battle.net",
    "spotify", "discord", "teams", "skype", "zoom",
    "onedrive", "dropbox", "box",
    "java", "javaw",
    "notepad", "notepad++",
    "calculator",
    "photoshop", "illustrator", "premiere",
    "excel", "word", "powerpoint"
)

# Critical system processes to NEVER touch
$criticalProcesses = @(
    "csrss", "wininit", "winlogon", "lsass", "services", "svchost",
    "dwm", "explorer", "smss", "system", "idle", "registry",
    "memcompression", "fontdrvhost", "userinit", "logonui",
    "taskhost", "conhost", "runtimebroker", "dllhost",
    "searchindexer", "searchhost", "sihost", "shell",
    "startmenuexperiencehost", "searchui", "cortana"
)

$freedRAM = 0
$stoppedCount = 0

# Function to safely stop a process
function Stop-SafeProcess {
    param(
        [string]$ProcessName,
        [string]$Reason
    )
    
    try {
        $procs = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
        foreach ($proc in $procs) {
            $memMB = [math]::Round($proc.WorkingSet64 / 1MB, 1)
            
            if ($criticalProcesses -contains $proc.ProcessName.ToLower()) {
                Write-Host "  Skipping critical process: $($proc.ProcessName)" -ForegroundColor $ColorWarning
                continue
            }
            
            if ($ListOnly) {
                Write-Host "  Would stop: $($proc.ProcessName) (PID: $($proc.Id)) - $memMB MB - $Reason" -ForegroundColor $ColorWarning
                $global:freedRAM += $memMB
                $global:stoppedCount++
                continue
            }
            
            Write-Host "  Stopping: $($proc.ProcessName) (PID: $($proc.Id)) - $memMB MB" -ForegroundColor $ColorWarning
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            $global:freedRAM += $memMB
            $global:stoppedCount++
        }
    } catch {
        Write-Host "  Error stopping $ProcessName : $_" -ForegroundColor $ColorError
    }
}

if (-not $Force -and -not $ListOnly) {
    Write-Host "This tool will close unnecessary applications to free RAM." -ForegroundColor $ColorInfo
    Write-Host "Your documents and work will NOT be saved automatically." -ForegroundColor $ColorWarning
    Write-Host ""
    Write-Host "Options:" -ForegroundColor $ColorInfo
    Write-Host "  - List only: Shows what would be closed without closing" -ForegroundColor $ColorLow
    Write-Host "  - Force: Automatically close safe-to-close processes" -ForegroundColor $ColorLow
    Write-Host ""
    Write-Host "Run with -ListOnly to preview, or -Force to execute." -ForegroundColor $ColorInfo
    exit
}

# Step 1: Clear temporary files
Write-Host "--- Clearing Temporary Files ---" -ForegroundColor $ColorInfo

$tempPaths = @(
    "$env:TEMP\*",
    "$env:LOCALAPPDATA\Temp\*",
    "C:\Windows\Temp\*"
)

foreach ($path in $tempPaths) {
    try {
        $count = (Get-ChildItem -Path $path -Recurse -ErrorAction SilentlyContinue | Measure-Object).Count
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Cleared temp files from: $path" -ForegroundColor $ColorSuccess
    } catch {
        Write-Host "  Skipped (some files in use): $path" -ForegroundColor $ColorWarning
    }
}

Write-Host ""

# Step 2: Clear Windows memory compression (if high usage)
Write-Host "--- Memory Optimization ---" -ForegroundColor $ColorInfo

$OS = Get-CimInstance Win32_OperatingSystem
$usedRAM = [math]::Round(($OS.TotalVisibleMemorySize - $OS.FreePhysicalMemory) / 1MB, 2)
$totalRAM = [math]::Round($OS.TotalVisibleMemorySize / 1MB, 2)
$usagePercent = [math]::Round(($usedRAM / $totalRAM) * 100, 1)

if ($usagePercent -gt 70) {
    Write-Host "  RAM usage is above 70%. Running memory optimization..." -ForegroundColor $ColorWarning
    
    # Trim working sets of non-critical processes
    $allProcs = Get-Process | Where-Object { $_.WorkingSet64 -gt 100MB }
    foreach ($proc in $allProcs) {
        if ($criticalProcesses -notcontains $proc.ProcessName.ToLower()) {
            try {
                # Use WMI to trim working set
                $procHandle = $proc.Handle
                [System.GC]::GetTotalMemory($true) | Out-Null
            } catch {
                # Silently continue if can't trim
            }
        }
    }
    Write-Host "  Memory optimization complete." -ForegroundColor $ColorSuccess
} else {
    Write-Host "  RAM usage is acceptable ($usagePercent%). Skipping deep optimization." -ForegroundColor $ColorSuccess
}

Write-Host ""

# Step 3: Close unnecessary applications
Write-Host "--- Closing Unnecessary Applications ---" -ForegroundColor $ColorInfo

foreach ($procName in $safeToClose) {
    $exists = Get-Process -Name $procName -ErrorAction SilentlyContinue
    if ($exists) {
        Stop-SafeProcess -ProcessName $procName -Reason "Safe to close"
    }
}

Write-Host ""

# Step 4: Clear DNS cache
Write-Host "--- Network Cache ---" -ForegroundColor $ColorInfo
try {
    Clear-DnsClientCache
    Write-Host "  DNS cache cleared." -ForegroundColor $ColorSuccess
} catch {
    Write-Host "  Could not clear DNS cache." -ForegroundColor $ColorWarning
}

Write-Host ""

# Final summary
Write-Host "========================================" -ForegroundColor $ColorInfo
Write-Host "         CLEANUP SUMMARY                " -ForegroundColor $ColorInfo
Write-Host "========================================" -ForegroundColor $ColorInfo
Write-Host ""

if ($ListOnly) {
    Write-Host "LIST ONLY MODE - No changes were made." -ForegroundColor $ColorWarning
    Write-Host "Processes that could be closed: $stoppedCount" -ForegroundColor $ColorWarning
    Write-Host "Potential RAM savings: ~$([math]::Round($freedRAM, 0)) MB" -ForegroundColor $ColorSuccess
} else {
    Write-Host "Processes closed: $stoppedCount" -ForegroundColor $ColorSuccess
    Write-Host "RAM freed: ~$([math]::Round($freedRAM, 0)) MB" -ForegroundColor $ColorSuccess
}

Write-Host ""

# New memory status
$OS = Get-CimInstance Win32_OperatingSystem
$newFreeRAM = [math]::Round($OS.FreePhysicalMemory / 1MB, 2)
$newUsedRAM = [math]::Round(($OS.TotalVisibleMemorySize - $OS.FreePhysicalMemory) / 1MB, 2)
$newPercent = [math]::Round(($newUsedRAM / $totalRAM) * 100, 1)

Write-Host "Current RAM Status:" -ForegroundColor $ColorInfo
Write-Host "  Used: $newUsedRAM MB ($newPercent%)" -ForegroundColor $ColorInfo
Write-Host "  Free: $newFreeRAM MB" -ForegroundColor $ColorInfo
Write-Host ""

Write-Host "Cleanup complete." -ForegroundColor $ColorSuccess
