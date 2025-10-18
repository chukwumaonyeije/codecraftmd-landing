# PowerShell Script to Convert HTML to PDF
# Requires Chrome/Chromium to be installed

param(
    [string]$InputFile = "lead-magnet-pdf.html",
    [string]$OutputFile = "5-Ways-AI-Can-Reduce-Billing-Workload-80-Percent.pdf"
)

Write-Host "🚀 Converting HTML to PDF using Chrome..." -ForegroundColor Green

# Get the full path of the HTML file
$HtmlPath = Join-Path $PSScriptRoot $InputFile
$PdfPath = Join-Path $PSScriptRoot $OutputFile

# Check if HTML file exists
if (-not (Test-Path $HtmlPath)) {
    Write-Host "❌ Error: HTML file not found at $HtmlPath" -ForegroundColor Red
    exit 1
}

# Find Chrome executable
$ChromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe"
)

$ChromeExe = $null
foreach ($path in $ChromePaths) {
    if (Test-Path $path) {
        $ChromeExe = $path
        break
    }
}

if (-not $ChromeExe) {
    Write-Host "❌ Error: Chrome not found. Please install Google Chrome." -ForegroundColor Red
    Write-Host "   Download from: https://www.google.com/chrome/" -ForegroundColor Yellow
    exit 1
}

# Convert HTML to PDF using Chrome's headless mode
Write-Host "📄 Converting $InputFile to $OutputFile..." -ForegroundColor Yellow

$Arguments = @(
    "--headless",
    "--disable-gpu",
    "--run-all-compositor-stages-before-draw",
    "--print-to-pdf=`"$PdfPath`"",
    "--print-to-pdf-no-header",
    "--no-margins",
    "file:///$($HtmlPath -replace '\\', '/')"
)

try {
    & $ChromeExe $Arguments
    
    if (Test-Path $PdfPath) {
        Write-Host "✅ PDF created successfully: $OutputFile" -ForegroundColor Green
        Write-Host "📍 Location: $PdfPath" -ForegroundColor Cyan
        
        # Ask if user wants to open the PDF
        $openPdf = Read-Host "Would you like to open the PDF now? (y/n)"
        if ($openPdf -eq 'y' -or $openPdf -eq 'Y') {
            Start-Process $PdfPath
        }
    } else {
        Write-Host "❌ Error: PDF was not created" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error during conversion: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Next steps:" -ForegroundColor Green
Write-Host "   1. Review the PDF and make any adjustments" -ForegroundColor White
Write-Host "   2. Upload to Gumroad as your digital product" -ForegroundColor White
Write-Host "   3. Set price to `$0 and configure email capture" -ForegroundColor White
Write-Host "   4. Update the Gumroad link in your website popup" -ForegroundColor White
