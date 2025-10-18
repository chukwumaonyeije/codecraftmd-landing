# PowerShell script to set up OpenAI API Key for CodeCraftMD
Write-Host "🚀 CodeCraftMD OpenAI Setup" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Blue

# Check if user has Firebase CLI
try {
    $firebaseVersion = firebase --version
    Write-Host "✅ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Instructions:"
Write-Host "1. Go to: https://platform.openai.com/api-keys" -ForegroundColor Cyan
Write-Host "2. Create a new secret key named 'CodeCraftMD-Production'" -ForegroundColor Cyan
Write-Host "3. Copy the key (it starts with 'sk-')" -ForegroundColor Cyan
Write-Host ""

# Prompt for API key
$apiKey = Read-Host "🔑 Enter your OpenAI API key"

# Validate API key format
if (-not $apiKey.StartsWith("sk-")) {
    Write-Host "⚠️  Warning: API key should start with 'sk-'" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔧 Setting up Firebase Functions config..." -ForegroundColor Yellow

# Set the config
try {
    $configCommand = "firebase functions:config:set openai.api_key=`"$apiKey`""
    Invoke-Expression $configCommand
    Write-Host "✅ OpenAI API key configured successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error setting config: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Deploying functions..." -ForegroundColor Yellow

# Deploy functions
try {
    firebase deploy --only functions
    Write-Host "✅ Functions deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error deploying functions: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Blue
Write-Host "✅ OpenAI API key configured" -ForegroundColor Green
Write-Host "✅ Firebase Functions deployed" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Go to: https://codecraftmd-e48b0.web.app/dashboard.html" -ForegroundColor White
Write-Host "2. Log in and test ICD-10 extraction" -ForegroundColor White
Write-Host "3. You should no longer see 'Using basic code detection'" -ForegroundColor White
Write-Host ""
Write-Host "💡 If issues persist, check Firebase Functions logs:" -ForegroundColor Yellow
Write-Host "   firebase functions:log" -ForegroundColor Gray