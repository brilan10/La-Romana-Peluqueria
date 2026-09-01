-- 1. Tabla Clientes
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rut VARCHAR(12) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    telefono VARCHAR(20),
    foto_perfil VARCHAR(255),
    cortes_acumulados INT DEFAULT 0,
    decants_disponibles INT DEFAULT 0,
    notas_crm TEXT DEFAULT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla Trabajadores (Barberos)
CREATE TABLE trabajadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    foto_perfil VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla Servicios
CREATE TABLE servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    es_corte BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE
);

-- 4. Tabla Citas
CREATE TABLE citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    trabajador_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado ENUM('Pendiente', 'Terminado_Esperando_Pago', 'Completada', 'Cancelada') DEFAULT 'Pendiente',
    descuento DECIMAL(10,2) DEFAULT 0.00,
    metodo_pago ENUM('Efectivo', 'Transferencia', 'Tarjeta', 'Otro') DEFAULT NULL,
    decant_entregado VARCHAR(100) DEFAULT NULL, -- Aroma si se entregó premio
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE CASCADE
);

-- 5. Tabla Detalles de Cita (Servicios realizados por cita)
CREATE TABLE cita_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cita_id INT NOT NULL,
    servicio_id INT NOT NULL,
    precio_cobrado DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
);

-- 6. Tabla Historial de Recompensas (Inventario histórico)
CREATE TABLE historial_recompensas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    cita_id INT NOT NULL,
    aroma_decant VARCHAR(100) NOT NULL,
    fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE
);

-- 7. Tabla Cierres Diarios
CREATE TABLE cierres_diarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    porcentaje_barbero DECIMAL(5,2) NOT NULL DEFAULT 60.00,
    porcentaje_tienda DECIMAL(5,2) NOT NULL DEFAULT 40.00,
    total_ingresos DECIMAL(10,2) DEFAULT 0.00,
    total_barberos DECIMAL(10,2) DEFAULT 0.00,
    total_tienda DECIMAL(10,2) DEFAULT 0.00,
    cerrado_por_admin BOOLEAN DEFAULT FALSE,
    fecha_cierre TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
