@echo off
:: GVR Engine Setup
:: Auto-Elevation to Administrator
NET SESSION >nul 2>&1
if %errorLevel% neq 0 (
    echo Meminta akses Administrator...
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /b
)

echo.
echo ===================================================
echo Memulai Instalasi GVR Engine...
echo ===================================================
echo.

set "GVR_DIR=C:\GVREngine"
if not exist "%GVR_DIR%" mkdir "%GVR_DIR%"

:: Write generator.vbs
echo Set fso = CreateObject("Scripting.FileSystemObject") > "%temp%\gen.vbs"
echo Set f = fso.CreateTextFile("%GVR_DIR%\handler.ps1", True) >> "%temp%\gen.vbs"
echo f.WriteLine "param([string]$Uri)" >> "%temp%\gen.vbs"
echo f.WriteLine "$ErrorActionPreference = 'SilentlyContinue'" >> "%temp%\gen.vbs"
echo f.WriteLine "if ($Uri -match 's=([^&]+)&l=([^&]+)&a=([^/]+)') {" >> "%temp%\gen.vbs"
echo f.WriteLine "    $b64s = $matches[1] -replace '%%3D', '='" >> "%temp%\gen.vbs"
echo f.WriteLine "    $b64l = $matches[2] -replace '%%3D', '='" >> "%temp%\gen.vbs"
echo f.WriteLine "    $scriptUrl = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64s))" >> "%temp%\gen.vbs"
echo f.WriteLine "    $downloadLink = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64l))" >> "%temp%\gen.vbs"
echo f.WriteLine "    $appId = $matches[3] -replace '/$', ''" >> "%temp%\gen.vbs"
echo f.WriteLine "    $env:VT_DOWNLOAD_LINK = $downloadLink" >> "%temp%\gen.vbs"
echo f.WriteLine "    $env:VT_APP_ID = $appId" >> "%temp%\gen.vbs"
echo f.WriteLine "    $env:VT_PLUGIN_NAME = 'voratools'" >> "%temp%\gen.vbs"
echo f.WriteLine "    iex (irm $scriptUrl)" >> "%temp%\gen.vbs"
echo f.WriteLine "}" >> "%temp%\gen.vbs"
echo f.Close >> "%temp%\gen.vbs"

echo Set f2 = fso.CreateTextFile("%GVR_DIR%\handler.vbs", True) >> "%temp%\gen.vbs"
echo f2.WriteLine "Set objArgs = WScript.Arguments" >> "%temp%\gen.vbs"
echo f2.WriteLine "If objArgs.Count > 0 Then" >> "%temp%\gen.vbs"
echo f2.WriteLine "    Set objShell = CreateObject(""WScript.Shell"")" >> "%temp%\gen.vbs"
echo f2.WriteLine "    objShell.Run ""powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File """"C:\GVREngine\handler.ps1"""" """""" & objArgs(0) & """""""", 0, False" >> "%temp%\gen.vbs"
echo f2.WriteLine "End If" >> "%temp%\gen.vbs"
echo f2.Close >> "%temp%\gen.vbs"

cscript //nologo "%temp%\gen.vbs"
del "%temp%\gen.vbs"

echo Mendaftarkan Protokol gvr:// ke Windows Registry...
reg add "HKCR\gvr" /ve /t REG_SZ /d "URL:GVR Protocol" /f >nul
reg add "HKCR\gvr" /v "URL Protocol" /t REG_SZ /d "" /f >nul
reg add "HKCR\gvr\shell\open\command" /ve /t REG_SZ /d "wscript.exe \"%GVR_DIR%\handler.vbs\" \"%%1\"" /f >nul

echo.
echo ===================================================
echo Instalasi GVR Engine Berhasil!
echo Anda sekarang bisa menginstal game langsung dari website Gamevora hanya dengan 1-klik.
echo ===================================================
echo.
pause
exit
