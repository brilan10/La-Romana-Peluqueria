<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/PHPMailer/Exception.php';
require __DIR__ . '/PHPMailer/PHPMailer.php';
require __DIR__ . '/PHPMailer/SMTP.php';

/**
 * Función para enviar correos usando la cuenta de Gmail.
 * @param string $destinatario Email de destino
 * @param string $asunto Asunto del correo
 * @param string $cuerpo Cuerpo en HTML del correo
 * @return bool True si se envió, False en caso de error.
 */
function enviarCorreo($destinatario, $asunto, $cuerpo) {
    $mail = new PHPMailer(true);

    try {
        // Configuración del servidor SMTP
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        // Credenciales de la cuenta
        $mail->Username   = 'laromana.vip01@gmail.com'; 
        // Contraseña de aplicación generada
        $mail->Password   = 'ujtfegqftupgxuuc'; 
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL/TLS
        $mail->Port       = 465;

        // Configuración adicional
        $mail->CharSet = 'UTF-8';

        // Remitente y destinatario
        $mail->setFrom('laromana.vip01@gmail.com', 'La Romana Barbería');
        $mail->addAddress($destinatario);

        // Contenido
        $mail->isHTML(true);
        $mail->Subject = $asunto;
        $mail->Body    = $cuerpo;
        // Versión en texto plano básica
        $mail->AltBody = strip_tags($cuerpo);

        $mail->send();
        return true;
    } catch (Exception $e) {
        // Podríamos loggear el error o retornarlo, pero retornamos false para simplificar
        error_log("No se pudo enviar el correo a $destinatario. Error de PHPMailer: {$mail->ErrorInfo}");
        return false;
    }
}
?>
