<?php
$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'la_romana';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS la_romana CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE la_romana");
    
    // Leer schema
    $sql = "SET FOREIGN_KEY_CHECKS=0;\n" . file_get_contents('database_full.sql') . "\nSET FOREIGN_KEY_CHECKS=1;";
    $pdo->exec($sql);
    
    // Add password_hash column if not exists
    try {
        $pdo->exec("ALTER TABLE clientes ADD COLUMN password_hash VARCHAR(255) NULL");
    } catch(Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE trabajadores ADD COLUMN password_hash VARCHAR(255) NULL");
    } catch(Exception $e) {}
    
    // Update existing clients with password 'cliente123'
    $hash = password_hash('cliente123', PASSWORD_DEFAULT);
    $pdo->exec("UPDATE clientes SET password_hash = '$hash'");
    
    // Update workers with password 'trabajador123'
    $hashTra = password_hash('trabajador123', PASSWORD_DEFAULT);
    $pdo->exec("UPDATE trabajadores SET password_hash = '$hashTra'");
    
    // Create new client as requested
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM clientes WHERE email = 'cliente@email.com'");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $hashNew = password_hash('123456', PASSWORD_DEFAULT);
        $pdo->exec("INSERT INTO clientes (rut, nombre, email, telefono, password_hash) VALUES ('12345678-9', 'Cliente Nuevo', 'cliente@email.com', '+56900000000', '$hashNew')");
    }
    
    echo "Base de datos inicializada y usuario cliente creado con exito.\n";

} catch (PDOException $e) {
    echo "Error de BD: " . $e->getMessage() . "\n";
}
?>
