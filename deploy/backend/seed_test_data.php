<?php
require 'db.php';

try {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    
    // Preparar esquema
    try { $pdo->exec("ALTER TABLE trabajadores ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL;"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE citas ADD COLUMN total_pagado INT DEFAULT 0;"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE citas ADD COLUMN decant_entregado VARCHAR(150) DEFAULT NULL;"); } catch(Exception $e) {}
    try { $pdo->exec("ALTER TABLE citas MODIFY COLUMN estado ENUM('Pendiente', 'Terminado_Esperando_Pago', 'Completada', 'Cancelada') DEFAULT 'Pendiente';"); } catch(Exception $e) {}

    // Asegurar tabla historial_recompensas
    $pdo->exec("CREATE TABLE IF NOT EXISTS historial_recompensas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT NOT NULL,
        cita_id INT NOT NULL,
        aroma_decant VARCHAR(150),
        fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
        FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Vaciar
    $pdo->exec("TRUNCATE TABLE citas;");
    $pdo->exec("TRUNCATE TABLE cita_detalle;");
    $pdo->exec("TRUNCATE TABLE pedidos;");
    $pdo->exec("TRUNCATE TABLE productos;");
    $pdo->exec("TRUNCATE TABLE categorias;");
    $pdo->exec("TRUNCATE TABLE clientes;");
    $pdo->exec("TRUNCATE TABLE trabajadores;");
    $pdo->exec("TRUNCATE TABLE historial_recompensas;");
    $pdo->exec("TRUNCATE TABLE cierres_diarios;");
    $pdo->exec("TRUNCATE TABLE servicios;");
    
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // Servicios
    $pdo->exec("INSERT INTO servicios (nombre, descripcion, precio, es_corte, activo) VALUES 
        ('Corte Clásico', 'Corte de cabello tradicional', 12000, 1, 1),
        ('Corte Degradado', 'Corte fade', 14000, 1, 1),
        ('Corte y Barba', 'Pack completo', 20000, 1, 1),
        ('Corte de Barba', 'Solo barba', 8000, 0, 1)
    ");
    $servicios = $pdo->query("SELECT * FROM servicios WHERE es_corte = 1")->fetchAll();

    // Categorias
    $pdo->exec("INSERT INTO categorias (nombre) VALUES ('Capilares'), ('Perfumes'), ('Gorras')");
    $catCap = $pdo->lastInsertId();
    $catPerf = $pdo->lastInsertId() + 1; // Auto increment offset
    $catGorra = $pdo->lastInsertId() + 2;

    // Productos
    $pdo->exec("INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, categoria_id) VALUES 
        ('Gorra Azul', 'Gorra urbana azul', 25000, 20, '/assets/fotos/gorras/Gorra azul.jpg', $catGorra),
        ('Gorra Roja', 'Gorra roja premium', 25000, 20, '/assets/fotos/gorras/Gorra roja.webp', $catGorra),
        ('Decant Creed Aventus', 'Perfume nicho', 20000, 500, '/assets/fotos/perfume/decant.png', $catPerf),
        ('Perfume Dior', 'Eau de parfum', 120000, 10, '/assets/fotos/perfume/perfume2.jpg', $catPerf),
        ('Perfume Bleu', 'Clasico de chanel', 110000, 5, '/assets/fotos/perfume/Perfume1.webp', $catPerf)
    ");
    $decantId = $pdo->query("SELECT id FROM productos WHERE nombre LIKE '%Decant%' LIMIT 1")->fetchColumn();

    // Trabajadores (con pass 123456)
    $hash = password_hash('123456', PASSWORD_DEFAULT);
    $pdo->prepare("INSERT INTO trabajadores (nombre, email, password_hash, foto_perfil) VALUES 
        ('Peluquero 1', 'peluquero1@laromana.cl', ?, '/assets/fotos/Peersonal/Peluquero 1.jpg'),
        ('Peluquero 2', 'peluquero2@laromana.cl', ?, '/assets/fotos/Peersonal/Peelukero2.jpg'),
        ('Peluquero 3', 'peluquero3@laromana.cl', ?, '/assets/fotos/Peersonal/Peluukero3.jpg')
    ")->execute([$hash, $hash, $hash]);

    // Clientes
    $nombres_clientes = ["Matias Torres", "Juan Perez", "Sebastian Silva", "Nicolas Rios", "Cristobal Vega", "Ignacio Soto", "Tomas Castro", "Felipe Guzman", "Diego Rojas", "Martin Gomez"];
    foreach ($nombres_clientes as $i => $n) {
        $rut = "1111111" . $i . "-9";
        $email = "cliente$i@email.com";
        $pdo->exec("INSERT INTO clientes (rut, nombre, email, telefono, cortes_acumulados, decants_disponibles) VALUES ('$rut', '$n', '$email', '+5691122334$i', 0, 0)");
    }

    $clientesIds = $pdo->query("SELECT id FROM clientes")->fetchAll(PDO::FETCH_COLUMN);
    $trabajadoresIds = $pdo->query("SELECT id FROM trabajadores")->fetchAll(PDO::FETCH_COLUMN);
    $metodos = ['Efectivo', 'Transferencia', 'Tarjeta'];

    // Simular dias desde Marzo a hoy
    $fecha_inicio = new DateTime('2026-03-01');
    $fecha_fin = new DateTime(date('Y-m-d')); // HOY
    $interval = new DateInterval('P1D');
    $daterange = new DatePeriod($fecha_inicio, $interval, $fecha_fin->modify('+1 day'));

    foreach ($daterange as $date) {
        $fecha_str = $date->format('Y-m-d');
        $es_hoy = ($fecha_str === date('Y-m-d'));
        
        // Cierre diario config
        $pdo->exec("INSERT INTO cierres_diarios (fecha, porcentaje_barbero, porcentaje_tienda) VALUES ('$fecha_str', 60, 40)");

        // 3-6 citas por dia
        $citas_dia = rand(3, 6);
        for ($i=0; $i<$citas_dia; $i++) {
            $cliente_id = $clientesIds[array_rand($clientesIds)];
            $trabajador_id = $trabajadoresIds[array_rand($trabajadoresIds)];
            $hora = sprintf("%02d:00:00", rand(10, 19));
            $metodo = $metodos[array_rand($metodos)];
            $servicio = $servicios[array_rand($servicios)];
            
            $estado = 'Completada';
            if ($es_hoy && rand(0,1) === 0) {
                $estado = 'Pendiente';
            }
            if ($es_hoy && rand(0,2) === 1) {
                $estado = 'Terminado_Esperando_Pago';
            }

            // Insertar cita
            $stmt = $pdo->prepare("INSERT INTO citas (cliente_id, trabajador_id, fecha, hora, estado, metodo_pago, total_pagado) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$cliente_id, $trabajador_id, $fecha_str, $hora, $estado, $estado=='Completada'?$metodo:null, $estado=='Completada'?$servicio['precio']:0]);
            $cita_id = $pdo->lastInsertId();

            // Insertar detalle cita
            $pdo->exec("INSERT INTO cita_detalle (cita_id, servicio_id, precio_cobrado) VALUES ($cita_id, {$servicio['id']}, {$servicio['precio']})");

            // Lógica de recompensas solo para citas pasadas o completadas
            if ($estado === 'Completada') {
                $cli = $pdo->query("SELECT cortes_acumulados FROM clientes WHERE id = $cliente_id")->fetch(PDO::FETCH_ASSOC);
                $cortes = $cli['cortes_acumulados'] + 1;
                
                $haRecibidoPremio = $pdo->query("SELECT COUNT(*) FROM historial_recompensas WHERE cliente_id = $cliente_id")->fetchColumn() > 0;
                $meta = $haRecibidoPremio ? 4 : 2;
                
                if ($cortes == $meta) {
                    // Dar premio
                    $aroma = "Creed Aventus"; // Decant default
                    $pdo->exec("INSERT INTO historial_recompensas (cliente_id, cita_id, aroma_decant, fecha_entrega) VALUES ($cliente_id, $cita_id, '$aroma', '$fecha_str 12:00:00')");
                    $pdo->exec("UPDATE citas SET decant_entregado = '$aroma' WHERE id = $cita_id");
                    $pdo->exec("UPDATE clientes SET cortes_acumulados = 0 WHERE id = $cliente_id");
                    $pdo->exec("UPDATE productos SET stock = stock - 1 WHERE id = $decantId");
                } else {
                    $pdo->exec("UPDATE clientes SET cortes_acumulados = $cortes WHERE id = $cliente_id");
                }
            }
        }
    }

    echo json_encode(["status" => "success", "message" => "Base de datos poblada masivamente con éxito desde Marzo hasta HOY."]);

} catch (Exception $e) {
    echo json_encode(["error" => "Error poblando BD: " . $e->getMessage()]);
}
?>
