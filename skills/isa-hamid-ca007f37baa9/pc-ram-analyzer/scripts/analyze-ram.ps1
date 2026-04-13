# PC RAM Analyzer - PowerShell Script
# Analyzes running processes and identifies unnecessary RAM usage

# Colors for output
$ColorHigh = "Red"
$ColorMedium = "Yellow"
$ColorLow = "Green"
$ColorHeader = "Cyan"

# Thresholds (in MB)
$HighMemoryThreshold = 500
$MediumMemoryThreshold = 200

Write-Host "========================================" -ForegroundColor $ColorHeader
Write-Host "       PC RAM ANALYSIS REPORT           " -ForegroundColor $ColorHeader
Write-Host "========================================" -ForegroundColor $ColorHeader
Write-Host ""

# Get system info
$OS = Get-CimInstance Win32_OperatingSystem
$TotalRAM = [math]::Round($OS.TotalVisibleMemorySize / 1MB, 2)
$FreeRAM = [math]::Round($OS.FreePhysicalMemory / 1MB, 2)
$UsedRAM = $TotalRAM - $FreeRAM
$UsagePercent = [math]::Round(($UsedRAM / $TotalRAM) * 100, 1)

Write-Host "--- System Memory ---" -ForegroundColor $ColorHeader
Write-Host "Total RAM:  $TotalRAM GB"
Write-Host "Used RAM:   $UsedRAM GB ($UsagePercent%)"
Write-Host "Free RAM:   $FreeRAM GB"
Write-Host ""

# Check if usage is high
if ($UsagePercent -gt 80) {
    Write-Host "⚠️  WARNING: RAM usage is HIGH (above 80%)" -ForegroundColor $ColorHigh
    Write-Host ""
} elseif ($UsagePercent -gt 60) {
    Write-Host "⚡ NOTICE: RAM usage is MODERATE (above 60%)" -ForegroundColor $ColorMedium
    Write-Host ""
}

# Get processes sorted by memory usage
$Processes = Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 30

Write-Host "--- Top 30 Processes by Memory Usage ---" -ForegroundColor $ColorHeader
Write-Host ("{0,-5} {1,-30} {2,-12} {3,-10}" -f "PID", "Process Name", "RAM (MB)", "Status")
Write-Host ("{0,-5} {1,-30} {2,-12} {3,-10}" -f "---", "---------------------------", "-----------", "----------")

foreach ($proc in $Processes) {
    $memMB = [math]::Round($proc.WorkingSet64 / 1MB, 1)
    $status = if ($proc.Responding) { "Running" } else { "Not Responding" }
    
    $color = $ColorLow
    if ($memMB -gt $HighMemoryThreshold) { $color = $ColorHigh }
    elseif ($memMB -gt $MediumMemoryThreshold) { $color = $ColorMedium }
    
    Write-Host ("{0,-5} {1,-30} {2,-12} {3,-10}" -f $proc.Id, $proc.ProcessName, "$memMB MB", $status) -ForegroundColor $color
}

Write-Host ""

# Identify known unnecessary/resource-heavy processes
Write-Host "--- Known Resource-Heavy Processes ---" -ForegroundColor $ColorHeader

$knownHeavy = @(
    @{Name="chrome"; Friendly="Google Chrome"; Tip="Close unused tabs or use tab suspender extensions"},
    @{Name="msedge"; Friendly="Microsoft Edge"; Tip="Close unused tabs or enable sleeping tabs"},
    @{Name="firefox"; Friendly="Mozilla Firefox"; Tip="Close unused tabs or use memory saver"},
    @{Name="steam"; Friendly="Steam"; Tip="Close when not gaming"},
    @{Name="epicgameslauncher"; Friendly="Epic Games Launcher"; Tip="Close when not gaming"},
    @{Name="spotify"; Friendly="Spotify"; Tip="Use web version or close when not listening"},
    @{Name="discord"; Friendly="Discord"; Tip="Close when not needed"},
    @{Name="teams"; Friendly="Microsoft Teams"; Tip="Close when not in meetings"},
    @{Name="skype"; Friendly="Skype"; Tip="Close when not in calls"},
    @{Name="zoom"; Friendly="Zoom"; Tip="Close when not in meetings"},
    @{Name="onedrive"; Friendly="OneDrive"; Tip="Pause sync if not actively needed"},
    @{Name="dropbox"; Friendly="Dropbox"; Tip="Pause sync if not actively needed"},
    @{Name="java"; Friendly="Java Runtime"; Tip="Close if no Java app is running"},
    @{Name="javaw"; Friendly="Java Application"; Tip="Close if no Java app is running"},
    @{Name="adobe"; Friendly="Adobe Process"; Tip="Close if not using Adobe apps"},
    @{Name="updater"; Friendly="Updater Process"; Tip="Check if update is necessary now"},
    @{Name="helper"; Friendly="Helper Process"; Tip="Many apps have background helpers - check if needed"}
)

