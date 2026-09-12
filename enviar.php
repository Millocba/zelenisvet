<?php
declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=utf-8');

const MAX_RATE = 5;
const RATE_WINDOW = 3600;
const DESTINATION = 'informacion@zelenisvet.com.ar';

if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}
$csrf = $_SESSION['csrf'];

function fail(int $code, string $message): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function ok(string $message, array $extra = []): void {
    echo json_encode(['ok' => true, 'message' => $message] + $extra, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET' && (($_GET['action'] ?? '') === 'token')) {
    ok('', ['csrf_token' => $csrf]);
}

if ($method !== 'POST') {
    fail(405, 'Método no permitido.');
}

// --- Rate limit: per IP, stored in session ---
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rlKey = 'rl_' . hash('sha256', $ip);
$now = time();

if (!isset($_SESSION[$rlKey]) || !is_array($_SESSION[$rlKey])) {
    $_SESSION[$rlKey] = ['count' => 0, 'reset' => $now + RATE_WINDOW];
}
if ($now >= $_SESSION[$rlKey]['reset']) {
    $_SESSION[$rlKey] = ['count' => 0, 'reset' => $now + RATE_WINDOW];
}
if ($_SESSION[$rlKey]['count'] >= MAX_RATE) {
    fail(429, 'Demasiados intentos. Intente más tarde.');
}
++$_SESSION[$rlKey]['count'];

// --- Honeypot: bots fill the hidden "website" field ---
if (!empty($_POST['website'])) {
    ok('Mensaje enviado correctamente.');
}

// --- CSRF ---
$token = (string)($_POST['csrf'] ?? '');
if ($token === '' || !hash_equals($csrf, $token)) {
    fail(403, 'Sesión inválida. Recargue la página.');
}

// --- Raw input ---
$name  = trim((string)($_POST['nombre'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$phone = trim((string)($_POST['telefono'] ?? ''));
$text  = trim((string)($_POST['mensaje'] ?? ''));

// --- Reject header injection characters (CR/LF/NUL) on every field ---
foreach ([$name, $email, $phone, $text] as $field) {
    if (preg_match('/[\r\n\0]/', $field)) {
        fail(422, 'Datos inválidos.');
    }
}

// --- Validation ---
$invalid = [];
if (mb_strlen($name) < 2 || mb_strlen($name) > 60) {
    $invalid[] = 'nombre';
}
if (mb_strlen($email) > 120 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $invalid[] = 'email';
}
if (mb_strlen($phone) > 20 || !preg_match('/^[0-9+\-\s().]{6,20}$/', $phone)) {
    $invalid[] = 'telefono';
}
if (mb_strlen($text) < 10 || mb_strlen($text) > 2000) {
    $invalid[] = 'mensaje';
}

if ($invalid) {
    fail(422, 'Datos inválidos en: ' . implode(', ', $invalid));
}

// --- Compose and send ---
$subject = 'Nuevo mensaje desde zelenisvet.com.ar';
$body = "Nombre: {$name}\n"
      . "Email: {$email}\n"
      . "Teléfono: {$phone}\n"
      . "-----------------------------\n"
      . "{$text}\n";

$headers = "From: Web ZELENI SVET <no-reply@zelenisvet.com.ar>\r\n"
         . "Reply-To: {$email}\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n"
         . "MIME-Version: 1.0\r\n"
         . "X-Mailer: PHP/" . phpversion();

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$sent = @mail(DESTINATION, $encodedSubject, $body, $headers);

if ($sent) {
    $_SESSION[$rlKey]['count'] = 0;
    ok('Mensaje enviado correctamente.');
}

fail(500, 'Hubo un error al enviar el mensaje. Intente nuevamente.');
