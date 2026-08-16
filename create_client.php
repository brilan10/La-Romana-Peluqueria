<?php
require 'src/backend/db.php';
try {
    $rut = '12345678-9';
    $email = 'cliente@laromana.cl';
    $nombre = 'Cliente Prueba';
    $password = 'password123';
    $hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Delete if exists
    $pdo->exec("DELETE FROM clientes WHERE rut = '$rut' OR email = '$email'");
    
    $stmt = $pdo->prepare("INSERT INTO clientes (rut, nombre, email, telefono, password_hash) VALUES (?, ?, ?, '+56900000000', ?)");
    $stmt->execute([$rut, $nombre, $email, $hash]);
    
    echo "Cliente creado exitosamente.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
