# 💈 LA ROMANA - REGLAS DEL PROYECTO Y MEMORIA PERMANENTE

## 📌 Credenciales de Base de Datos en Producción (WebHost / cPanel)
- **Host:** `localhost`
- **Base de Datos:** `laromana_basededatos`
- **Usuario MySQL:** `laromana_ronin`
- **Contraseña MySQL:** `rONIN.ABC.123`

## 📌 Credenciales de Base de Datos Local (XAMPP)
- **Host:** `127.0.0.1` / `localhost:8080/phpmyadmin`
- **Base de Datos:** `la_romana`
- **Usuario MySQL:** `root`
- **Contraseña:** *(vacía)*

## 📌 Accesos del Sistema
- **Admin Dueño:** `admin@laromana.cl` | `admin123`
- **Barberos:** `carlos@laromana.cl`, `luis@laromana.cl`, `pedro@laromana.cl` | `123456`
- **Clientes:** Login con RUT | `123456`

## 📌 Arquitectura y Reglas de Despliegue
- El comando para generar el build y el paquete de despliegue es:
  `powershell -ExecutionPolicy Bypass -File .\prepare_deploy.ps1`
- La carpeta de despliegue generada es `deploy/` y `webhost_deploy/`.
- El script compila el frontend con Vite (`npm run build`), copia los archivos estáticos a la raíz, copia el backend PHP a `/backend`, exporta la base de datos SQL e incluye `.htaccess` e instrucciones de despliegue.
- Git Remote: `https://github.com/brilan10/La-Romana-Peluqueria.git` (Rama `main`).
