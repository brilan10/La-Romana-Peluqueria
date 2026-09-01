<?php
require 'db.php';

try {
    // 1. Limpiar tablas y Actualizar Esquema (Ignorando restricciones de llaves foráneas temporalmente)
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    
    // Actualizar esquema de citas para soportar RF04 y Métricas
    $pdo->exec("ALTER TABLE citas MODIFY COLUMN estado ENUM('Pendiente', 'Completada', 'Cancelada', 'Cerrada') DEFAULT 'Pendiente';");
    
    // Check si existe total_pagado, sino añadirlo
    try {
        $pdo->exec("ALTER TABLE citas ADD COLUMN total_pagado INT DEFAULT 0;");
    } catch (Exception $e) {} // Ignorar si ya existe
    
    // Check si existe decant_entregado, sino añadirlo
    try {
        $pdo->exec("ALTER TABLE citas ADD COLUMN decant_entregado VARCHAR(150) DEFAULT NULL;");
    } catch (Exception $e) {} // Ignorar si ya existe

    $pdo->exec("TRUNCATE TABLE citas;");
    $pdo->exec("TRUNCATE TABLE pedidos;");
    $pdo->exec("TRUNCATE TABLE productos;");
    $pdo->exec("TRUNCATE TABLE categorias;");
    $pdo->exec("TRUNCATE TABLE clientes;");
    $pdo->exec("TRUNCATE TABLE trabajadores;");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 2. Crear Categorías
    $pdo->exec("INSERT INTO categorias (nombre) VALUES ('Capilares'), ('Perfumes'), ('Gorras')");
    $catCapilares = $pdo->lastInsertId();
    $catPerfumes = $pdo->lastInsertId() - 1; // Simplificado

    // 3. Crear Productos
    $pdo->exec("INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, categoria_id) VALUES 
        ('Cera Mate Reuzel', 'Cera de fijación fuerte', 15000, 10, 'https://images.unsplash.com/photo-1599687351724-dfa3c4ff81b1?w=500', 1),
        ('Minoxidil Kirkland 5%', 'Tratamiento barba', 12000, 5, 'https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?w=500', 1),
        ('Decant Creed Aventus 10ml', 'Perfume nicho', 25000, 3, 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=500', 2)
    ");

    // 4. Crear Trabajadores
    $pdo->exec("INSERT INTO trabajadores (nombre, email, foto_perfil) VALUES 
        ('Alejandro (Barbero Senior)', 'ale@laromana.cl', 'https://i.pravatar.cc/150?u=ale'),
        ('Sebastián (Estilista)', 'seba@laromana.cl', 'https://i.pravatar.cc/150?u=seba')
    ");
    
    // 5. Crear Clientes (Diferentes estados para el CRM)
    $hoy = date('Y-m-d');
    $haceUnMes = date('Y-m-d', strtotime('-40 days'));
    $pdo->exec("INSERT INTO clientes (email, nombre, google_id, telefono, foto_perfil) VALUES 
        ('brilan@test.com', 'Brilan M.', 'g1', '+56912345678', 'https://i.pravatar.cc/150?u=brilan'),
        ('carlos@test.com', 'Carlos Ruiz', 'g2', '+56987654321', 'https://i.pravatar.cc/150?u=carlos'),
        ('andres@test.com', 'Andrés Tapia (Riesgo)', 'g3', '+56911223344', 'https://i.pravatar.cc/150?u=andres')
    ");

    // 6. Generar Citas (Algunas antiguas para historial, otras para hoy)
    // Citas antiguas para Andrés (Hace 40 días)
    $pdo->exec("INSERT INTO citas (cliente_id, trabajador_id, fecha, hora, estado, total_pagado) VALUES (3, 1, '$haceUnMes', '10:00:00', 'Completada', 14000)");

    // Citas antiguas para Brilan (Lleva 3, está a punto de ser VIP hoy)
    $pdo->exec("INSERT INTO citas (cliente_id, trabajador_id, fecha, hora, estado, total_pagado) VALUES (1, 1, '2026-06-01', '12:00:00', 'Completada', 14000)");
    $pdo->exec("INSERT INTO citas (cliente_id, trabajador_id, fecha, hora, estado, total_pagado) VALUES (1, 1, '2026-06-15', '12:00:00', 'Completada', 14000)");
    $pdo->exec("INSERT INTO citas (cliente_id, trabajador_id, fecha, hora, estado, total_pagado) VALUES (1, 1, '2026-07-01', '12:00:00', 'Completada', 14000)");
    
    // Citas para HOY (Para el Dashboard y POS)
    // Cerradas hoy en la mañana (Suman ingresos)
    $pdo->exec("INSERT INTO citas (cliente_id, trabajador_id, fecha, hora, estado, total_pagado) VALUES (2, 2, '$hoy', '09:00:00', 'Completada', 20000)");
    $pdo->exec("INSERT INTO citas (cliente_id, trabajador_id, fecha, hora, estado, total_pagado) VALUES (3, 1, '$hoy', '10:30:00', 'Completada', 12000)");
    
    // Pendientes para hoy en la tarde (Para que aparezcan en POS)
    $pdo->exec("INSERT INTO citas (cliente_id, trabajador_id, fecha, hora, estado) VALUES (1, 1, '$hoy', '15:00:00', 'Pendiente')"); // Brilan, su 4ta cita
    $pdo->exec("INSERT INTO citas (cliente_id, trabajador_id, fecha, hora, estado) VALUES (2, 2, '$hoy', '16:00:00', 'Pendiente')");

    // 7. Generar Ventas de Tienda (Para HOY)
    $pdo->exec("INSERT INTO pedidos (cliente_id, total, estado, fecha_creacion) VALUES (2, 40000, 'Entregado', '$hoy 11:00:00')");
    $pdo->exec("INSERT INTO pedidos (cliente_id, total, estado, fecha_creacion) VALUES (1, 15000, 'Pendiente', '$hoy 12:30:00')");

    echo "Base de datos poblada con éxito con datos reales simulados.";
} catch (Exception $e) {
    echo "Error poblando BD: " . $e->getMessage();
}
?>
