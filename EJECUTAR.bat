@echo off
chcp 65001 >nul
echo ================================================
echo   TGP Botilleria - Iniciando aplicacion
echo ================================================
echo.

:: Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado o no esta en el PATH.
    echo.
    echo Descarga e instala Node.js desde: https://nodejs.org
    echo Elige la version LTS, instala y vuelve a intentarlo.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js:
node --version

:: Verificar que las dependencias esten instaladas
if not exist "node_modules" (
    echo.
    echo Instalando dependencias por primera vez...
    call npm install
    cd server && call npm install && cd ..
    cd client && call npm install && cd ..
    echo [OK] Dependencias instaladas
)

echo.
echo  Abre tu navegador en: http://localhost:5173
echo  Presiona Ctrl+C para detener la aplicacion.
echo.
npm run dev

pause
