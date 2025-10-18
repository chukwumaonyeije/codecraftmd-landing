param([Parameter(Mandatory=$true)][string]$GumroadUrl)

Write-Host "Updating Gumroad link..." -ForegroundColor Green

$IndexFile = "index.html"

if (-not (Test-Path $IndexFile)) {
    Write-Host "Error: index.html not found" -ForegroundColor Red
    exit 1
}

if ($GumroadUrl -notmatch "^https://((gum\.co/[\w\-]+)|(\w+\.gumroad\.com/l/[\w\-]+))$") {
    Write-Host "Error: Invalid Gumroad URL format" -ForegroundColor Red
    Write-Host "Expected: https://gum.co/slug or https://store.gumroad.com/l/slug" -ForegroundColor Yellow
    Write-Host "You provided: $GumroadUrl" -ForegroundColor Yellow
    exit 1
}

$content = Get-Content $IndexFile -Raw

if ($content -notmatch 'href="#".*id="gumroadButton"') {
    Write-Host "Error: Gumroad button placeholder not found" -ForegroundColor Red
    exit 1
}

$backupFile = "index.html.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $IndexFile $backupFile
Write-Host "Backup created: $backupFile" -ForegroundColor Cyan

$newContent = $content -replace 'href="#"(\s+id="gumroadButton")', "href=`"$GumroadUrl`"`$1"
Set-Content -Path $IndexFile -Value $newContent -NoNewline

Write-Host "Successfully updated Gumroad link!" -ForegroundColor Green
Write-Host "Updated link: $GumroadUrl" -ForegroundColor Cyan

$verifyContent = Get-Content $IndexFile -Raw
if ($verifyContent -match [regex]::Escape($GumroadUrl)) {
    Write-Host "Verification: Link successfully updated" -ForegroundColor Green
} else {
    Write-Host "Verification failed" -ForegroundColor Red
    Copy-Item $backupFile $IndexFile
    exit 1
}

Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  1. Test website popup" -ForegroundColor White
Write-Host "  2. Test in incognito browser" -ForegroundColor White
Write-Host "  3. Verify PDF download works" -ForegroundColor White
