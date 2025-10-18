# Get the latest Firebase Functions logs
Write-Host "Getting latest Firebase Functions logs..." -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Blue

# Get the most recent logs
$logs = firebase functions:log | Select-Object -First 30
$logs | Where-Object { $_ -match "extractICD10Codes" } | ForEach-Object {
    if ($_ -match "Function execution started") {
        Write-Host $_ -ForegroundColor Green
    } elseif ($_ -match "status code: 400") {
        Write-Host $_ -ForegroundColor Red
    } elseif ($_ -match "status code: 204") {
        Write-Host $_ -ForegroundColor Yellow
    } else {
        Write-Host $_
    }
}

Write-Host ""
Write-Host "Looking for detailed console logs (these contain the actual error messages)..." -ForegroundColor Yellow

# Get detailed logs with console output
$allLogs = firebase functions:log
$allLogs | Where-Object { 
    $_ -match "extractICD10Codes" -or 
    $_ -match "OpenAI" -or 
    $_ -match "ERROR" -or
    $_ -match "Request method" -or
    $_ -match "Request body" -or
    $_ -match "Input validation"
} | Select-Object -First 20 | ForEach-Object {
    Write-Host $_ -ForegroundColor Cyan
}