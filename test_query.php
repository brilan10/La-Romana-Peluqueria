<?php
require 'src/backend/db.php';
try {
    $stmt = $pdo->query('SELECT * FROM pedidos');
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    
    $stmt = $pdo->query('SELECT * FROM clientes');
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo $e->getMessage();
}
