<?php
// get_barberos.php
require 'db.php';

try {
    $stmt = $pdo->query("SELECT id, nombre, foto_perfil FROM trabajadores WHERE activo = TRUE");
    $barberos = $stmt->fetchAll();
    echo json_encode($barberos);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
