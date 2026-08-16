<?php
require 'db.php';
require_once 'mailer.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['identificador']) && !isset($data['email'])) {
    http_response_code(400);
    echo json_encode(["error" => "Identificador (RUT o Correo) requerido"]);
    exit();
}

$identificador = $data['identificador'] ?? $data['email'];
$login_type = $data['login_type'] ?? 'standard';

if ($login_type === 'forgot_password') {
    $userType = null;
    $userId = null;
    $nombreUser = '';
    $userEmail = '';
    
    // Check client
    $stmt = $pdo->prepare("SELECT id, nombre, email FROM clientes WHERE email = ? OR rut = ?");
    $stmt->execute([$identificador, $identificador]);
    $cli = $stmt->fetch();
    if ($cli) {
        $userType = 'clientes'; $userId = $cli['id']; $nombreUser = $cli['nombre']; $userEmail = $cli['email'];
    } else {
        // Check trabajador
        $stmt = $pdo->prepare("SELECT id, nombre, email FROM trabajadores WHERE email = ?");
        $stmt->execute([$identificador]);
        $tra = $stmt->fetch();
        if ($tra) {
            $userType = 'trabajadores'; $userId = $tra['id']; $nombreUser = $tra['nombre']; $userEmail = $tra['email'];
        } else {
            // Check admin
            $stmt = $pdo->prepare("SELECT id, nombre, email FROM administradores WHERE email = ?");
            $stmt->execute([$identificador]);
            $adm = $stmt->fetch();
            if ($adm) {
                $userType = 'administradores'; $userId = $adm['id']; $nombreUser = $adm['nombre']; $userEmail = $adm['email'];
            }
        }
    }

    if ($userType) {
        if (empty($userEmail)) {
            http_response_code(400);
            echo json_encode(["error" => "No tienes un correo registrado para recuperar la clave. Contacta al administrador en el local."]);
            exit();
        }

        $new_pass = (string)rand(100000, 999999);
        $new_hash = password_hash($new_pass, PASSWORD_DEFAULT);
        
        $upd = $pdo->prepare("UPDATE $userType SET password_hash = ? WHERE id = ?");
        $upd->execute([$new_hash, $userId]);
        
        $asunto = "Recuperación de Contraseña - La Romana";
        $cuerpo = "<h2>¡Hola $nombreUser!</h2><p>Tu nueva contraseña temporal es: <strong>$new_pass</strong></p><p>Te recomendamos iniciar sesión y actualizarla.</p>";
        enviarCorreo($userEmail, $asunto, $cuerpo);
        
        echo json_encode(["status" => "success", "message" => "Te hemos enviado una contraseña temporal a tu correo."]);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "El RUT o correo no está registrado en el sistema."]);
    }
    exit();
}

if ($login_type === 'reset_password') {
    $stmt = $pdo->prepare("SELECT id FROM administradores WHERE email = ?");
    $stmt->execute([$identificador]);
    $admin = $stmt->fetch();
    
    if ($admin) {
        $new_hash = password_hash($data['new_password'], PASSWORD_DEFAULT);
        $upd = $pdo->prepare("UPDATE administradores SET password_hash = ? WHERE email = ?");
        $upd->execute([$new_hash, $identificador]);
        echo json_encode(["status" => "success", "message" => "Clave actualizada."]);
    } else {
        http_response_code(400);
        echo json_encode(["error" => "No eres administrador."]);
    }
    exit();
}

