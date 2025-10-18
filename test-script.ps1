param([string]$GumroadUrl)

Write-Host "Testing with URL: $GumroadUrl"

if ($GumroadUrl -match "gumroad") {
    Write-Host "URL contains gumroad"
} else {
    Write-Host "URL does not contain gumroad"
}