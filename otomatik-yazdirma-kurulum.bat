@echo off
chcp 65001 >nul
setlocal

echo ============================================================
echo   Hekim Plus - Otomatik Yazdirma Kurulumu
echo ============================================================
echo.

set "DEST_DIR=%~dp0"
set "PY_URL=https://hekimasistani.com/yazici_host.py"
set "INSTALL_DIR=%LOCALAPPDATA%\HekimPlus\YaziciHost"
set "PY_FILE=%INSTALL_DIR%\yazici_host.py"
set "BAT_FILE=%INSTALL_DIR%\yazici_host.bat"
set "JSON_FILE=%DEST_DIR%com.recete.yazici.json"
set "EXT_ID=dbodkaociggagccjjnobjefpjhpmkjif"

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%" >nul 2>&1

echo [1/3] Host dosyasi indiriliyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12;" ^
  "$u = '%PY_URL%';" ^
  "$out = '%PY_FILE%';" ^
  "if (Test-Path $out) { Remove-Item $out -Force -ErrorAction SilentlyContinue }" ^
  "$ok = $false;" ^
  "try {" ^
  "  if (Get-Command curl.exe -ErrorAction SilentlyContinue) {" ^
  "    & curl.exe -fL --retry 4 --retry-all-errors --connect-timeout 20 --output $out $u;" ^
  "    $ok = (Test-Path $out -PathType Leaf);" ^
  "  }" ^
  "} catch { }" ^
  "if (-not $ok) {" ^
  "  try {" ^
  "    Start-BitsTransfer -Source $u -Destination $out -ErrorAction Stop;" ^
  "    $ok = (Test-Path $out -PathType Leaf);" ^
  "  } catch { }" ^
  "}" ^
  "if (-not $ok) {" ^
  "  try {" ^
  "    Invoke-WebRequest -Uri $u -OutFile $out -Headers @{ 'User-Agent'='Mozilla/5.0'; 'Accept'='*/*' } -TimeoutSec 120;" ^
  "    $ok = (Test-Path $out -PathType Leaf);" ^
  "  } catch { }" ^
  "}" ^
  "if (-not $ok) { throw 'Host dosyasi indirilemedi.' }"
if errorlevel 1 (
  echo HATA: Host dosyasi indirilemedi.
  echo LUTFEN internet baglantinizi kontrol edip tekrar deneyin.
  pause
  exit /b 1
)

echo [2/3] Baslatici dosyasi olusturuluyor...
(
  echo @echo off
  echo set "PY_CMD=python"
  echo where py ^>nul 2^>nul ^&^& set "PY_CMD=py -3"
  echo %%PY_CMD%% "%%~dp0yazici_host.py"
  echo if errorlevel 1 (
  echo   echo HATA: Python bulunamadi. py -3 veya python kurulumu gerekli.
  echo   pause
  echo   exit /b 1
  echo )
) > "%BAT_FILE%"

echo [3/3] Native Messaging kaydi yaziliyor...
(
  echo {
  echo   "name": "com.recete.yazici",
  echo   "description": "Hekim Plus otomatik yazdirma native host",
  echo   "path": "%BAT_FILE:\\=\\\\%",
  echo   "type": "stdio",
  echo   "allowed_origins": [
  echo     "chrome-extension://%EXT_ID%/"
  echo   ]
  echo }
) > "%JSON_FILE%"

reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.recete.yazici" /ve /t REG_SZ /d "%JSON_FILE%" /f >nul 2>&1
reg add "HKCU\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.recete.yazici" /ve /t REG_SZ /d "%JSON_FILE%" /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.recete.yazici" /ve /t REG_SZ /d "%JSON_FILE%" /f >nul 2>&1

echo.
echo ============================================================
echo   Kurulum tamamlandi.
echo   Indirilen dosya: %PY_FILE%
echo   Tarayiciyi yeniden baslatin.
echo ============================================================
echo.
pause
