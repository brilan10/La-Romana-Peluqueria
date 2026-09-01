# prepare_deploy.ps1 - Script de Construccion y Empaquetado para Despliegue en Produccion
$ErrorActionPreference = "Stop"
$Workspace = $PSScriptRoot
$DeployDir = "$Workspace\deploy"
$WebhostDeployDir = "$Workspace\webhost_deploy"

Set-Location $Workspace

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  INICIANDO PREPARACION DE DESPLIEGUE - LA ROMANA" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 1. Compilar Frontend
Write-Host "`n[1/5] Compilando Frontend (React + Vite)..." -ForegroundColor Yellow
npm.cmd run build

# 2. Limpiar / Crear carpetas de despliegue
Write-Host "`n[2/5] Creando directorios de despliegue (deploy y webhost_deploy)..." -ForegroundColor Yellow
if (Test-Path $DeployDir) {
    Remove-Item -Recurse -Force "$DeployDir\*"
} else {
    New-Item -ItemType Directory -Force -Path $DeployDir | Out-Null
}

if (Test-Path $WebhostDeployDir) {
    Remove-Item -Recurse -Force "$WebhostDeployDir\*"
} else {
    New-Item -ItemType Directory -Force -Path $WebhostDeployDir | Out-Null
}

# 3. Copiar Frontend compilado (dist)
Write-Host "`n[3/5] Copiando archivos compilados del Frontend..." -ForegroundColor Yellow
Copy-Item -Path "dist\*" -Destination $DeployDir -Recurse -Force
Copy-Item -Path "dist\*" -Destination $WebhostDeployDir -Recurse -Force

# 4. Crear carpeta backend y copiar scripts PHP
Write-Host "`n[4/5] Copiando Backend PHP a /backend..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$DeployDir\backend" | Out-Null
Copy-Item -Path "src\backend\*" -Destination "$DeployDir\backend" -Recurse -Force

New-Item -ItemType Directory -Force -Path "$WebhostDeployDir\backend" | Out-Null
Copy-Item -Path "src\backend\*" -Destination "$WebhostDeployDir\backend" -Recurse -Force

# 5. Crear archivo .htaccess para enrutamiento limpio SPA + PHP
Write-Host "`n[5/5] Generando .htaccess, base de datos SQL e instrucciones..." -ForegroundColor Yellow

$htaccessContent = @"
# .htaccess para La Romana Peluqueria / Barberia
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Permitir acceso directo a backend y archivos estaticos
  RewriteRule ^backend/ - [L]
  RewriteRule ^assets/ - [L]
  RewriteRule ^botones/ - [L]

  # Si el archivo o directorio existe fisicamente, servirlo directo
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Todo lo demas se redirige a la Single Page App (index.html)
  RewriteRule ^ index.html [L]
</IfModule>

# Seguridad y tipos MIME
AddDefaultCharset UTF-8
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
</IfModule>
"@

Set-Content -Path "$DeployDir\.htaccess" -Value $htaccessContent -Encoding UTF8
Set-Content -Path "$WebhostDeployDir\.htaccess" -Value $htaccessContent -Encoding UTF8

# Copiar base de datos SQL
if (Test-Path "database_full.sql") {
    Copy-Item -Path "database_full.sql" -Destination "$DeployDir\database_la_romana.sql" -Force
    Copy-Item -Path "database_full.sql" -Destination "$WebhostDeployDir\database_la_romana.sql" -Force
}

# Copiar Instrucciones de Despliegue
if (Test-Path "INSTRUCCIONES_DEPLOY_WEBHOST.txt") {
    Copy-Item -Path "INSTRUCCIONES_DEPLOY_WEBHOST.txt" -Destination "$DeployDir\INSTRUCCIONES_DEPLOY_WEBHOST.txt" -Force
    Copy-Item -Path "INSTRUCCIONES_DEPLOY_WEBHOST.txt" -Destination "$WebhostDeployDir\INSTRUCCIONES_DEPLOY_WEBHOST.txt" -Force
    Copy-Item -Path "INSTRUCCIONES_DEPLOY_WEBHOST.txt" -Destination "$DeployDir\INSTRUCCIONES_DESPLIEGUE.txt" -Force
    Copy-Item -Path "INSTRUCCIONES_DEPLOY_WEBHOST.txt" -Destination "$WebhostDeployDir\INSTRUCCIONES_DESPLIEGUE.txt" -Force
}

Write-Host "`n=================================================" -ForegroundColor Green
Write-Host "  DESPLIEGUE GENERADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "  Carpeta lista en: $DeployDir" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

