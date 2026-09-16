# Nano BookShelf - Local Test Server Launcher (PowerShell)
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   나노의 책장 로컬 테스트 서버 런처" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path -Parent $PSScriptRoot
$phpDir = Join-Path $rootDir "php"
$portablePhp = Join-Path $phpDir "php.exe"
$xamppPhp = "C:\xampp\php\php.exe"

$phpCmd = $null

if (Get-Command php -ErrorAction SilentlyContinue) {
    Write-Host "[OK] 시스템 PHP를 발견했습니다." -ForegroundColor Green
    $phpCmd = "php"
} elseif (Test-Path $portablePhp) {
    Write-Host "[OK] 포터블 PHP를 발견했습니다 ($portablePhp)" -ForegroundColor Green
    $phpCmd = $portablePhp
} elseif (Test-Path $xamppPhp) {
    Write-Host "[OK] XAMPP PHP를 발견했습니다 ($xamppPhp)" -ForegroundColor Green
    $phpCmd = $xamppPhp
} else {
    Write-Host "[안내] PC에 PHP가 없습니다. 공식 포터블 PHP(약 30MB)를 자동 다운로드합니다..." -ForegroundColor Yellow
    Write-Host "잠시만 기다려 주세요 (인터넷 속도에 따라 약 5~15초 소요)..." -ForegroundColor Yellow
    
    $ProgressPreference = 'SilentlyContinue'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $zipPath = Join-Path $env:TEMP "php_portable.zip"
    
    try {
        $wc = New-Object System.Net.WebClient
        $wc.DownloadFile("https://windows.php.net/downloads/releases/archives/php-8.0.30-nts-Win32-vs16-x64.zip", $zipPath)
        
        Write-Host "[OK] 다운로드 완료. 압축을 해제합니다..." -ForegroundColor Cyan
        Expand-Archive -Path $zipPath -DestinationPath $phpDir -Force
        Remove-Item $zipPath -Force
        
        $iniDev = Join-Path $phpDir "php.ini-development"
        $iniFile = Join-Path $phpDir "php.ini"
        if (Test-Path $iniDev) { Copy-Item $iniDev $iniFile -Force }
        
        Write-Host "[OK] PHP 세팅이 완료되었습니다!" -ForegroundColor Green
        $phpCmd = $portablePhp
    } catch {
        Write-Host "[오류] 다운로드 중 문제가 발생했습니다: $_" -ForegroundColor Red
        Write-Host "인터넷 연결을 확인하시거나 XAMPP를 설치해 주세요." -ForegroundColor Red
        pause
        exit 1
    }
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "   웹 서버 구동 시작: http://localhost:8080" -ForegroundColor Green
Write-Host "   웹 브라우저가 자동으로 열립니다." -ForegroundColor Green
Write-Host "   (서버를 종료하시려면 이 창에서 Ctrl + C 를 누르세요)" -ForegroundColor Gray
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

Start-Process "http://localhost:8080/preview_demo.html"

Set-Location $PSScriptRoot
& $phpCmd -S localhost:8080
