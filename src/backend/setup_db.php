<?php
require 'db.php';

try {
    // Crear tabla administradores
    $pdo->exec("CREATE TABLE IF NOT EXISTS administradores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Insertar administrador por defecto si no existe (admin123)
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM administradores WHERE email = 'admin@laromana.cl'");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $hash = password_hash('admin123', PASSWORD_DEFAULT);
        $ins = $pdo->prepare("INSERT INTO administradores (nombre, email, password_hash) VALUES ('Dueño', 'admin@laromana.cl', ?)");
        $ins->execute([$hash]);
        echo "Admin default insertado.\n";
    }

    echo "Base de datos actualizada con exito.\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
