<?php
// send_ticket_email.php
// Envía notificación por email cuando se crea o actualiza un ticket.
// Llamado desde el frontend (TicketsEdit.svelte) vía fetch POST con JSON.
// Estructura idéntica a administrador-web/public/send_email.php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// vendor/ está un nivel arriba de public/ (igual que en administrador-web)
$composerPath = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($composerPath)) {
    $composerPath = __DIR__ . '/vendor/autoload.php';
}

if (file_exists($composerPath)) {
    require $composerPath;
} else {
    echo json_encode([
        'success' => false,
        'error'   => 'No se encontró PHPMailer',
        'help'    => 'Ejecuta: composer install  (en la raíz del proyecto)',
    ]);
    exit;
}

$config = require __DIR__ . '/email_config.php';

if ($config['debug']) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// Leer payload JSON del frontend
$payload = json_decode(file_get_contents('php://input'), true) ?: $_POST;

$ticketNumber   = $payload['ticketNumber']   ?? '';
$ticketId       = $payload['ticketId']       ?? '';
$title          = $payload['title']          ?? '';
$description    = $payload['description']    ?? '';
$createdByName  = $payload['createdByName']  ?? '';
$createdByEmail = $payload['createdByEmail'] ?? '';
$requestingArea = isset($payload['requestingArea']) ? (int) $payload['requestingArea'] : null;
$priority       = isset($payload['priority']) ? (int) $payload['priority'] : null;
$status         = isset($payload['status']) ? (int) $payload['status'] : null;

$ref = $ticketNumber ?: $ticketId;

if (!$ref) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ticketId o ticketNumber requerido']);
    exit;
}

// ── Asunto ─────────────────────────────────────────────────────────────────
$subject = "Nuevo ticket #{$ref}" . ($config['debug'] ? ' [PRUEBA]' : '') . " — $title";

// ── Cuerpo texto plano ──────────────────────────────────────────────────────
$bodyText  = "Se ha creado un nuevo ticket en el sistema.\n\n";
$bodyText .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
$bodyText .= "Ticket #:    $ref\n";
$bodyText .= "Título:      $title\n";
$bodyText .= "Área:        " . ($areaLabel !== '' ? strip_tags($areaLabel) : ($requestingArea !== null ? $requestingArea : '')) . "\n";
$bodyText .= "Prioridad:   " . ($priorityLabel !== '' ? $priorityLabel : ($priority !== null ? $priority : '')) . "\n";
$bodyText .= "Estado:      " . ($statusLabel !== '' ? $statusLabel : ($status !== null ? $status : '')) . "\n";
$bodyText .= "Creado por:  " . (!empty($createdByName) ? $createdByName : '') . "\n";
$bodyText .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
$bodyText .= "Descripción:\n$description\n\n";
$bodyText .= "Fecha: " . ($createdAt ?: date('Y-m-d H:i:s')) . "\n";
$bodyText .= "Entorno: " . ($config['debug'] ? 'DESARROLLO' : 'PRODUCCIÓN');

// ── Cuerpo HTML ────────────────────────────────────────────────────────────
function row($label, $value) {
    return "<tr>
      <td style='color:#555;padding:6px 8px;width:140px;border-bottom:1px solid #eee;'>{$label}</td>
      <td style='padding:6px 8px;border-bottom:1px solid #eee;'>" . htmlspecialchars($value) . "</td>
    </tr>";
}

// Mappings (must match frontend labels)
$statusOptions = ["Abierto","En Progreso","Resuelto","Cerrado","Cancelado"];
$priorityOptions = ["Baja","Normal","Alta","Crítica"];
$areaOptions = ["Sistemas","Administrativo","Recursos Humanos","Mantenimiento","Comercial","Gerencia","Operaciones","Estancias"];

// Prepare assigned info if provided
$assignedToName = $payload['assignedToName'] ?? '';
$assignedToEmail = $payload['to_email'] ?? '';
$isAssignment = ($assignedToEmail !== '' && $assignedToEmail !== $config['to_email']);

// Badge settings
$badgeColor = $isAssignment ? '#1976d2' : '#1a73e8';
$badgeText  = $isAssignment ? '🟦 NOTIFICACIÓN DE ASIGNACIÓN' : '🆕 Nuevo ticket creado';

$createdAt = $payload['createdDateString'] ?? $payload['createdDate'] ?? date('Y-m-d H:i:s');

