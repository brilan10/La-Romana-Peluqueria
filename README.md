# 💈 La Romana - Barber Shop, Accesorios & Perfumería

Sistema integral de gestión para Barbería y Perfumería La Romana, desarrollado con **React + Vite** en el Frontend y **PHP + MySQL (PDO)** en el Backend.

---

## 🔑 Credenciales y Accesos del Proyecto

### 1. Base de Datos en Producción (WebHost / cPanel)
- **Host:** `localhost`
- **Base de Datos:** `laromana_basededatos`
- **Usuario MySQL:** `laromana_ronin`
- **Contraseña MySQL:** `rONIN.ABC.123`

### 2. Base de Datos Local (XAMPP)
- **Host:** `127.0.0.1` / `localhost:8080/phpmyadmin`
- **Base de Datos:** `la_romana`
- **Usuario MySQL:** `root`
- **Contraseña:** *(vacía)*

### 3. Usuarios y Accesos del Sistema
- **Panel Administrador Dueño (Back-Office):**
  - **Email:** `admin@laromana.cl`
  - **Contraseña:** `admin123`
- **Barberos (POS, Liquidaciones y Mis Pagos):**
  - Carlos *(Master)*: `carlos@laromana.cl` | Clave: `123456`
  - Luis *(Senior)*: `luis@laromana.cl` | Clave: `123456`
  - Pedro *(Junior)*: `pedro@laromana.cl` | Clave: `123456`
- **Clientes (Portal de Citas y Fidelización):**
  - Acceso con RUT
  - Contraseña inicial: `123456`

---

## 🚀 Módulos Principales del Sistema

1. **Agenda & Turnos en Tiempo Real:** Calendario interactivo con vista diaria, semanal y mensual, bloqueo de horarios ocupados y asignación por barbero.
2. **Punto de Venta (POS Trabajador):** Cobro ágil de servicios y productos, aplicación de propinas, decants de regalo y módulo "Mis Pagos" para barberos.
3. **CRM de Fidelización:** 
   - Creación rápida de clientes desde el panel.
   - Meta de cortes para regalo dinámica (configurable a 2, 3, 4, 5 cortes).
   - Botón de **Regalo Rápido** para entregar atenciones VIP desde inventario o detalles personalizados.
   - Historial detallado con pestañas de visitas y registro de premios.
4. **Liquidaciones y Pagos de Comisiones:** 
   - Control de comisiones diarias por barbero y porcentaje del local.
   - Módulo para registrar, editar y anular pagos con método y comprobante.
   - Historial completo de liquidaciones pagadas y pendientes.
5. **Tienda Online de Perfumería y Accesorios:** Catálogo de productos, carrito de compras, decants y gestión de bodega con stock en tiempo real.
6. **Caja Diaria & Arqueo:** Apertura con fondo inicial, registro de ventas por método de pago y arqueo de cierre.

---

## 📦 Despliegue en Hosting (cPanel / Hostinger / WebHost)

Para generar el paquete de despliegue listo para subir al servidor:

```powershell
powershell -ExecutionPolicy Bypass -File .\prepare_deploy.ps1
```

Este script compila el frontend con `npm run build`, sincroniza los archivos en la carpeta `deploy/` y genera:
- Archivos estáticos en la raíz (`index.html`, `assets/`, etc.).
- Backend PHP en `/backend`.
- Archivo `.htaccess` para Apache mod_rewrite y enrutamiento SPA.
- Respaldo de base de datos `database_la_romana.sql`.
- Manual paso a paso en `INSTRUCCIONES_DEPLOY_WEBHOST.txt`.

---

## 🐙 Repositorio Git
- **URL Remota:** `https://github.com/brilan10/La-Romana-Peluqueria.git`
- **Rama Principal:** `main`
