<?php
// login.php
require 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (isset($data->email) && isset($data->nombre)) {
    $email = $data->email;
    $nombre = $data->nombre;
    $foto = isset($data->foto) ? $data->foto : '';
    
    // Verificar si el cliente existe
    $stmt = $pdo->prepare("SELECT * FROM clientes WHERE email = ?");
    $stmt->execute([$email]);
    $cliente = $stmt->fetch();

    if (!$cliente) {
        // Registrar nuevo cliente con RUT temporal si no existe
        // En la vida real aquí pediríamos el RUT y Teléfono
        $rut_temp = uniqid('rut_');
        $stmt_insert = $pdo->prepare("INSERT INTO clientes (rut, nombre, email, foto_perfil) VALUES (?, ?, ?, ?)");
        $stmt_insert->execute([$rut_temp, $nombre, $email, $foto]);
        $cliente_id = $pdo->lastInsertId();
    } else {
        $cliente_id = $cliente['id'];
    }

    // Generar un JWT falso para el entorno de desarrollo local
    // (En producción usarías la librería firebase/php-jwt)
    $payload = base64_encode(json_encode(['id' => $cliente_id, 'email' => $email]));
    $fake_jwt = "header." . $payload . ".signature";

    echo json_encode(['token' => $fake_jwt, 'cliente_id' => $cliente_id, 'nombre' => $nombre]);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Email y nombre son requeridos']);
}
?>
