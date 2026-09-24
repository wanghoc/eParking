# Đóng gói ứng dụng máy trạm thành thư mục dist\eParkingEdge (chạy eParkingEdge.exe).
# Yêu cầu: .venv đã cài requirements.txt + pyinstaller (xem HUONG_DAN_SU_DUNG.md).
# config.yaml và data\ (hàng chờ chưa đồng bộ, ảnh, log) của bản build cũ được giữ lại.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$py = ".\.venv\Scripts\python.exe"
$out = "dist\eParkingEdge"
$keep = "build\_keep"

if (Get-Process eParkingEdge -ErrorAction SilentlyContinue) { throw "Hãy đóng eParkingEdge.exe trước khi build." }

Remove-Item -Recurse -Force $keep -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $keep | Out-Null
foreach ($item in "config.yaml", "data") {
    if (Test-Path "$out\$item") { Move-Item "$out\$item" "$keep\$item" }
}

& $py -m PyInstaller main.py `
    --name eParkingEdge `
    --windowed `
    --noconfirm `
    --paths . `
    --collect-submodules eparking_edge `
    --collect-data ultralytics `
    --collect-all torchvision `
    --hidden-import ultralytics.nn.tasks
$ok = $LASTEXITCODE -eq 0

New-Item -ItemType Directory -Force $out | Out-Null
foreach ($item in "config.yaml", "data") {
    if (Test-Path "$keep\$item") { Move-Item -Force "$keep\$item" "$out\$item" }
}
if (-not $ok) { throw "PyInstaller failed" }

Copy-Item -Recurse -Force models "$out\models"
Copy-Item -Force config.example.yaml "$out\config.example.yaml"
if (-not (Test-Path "$out\config.yaml") -and (Test-Path config.yaml)) { Copy-Item config.yaml "$out\config.yaml" }
Write-Host "Done: $out\eParkingEdge.exe"
