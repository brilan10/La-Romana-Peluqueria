-- ==========================================================
-- Ecosistema La Romana S.P.A (Barbería + Tienda)
-- Para importar en phpMyAdmin (MariaDB/MySQL)
-- Incluye Esquema Completo y Datos Ficticios (Dummy Data)
-- ==========================================================

-- Configuraciones de codificación para evitar problemas con acentos
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8mb4 */;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. TABLA: clientes
-- --------------------------------------------------------
DROP TABLE IF EXISTS `clientes`;
CREATE TABLE `clientes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `google_id` VARCHAR(255) UNIQUE NULL,
  `rut` VARCHAR(12) UNIQUE NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) UNIQUE NOT NULL,
  `telefono` VARCHAR(20),
  `foto_perfil` VARCHAR(255),
  `cortes_acumulados` INT DEFAULT 0,
  `decants_disponibles` INT DEFAULT 0,
  `notas_crm` TEXT DEFAULT NULL,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `clientes` (`rut`, `nombre`, `email`, `telefono`, `cortes_acumulados`) VALUES
('19123456-7', 'Juan Pérez', 'juan.perez@email.com', '+56911111111', 2),
('18765432-1', 'Carlos Silva', 'carlos.silva@email.com', '+56922222222', 4), -- VIP
('20555666-8', 'Miguel Rojo', 'miguel.rojo@email.com', '+56933333333', 1);

-- --------------------------------------------------------
-- 2. TABLA: trabajadores
-- --------------------------------------------------------
DROP TABLE IF EXISTS `trabajadores`;
CREATE TABLE `trabajadores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) UNIQUE NOT NULL,
  `foto_perfil` VARCHAR(255),
  `activo` BOOLEAN DEFAULT TRUE,
  `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `trabajadores` (`nombre`, `email`) VALUES
('Alejandro', 'alejandro@laromana.cl'),
('Mateo', 'mateo@laromana.cl'),
('Sebastián', 'sebastian@laromana.cl');

-- --------------------------------------------------------
-- 3. TABLA: servicios
-- --------------------------------------------------------
DROP TABLE IF EXISTS `servicios`;
CREATE TABLE `servicios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT,
  `precio` DECIMAL(10,2) NOT NULL,
  `es_corte` BOOLEAN DEFAULT FALSE,
  `activo` BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `servicios` (`nombre`, `precio`, `es_corte`) VALUES
('Corte de pelo degradado', 14000.00, TRUE),
('Corte clásico', 12000.00, TRUE),
('Corte de Barba', 8000.00, TRUE),
('Corte y barba', 20000.00, TRUE);

-- --------------------------------------------------------
-- 4. TABLA: categorias (Tienda)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `categorias`;
CREATE TABLE `categorias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categorias` (`nombre`) VALUES
('Decants / Perfumes'),
('Gorras'),
('Cuidado Capilar');

-- --------------------------------------------------------
-- 5. TABLA: productos (Tienda)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `productos`;
CREATE TABLE `productos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `categoria_id` INT NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT,
  `precio` DECIMAL(10,2) NOT NULL,
  `stock` INT DEFAULT 0,
  `imagen_url` VARCHAR(255),
  `ventas` INT DEFAULT 0,
  FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `productos` (`categoria_id`, `nombre`, `descripcion`, `precio`, `stock`, `ventas`) VALUES
(1, 'Creed Aventus (Decant 10ml)', 'Aroma cítrico y maderoso.', 25000.00, 10, 45),
(1, 'Tom Ford Oud Wood (Decant 10ml)', 'Elegante e intenso.', 30000.00, 5, 20),
(2, 'Gorra Trucker La Romana', 'Color negro con logo bordado dorado.', 15000.00, 20, 10),
(3, 'Pomada Fijación Extra Fuerte', 'Acabado mate, base de agua.', 12000.00, 15, 35);

-- --------------------------------------------------------
-- 6. TABLA: citas
-- --------------------------------------------------------
DROP TABLE IF EXISTS `citas`;
CREATE TABLE `citas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cliente_id` INT NOT NULL,
  `trabajador_id` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `hora` TIME NOT NULL,
  `estado` ENUM('Pendiente', 'Terminado_Esperando_Pago', 'Completada', 'Cancelada') DEFAULT 'Pendiente',
  `descuento` DECIMAL(10,2) DEFAULT 0.00,
  `metodo_pago` ENUM('Efectivo', 'Transferencia', 'Tarjeta', 'Otro') DEFAULT NULL,
  `premio_entregado` VARCHAR(100) DEFAULT NULL,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `citas` (`cliente_id`, `trabajador_id`, `fecha`, `hora`, `estado`) VALUES
(1, 1, CURDATE(), '10:00:00', 'Pendiente'),
(2, 2, CURDATE(), '11:30:00', 'Pendiente'),
(3, 3, CURDATE(), '13:00:00', 'Pendiente');

-- --------------------------------------------------------
-- 7. TABLA: cita_detalle
-- --------------------------------------------------------
DROP TABLE IF EXISTS `cita_detalle`;
CREATE TABLE `cita_detalle` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cita_id` INT NOT NULL,
  `servicio_id` INT NOT NULL,
  `precio_cobrado` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`cita_id`) REFERENCES `citas`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`servicio_id`) REFERENCES `servicios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. TABLA: pedidos (Tienda)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `pedidos`;
CREATE TABLE `pedidos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cliente_id` INT NOT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `estado` ENUM('Pendiente', 'Preparando', 'Entregado', 'Cancelado') DEFAULT 'Pendiente',
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `pedidos` (`cliente_id`, `total`, `estado`) VALUES
(1, 40000.00, 'Pendiente'),
(2, 15000.00, 'Entregado');

-- --------------------------------------------------------
-- 9. TABLA: pedido_detalle (Tienda)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `pedido_detalle`;
CREATE TABLE `pedido_detalle` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pedido_id` INT NOT NULL,
  `producto_id` INT NOT NULL,
  `cantidad` INT NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `pedido_detalle` (`pedido_id`, `producto_id`, `cantidad`, `precio_unitario`) VALUES
(1, 1, 1, 25000.00), -- 1 Creed Aventus
(1, 3, 1, 15000.00), -- 1 Gorra
(2, 3, 1, 15000.00); -- 1 Gorra

-- --------------------------------------------------------
-- 10. TABLA: cierres_diarios
-- --------------------------------------------------------
DROP TABLE IF EXISTS `cierres_diarios`;
CREATE TABLE `cierres_diarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fecha` DATE NOT NULL,
  `porcentaje_barbero` DECIMAL(5,2) NOT NULL DEFAULT 60.00,
  `porcentaje_tienda` DECIMAL(5,2) NOT NULL DEFAULT 40.00,
  `total_ingresos` DECIMAL(10,2) DEFAULT 0.00,
  `total_barberos` DECIMAL(10,2) DEFAULT 0.00,
  `total_tienda` DECIMAL(10,2) DEFAULT 0.00,
  `cerrado_por_admin` BOOLEAN DEFAULT FALSE,
  `fecha_cierre` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
