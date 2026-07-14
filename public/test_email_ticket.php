<?php
// test_email_ticket.php
// Prueba directa de SMTP — abre en el navegador para verificar la configuración.
// Idéntico a administrador-web/public/test_email_direct.php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$composerPath = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($composerPath)) {
    $composerPath = __DIR__ . '/vendor/autoload.php';
}

if (file_exists($composerPath)) {
    require $composerPath;
} else {
    echo json_encode(['error' => 'No se encontró PHPMailer. Ejecuta: composer install']);
    exit;
}

$config = require __DIR__ . '/email_config.php';

error_reporting(E_ALL);
ini_set('display_errors', 1);

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = $config['smtp_host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['smtp_user'];
    $mail->Password   = $config['smtp_pass'];
    $mail->SMTPSecure = $config['smtp_secure'];
    $mail->Port       = (int) $config['smtp_port'];
    $mail->CharSet    = 'UTF-8';

    $mail->SMTPDebug  = 3;
    $mail->Debugoutput = 'html';

    $mail->setFrom($config['from_email'], $config['from_name']);
    $mail->addAddress($config['to_email']);

    $mail->Subject = 'Prueba SMTP — Sistema de Tickets Los Olivos';
    $mail->isHTML(true);
    $mail->Body = "
    <h2 style='color:#1a73e8;'>&#10004; Prueba de correo exitosa</h2>
    <p>El servidor SMTP de Hostinger está configurado correctamente para el Sistema de Tickets.</p>
    <ul>
      <li><strong>Host:</strong> {$config['smtp_host']}</li>
      <li><strong>Puerto:</strong> {$config['smtp_port']}</li>
      <li><strong>Encriptación:</strong> " . strtoupper($config['smtp_secure']) . "</li>
      <li><strong>Remitente:</strong> {$config['from_email']}</li>
      <li><strong>Destinatario:</strong> {$config['to_email']}</li>
    </ul>
    <p style='color:#888;font-size:12px;'>Enviado: " . date('Y-m-d H:i:s') . "</p>";
    $mail->AltBody = "Prueba SMTP exitosa. Host: {$config['smtp_host']}:{$config['smtp_port']}";

    echo "<h2>Enviando correo de prueba a <em>{$config['to_email']}</em>...</h2><pre>";
    $mail->send();
    echo "</pre><h2 style='color:green;'>&#10004; ¡Correo enviado exitosamente!</h2>";

} catch (Exception $e) {
    echo "<h2 style='color:red;'>&#10008; Error al enviar correo</h2>";
    echo "<pre>" . htmlspecialchars($mail->ErrorInfo) . "</pre>";
}
