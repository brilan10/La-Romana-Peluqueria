<?php
require 'db.php';

try {
    // 1. Trabajadores (Barberos)
    $barberos = ['Carlos (Master)', 'Luis (Senior)', 'Pedro (Junior)'];
    foreach ($barberos as $b) {
        $stmt = $pdo->prepare("SELECT id FROM trabajadores WHERE nombre = ?");
        $stmt->execute([$b]);
        if (!$stmt->fetch()) {
            $ins = $pdo->prepare("INSERT INTO trabajadores (nombre, email, password_hash) VALUES (?, ?, ?)");
            $ins->execute([$b, strtolower(explode(' ', $b)[0]) . '@laromana.cl', password_hash('123456', PASSWORD_DEFAULT)]);
        }
    }
    
    // Obtener IDs de barberos
    $stmt = $pdo->query("SELECT id FROM trabajadores");
    $trabajadores_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // 2. Servicios
    $servicios_data = [
        ['Corte Clásico', 10000, 1],
        ['Corte + Barba', 15000, 1],
        ['Perfilado de Barba', 6000, 0],
        ['Diseño / Líneas', 4000, 0],
        ['Black Mask', 5000, 0]
    ];
    foreach ($servicios_data as $s) {
        $stmt = $pdo->prepare("SELECT id FROM servicios WHERE nombre = ?");
        $stmt->execute([$s[0]]);
        if (!$stmt->fetch()) {
            $ins = $pdo->prepare("INSERT INTO servicios (nombre, precio, es_corte) VALUES (?, ?, ?)");
            $ins->execute([$s[0], $s[1], $s[2]]);
        }
    }

    // Obtener IDs de servicios y sus precios
    $stmt = $pdo->query("SELECT id, precio, es_corte FROM servicios");
    $servicios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Clientes
    $nombres = ['Juan Pérez', 'Diego Muñoz', 'Miguel Rojas', 'Felipe Soto', 'Andrés Castro', 'Matías Silva', 'Ignacio Vega', 'Bastián Morales', 'Camilo Herrera', 'Tomás Riquelme'];
    foreach ($nombres as $i => $n) {
        $rut = (10000000 + $i * 123456) . '-' . rand(0, 9);
        $stmt = $pdo->prepare("SELECT id FROM clientes WHERE rut = ?");
        $stmt->execute([$rut]);
        if (!$stmt->fetch()) {
            $ins = $pdo->prepare("INSERT INTO clientes (rut, nombre, email, telefono, password_hash) VALUES (?, ?, ?, ?, ?)");
            $ins->execute([$rut, $n, "cliente$i" . rand(1000, 9999) . "@email.com", '+569' . rand(11111111, 99999999), password_hash('123456', PASSWORD_DEFAULT)]);
        }
    }

    // Obtener IDs de clientes
    $stmt = $pdo->query("SELECT id FROM clientes");
    $clientes_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // 4. Generar Citas (Junio, Julio, Agosto 2026)
    $startDate = strtotime('2026-06-01');
    $endDate = strtotime('2026-08-31');
    $now = time();

    $estados_pasados = ['Completada', 'Completada', 'Completada', 'Cancelada'];
    $horas = ['10:00:00', '11:00:00', '12:00:00', '14:00:00', '15:00:00', '16:00:00', '17:00:00', '18:00:00'];

    for ($i = 0; $i < 200; $i++) {
        $timestamp = rand($startDate, $endDate);
        $fecha = date('Y-m-d', $timestamp);
        $hora = $horas[array_rand($horas)];
        $cliente_id = $clientes_ids[array_rand($clientes_ids)];
        $trabajador_id = $trabajadores_ids[array_rand($trabajadores_ids)];
        
        // Evitar duplicados exactos (misma fecha, hora y barbero)
        $check = $pdo->prepare("SELECT id FROM citas WHERE trabajador_id = ? AND fecha = ? AND hora = ?");
        $check->execute([$trabajador_id, $fecha, $hora]);
        if ($check->fetch()) continue;

        if ($timestamp < $now) {
            $estado = $estados_pasados[array_rand($estados_pasados)];
        } else {
            // Futuras
            $estado = (rand(1,10) > 8) ? 'Cancelada' : 'Pendiente';
        }

        $insCita = $pdo->prepare("INSERT INTO citas (cliente_id, trabajador_id, fecha, hora, estado) VALUES (?, ?, ?, ?, ?)");
        $insCita->execute([$cliente_id, $trabajador_id, $fecha, $hora, $estado]);
        $citaId = $pdo->lastInsertId();

        // 1 a 3 servicios por cita
        $num_servicios = rand(1, 3);
        $servicios_cita = [];
        $cortes_sumados = 0;
        
        for ($j = 0; $j < $num_servicios; $j++) {
            $s = $servicios[array_rand($servicios)];
            if (!in_array($s['id'], $servicios_cita)) {
                $servicios_cita[] = $s['id'];
                $insDetalle = $pdo->prepare("INSERT INTO cita_detalle (cita_id, servicio_id, precio_cobrado) VALUES (?, ?, ?)");
                $insDetalle->execute([$citaId, $s['id'], $s['precio']]);
                
                if ($estado === 'Completada' && $s['es_corte']) {
                    $cortes_sumados++;
                }
            }
        }

        if ($cortes_sumados > 0) {
            $updCli = $pdo->prepare("UPDATE clientes SET cortes_acumulados = cortes_acumulados + ? WHERE id = ?");
            $updCli->execute([$cortes_sumados, $cliente_id]);
        }
    }

    // Datos garantizados para los ultimos 7 dias (incluyendo HOY) para ver los graficos
    for ($d = 0; $d <= 7; $d++) {
        $fecha = date('Y-m-d', strtotime("-$d days"));
        for ($k = 0; $k < rand(3, 8); $k++) {
            $hora = $horas[array_rand($horas)];
            $cliente_id = $clientes_ids[array_rand($clientes_ids)];
            $trabajador_id = $trabajadores_ids[array_rand($trabajadores_ids)];
            
            $insCita = $pdo->prepare("INSERT INTO citas (cliente_id, trabajador_id, fecha, hora, estado) VALUES (?, ?, ?, ?, 'Completada')");
            $insCita->execute([$cliente_id, $trabajador_id, $fecha, $hora]);
            $citaId = $pdo->lastInsertId();
            
            $s = $servicios[array_rand($servicios)];
            $insDetalle = $pdo->prepare("INSERT INTO cita_detalle (cita_id, servicio_id, precio_cobrado) VALUES (?, ?, ?)");
            $insDetalle->execute([$citaId, $s['id'], $s['precio']]);
        }
        // Tambien algunos pedidos para tienda
        for ($p = 0; $p < rand(1, 4); $p++) {
            $cliente_id = $clientes_ids[array_rand($clientes_ids)];
            $total = rand(15000, 45000);
            $fecha_crea = $fecha . ' ' . $horas[array_rand($horas)];
            $insP = $pdo->prepare("INSERT INTO pedidos (cliente_id, total, estado, fecha_creacion) VALUES (?, ?, 'Entregado', ?)");
            $insP->execute([$cliente_id, $total, $fecha_crea]);
        }
    }

    echo "Base de datos rellenada con exito con clientes, barberos, servicios y citas de junio a agosto.\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
