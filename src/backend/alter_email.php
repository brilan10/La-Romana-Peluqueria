<?php
require 'db.php';
try {
    try {
        $pdo->exec("ALTER TABLE clientes DROP INDEX email");
    } catch (Exception $e) {}
    $pdo->exec("ALTER TABLE clientes MODIFY email VARCHAR(150) NULL");
    
    // Also google_id is not strictly needed anymore but it's null already.
    echo "Schema updated successfully.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
