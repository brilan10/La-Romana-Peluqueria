<?php
require 'src/backend/db.php';
try {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE pedido_detalle;");
    $pdo->exec("TRUNCATE TABLE pedidos;");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
    $pdo->exec("INSERT INTO pedidos (id, cliente_id, total, estado, fecha_creacion) VALUES
    (1, 1, 40000.00, 'Pendiente', NOW() - INTERVAL 1 DAY),
    (2, 2, 15000.00, 'Entregado', NOW() - INTERVAL 2 DAY);");
    $pdo->exec("INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario) VALUES
    (1, 1, 1, 25000.00),
    (1, 2, 1, 15000.00),
    (2, 3, 1, 15000.00);");
    echo "Pedidos insertados";
} catch (Exception $e) {
    echo $e->getMessage();
}