// REGISTRO DE CLIENTE NUEVO (SOLO CLIENTES SE REGISTRAN)
if ($login_type === 'register') {
    $rut = $data['identificador']; // En registro, identificador es el RUT
    $nombre = $data['nombre'];
    $password = $data['password'];

    if (empty($rut) || empty($nombre) || empty($password)) {
        http_response_code(400);
        echo json_encode(["error" => "RUT, Nombre y Contraseña son obligatorios para registrarse."]);
        exit();
    }

    // Verificar si ya existe el RUT
    $check = $pdo->prepare("SELECT id FROM clientes WHERE rut = ?");
    $check->execute([$rut]);
    if ($check->fetch()) {
        http_response_code(400);
        echo json_encode(["error" => "El RUT ya está registrado. Inicia sesión."]);
        exit();
    }

    $pwd_hash = password_hash($password, PASSWORD_DEFAULT);
    $stmtIns = $pdo->prepare("INSERT INTO clientes (rut, nombre, password_hash) VALUES (?, ?, ?)");
    $stmtIns->execute([$rut, $nombre, $pwd_hash]);
    $clienteId = $pdo->lastInsertId();

    $stmt = $pdo->prepare("SELECT id, nombre, email, foto_perfil, rut, telefono, cortes_acumulados, password_hash FROM clientes WHERE id = ?");
    $stmt->execute([$clienteId]);
    $cliente = $stmt->fetch();

    $perfilCompleto = (!empty($cliente['rut']) && !empty($cliente['telefono']));

    echo json_encode([
        "status" => "success",
        "rol" => "cliente",
        "usuario" => $cliente,
        "perfilCompleto" => $perfilCompleto,
        "token" => "token-cliente-" . $cliente['id']
    ]);
    exit();
}

// LOGIN ESTÁNDAR
// 1. Verificar si es Administrador (con email, o identificador en su caso)
$stmt = $pdo->prepare("SELECT * FROM administradores WHERE email = ?");
$stmt->execute([$identificador]);
$admin = $stmt->fetch();

if ($admin) {
    if (!password_verify($data['password'], $admin['password_hash'])) {
        http_response_code(401);
        echo json_encode(["error" => "Contraseña incorrecta."]);
        exit();
    }
    echo json_encode([
        "status" => "success",
        "rol" => "admin",
        "usuario" => ["nombre" => $admin['nombre'], "email" => $admin['email']],
        "token" => "token-admin-" . $admin['id']
    ]);
    exit();
}

// 2. Verificar si es Trabajador (Barbero) (busca por email)
$stmt = $pdo->prepare("SELECT id, nombre, email, foto_perfil, password_hash FROM trabajadores WHERE email = ? AND activo = 1");
$stmt->execute([$identificador]);
$trabajador = $stmt->fetch();

if ($trabajador) {
    if (!password_verify($data['password'], $trabajador['password_hash'])) {
        http_response_code(401);
        echo json_encode(["error" => "Contraseña incorrecta."]);
        exit();
    }
    echo json_encode([
        "status" => "success",
        "rol" => "trabajador",
        "usuario" => [
            "id" => $trabajador['id'],
            "nombre" => $trabajador['nombre'],
            "email" => $trabajador['email'],
            "foto_perfil" => $trabajador['foto_perfil']
        ],
        "token" => "token-trabajador-" . $trabajador['id']
    ]);
    exit();
}

// 3. Verificar si es Cliente (busca por RUT o Email)
$stmt = $pdo->prepare("SELECT id, nombre, email, foto_perfil, rut, telefono, cortes_acumulados, password_hash FROM clientes WHERE email = ? OR rut = ?");
$stmt->execute([$identificador, $identificador]);
$cliente = $stmt->fetch();

if (!$cliente) {
    http_response_code(401);
    echo json_encode(["error" => "Usuario no registrado. Por favor, crea una cuenta."]);
    exit();
}

// Si existe, verificamos contraseña
if (empty($cliente['password_hash']) || !password_verify($data['password'], $cliente['password_hash'])) {
    http_response_code(401);
    echo json_encode(["error" => "Contraseña incorrecta o cuenta antigua sin contraseña configurada."]);
    exit();
}

$perfilCompleto = (!empty($cliente['rut']) && !empty($cliente['telefono']));

echo json_encode([
    "status" => "success",
    "rol" => "cliente",
    "usuario" => $cliente,
    "perfilCompleto" => $perfilCompleto,
    "token" => "token-cliente-" . $cliente['id']
]);
?>
