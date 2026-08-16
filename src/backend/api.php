<?php
require 'db.php';
require_once 'mailer.php';
$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    switch ($action) {
        case 'get_barberos':
            $stmt = $pdo->query("SELECT id, nombre, foto_perfil FROM trabajadores WHERE activo = 1");
            echo json_encode($stmt->fetchAll());
            break;
        case 'get_servicios':
            $stmt = $pdo->query("SELECT id, nombre, descripcion, precio, es_corte FROM servicios WHERE activo = 1");
            echo json_encode($stmt->fetchAll());
            break;
        case 'get_productos':
            $stmt = $pdo->query("SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, p.imagen_url, p.ventas, c.nombre as categoria FROM productos p JOIN categorias c ON p.categoria_id = c.id");
            echo json_encode($stmt->fetchAll());
            break;
        case 'get_horarios_ocupados':
            $trabajador_id = $_GET['trabajador_id'] ?? 0;
            $fecha = $_GET['fecha'] ?? '';
            $stmt = $pdo->prepare("SELECT hora FROM citas WHERE trabajador_id = ? AND fecha = ?");
            $stmt->execute([$trabajador_id, $fecha]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_COLUMN));
            break;
        case 'get_citas_trabajador':
            $trabajador_id = $_GET['trabajador_id'] ?? 0;
            $fecha = date('Y-m-d'); // Hoy
            // Traer citas del trabajador de hoy, con nombre del cliente y foto, y calcular cortes del cliente (COUNT en BD).
            $stmt = $pdo->prepare("
                SELECT c.id, c.hora, c.estado, cl.nombre, cl.foto_perfil as foto, cl.id as cliente_id,
                (SELECT COUNT(*) FROM citas c2 WHERE c2.cliente_id = cl.id AND c2.estado = 'Completada') + 1 as cortes
                FROM citas c
                JOIN clientes cl ON c.cliente_id = cl.id
                WHERE c.trabajador_id = ? AND c.fecha = ? AND c.estado IN ('Pendiente', 'Terminado_Esperando_Pago')
                ORDER BY c.hora ASC
            ");
            $stmt->execute([$trabajador_id, $fecha]);
            echo json_encode($stmt->fetchAll());
            break;
        case 'get_mis_pedidos':
            $cliente_id = $_GET['cliente_id'] ?? 0;
            $stmt = $pdo->prepare("SELECT id, estado, total, fecha_creacion FROM pedidos WHERE cliente_id = ? ORDER BY fecha_creacion DESC");
            $stmt->execute([$cliente_id]);
            echo json_encode($stmt->fetchAll());
            break;
        default:
            echo json_encode(["error" => "Invalid action"]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    switch ($action) {
        case 'update_profile':
            try {
                $stmt = $pdo->prepare("UPDATE clientes SET rut = ?, telefono = ?, email = ? WHERE id = ?");
                // Si el esquema aún no permite NULL, podemos usar un string vacío o el correo original.
                // Lo mejor es no actualizar el email si no se envía, pero si viene vacío, lo intentamos guardar como NULL.
                $email = empty($data['email']) ? null : $data['email'];
                $stmt->execute([$data['rut'], $data['telefono'], $email, $data['cliente_id']]);
                echo json_encode(["status" => "success"]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["error" => "Error BD: " . $e->getMessage()]);
            }
            break;
        case 'agendar_cita':
            $cliente_id = $data['cliente_id'] ?? null;
            if (!$cliente_id && !empty($data['rut']) && !empty($data['nombre'])) {
                // Agendamiento Express
                $stmtCli = $pdo->prepare("SELECT id FROM clientes WHERE rut = ?");
                $stmtCli->execute([$data['rut']]);
                $cliente_id = $stmtCli->fetchColumn();
                if (!$cliente_id) {
                    $dummy_email = "express_" . time() . "@laromana.cl";
                    $stmtIns = $pdo->prepare("INSERT INTO clientes (rut, nombre, email) VALUES (?, ?, ?)");
                    $stmtIns->execute([$data['rut'], $data['nombre'], $dummy_email]);
                    $cliente_id = $pdo->lastInsertId();
                }
            }

            if (!$cliente_id) {
                echo json_encode(["error" => "Cliente no especificado"]);
                break;
            }

            $stmt = $pdo->prepare("INSERT INTO citas (cliente_id, trabajador_id, fecha, hora) VALUES (?, ?, ?, ?)");
            $stmt->execute([$cliente_id, $data['trabajador_id'], $data['fecha'], $data['hora']]);
            $citaId = $pdo->lastInsertId();
            
            // Insertar detalles
            $stmtDet = $pdo->prepare("INSERT INTO cita_detalle (cita_id, servicio_id, precio_cobrado) VALUES (?, ?, ?)");
            foreach ($data['servicios'] as $servId) {
                // Obtenemos el precio
                $s = $pdo->prepare("SELECT precio FROM servicios WHERE id = ?");
                $s->execute([$servId]);
                $precio = $s->fetchColumn();
                $stmtDet->execute([$citaId, $servId, $precio]);
            }
            // Enviar correo
            $stmtCli = $pdo->prepare("SELECT email, nombre FROM clientes WHERE id = ? AND email NOT LIKE 'express_%'");
            $stmtCli->execute([$cliente_id]);
            $cliente = $stmtCli->fetch();
            if ($cliente && $cliente['email']) {
                $asunto = "Cita Confirmada - La Romana";
                $cuerpo = "<h2>¡Hola {$cliente['nombre']}!</h2><p>Tu cita para el día <strong>{$data['fecha']}</strong> a las <strong>{$data['hora']}</strong> ha sido agendada con éxito.</p><p>¡Te esperamos!</p>";
                enviarCorreo($cliente['email'], $asunto, $cuerpo);
            }

            echo json_encode(["status" => "success", "cita_id" => $citaId, "cliente_id" => $cliente_id]);
            break;
        case 'nuevo_pedido':
            $stmt = $pdo->prepare("INSERT INTO pedidos (cliente_id, total) VALUES (?, ?)");
            $stmt->execute([$data['cliente_id'], $data['total']]);
            $pedidoId = $pdo->lastInsertId();
            
            $stmtDet = $pdo->prepare("INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)");
            foreach ($data['carrito'] as $item) {
                $stmtDet->execute([$pedidoId, $item['id'], $item['cantidad'], $item['precio']]);
            }
            $responseJson = json_encode(["status" => "success", "pedido_id" => $pedidoId]);
            
            // Forzar respuesta inmediata al frontend (Fire and Forget)
            ignore_user_abort(true);
            ob_start();
            echo $responseJson;
            header("Connection: close");
            header("Content-Length: " . ob_get_length());
            ob_end_flush();
            @ob_flush();
            flush();
            if (function_exists('fastcgi_finish_request')) {
                fastcgi_finish_request();
            }

            // Enviar correo en segundo plano
            $stmtCli = $pdo->prepare("SELECT email, nombre FROM clientes WHERE id = ?");
            $stmtCli->execute([$data['cliente_id']]);
            $cliente = $stmtCli->fetch();
            if ($cliente && $cliente['email']) {
                $asunto = "Pedido Recibido ORD-$pedidoId - La Romana";
                $cuerpo = "<h2>¡Hola {$cliente['nombre']}!</h2><p>Tu pedido <strong>ORD-$pedidoId</strong> ha sido registrado correctamente por un total de <strong>$" . number_format($data['total'], 0, ',', '.') . "</strong>.</p><p>Acércate a la caja en la barbería para pagarlo y retirarlo.</p>";
                enviarCorreo($cliente['email'], $asunto, $cuerpo);
            }

            break;
        case 'finalizar_cita':
            $cita_id = $data['cita_id'] ?? 0;
            $descuento = $data['descuento'] ?? 0;
            $metodo_pago = $data['metodo_pago'] ?? 'Efectivo';
            $decant_producto_id = $data['decant_producto_id'] ?? null;
            
            // Calcular total_pagado = subtotal - descuento
            $subQ = $pdo->prepare("SELECT SUM(precio_cobrado) FROM cita_detalle WHERE cita_id = ?");
            $subQ->execute([$cita_id]);
            $subtotal = (float)$subQ->fetchColumn();
            $total_pagado = max(0, $subtotal - $descuento);
            
            // Si hay decant regalado, lo procesamos
            if ($decant_producto_id) {
                // Obtener nombre del decant
                $sProd = $pdo->prepare("SELECT nombre FROM productos WHERE id = ?");
                $sProd->execute([$decant_producto_id]);
                $decantNombre = $sProd->fetchColumn();

                if ($decantNombre) {
                    // Restar stock
                    $pdo->prepare("UPDATE productos SET stock = stock - 1 WHERE id = ?")->execute([$decant_producto_id]);
                    
                    // Obtener cliente_id
                    $sCli = $pdo->prepare("SELECT cliente_id FROM citas WHERE id = ?");
                    $sCli->execute([$cita_id]);
                    $cliente_id = $sCli->fetchColumn();

                    // Guardar historial recompensas
                    $pdo->prepare("INSERT INTO historial_recompensas (cliente_id, cita_id, aroma_decant) VALUES (?, ?, ?)")
                        ->execute([$cliente_id, $cita_id, $decantNombre]);
                    
                    // Actualizar cliente (reset cortes)
                    $pdo->prepare("UPDATE clientes SET cortes_acumulados = 0 WHERE id = ?")->execute([$cliente_id]);

                    // Completar cita con decant
                    $stmt = $pdo->prepare("UPDATE citas SET estado = 'Completada', descuento = ?, metodo_pago = ?, decant_entregado = ?, total_pagado = ? WHERE id = ?");
                    $stmt->execute([$descuento, $metodo_pago, $decantNombre, $total_pagado, $cita_id]);
                    echo json_encode(["status" => "success"]);
                    break;
                }
            }

            // Normal finalizar (no VIP o ya procesado sin premio)
            $stmt = $pdo->prepare("UPDATE citas SET estado = 'Completada', descuento = ?, metodo_pago = ?, total_pagado = ? WHERE id = ?");
            $stmt->execute([$descuento, $metodo_pago, $total_pagado, $cita_id]);
            
            // Incrementar corte al cliente normal
            $sCli = $pdo->prepare("SELECT cliente_id FROM citas WHERE id = ?");
            $sCli->execute([$cita_id]);
            $cliente_id = $sCli->fetchColumn();
            $pdo->prepare("UPDATE clientes SET cortes_acumulados = cortes_acumulados + 1 WHERE id = ?")->execute([$cliente_id]);

            echo json_encode(["status" => "success"]);
            break;
        case 'derivar_a_caja':
            $cita_id = $data['cita_id'] ?? 0;
            $stmt = $pdo->prepare("UPDATE citas SET estado = 'Terminado_Esperando_Pago' WHERE id = ?");
            $stmt->execute([$cita_id]);
            echo json_encode(["status" => "success"]);
            break;
        case 'update_password_trabajador':
            // Idealmente aquí se verificaría la sesión. Para demo validamos el ID.
            $hash = password_hash($data['new_password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE trabajadores SET password_hash = ? WHERE id = ?");
            $stmt->execute([$hash, $data['trabajador_id']]);
            echo json_encode(["status" => "success"]);
            break;
        default:
            echo json_encode(["error" => "Invalid action"]);
    }
}
?>