$foundHeavy = @()
foreach ($item in $knownHeavy) {
    $matching = $Processes | Where-Object { $_.ProcessName -like "*$($item.Name)*" }
    foreach ($proc in $matching) {
        $memMB = [math]::Round($proc.WorkingSet64 / 1MB, 1)
        $foundHeavy += [PSCustomObject]@{
            Name = $item.Friendly
            ProcessName = $proc.ProcessName
            PID = $proc.Id
            MemoryMB = $memMB
            Tip = $item.Tip
        }
    }
}

if ($foundHeavy.Count -gt 0) {
    $totalWaste = 0
    foreach ($item in $foundHeavy) {
        Write-Host "• $($item.Name) (PID: $($item.PID)) - $($item.MemoryMB) MB" -ForegroundColor $ColorMedium
        Write-Host "  Process: $($item.ProcessName) | Tip: $($item.Tip)" -ForegroundColor DarkGray
        $totalWaste += $item.MemoryMB
    }
    Write-Host ""
    Write-Host "Potential RAM savings: ~$([math]::Round($totalWaste, 0)) MB if these are closed" -ForegroundColor $ColorLow
} else {
    Write-Host "No known unnecessary heavy processes found." -ForegroundColor $ColorLow
}

Write-Host ""

# Check for not responding processes
Write-Host "--- Not Responding Processes ---" -ForegroundColor $ColorHeader
$notResponding = $Processes | Where-Object { -not $_.Responding }
if ($notResponding.Count -gt 0) {
    foreach ($proc in $notResponding) {
        $memMB = [math]::Round($proc.WorkingSet64 / 1MB, 1)
        Write-Host "• $($proc.ProcessName) (PID: $($proc.Id)) - $($memMB) MB - NOT RESPONDING" -ForegroundColor $ColorHigh
        Write-Host "  Recommendation: Consider ending this task to free RAM" -ForegroundColor DarkGray
    }
} else {
    Write-Host "No unresponsive processes found." -ForegroundColor $ColorLow
}

Write-Host ""

# Memory diagnostic
Write-Host "--- Memory Health Check ---" -ForegroundColor $ColorHeader
$memDiag = Get-CimInstance Win32_PhysicalMemory
$totalSlots = ($memDiag | Measure-Object).Count
$totalCapacity = [math]::Round(($memDiag | Measure-Object -Property Capacity -Sum).Sum / 1GB, 1)
$speeds = ($memDiag | ForEach-Object { "$($_.Speed) MHz" }) -join ", "
$types = ($memDiag | ForEach-Object { $_.MemoryType }) -join ", "

Write-Host "Memory Slots Used: $totalSlots"
Write-Host "Total Capacity: $totalCapacity GB"
Write-Host "Speeds: $speeds"
Write-Host ""

# Summary and recommendations
Write-Host "========================================" -ForegroundColor $ColorHeader
Write-Host "         RECOMMENDATIONS                " -ForegroundColor $ColorHeader
Write-Host "========================================" -ForegroundColor $ColorHeader
Write-Host ""

if ($UsagePercent -gt 80) {
    Write-Host "1. HIGH PRIORITY: Close unnecessary applications" -ForegroundColor $ColorHigh
    Write-Host "2. Consider adding more RAM if frequently above 80%" -ForegroundColor $ColorHigh
    Write-Host "3. Check startup programs and disable unnecessary ones" -ForegroundColor $ColorMedium
    Write-Host "4. Run Windows Memory Diagnostic for potential hardware issues" -ForegroundColor $ColorMedium
} elseif ($UsagePercent -gt 60) {
    Write-Host "1. MEDIUM PRIORITY: Review running applications" -ForegroundColor $ColorMedium
    Write-Host "2. Close unused browser tabs and applications" -ForegroundColor $ColorMedium
    Write-Host "3. Monitor for memory leaks over time" -ForegroundColor $ColorLow
} else {
    Write-Host "1. RAM usage is healthy. No immediate action needed." -ForegroundColor $ColorLow
    Write-Host "2. Keep monitoring periodically for changes." -ForegroundColor $ColorLow
}

Write-Host ""
Write-Host "To fix issues, run the cleanup script:" -ForegroundColor $ColorHeader
Write-Host "powershell -ExecutionPolicy Bypass -File cleanup-ram.ps1" -ForegroundColor $ColorLow
Write-Host ""
Write-Host "Analysis complete. Report saved to: C:\inetpub\output\ram-analysis-$(Get-Date -Format 'yyyy-MM-dd-HHmm').txt" -ForegroundColor $ColorHeader
