# Script Test RTSP URLs for Yoosee Camera

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🎥 TESTING YOOSEE RTSP URLS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$ip = "192.168.1.16"
$port = 554
$credentials = @(
    @{user="admin"; pass=""},
    @{user="admin"; pass="admin"},
    @{user="admin"; pass="888888"},
    @{user="admin"; pass="123456"},
    @{user="admin"; pass="0977298362"},  # WiFi password
    @{user=""; pass=""}
)

$paths = @("/11", "/12", "/live", "/stream1", "/ch0", "/live/ch00_0", "/live/ch00_1")

foreach ($cred in $credentials) {
    $user = $cred.user
    $pass = $cred.pass
    
    if ($user -eq "" -and $pass -eq "") {
        $authStr = "no auth"
        $urlPrefix = "rtsp://$ip`:$port"
    } else {
        $authStr = "$user`:$pass"
        $urlPrefix = "rtsp://$user`:$pass@$ip`:$port"
    }
    
    Write-Host "`n--- Testing with credentials: $authStr ---" -ForegroundColor Yellow
    
    foreach ($path in $paths) {
        $url = "$urlPrefix$path"
        Write-Host "Testing: $url ... " -NoNewline
        
        # Test with timeout 5 seconds
        $result = docker exec eparking_backend timeout 5 ffmpeg -rtsp_transport tcp -i "$url" -vframes 1 -f image2pipe -vcodec mjpeg - 2>&1 | Select-String "401|400|403|succeed|Connection|Invalid|succeeded|timed"
        
        if ($result -match "401") {
            Write-Host "❌ 401 Unauthorized" -ForegroundColor Red
        } elseif ($result -match "400") {
            Write-Host "❌ 400 Bad Request" -ForegroundColor Red
        } elseif ($result -match "403") {
            Write-Host "❌ 403 Forbidden" -ForegroundColor Red
        } elseif ($result -match "Connection refused") {
            Write-Host "❌ Connection Refused" -ForegroundColor Red
        } elseif ($result -match "timed out") {
            Write-Host "⏱️ Timeout" -ForegroundColor Gray
        } elseif ($result -match "Invalid") {
            Write-Host "❌ Invalid" -ForegroundColor Red
        } else {
            Write-Host "✅ MIGHT WORK! Check output" -ForegroundColor Green
            Write-Host "   → Full test: docker exec eparking_backend ffmpeg -rtsp_transport tcp -i `"$url`" -vframes 1 -f image2pipe -vcodec mjpeg - > test_$($path.Replace('/','_')).jpg 2>&1"
        }
        
        Start-Sleep -Milliseconds 500
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing completed!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
