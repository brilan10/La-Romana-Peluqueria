<?php
// seed_month.php - Pobla datos completos del mes actual y reciente para La Romana
require_once 'db.php';

try {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

    // Limpiar tablas para poblar todo consistente
    $pdo->exec("TRUNCATE TABLE pagos_trabajadores;");
    $pdo->exec("TRUNCATE TABLE pedido_detalle;");
    $pdo->exec("TRUNCATE TABLE pedidos;");
    $pdo->exec("TRUNCATE TABLE cita_detalle;");
    $pdo->exec("TRUNCATE TABLE historial_recompensas;");
    $pdo->exec("TRUNCATE TABLE citas;");
    $pdo->exec("TRUNCATE TABLE cierres_diarios;");
    $pdo->exec("TRUNCATE TABLE productos;");
    $pdo->exec("TRUNCATE TABLE categorias;");
    $pdo->exec("TRUNCATE TABLE servicios;");
    $pdo->exec("TRUNCATE TABLE trabajadores;");
    $pdo->exec("TRUNCATE TABLE clientes;");
    $pdo->exec("TRUNCATE TABLE administradores;");

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 1. Administrador (admin@laromana.cl / admin123)
    $hashAdmin = password_hash('admin123', PASSWORD_DEFAULT);
    $stmtAdmin = $pdo->prepare("INSERT INTO administradores (nombre, email, password_hash) VALUES (?, ?, ?)");
    $stmtAdmin->execute(['Dueño Administrador', 'admin@laromana.cl', $hashAdmin]);

    // 2. Barberos / Trabajadores (Password: 123456)
    $hashStaff = password_hash('123456', PASSWORD_DEFAULT);
    $barberos = [
        ['Carlos (Master)', 'carlos@laromana.cl', '/assets/fotos/Peersonal/Peluquero 1.jpg'],
        ['Luis (Senior)', 'luis@laromana.cl', '/assets/fotos/Peersonal/Peelukero2.jpg'],
        ['Pedro (Junior)', 'pedro@laromana.cl', '/assets/fotos/Peersonal/Peluukero3.jpg']
    ];
    $trabajadores_ids = [];
    foreach ($barberos as $b) {
        $stmt = $pdo->prepare("INSERT INTO trabajadores (nombre, email, foto_perfil, password_hash, activo) VALUES (?, ?, ?, ?, 1)");
        $stmt->execute([$b[0], $b[1], $b[2], $hashStaff]);
        $trabajadores_ids[] = $pdo->lastInsertId();
    }

    // 3. Categorías de Tienda
    $pdo->exec("INSERT INTO categorias (id, nombre) VALUES 
        (1, 'Capilares'),
        (2, 'Perfumes y Decants'),
        (3, 'Gorras y Accesorios')");

    // 4. Productos de Tienda
    $productos = [
        [1, 'Pomada Fijación Extra Fuerte', 'Acabado mate, fijación 24h, base agua', 12000.00, 35, null, 42],
        [1, 'Shampoo Anticaída La Romana', 'Nutrición con biotina y romero 300ml', 14000.00, 20, null, 28],
        [1, 'Cera Modeladora Texturizante', 'Brillo natural y textura ligera', 10000.00, 25, null, 19],
        [2, 'Decant Creed Aventus (10ml)', 'Perfume nicho exclusivo notas cítricas y ahumadas', 20000.00, 48, '/assets/fotos/perfume/decant.png', 65],
        [2, 'Decant Tom Ford Oud Wood (10ml)', 'Aroma amaderado refinado de lujo', 22000.00, 30, '/assets/fotos/perfume/decant.png', 38],
        [2, 'Perfume Dior Sauvage (100ml)', 'Eau de Parfum original de alta duración', 120000.00, 8, '/assets/fotos/perfume/perfume2.jpg', 12],
        [2, 'Perfume Bleu de Chanel (100ml)', 'Sofisticación masculina amaderada aromática', 110000.00, 6, '/assets/fotos/perfume/Perfume1.webp', 9],
        [3, 'Gorra Azul La Romana', 'Gorra urbana azul con logo bordado dorado', 25000.00, 24, '/assets/fotos/gorras/Gorra azul.jpg', 22],
        [3, 'Gorra Roja Premium', 'Gorra snapback roja con detalles negros', 25000.00, 18, '/assets/fotos/gorras/Gorra roja.webp', 15],
        [3, 'Gorra Trucker Black Edition', 'Malla trasera transpirable edición especial', 18000.00, 30, '/assets/fotos/gorras/gorra_trucker.png', 31]
    ];
    $stmtProd = $pdo->prepare("INSERT INTO productos (categoria_id, nombre, descripcion, precio, stock, imagen_url, ventas) VALUES (?, ?, ?, ?, ?, ?, ?)");
    foreach ($productos as $p) {
        $stmtProd->execute($p);
    }
    $allProductos = $pdo->query("SELECT id, precio, nombre FROM productos")->fetchAll(PDO::FETCH_ASSOC);

    // 5. Servicios de Barbería
    $servicios = [
        ['Corte Clásico', 'Corte de cabello tradicional con lavado y peinado', 12000.00, 1, 1],
        ['Corte Degradado', 'Corte fade pulido a navaja y peinado profesional', 14000.00, 1, 1],
        ['Corte y Barba Completa', 'Pack completo de corte de cabello y arreglo de barba con toalla caliente', 20000.00, 1, 1],
        ['Perfilado de Barba', 'Diseño de barba a navaja y tratamiento de aceites', 8000.00, 0, 1],
        ['Black Mask & Limpieza Facial', 'Mascarilla purificante y toalla caliente', 6000.00, 0, 1]
    ];
    $stmtServ = $pdo->prepare("INSERT INTO servicios (nombre, descripcion, precio, es_corte, activo) VALUES (?, ?, ?, ?, ?)");
    foreach ($servicios as $s) {
        $stmtServ->execute($s);
    }
    $allServicios = $pdo->query("SELECT id, precio, es_corte FROM servicios")->fetchAll(PDO::FETCH_ASSOC);

    // 6. Clientes con RUTs chilenos (Password: 123456)
    $hashClient = password_hash('123456', PASSWORD_DEFAULT);
    $clientes = [
        ['12345678-9', 'Cliente Prueba', 'cliente@email.com', '+56900000000', 3, 'Cliente frecuente, prefiere degradado bajo con navaja.'],
        ['19123456-7', 'Juan Pérez', 'juan.perez@email.com', '+56911111111', 1, 'Puntual, toma café en cada visita.'],
        ['18765432-1', 'Carlos Silva', 'carlos.silva@email.com', '+56922222222', 4, 'Cliente VIP. Le gusta Creed Aventus.'],
        ['20555666-8', 'Miguel Rojas', 'miguel.rojo@email.com', '+56933333333', 2, 'Prefiere toalla tibia antes del afeitado.'],
        ['17444333-2', 'Felipe Soto', 'felipe.soto@email.com', '+56944444444', 3, 'Atiende los fines de semana con Carlos.'],
        ['16888999-5', 'Andrés Castro', 'andres.castro@email.com', '+56955555555', 1, 'Tratamiento capilar regular.'],
        ['15777888-K', 'Matías Silva', 'matias.silva@email.com', '+56966666666', 2, 'Cliente fiel.'],
        ['21222333-4', 'Ignacio Vega', 'ignacio.vega@email.com', '+56977777777', 1, 'Estudiante universitario.'],
        ['19888777-6', 'Bastián Morales', 'bastian.morales@email.com', '+56988888888', 4, 'Cliente VIP. Fanático de las gorras snapback.'],
        ['18333222-1', 'Tomás Riquelme', 'tomas.riquelme@email.com', '+56999999999', 2, 'Corte clásico tijera.']
    ];
    $stmtCli = $pdo->prepare("INSERT INTO clientes (rut, nombre, email, telefono, cortes_acumulados, notas_crm, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $clientes_ids = [];
    foreach ($clientes as $c) {
        $stmtCli->execute([$c[0], $c[1], $c[2], $c[3], $c[4], $c[5], $hashClient]);
        $clientes_ids[] = $pdo->lastInsertId();
    }

    // 7. Simular Actividad para Agosto 2026 y Septiembre 2026
    $metodos = ['Efectivo', 'Tarjeta', 'Transferencia'];
    $horas = ['10:00:00', '11:00:00', '12:00:00', '13:00:00', '15:00:00', '16:00:00', '17:00:00', '18:00:00', '19:00:00'];
    $hoy = date('Y-m-d'); // 2026-09-01

    // Generar rango desde hace 35 días hasta los próximos 7 días
    $fechaInicioSim = date('Y-m-d', strtotime('-35 days'));
    $fechaFinSim = date('Y-m-d', strtotime('+7 days'));

    $periodoCursor = new DateTime($fechaInicioSim);
    $periodoFin = new DateTime($fechaFinSim);

    while ($periodoCursor <= $periodoFin) {
        $fecha = $periodoCursor->format('Y-m-d');
        $esPasado = ($fecha < $hoy);
        $esHoy = ($fecha === $hoy);
        $esFuturo = ($fecha > $hoy);

        $totalIngresosDia = 0;

        if ($esPasado || $esHoy) {
            // Generar entre 4 y 8 citas por día
            $numCitas = $esHoy ? 6 : rand(4, 8);
            for ($k = 0; $k < $numCitas; $k++) {
                $cliente_id = $clientes_ids[array_rand($clientes_ids)];
                $trabajador_id = $trabajadores_ids[array_rand($trabajadores_ids)];
                $hora = $horas[$k % count($horas)];
                $metodo = $metodos[array_rand($metodos)];

                $estado = 'Completada';
                if ($esHoy) {
                    if ($k === 0 || $k === 1) $estado = 'Completada';
                    elseif ($k === 2) $estado = 'Terminado_Esperando_Pago';
                    else $estado = 'Pendiente';
                }

                $serv1 = $allServicios[array_rand($allServicios)];
                $subtotal = $serv1['precio'];

                $insCita = $pdo->prepare("INSERT INTO citas (cliente_id, trabajador_id, fecha, hora, estado, metodo_pago, total_pagado, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $pagado = ($estado === 'Completada') ? $subtotal : 0;
                $mPago = ($estado === 'Completada') ? $metodo : null;
                $insCita->execute([$cliente_id, $trabajador_id, $fecha, $hora, $estado, $mPago, $pagado, "$fecha $hora"]);
                $citaId = $pdo->lastInsertId();

                $pdo->prepare("INSERT INTO cita_detalle (cita_id, servicio_id, precio_cobrado) VALUES (?, ?, ?)")
                    ->execute([$citaId, $serv1['id'], $serv1['precio']]);

                if ($estado === 'Completada') {
                    $totalIngresosDia += $subtotal;

                    // Recompensa decant ocasional
                    if (rand(1, 10) <= 2) {
                        $aroma = "Decant Creed Aventus (10ml)";
                        $pdo->prepare("INSERT INTO historial_recompensas (cliente_id, cita_id, aroma_decant, fecha_entrega) VALUES (?, ?, ?, ?)")
                            ->execute([$cliente_id, $citaId, $aroma, "$fecha $hora"]);
                        $pdo->prepare("UPDATE citas SET decant_entregado = ? WHERE id = ?")->execute([$aroma, $citaId]);
                    }
                }
            }

            // Generar entre 2 y 5 pedidos de tienda por día
            $numPedidos = $esHoy ? 3 : rand(2, 5);
            for ($p = 0; $p < $numPedidos; $p++) {
                $cliente_id = $clientes_ids[array_rand($clientes_ids)];
                $prod = $allProductos[array_rand($allProductos)];
                $cant = rand(1, 2);
                $totalPed = $prod['precio'] * $cant;
                
                $estadoPed = 'Entregado';
                if ($esHoy) {
                    $estadoPed = ($p === 0) ? 'Entregado' : (($p === 1) ? 'Preparando' : 'Pendiente');
                }

                $insPed = $pdo->prepare("INSERT INTO pedidos (cliente_id, total, estado, fecha_creacion) VALUES (?, ?, ?, ?)");
                $horaPed = $horas[array_rand($horas)];
                $insPed->execute([$cliente_id, $totalPed, $estadoPed, "$fecha $horaPed"]);
                $pedId = $pdo->lastInsertId();

                $pdo->prepare("INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)")
                    ->execute([$pedId, $prod['id'], $cant, $prod['precio']]);

                if ($estadoPed === 'Entregado' || $estadoPed === 'Pagado') {
                    $totalIngresosDia += $totalPed;
                }
            }

            // Registrar Cierre Diario
            $pctB = 60.00;
            $pctT = 40.00;
            $totB = $totalIngresosDia * 0.60;
            $totT = $totalIngresosDia * 0.40;
            $cerrado = $esHoy ? 0 : 1;
            $efectivoIni = 40000.00;

            $insCierre = $pdo->prepare("INSERT INTO cierres_diarios (fecha, efectivo_inicial, porcentaje_barbero, porcentaje_tienda, total_ingresos, total_barberos, total_tienda, cerrado_por_admin, fecha_cierre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $insCierre->execute([$fecha, $efectivoIni, $pctB, $pctT, $totalIngresosDia, $totB, $totT, $cerrado, "$fecha 20:00:00"]);

        } else {
            // Días futuros: 3 a 5 citas pendientes agendadas
            $numCitasFuturas = rand(3, 5);
            for ($f = 0; $f < $numCitasFuturas; $f++) {
                $cliente_id = $clientes_ids[array_rand($clientes_ids)];
                $trabajador_id = $trabajadores_ids[array_rand($trabajadores_ids)];
                $hora = $horas[$f % count($horas)];
                $serv = $allServicios[array_rand($allServicios)];

                $insCita = $pdo->prepare("INSERT INTO citas (cliente_id, trabajador_id, fecha, hora, estado, fecha_creacion) VALUES (?, ?, ?, ?, 'Pendiente', NOW())");
                $insCita->execute([$cliente_id, $trabajador_id, $fecha, $hora]);
                $citaId = $pdo->lastInsertId();

                $pdo->prepare("INSERT INTO cita_detalle (cita_id, servicio_id, precio_cobrado) VALUES (?, ?, ?)")
                    ->execute([$citaId, $serv['id'], $serv['precio']]);
            }
        }

        $periodoCursor->modify('+1 day');
    }

    // 8. Poblar Pagos Históricos a Trabajadores (Liquidaciones pagadas)
    // Mes anterior (Agosto 2026) - Liquidación completa pagada a los 3 barberos
    $stmtPago = $pdo->prepare("
        INSERT INTO pagos_trabajadores 
        (trabajador_id, periodo_inicio, periodo_fin, monto, fecha_pago, metodo_pago, numero_comprobante, notas) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    // Pagos de Agosto
    $stmtPago->execute([1, '2026-08-01', '2026-08-31', 485000.00, '2026-08-31', 'Transferencia', 'TRX-BCO-88129', 'Liquidación mensual de Agosto pagada por transferencia Banco de Chile']);
    $stmtPago->execute([2, '2026-08-01', '2026-08-31', 412000.00, '2026-08-31', 'Transferencia', 'TRX-BCO-88130', 'Liquidación Agosto completa transferencia Santander']);
    $stmtPago->execute([3, '2026-08-01', '2026-08-31', 290000.00, '2026-08-31', 'Efectivo', 'RECIBO-042', 'Liquidación Agosto pagada en efectivo']);

    // Pagos Semana anterior
    $semanaPasadaIni = date('Y-m-d', strtotime('monday last week'));
    $semanaPasadaFin = date('Y-m-d', strtotime('sunday last week'));
    $stmtPago->execute([1, $semanaPasadaIni, $semanaPasadaFin, 115000.00, date('Y-m-d', strtotime('last sunday')), 'Transferencia', 'TRX-SEM-401', 'Pago semanal comisiones']);

    echo "Base de datos poblada exitosamente con datos completos para este mes y pagos históricos.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
