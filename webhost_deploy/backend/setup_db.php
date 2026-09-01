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

    // Crear tabla pagos_trabajadores para registro y liquidación de pagos
    $pdo->exec("CREATE TABLE IF NOT EXISTS pagos_trabajadores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trabajador_id INT NOT NULL,
        periodo_inicio DATE NOT NULL,
        periodo_fin DATE NOT NULL,
        monto DECIMAL(10,2) NOT NULL,
        fecha_pago DATE NOT NULL,
        metodo_pago ENUM('Transferencia', 'Efectivo', 'Tarjeta', 'Cheque', 'Otro') DEFAULT 'Transferencia',
        numero_comprobante VARCHAR(100) DEFAULT NULL,
        notas TEXT DEFAULT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Crear tabla configuraciones generales
    $pdo->exec("CREATE TABLE IF NOT EXISTS configuraciones (
        clave VARCHAR(50) PRIMARY KEY,
        valor TEXT NOT NULL,
        descripcion VARCHAR(255) DEFAULT NULL,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Insertar configuración por defecto de cortes para premio (ej: 3 cortes)
    $stmtConf = $pdo->prepare("INSERT INTO configuraciones (clave, valor, descripcion) VALUES ('meta_cortes_premio', '3', 'Cantidad de cortes requeridos para ganar premio') ON DUPLICATE KEY UPDATE clave=clave");
    $stmtConf->execute();

    echo "Base de datos actualizada con exito.\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
