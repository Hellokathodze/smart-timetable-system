$Host.UI.RawUI.WindowTitle = "Smart Timetable - Dashboard"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$Services = [ordered]@{
    "AI Engine" = @{
        Port = 5000
        StartCmd = "cd `"$ProjectRoot\smarttimetablesystem`" && call .venv\Scripts\activate && cd ai-engine && uvicorn api.main:app --reload --port 5000"
        WindowName = "AI-ENGINE"
        Color = "Magenta"
        Tech = "FastAPI + Uvicorn"
    }
    "React Frontend" = @{
        Port = 5173
        StartCmd = "cd `"$ProjectRoot\smart-timetable-frontend`" && npm run dev"
        WindowName = "REACT-FRONTEND"
        Color = "Cyan"
        Tech = "Vite + React"
    }
    "Spring Boot" = @{
        Port = 8081
        StartCmd = "cd `"$ProjectRoot\smarttimetablesystem`" && .\mvnw.cmd spring-boot:run"
        WindowName = "SPRING-BOOT"
        Color = "Green"
        Tech = "Java + Maven"
    }
}

function Test-Port($port) {
    $result = netstat -ano 2>$null | Select-String ":$port\s" | Select-String "LISTENING"
    return ($null -ne $result -and $result.Count -gt 0)
}

function Get-PortPID($port) {
    $pids = @()
    $lines = netstat -ano 2>$null | Select-String ":$port\s" | Select-String "LISTENING"
    foreach ($line in $lines) {
        $parts = $line.ToString().Trim() -split '\s+'
        $procId = $parts[-1]
        if ($procId -match '^\d+$' -and [int]$procId -ne 0) { $pids += $procId }
    }
    return $pids
}

function Start-ServiceByName($name) {
    $svc = $Services[$name]
    Write-Host "`n  Launching $name ($($svc.Tech))..." -ForegroundColor Yellow
    Start-Process cmd -ArgumentList "/k title $($svc.WindowName) && $($svc.StartCmd)"
    Write-Host "  $name launched! Press [R] to refresh once it boots." -ForegroundColor Green
    Start-Sleep -Seconds 2
}

function Stop-ServiceByName($name) {
    $svc = $Services[$name]
    Write-Host "`n  Stopping $name on port $($svc.Port)..." -ForegroundColor Yellow
    Get-Process | Where-Object { $_.MainWindowTitle -like "*$($svc.WindowName)*" } |
        ForEach-Object { taskkill /PID $_.Id /T /F 2>$null | Out-Null }
    $pids = Get-PortPID $svc.Port
    foreach ($p in $pids) {
        taskkill /PID $p /T /F 2>$null | Out-Null
        Write-Host "    Killed PID $p" -ForegroundColor DarkYellow
    }
    $maxWait = 8; $waited = 0
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 1; $waited++
        if (-not (Test-Port $svc.Port)) { Write-Host "  $name STOPPED" -ForegroundColor Red; return }
        if ($waited -eq 4) { $pids = Get-PortPID $svc.Port; foreach ($p in $pids) { taskkill /PID $p /T /F 2>$null | Out-Null } }
    }
    if (-not (Test-Port $svc.Port)) { Write-Host "  $name STOPPED" -ForegroundColor Red }
    else { Write-Host "  FAILED - close its terminal window manually" -ForegroundColor Red }
}

function Show-Dashboard {
    Clear-Host
    Write-Host ""
    Write-Host "  =======================================================" -ForegroundColor DarkCyan
    Write-Host "      SMART TIMETABLE SYSTEM  -  Service Dashboard" -ForegroundColor DarkCyan
    Write-Host "  =======================================================" -ForegroundColor DarkCyan
    Write-Host ""
    $i = 1
    foreach ($name in $Services.Keys) {
        $svc = $Services[$name]
        $running = Test-Port $svc.Port
        if ($running) { $toggle = " ON  "; $dot = "[*]"; $sColor = "Green"; $url = "http://localhost:$($svc.Port)" }
        else { $toggle = " OFF "; $dot = "[ ]"; $sColor = "DarkGray"; $url = "---" }
        Write-Host -NoNewline "   [$i]  " -ForegroundColor White
        Write-Host -NoNewline "$dot " -ForegroundColor $sColor
        Write-Host -NoNewline "$name" -ForegroundColor $svc.Color
        $pad = 18 - $name.Length; if ($pad -gt 0) { Write-Host -NoNewline (" " * $pad) }
        Write-Host -NoNewline "$toggle" -ForegroundColor $sColor
        Write-Host "  $url" -ForegroundColor DarkGray
        $i++
    }
    Write-Host ""
    Write-Host "  -------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "   [A] Start ALL          [S] Stop ALL" -ForegroundColor Yellow
    Write-Host "   [R] Refresh            [Q] Quit" -ForegroundColor DarkYellow
    Write-Host "  -------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host ""
}

while ($true) {
    Show-Dashboard
    $choice = Read-Host "  Toggle service (1/2/3) or action (A/S/R/Q)"
    $names = @($Services.Keys)
    switch ($choice.ToUpper()) {
        {$_ -in "1","2","3"} {
            $idx = [int]$_ - 1; $name = $names[$idx]; $svc = $Services[$name]
            if (Test-Port $svc.Port) { Stop-ServiceByName $name } else { Start-ServiceByName $name }
            Start-Sleep -Seconds 1
        }
        "A" {
            foreach ($name in $names) {
                if (-not (Test-Port $Services[$name].Port)) { Start-ServiceByName $name }
                else { Write-Host "  $name already running" -ForegroundColor DarkGreen }
            }
            Write-Host "`n  All launched! Waiting for boot..." -ForegroundColor Yellow
            Start-Sleep -Seconds 12
        }
        "S" { foreach ($name in $names) { if (Test-Port $Services[$name].Port) { Stop-ServiceByName $name } else { Write-Host "  $name already stopped" -ForegroundColor DarkGray } }; Start-Sleep 2 }
        "R" { continue }
        "Q" { Write-Host "`n  Dashboard closed.`n" -ForegroundColor Cyan; exit }
    }
}