// Resolve human-readable labels
$areaLabel = '';
if ($requestingArea !== null && isset($areaOptions[$requestingArea])) {
  $areaLabel = $areaOptions[$requestingArea];
  // If branchName provided and area is Estancias (index 7), append branch
  if ($requestingArea === 7 && !empty($payload['branchName'])) {
    $areaLabel .= ' - ' . htmlspecialchars($payload['branchName']);
  }
} elseif (!empty($payload['requestingAreaName'])) {
  $areaLabel = $payload['requestingAreaName'];
} else {
  $areaLabel = ($requestingArea !== null ? $requestingArea : '');
}

$priorityLabel = ($priority !== null && isset($priorityOptions[$priority])) ? $priorityOptions[$priority] : ($priority !== null ? $priority : '');
$statusLabel = ($status !== null && isset($statusOptions[$status])) ? $statusOptions[$status] : ($status !== null ? $status : '');

$bodyHtml = "<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='font-family:Arial,sans-serif; margin:0; padding:0; background:#f3f4f6;'>
  <div style='max-width:600px;margin:20px auto;background:#fff;border-radius:6px;overflow:hidden;'>
    <div style='background:linear-gradient(135deg, {$badgeColor} 0%, #0f62c9 100%);padding:20px 24px;color:#fff;'>
      <h1 style='margin:0;font-size:20px;'>Sistema de Tickets</h1>
      <p style='margin:6px 0 0 0;opacity:0.95;font-size:13px;'>Notificación automática</p>
    </div>

    <div style='padding:20px 24px;'>
      <div style='display:block;background:{$badgeColor};color:#fff;padding:10px;border-radius:6px;font-weight:700;margin-bottom:18px;text-align:center;'>{$badgeText}</div>

      <h2 style='color:{$badgeColor};margin:0 0 12px 0;font-size:18px;'>" . htmlspecialchars($payload['subject'] ?? $subject) . "</h2>

      <div style='background:#f7f7f7;padding:14px;border-radius:6px;margin-bottom:16px;'>
        <table style='width:100%;border-collapse:collapse;'>
          " . row('Ticket #', $ref)
          . row('Título', $title)
          . row('Área', $areaLabel)
          . row('Prioridad', $priorityLabel)
          . row('Estado', $statusLabel)
          . row('Creado por', "$createdByName") . ""
          . ($isAssignment ? row('Asignado a', ($assignedToName ? htmlspecialchars($assignedToName) : htmlspecialchars($assignedToEmail))) : '') . "
        </table>
      </div>

      <div style='margin-bottom:16px;'>
        <strong style='color:#555;'>Descripción</strong>
        <div style='margin-top:8px;color:#333;line-height:1.5;'>" . nl2br(htmlspecialchars($description)) . "</div>
      </div>

      <div style='background:#fafafa;padding:12px;border-radius:6px;font-size:12px;color:#666;text-align:center;'>
        Enviado: {$createdAt} — Entorno: " . ($config['debug'] ? 'DESARROLLO' : 'PRODUCCIÓN') . "
      </div>
    </div>

    <div style='background:#f5f5f5;padding:12px 20px;text-align:center;border-top:3px solid {$badgeColor};'>
      <p style='margin:0;color:#666;font-size:13px;'><strong>Los Olivos Estancias</strong></p>
      <p style='margin:2px 0 0 0;color:#999;font-size:12px;'>Sistema de Gestión Administrativa</p>
    </div>
  </div>
</body>
</html>";

// ── Envío ──────────────────────────────────────────────────────────────────
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

    $mail->setFrom($config['from_email'], $config['from_name']);
    // Allow overriding recipient via payload (useful for assignment emails)
    $toEmail = $payload['to_email'] ?? $config['to_email'];
    $mail->addAddress($toEmail);

    // Copia al creador si tiene email válido
    if ($createdByEmail && filter_var($createdByEmail, FILTER_VALIDATE_EMAIL) && $createdByEmail !== $config['to_email']) {
        $mail->addBCC($createdByEmail, $createdByName);
        $mail->addReplyTo($createdByEmail, $createdByName);
    }

    $mail->isHTML(true);
    // Allow subject override from payload
    $mail->Subject = $payload['subject'] ?? $subject;
    $mail->Body    = $bodyHtml;
    $mail->AltBody = strip_tags(str_replace(array('</tr>','</td>','<br>','<br/>','</p>'), "\n", $bodyHtml));

    $mail->send();

    echo json_encode([
      'success'     => true,
      'message'     => 'Correo enviado exitosamente',
      'to'          => $toEmail,
      'environment' => $config['debug'] ? 'local' : 'production',
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Error al enviar correo',
        'details' => $mail->ErrorInfo,
    ]);
}
