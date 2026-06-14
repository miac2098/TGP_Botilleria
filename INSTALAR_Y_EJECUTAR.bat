@echo off
chcp 65001 >nul
echo ================================================
echo   TGP Botilleria - Instalador
echo ================================================
echo.

:: Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Descarga e instala Node.js desde: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js:
node --version
echo.

:: Limpiar node_modules del server por si quedaron binarios viejos
if exist "server\node_modules" (
    echo Limpiando modulos viejos del servidor...
    rmdir /s /q "server\node_modules"
)

echo Instalando dependencias...
echo.

call npm install
if %errorlevel% neq 0 ( echo [ERROR] Fallo npm install raiz & pause & exit /b 1 )

cd server && call npm install && cd ..
if %errorlevel% neq 0 ( echo [ERROR] Fallo npm install server & pause & exit /b 1 )

cd client && call npm install && cd ..
if %errorlevel% neq 0 ( echo [ERROR] Fallo npm install client & pause & exit /b 1 )

echo.
echo [OK] Todo instalado. Iniciando aplicacion...
echo.
echo  Abre tu navegador en: http://localhost:5173
echo  Presiona Ctrl+C para detener.
echo.
npm run dev

pause
