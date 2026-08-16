<?php
require 'db.php';
$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    switch ($action) {
        // --- MÉTRICAS Y DASHBOARD ---
        case 'get_dashboard_metrics':
            $metrics = [
                'ingresos_totales' => 0,
                'citas_atendidas' => 0,
                'ventas_tienda' => 0,
                'total_pedidos' => 0,
                'decants_mes' => 0,
                'ingresos_mes' => 0,
                'top_barbero' => '-',
                'top_barbero_cortes' => 0,
                'top_cliente' => '-',
                'top_cliente_citas' => 0
            ];
            $hoy = $pdo->query("SELECT CURDATE()")->fetchColumn();
            $mes_actual = $pdo->query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-01')")->fetchColumn();

            // Citas Atendidas Hoy (Completadas)
            $stmtCitasHoy = $pdo->prepare("SELECT COUNT(*) FROM citas WHERE fecha = ? AND estado = 'Completada'");
            $stmtCitasHoy->execute([$hoy]);
            $metrics['citas_atendidas'] = $stmtCitasHoy->fetchColumn() ?: 0;

            // Ingresos Cortes Hoy (Total cobrado en cita_detalle)
            $stmtIngresosCortes = $pdo->prepare("
                SELECT SUM(cd.precio_cobrado) FROM cita_detalle cd 
                JOIN citas c ON cd.cita_id = c.id 
                WHERE c.fecha = ? AND c.estado = 'Completada'
            ");
            $stmtIngresosCortes->execute([$hoy]);
            $ingresos_cortes = $stmtIngresosCortes->fetchColumn() ?: 0;

            // Ventas Tienda Hoy
            $stmtVentas = $pdo->prepare("SELECT SUM(total), COUNT(*) FROM pedidos WHERE DATE(fecha_creacion) = ? AND estado = 'Entregado'");
            $stmtVentas->execute([$hoy]);
            $ventas = $stmtVentas->fetch(PDO::FETCH_NUM);
            $metrics['ventas_tienda'] = $ventas[0] ?: 0;
            $metrics['total_pedidos'] = $ventas[1] ?: 0;

            $metrics['ingresos_totales'] = $ingresos_cortes + $metrics['ventas_tienda'];

            // Ingresos del mes
            $stmtIngMes = $pdo->prepare("
                SELECT SUM(cd.precio_cobrado) FROM cita_detalle cd 
                JOIN citas c ON cd.cita_id = c.id 
                WHERE c.fecha >= ? AND c.estado = 'Completada'
            ");
            $stmtIngMes->execute([$mes_actual]);
            $ingresos_cortes_mes = $stmtIngMes->fetchColumn() ?: 0;

            $stmtVentasMes = $pdo->prepare("SELECT SUM(total) FROM pedidos WHERE fecha_creacion >= ? AND estado = 'Entregado'");
            $stmtVentasMes->execute([$mes_actual]);
            $ventas_mes = $stmtVentasMes->fetchColumn() ?: 0;

            $metrics['ingresos_mes'] = $ingresos_cortes_mes + $ventas_mes;

            // Top Barbero
            $stmtTopB = $pdo->prepare("
                SELECT t.nombre, COUNT(c.id) as cortes 
                FROM citas c JOIN trabajadores t ON c.trabajador_id = t.id 
                WHERE c.fecha >= ? AND c.estado = 'Completada' 
                GROUP BY t.id ORDER BY cortes DESC LIMIT 1
            ");
            $stmtTopB->execute([$mes_actual]);
            $topB = $stmtTopB->fetch();
            if ($topB) {
                $metrics['top_barbero'] = $topB['nombre'];
                $metrics['top_barbero_cortes'] = $topB['cortes'];
            }

            // Top Cliente
            $stmtTopC = $pdo->prepare("
                SELECT cl.nombre, COUNT(c.id) as citas 
                FROM citas c JOIN clientes cl ON c.cliente_id = cl.id 
                WHERE c.fecha >= ? AND c.estado = 'Completada' 
                GROUP BY cl.id ORDER BY citas DESC LIMIT 1
            ");
            $stmtTopC->execute([$mes_actual]);
            $topC = $stmtTopC->fetch();
            if ($topC) {
                $metrics['top_cliente'] = $topC['nombre'];
                $metrics['top_cliente_citas'] = $topC['citas'];
            }

            // Decants
            $stmtDecants = $pdo->prepare("SELECT COUNT(*) FROM citas WHERE fecha >= ? AND premio_entregado IS NOT NULL AND premio_entregado != ''");
            $stmtDecants->execute([$mes_actual]);
            $metrics['decants_mes'] = $stmtDecants->fetchColumn() ?: 0;

            echo json_encode($metrics);
            break;

        case 'get_chart_data':
            $data = [];
            for ($i = 0; $i < 7; $i++) {
                $fecha = date('Y-m-d', strtotime("-$i days"));
                
                $stmtC = $pdo->prepare("
                    SELECT SUM(cd.precio_cobrado) FROM cita_detalle cd 
                    JOIN citas c ON cd.cita_id = c.id 
                    WHERE c.fecha = ? AND c.estado = 'Completada'
                ");
                $stmtC->execute([$fecha]);
                $c = $stmtC->fetchColumn() ?: 0;

                $stmtP = $pdo->prepare("SELECT SUM(total) FROM pedidos WHERE DATE(fecha_creacion) = ? AND estado = 'Entregado'");
                $stmtP->execute([$fecha]);
                $p = $stmtP->fetchColumn() ?: 0;

                $data[] = [
                    'fecha' => date('d/m', strtotime($fecha)),
                    'total' => $c + $p
                ];
            }
            echo json_encode($data);
            break;

        case 'get_todas_citas':
            $start_date = $_GET['start_date'] ?? ($_GET['fecha'] ?? $pdo->query("SELECT CURDATE()")->fetchColumn());
            $end_date = $_GET['end_date'] ?? $start_date;
            
            $stmt = $pdo->prepare("
                SELECT c.id, c.fecha, c.hora, c.estado, cl.nombre as cliente, t.nombre as trabajador,
                (SELECT SUM(precio_cobrado) FROM cita_detalle cd WHERE cd.cita_id = c.id) as subtotal, cl.cortes_acumulados, c.descuento
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                JOIN trabajadores t ON c.trabajador_id = t.id
                WHERE c.fecha >= ? AND c.fecha <= ?
                ORDER BY c.fecha ASC, c.hora ASC
            ");
            $stmt->execute([$start_date, $end_date]);
            echo json_encode($stmt->fetchAll());
            break;

        case 'get_crm_clientes':
            $stmt = $pdo->query("
                SELECT cl.id, cl.nombre, cl.email, cl.telefono, cl.rut, cl.cortes_acumulados, cl.decants_disponibles, cl.notas_crm, cl.fecha_registro,
                (SELECT COUNT(*) FROM citas c WHERE c.cliente_id = cl.id AND c.estado = 'Completada' AND MONTH(c.fecha) = MONTH(CURDATE()) AND YEAR(c.fecha) = YEAR(CURDATE())) as cortes_mes,
                (SELECT COUNT(*) FROM historial_recompensas hr WHERE hr.cliente_id = cl.id AND MONTH(hr.fecha_entrega) = MONTH(CURDATE()) AND YEAR(hr.fecha_entrega) = YEAR(CURDATE())) as premios_mes
                FROM clientes cl 
                ORDER BY cl.nombre ASC
            ");
            echo json_encode($stmt->fetchAll());
            break;

        case 'get_citas_por_cobrar':
            $fecha = $pdo->query("SELECT CURDATE()")->fetchColumn();
            $stmt = $pdo->prepare("
                SELECT c.id, c.hora, c.estado, cl.nombre as cliente, cl.cortes_acumulados, t.nombre as barbero, c.descuento, c.total_pagado,
                (SELECT SUM(precio_cobrado) FROM cita_detalle cd WHERE cd.cita_id = c.id) as subtotal
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                JOIN trabajadores t ON c.trabajador_id = t.id
                WHERE c.fecha = ? AND c.estado != 'Cancelada'
                ORDER BY c.hora ASC
            ");
            $stmt->execute([$fecha]);
            echo json_encode($stmt->fetchAll());
            break;

        case 'get_estado_caja':
            $fecha = $pdo->query("SELECT CURDATE()")->fetchColumn();
            $stmt = $pdo->prepare("SELECT * FROM cierres_diarios WHERE fecha = ?");
            $stmt->execute([$fecha]);
            $caja = $stmt->fetch();
            
            if (!$caja) {
                echo json_encode(['estado' => 'no_iniciada']);
            } else {
                // Calcular ingresos de hoy
                $stmtCitas = $pdo->prepare("SELECT metodo_pago, SUM(total_pagado) as total FROM citas WHERE fecha = ? AND estado = 'Completada' GROUP BY metodo_pago");
                $stmtCitas->execute([$fecha]);
                $ventas_citas = $stmtCitas->fetchAll(PDO::FETCH_ASSOC);
                
                $ingresos = ['Efectivo' => 0, 'Transferencia' => 0, 'Tarjeta' => 0, 'Otro' => 0, 'Total' => 0];
                foreach ($ventas_citas as $v) {
                    if (isset($ingresos[$v['metodo_pago']])) {
                        $ingresos[$v['metodo_pago']] += $v['total'];
                    } else {
                        $ingresos['Otro'] += $v['total'];
                    }
                    $ingresos['Total'] += $v['total'];
                }
                
                // Tienda/Pedidos no tienen metodo_pago registrado actualmente, sumaremos todo como Efectivo o 'Otro' si aplica. 
                // Asumimos citas por ahora para desglose. Si pedidos existen, sumarlos.
                $stmtPed = $pdo->prepare("SELECT SUM(total) FROM pedidos WHERE DATE(fecha_creacion) = ? AND estado = 'Pagado'");
                $stmtPed->execute([$fecha]);
                $pedidos_tot = $stmtPed->fetchColumn() ?: 0;
                $ingresos['Efectivo'] += $pedidos_tot; // asumiendo efectivo por defecto en tienda
                $ingresos['Total'] += $pedidos_tot;
                
                echo json_encode([
                    'estado' => $caja['cerrado_por_admin'] ? 'cerrada' : 'abierta',
                    'efectivo_inicial' => $caja['efectivo_inicial'],
                    'ingresos' => $ingresos
                ]);
            }
            break;

        // --- BODEGA Y TIENDA ---
        case 'get_productos':
            $stmt = $pdo->query("
                SELECT p.*, c.nombre as categoria_nombre 
                FROM productos p 
                JOIN categorias c ON p.categoria_id = c.id
                ORDER BY p.nombre ASC
            ");
            echo json_encode($stmt->fetchAll());
            break;
            
        case 'get_categorias':
            $stmt = $pdo->query("SELECT * FROM categorias ORDER BY nombre ASC");
            echo json_encode($stmt->fetchAll());
            break;
            
        case 'get_pedidos_admin':
            $stmt = $pdo->query("
                SELECT p.id, p.total, p.estado, p.fecha_creacion, cl.nombre as cliente, cl.telefono as cliente_telefono, cl.email as cliente_email
                FROM pedidos p
                JOIN clientes cl ON p.cliente_id = cl.id
                ORDER BY p.fecha_creacion DESC
            ");
            $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $stmtDet = $pdo->prepare("
                SELECT pd.cantidad, pr.nombre as producto, pd.precio_unitario 
                FROM pedido_detalle pd 
                JOIN productos pr ON pd.producto_id = pr.id 
                WHERE pd.pedido_id = ?
            ");
            
            foreach ($pedidos as &$ped) {
                $stmtDet->execute([$ped['id']]);
                $ped['detalles'] = $stmtDet->fetchAll(PDO::FETCH_ASSOC);
            }
            
            echo json_encode($pedidos);
            break;

        // --- EQUIPO ---
        case 'get_trabajadores':
            $stmt = $pdo->query("
                SELECT t.id, t.nombre, t.email, t.foto_perfil, t.activo,
                (SELECT COUNT(*) FROM citas c WHERE c.trabajador_id = t.id AND c.fecha = CURDATE() AND c.estado = 'Completada') as cortes_hoy,
                (SELECT COUNT(*) FROM citas c WHERE c.trabajador_id = t.id AND c.estado = 'Completada') as cortes_totales
                FROM trabajadores t
                ORDER BY t.activo DESC, t.nombre ASC
            ");
            echo json_encode($stmt->fetchAll());
            break;

        // --- SERVICIOS ---
        case 'get_servicios':
            $stmt = $pdo->query("SELECT * FROM servicios ORDER BY activo DESC, nombre ASC");
            echo json_encode($stmt->fetchAll());
            break;

        // --- EXPORTAR ---
        case 'exportar_excel_barberos':
            $fecha_inicio = $_GET['inicio'] ?? date('Y-m-01');
            $fecha_fin = $_GET['fin'] ?? date('Y-m-t');
            $stmt = $pdo->prepare("
                SELECT c.id, c.fecha, c.hora, c.descuento, c.metodo_pago, cl.nombre as cliente, t.nombre as barbero,
                (SELECT SUM(precio_cobrado) FROM cita_detalle cd WHERE cd.cita_id = c.id) as subtotal,
                IFNULL(cdi.porcentaje_barbero, 60.00) as porcentaje_barbero,
                IFNULL(cdi.porcentaje_tienda, 40.00) as porcentaje_tienda
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                JOIN trabajadores t ON c.trabajador_id = t.id
                LEFT JOIN cierres_diarios cdi ON c.fecha = cdi.fecha
                WHERE c.estado = 'Completada' AND c.fecha BETWEEN ? AND ?
                ORDER BY t.nombre, c.fecha, c.hora
            ");
            $stmt->execute([$fecha_inicio, $fecha_fin]);
            $results = $stmt->fetchAll();
            $agrupado = [];
            foreach ($results as $row) {
                $barbero = $row['barbero'];
                if (!isset($agrupado[$barbero])) $agrupado[$barbero] = [];
                $agrupado[$barbero][] = $row;
            }
            echo json_encode($agrupado);
            break;

        case 'get_historial_cliente':
            $cliente_id = $_GET['cliente_id'] ?? 0;
            
            // Citas pasadas (historial completo)
            $stmtCitas = $pdo->prepare("
                SELECT c.fecha, c.hora, c.estado, t.nombre as barbero, c.decant_entregado,
                (SELECT GROUP_CONCAT(s.nombre SEPARATOR ', ') FROM cita_detalle cd JOIN servicios s ON cd.servicio_id = s.id WHERE cd.cita_id = c.id) as servicios
                FROM citas c
                JOIN trabajadores t ON c.trabajador_id = t.id
                WHERE c.cliente_id = ? AND c.estado IN ('Completada', 'Cancelada')
                ORDER BY c.fecha DESC, c.hora DESC
            ");
            $stmtCitas->execute([$cliente_id]);
            $citas = $stmtCitas->fetchAll();
            
            // Recompensas
            $stmtRec = $pdo->prepare("SELECT aroma_decant, fecha_entrega FROM historial_recompensas WHERE cliente_id = ? ORDER BY fecha_entrega DESC");
            $stmtRec->execute([$cliente_id]);
            $recompensas = $stmtRec->fetchAll();
            
            // Cortes este mes
            $mes_actual = date('Y-m-01');
            $stmtMes = $pdo->prepare("SELECT COUNT(*) FROM citas WHERE cliente_id = ? AND fecha >= ? AND estado = 'Completada'");
            $stmtMes->execute([$cliente_id, $mes_actual]);
            $cortes_mes = $stmtMes->fetchColumn();

            echo json_encode([
                "citas" => $citas,
                "recompensas" => $recompensas,
                "cortes_mes" => $cortes_mes
            ]);
            break;

        default:
            echo json_encode(["error" => "Invalid action GET"]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'upload_image') {
        if (!isset($_FILES['image'])) {
            echo json_encode(['error' => 'No image uploaded']);
            exit;
        }
        $file = $_FILES['image'];
        $uploadDir = __DIR__ . '/../../public/assets/fotos/productos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('prod_') . '.' . $ext;
        $targetPath = $uploadDir . $filename;
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            // Devuelve la URL relativa que entiende el frontend
            echo json_encode(['status' => 'success', 'url' => '/assets/fotos/productos/' . $filename]);
        } else {
            echo json_encode(['error' => 'Failed to move uploaded file']);
        }
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);
    
    switch ($action) {
        // --- CRM Y CAJA ---
        case 'guardar_notas_crm':
            $stmt = $pdo->prepare("UPDATE clientes SET notas_crm = ? WHERE id = ?");
            $stmt->execute([$data['notas_crm'] ?? '', $data['cliente_id'] ?? 0]);
            echo json_encode(["status" => "success"]);
            break;

        case 'entregar_premio_crm':
            $cliente_id = $data['cliente_id'] ?? 0;
            $producto_id = $data['producto_id'] ?? 0;
            
            // Obtener nombre del producto
            $sProd = $pdo->prepare("SELECT nombre FROM productos WHERE id = ?");
            $sProd->execute([$producto_id]);
            $prodNombre = $sProd->fetchColumn();
            
            if ($prodNombre) {
                // Restar stock
                $pdo->prepare("UPDATE productos SET stock = stock - 1 WHERE id = ?")->execute([$producto_id]);
                // Registrar historial
                $pdo->prepare("INSERT INTO historial_recompensas (cliente_id, cita_id, aroma_decant) VALUES (?, NULL, ?)")
                    ->execute([$cliente_id, $prodNombre]);
                echo json_encode(["status" => "success"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Producto no encontrado"]);
            }
            break;
            
        case 'configurar_comisiones_dia':
            $fecha = $data['fecha'] ?? date('Y-m-d');
            $pct_b = $data['porcentaje_barbero'] ?? 60;
            $pct_t = $data['porcentaje_tienda'] ?? 40;
            $stmt = $pdo->prepare("SELECT id FROM cierres_diarios WHERE fecha = ?");
            $stmt->execute([$fecha]);
            if ($stmt->fetchColumn()) {
                $pdo->prepare("UPDATE cierres_diarios SET porcentaje_barbero=?, porcentaje_tienda=? WHERE fecha=?")->execute([$pct_b, $pct_t, $fecha]);
            } else {
                $pdo->prepare("INSERT INTO cierres_diarios (fecha, porcentaje_barbero, porcentaje_tienda) VALUES (?,?,?)")->execute([$fecha, $pct_b, $pct_t]);
            }
            echo json_encode(["status" => "success"]);
            break;

        // --- CAJA ---
        case 'abrir_caja':
            $fecha = $pdo->query("SELECT CURDATE()")->fetchColumn();
            $efectivo_inicial = $data['efectivo_inicial'] ?? 0;
            
            $stmt = $pdo->prepare("SELECT id FROM cierres_diarios WHERE fecha = ?");
            $stmt->execute([$fecha]);
            if (!$stmt->fetchColumn()) {
                $pdo->prepare("INSERT INTO cierres_diarios (fecha, efectivo_inicial, cerrado_por_admin) VALUES (?, ?, 0)")
                    ->execute([$fecha, $efectivo_inicial]);
                echo json_encode(['status' => 'success']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Caja ya existe']);
            }
            break;
            
        case 'cerrar_caja':
            $fecha = $pdo->query("SELECT CURDATE()")->fetchColumn();
            $total_ingresos = $data['total_ingresos'] ?? 0;
            
            $pdo->prepare("UPDATE cierres_diarios SET cerrado_por_admin = 1, total_ingresos = ? WHERE fecha = ?")
                ->execute([$total_ingresos, $fecha]);
            echo json_encode(['status' => 'success']);
            break;

        case 'reabrir_caja':
            $fecha = $pdo->query("SELECT CURDATE()")->fetchColumn();
            $pdo->prepare("UPDATE cierres_diarios SET cerrado_por_admin = 0 WHERE fecha = ?")->execute([$fecha]);
            echo json_encode(['status' => 'success']);
            break;

        // --- BODEGA ---
        case 'add_producto':
            $stmt = $pdo->prepare("INSERT INTO productos (categoria_id, nombre, descripcion, precio, stock, imagen_url) VALUES (?,?,?,?,?,?)");
            $stmt->execute([$data['categoria_id'], $data['nombre'], $data['descripcion']??'', $data['precio'], $data['stock'], $data['imagen_url']??'']);
            echo json_encode(["status" => "success"]);
            break;
        case 'update_producto':
            $stmt = $pdo->prepare("UPDATE productos SET categoria_id=?, nombre=?, descripcion=?, precio=?, stock=?, imagen_url=? WHERE id=?");
            $stmt->execute([$data['categoria_id'], $data['nombre'], $data['descripcion']??'', $data['precio'], $data['stock'], $data['imagen_url']??'', $data['id']]);
            echo json_encode(["status" => "success"]);
            break;
        case 'delete_producto':
            $pdo->prepare("DELETE FROM productos WHERE id=?")->execute([$data['id']]);
            echo json_encode(["status" => "success"]);
            break;
        case 'update_pedido_estado':
            $pdo->prepare("UPDATE pedidos SET estado=? WHERE id=?")->execute([$data['estado'], $data['id']]);
            echo json_encode(["status" => "success"]);
            break;

        // --- EQUIPO ---
        case 'add_trabajador':
            // Asumimos que los barberos nuevos también se registran sin pass por este endpoint mock
            $stmt = $pdo->prepare("INSERT INTO trabajadores (nombre, email, foto_perfil) VALUES (?,?,?)");
            $stmt->execute([$data['nombre'], $data['email'], $data['foto_perfil']??'']);
            echo json_encode(["status" => "success"]);
            break;
        case 'update_trabajador':
            $stmt = $pdo->prepare("UPDATE trabajadores SET nombre=?, email=?, foto_perfil=? WHERE id=?");
            $stmt->execute([$data['nombre'], $data['email'], $data['foto_perfil']??'', $data['id']]);
            echo json_encode(["status" => "success"]);
            break;
        case 'toggle_trabajador':
            $pdo->prepare("UPDATE trabajadores SET activo = NOT activo WHERE id=?")->execute([$data['id']]);
            echo json_encode(["status" => "success"]);
            break;

        // --- SERVICIOS ---
        case 'add_servicio':
            $stmt = $pdo->prepare("INSERT INTO servicios (nombre, precio, es_corte, activo) VALUES (?,?,?,?)");
            $stmt->execute([$data['nombre'], $data['precio'], $data['es_corte'] ? 1 : 0, $data['activo'] ? 1 : 0]);
            echo json_encode(["status" => "success"]);
            break;
        case 'update_servicio':
            $stmt = $pdo->prepare("UPDATE servicios SET nombre=?, precio=?, es_corte=?, activo=? WHERE id=?");
            $stmt->execute([$data['nombre'], $data['precio'], $data['es_corte'] ? 1 : 0, $data['activo'] ? 1 : 0, $data['id']]);
            echo json_encode(["status" => "success"]);
            break;
        case 'delete_servicio':
            $pdo->prepare("DELETE FROM servicios WHERE id=?")->execute([$data['id']]);
            echo json_encode(["status" => "success"]);
            break;

        // --- CUSTOM ANALYTICS ---
        case 'get_custom_analytics':
            // Simple mock para evitar errores en reportes custom
            $dataResp = [];
            for($i=0; $i<5; $i++) {
                $dataResp[] = [
                    'label' => 'Fecha ' . date('Y-m-d', strtotime("-$i days")),
                    'valor' => rand(10000, 50000)
                ];
            }
            echo json_encode(['aggregated' => $dataResp, 'details' => []]);
            break;

        default:
            echo json_encode(["error" => "Invalid action POST"]);
    }
}
?>
