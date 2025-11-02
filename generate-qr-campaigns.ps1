# QR Code Campaign URL Generator for CodeCraftMD
# This script generates URLs that can be used to create QR codes

param(
    [string]$BaseUrl = "https://codecraftmd.com/outreach",
    [string]$OutputFile = "qr-campaign-urls.txt"
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   CodeCraftMD QR Campaign URL Generator" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Predefined campaign examples
$campaigns = @(
    @{Name="snailmail-q1-2025"; Description="Direct mail campaign Q1 2025"},
    @{Name="atlanta-physician-fair"; Description="Atlanta Physician Fair booth"},
    @{Name="networking-event-march"; Description="March networking event"},
    @{Name="cardiology-conference"; Description="Cardiology association conference"},
    @{Name="referral-program"; Description="Physician referral program"}
)

Write-Host "Select an option:" -ForegroundColor Yellow
Write-Host "1. Generate URLs for predefined campaigns"
Write-Host "2. Create custom campaign URL"
Write-Host "3. Batch create custom campaigns"
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

$urlsToGenerate = @()

switch ($choice) {
    "1" {
        # Use predefined campaigns
        foreach ($campaign in $campaigns) {
            $url = "$BaseUrl?campaign=$($campaign.Name)"
            $urlsToGenerate += @{
                Name = $campaign.Name
                Description = $campaign.Description
                URL = $url
            }
        }
    }
    "2" {
        # Single custom campaign
        Write-Host ""
        $campaignName = Read-Host "Enter campaign name (use hyphens, no spaces)"
        $campaignDesc = Read-Host "Enter campaign description"
        
        $url = "$BaseUrl?campaign=$campaignName"
        $urlsToGenerate += @{
            Name = $campaignName
            Description = $campaignDesc
            URL = $url
        }
    }
    "3" {
        # Batch custom campaigns
        Write-Host ""
        Write-Host "Enter campaign names (one per line, press Enter twice when done):" -ForegroundColor Yellow
        $batchNames = @()
        do {
            $input = Read-Host
            if ($input) { $batchNames += $input }
        } while ($input)
        
        foreach ($name in $batchNames) {
            $url = "$BaseUrl?campaign=$name"
            $urlsToGenerate += @{
                Name = $name
                Description = "Campaign: $name"
                URL = $url
            }
        }
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit
    }
}

# Display and save results
Write-Host ""
Write-Host "Generated Campaign URLs:" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""

$output = @()
$output += "CodeCraftMD Outreach Campaign URLs"
$output += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$output += "=" * 80
$output += ""

foreach ($item in $urlsToGenerate) {
    Write-Host "Campaign: $($item.Name)" -ForegroundColor Cyan
    Write-Host "Description: $($item.Description)" -ForegroundColor Gray
    Write-Host "URL: $($item.URL)" -ForegroundColor White
    Write-Host "QR Code: Paste URL into qrcode-monkey.com or similar" -ForegroundColor Yellow
    Write-Host ""
    
    $output += "Campaign: $($item.Name)"
    $output += "Description: $($item.Description)"
    $output += "URL: $($item.URL)"
    $output += ""
}

# Save to file
$output | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host "URLs saved to: $OutputFile" -ForegroundColor Green
Write-Host ""

# Provide next steps
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Copy each URL above"
Write-Host "2. Visit https://www.qrcode-monkey.com/ (or any QR code generator)"
Write-Host "3. Paste the URL and generate your QR code"
Write-Host "4. Download and add to your marketing materials"
Write-Host "5. Track results in the CodeCraftMD admin dashboard"
Write-Host ""

# Ask if user wants to open QR code generator
$openBrowser = Read-Host "Open QR code generator in browser? (y/n)"
if ($openBrowser -eq "y") {
    Start-Process "https://www.qrcode-monkey.com/"
}

Write-Host ""
Write-Host "Done! Happy campaigning! 🎉" -ForegroundColor Green
