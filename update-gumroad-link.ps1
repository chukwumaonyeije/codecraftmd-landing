# PowerShell Script to Update Gumroad Link in Website
# Usage: .\update-gumroad-link.ps1 "https://gum.co/your-product-slug"

param(
    [Parameter(Mandatory=$true)]
    [string]$GumroadUrl
)

Write-Host "🔗 Updating Gumroad link in your website..." -ForegroundColor Green

$IndexFile = "index.html"

# Check if index.html exists
if (-not (Test-Path $IndexFile)) {
    Write-Host "❌ Error: index.html not found in current directory" -ForegroundColor Red
    Write-Host "   Make sure you're running this from: $PWD" -ForegroundColor Yellow
    exit 1
}

# Validate URL format (accept both gum.co and gumroad.com formats)
if ($GumroadUrl -notmatch "^https://((gum\.co/[\w\-]+)|(\w+\.gumroad\.com/l/[\w\-]+))$") {
    Write-Host "❌ Error: Invalid Gumroad URL format" -ForegroundColor Red
    Write-Host "   Expected format: https://gum.co/your-product-slug or https://yourstore.gumroad.com/l/product-slug" -ForegroundColor Yellow
    Write-Host "   You provided: $GumroadUrl" -ForegroundColor Yellow
    exit 1
}

Write-Host "📝 Reading current index.html..." -ForegroundColor Yellow

# Read the file content
$content = Get-Content $IndexFile -Raw

# Check if placeholder exists
if ($content -notmatch 'href="#".*id="gumroadButton"') {
    Write-Host "❌ Error: Gumroad button placeholder not found" -ForegroundColor Red
    Write-Host "   Looking for: href=`"#`" id=`"gumroadButton`"" -ForegroundColor Yellow
    exit 1
}

# Create backup
$backupFile = "index.html.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $IndexFile $backupFile
Write-Host "💾 Backup created: $backupFile" -ForegroundColor Cyan

# Replace the placeholder link
$newContent = $content -replace 'href="#"(\s+id="gumroadButton")', "href=`"$GumroadUrl`"`$1"

# Write the updated content back to file
Set-Content -Path $IndexFile -Value $newContent -NoNewline

Write-Host "✅ Successfully updated Gumroad link!" -ForegroundColor Green
Write-Host "📍 Updated link: $GumroadUrl" -ForegroundColor Cyan

# Verify the change
$verifyContent = Get-Content $IndexFile -Raw
if ($verifyContent -match [regex]::Escape($GumroadUrl)) {
    Write-Host "🔍 Verification: Link successfully updated in file" -ForegroundColor Green
} else {
    Write-Host "❌ Verification failed: Link not found in updated file" -ForegroundColor Red
    Write-Host "   Restoring from backup..." -ForegroundColor Yellow
    Copy-Item $backupFile $IndexFile
    exit 1
}

Write-Host "`n🎯 Next steps:" -ForegroundColor Green
Write-Host "   1. Test your website popup to ensure link works" -ForegroundColor White
Write-Host "   2. Open incognito browser and test the complete flow" -ForegroundColor White
Write-Host "   3. Verify PDF download and email capture work" -ForegroundColor White

Write-Host "`n🧪 Quick test commands:" -ForegroundColor Cyan
Write-Host "   * Open browser console: window.showLeadMagnet()" -ForegroundColor Gray
Write-Host "   * Reset popup: localStorage.removeItem('leadMagnetSeen')" -ForegroundColor Gray
