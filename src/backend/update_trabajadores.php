<?php
require 'db.php';

try {
    // Añadir columna password_hash si no existe
    // En MariaDB podemos chequear si existe, pero una forma rápida es intentar agregarla y atrapar el error si ya existe.
    try {
        $pdo->exec("ALTER TABLE trabajadores ADD COLUMN password_hash VARCHAR(255) NULL AFTER email");
        echo "Columna password_hash añadida.\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            echo "La columna password_hash ya existe.\n";
        } else {
            throw $e;
        }
    }

    // Asignar contraseña '123456' a todos los trabajadores que no tengan (NULL)
    $hash = password_hash('123456', PASSWORD_DEFAULT);
    $upd = $pdo->prepare("UPDATE trabajadores SET password_hash = ? WHERE password_hash IS NULL");
    $upd->execute([$hash]);
    
    echo "Contraseñas por defecto (123456) asignadas a trabajadores antiguos.\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
