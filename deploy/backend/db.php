<?php
// db.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

// Credenciales de Producción WebHost / cPanel
$prod_host = 'localhost';
$prod_db   = 'laromana_basededatos';
$prod_user = 'laromana_ronin';
$prod_pass = 'rONIN.ABC.123';

// Credenciales Locales XAMPP
$local_host = '127.0.0.1';
$local_db   = 'la_romana';
$local_user = 'root';
$local_pass = '';

$is_local = (isset($_SERVER['HTTP_HOST']) && (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false)) || (php_sapi_name() === 'cli');

$pdo = null;

if ($is_local) {
    // Entorno Local
    try {
        $dsn = "mysql:host=$local_host;dbname=$local_db;charset=utf8mb4";
        $pdo = new PDO($dsn, $local_user, $local_pass, $options);
    } catch (\PDOException $e) {
        try {
            $dsn = "mysql:host=$prod_host;dbname=$prod_db;charset=utf8mb4";
            $pdo = new PDO($dsn, $prod_user, $prod_pass, $options);
        } catch (\PDOException $e2) {
            http_response_code(500);
            echo json_encode(["error" => "Error de conexión a BD local: " . $e->getMessage()]);
            exit();
        }
    }
} else {
    // Entorno de Producción WebHost
    try {
        $dsn = "mysql:host=$prod_host;dbname=$prod_db;charset=utf8mb4";
        $pdo = new PDO($dsn, $prod_user, $prod_pass, $options);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Error de conexión a BD producción: " . $e->getMessage()]);
        exit();
    }
}
?>
