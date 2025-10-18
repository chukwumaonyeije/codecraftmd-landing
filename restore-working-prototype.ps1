# 🔄 RESTORE WORKING PROTOTYPE - October 8, 2024
# This script restores the fully functional prototype state

Write-Host "🔄 Restoring Working Prototype State..." -ForegroundColor Cyan

# Backup current state first
Write-Host "📦 Creating backup of current files..." -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'

if (Test-Path "functions\index.js") {
    Copy-Item "functions\index.js" "functions\index.js.backup-$timestamp"
    Write-Host "✅ Backed up current functions\index.js" -ForegroundColor Green
}

if (Test-Path "dashboard.html") {
    Copy-Item "dashboard.html" "dashboard.html.backup-$timestamp"
    Write-Host "✅ Backed up current dashboard.html" -ForegroundColor Green
}

# Restore working files
Write-Host "🔧 Restoring working prototype files..." -ForegroundColor Yellow

if (Test-Path "functions\index.js.working-prototype-20241008") {
    Copy-Item "functions\index.js.working-prototype-20241008" "functions\index.js"
    Write-Host "✅ Restored working functions\index.js" -ForegroundColor Green
} else {
    Write-Host "❌ Working prototype backup not found: functions\index.js.working-prototype-20241008" -ForegroundColor Red
    exit 1
}

if (Test-Path "dashboard.html.working-prototype-20241008") {
    Copy-Item "dashboard.html.working-prototype-20241008" "dashboard.html"
    Write-Host "✅ Restored working dashboard.html" -ForegroundColor Green
} else {
    Write-Host "❌ Working prototype backup not found: dashboard.html.working-prototype-20241008" -ForegroundColor Red
    exit 1
}

# Deploy functions
Write-Host "🚀 Deploying restored functions..." -ForegroundColor Yellow
firebase deploy --only functions

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Functions deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Function deployment failed!" -ForegroundColor Red
    exit 1
}

# Verify configuration
Write-Host "🔍 Verifying Firebase configuration..." -ForegroundColor Yellow
firebase functions:config:get | Out-String | Write-Host

Write-Host ""
Write-Host "🎉 Working Prototype Restored Successfully!" -ForegroundColor Green
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Navigate to your web app" -ForegroundColor White
Write-Host "   2. Test with medical text input" -ForegroundColor White  
Write-Host "   3. Verify ICD-10/CPT extraction works" -ForegroundColor White
Write-Host "   4. Check credit balance displays correctly" -ForegroundColor White
Write-Host ""
Write-Host "📄 Test Input:" -ForegroundColor Cyan
Write-Host "Patient presents with chest pain and shortness of breath. Physical examination reveals elevated blood pressure 150/90 mmHg. EKG shows normal sinus rhythm. Diagnosed with hypertension and chest pain. Plan: Start ACE inhibitor, follow up in 2 weeks." -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Resources:" -ForegroundColor Cyan
Write-Host "   Firebase Console: https://console.firebase.google.com/project/codecraftmd-e48b0" -ForegroundColor White
Write-Host "   Function Logs: firebase functions:log" -ForegroundColor White
Write-Host "   Rollback Documentation: .\ROLLBACK_POINT_WORKING_PROTOTYPE.md" -ForegroundColor White