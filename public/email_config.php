<?php
// Configuración de email — Sistema de Tickets Los Olivos
// Igual que administrador-web/public/email_config.php

$isLocal = in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1']) ||
           strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost:') === 0;

if ($isLocal) {
    // Configuración para DESARROLLO (Gmail)
    return [
        'smtp_host' => 'smtp.gmail.com',
        'smtp_port' => 587,
        'smtp_user' => 'agse201289@gmail.com', // Tu email de Gmail
        'smtp_pass' => 'lfdrvtotlqpyosje', // App Password de Gmail (16 caracteres) - CONFIGURA ESTO
        'smtp_secure' => 'tls',
        'from_email' => 'agse201289@gmail.com',
        'from_name' => 'Sistema Olivos - Pruebas',
        'to_email' => 'agse201289@gmail.com', // Email destino para pruebas
        'debug' => true
    ];
} else {
    // Configuración para PRODUCCIÓN (Hostinger)
    return [
        'smtp_host' => 'smtp.gmail.com',
        'smtp_port' => 587,
        'smtp_user' => 'agse201289@gmail.com', // Tu email de Hostinger
        'smtp_pass' => 'lfdrvtotlqpyosje', // Tu password de Hostinger - CONFIGURAR EN PRODUCCIÓN
        'smtp_secure' => 'tls',
        'from_email' => 'noreply@losolivosestancias.com',
        'from_name' => 'Sistema Olivos',
        'to_email' => 'agse201289@gmail.com', // Email destino
        'debug' => false
    ];
}
