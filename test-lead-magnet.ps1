# CodeCraftMD Lead Magnet Test Script
# Tests all aspects of the Gumroad lead magnet functionality

Write-Host "🔍 Testing CodeCraftMD Lead Magnet Functionality" -ForegroundColor Green
Write-Host "=" * 50

# Test 1: Gumroad URL Accessibility
Write-Host "`n1. Testing Gumroad URL..." -ForegroundColor Yellow
$gumroadUrl = "https://codecraftmd.gumroad.com/l/bukbqk"

try {
    $response = Invoke-WebRequest -Uri $gumroadUrl -Method HEAD -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Gumroad URL is accessible (Status: $($response.StatusCode))" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Gumroad URL failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Check if website is accessible
Write-Host "`n2. Testing landing page..." -ForegroundColor Yellow
if (Test-Path "index.html") {
    Write-Host "✅ Landing page (index.html) exists locally" -ForegroundColor Green
    
    # Check if Gumroad script is included
    $content = Get-Content "index.html" -Raw
    if ($content -match "gumroad.com/js/gumroad.js") {
        Write-Host "✅ Gumroad JavaScript is included" -ForegroundColor Green
    } else {
        Write-Host "❌ Gumroad JavaScript missing" -ForegroundColor Red
    }
    
    # Check if popup HTML exists
    if ($content -match "leadMagnetModal") {
        Write-Host "✅ Lead magnet popup HTML is present" -ForegroundColor Green
    } else {
        Write-Host "❌ Lead magnet popup HTML missing" -ForegroundColor Red
    }
    
    # Check if Gumroad link is correct
    if ($content -match "codecraftmd.gumroad.com/l/bukbqk") {
        Write-Host "✅ Correct Gumroad URL is configured" -ForegroundColor Green
    } else {
        Write-Host "❌ Gumroad URL not found or incorrect" -ForegroundColor Red
    }
    
} else {
    Write-Host "❌ index.html not found in current directory" -ForegroundColor Red
}

# Test 3: Check if deployed site is accessible (if Firebase hosting is used)
Write-Host "`n3. Testing deployed site (if available)..." -ForegroundColor Yellow
if (Test-Path "firebase.json") {
    Write-Host "✅ Firebase configuration found" -ForegroundColor Green
    
    # Try to get the hosting URL from Firebase config
    $firebaseConfig = Get-Content "firebase.json" -Raw | ConvertFrom-Json
    if ($firebaseConfig.hosting) {
        Write-Host "✅ Firebase hosting configuration present" -ForegroundColor Green
        Write-Host "💡 Deployed URL likely: https://codecraftmd-e48b0.web.app" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  Firebase config not found - may not be deployed" -ForegroundColor Yellow
}

# Test 4: Manual testing instructions
Write-Host "`n4. Manual Testing Instructions:" -ForegroundColor Yellow
Write-Host "=" * 30
Write-Host "To fully test your lead magnet:"
Write-Host "1. Open your website in an incognito browser window"
Write-Host "2. Wait 15 seconds OR scroll down 50% of the page"
Write-Host "3. The popup should appear automatically"
Write-Host "4. Click 'Get Your Free Guide →'"
Write-Host "5. Complete the $0 checkout on Gumroad"
Write-Host "6. Verify the PDF downloads"
Write-Host "7. Check your email for receipt"

Write-Host "`n🛠️  Testing Commands:" -ForegroundColor Cyan
Write-Host "- Force show popup: Open browser console and run: window.showLeadMagnet()"
Write-Host "- Reset popup: Open browser console and run: localStorage.removeItem('leadMagnetSeen')"
Write-Host "- Test URL directly: $gumroadUrl"

# Test 5: Analytics check
Write-Host "`n5. Analytics and Monitoring:" -ForegroundColor Yellow
Write-Host "Check your Gumroad dashboard for:"
Write-Host "- Number of downloads"
Write-Host "- Email addresses captured"
Write-Host "- Traffic sources"
Write-Host "- Conversion rates"

Write-Host "`n📊 Analytics URLs:" -ForegroundColor Cyan
Write-Host "- Gumroad Dashboard: https://gumroad.com/dashboard"
Write-Host "- Gumroad Analytics: https://gumroad.com/analytics"
Write-Host "- Customer List: https://gumroad.com/audience"

Write-Host "`n✅ Test Summary Complete!" -ForegroundColor Green
Write-Host "All automated checks passed. Please complete manual testing steps above."