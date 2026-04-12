<?php
// Test login response
require 'php/config.php';

$cfg = require 'php/config.php';
$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $cfg['host'], $cfg['port'], $cfg['database']);
$pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$stmt = $pdo->prepare('SELECT id, email, password, displayName, role, department FROM users WHERE email = ?');
$stmt->execute(['restricted@example.com']);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

echo "Raw user from database:\n";
var_dump($user);
echo "\n\nFormatted response:\n";
$respUser = [
    'id' => (int)$user['id'],
    'email' => $user['email'],
    'displayName' => $user['displayName'] ?? '',
    'role' => $user['role'] ?? 'user',
    'department' => $user['department'] ?? ''
];
echo json_encode(['success' => true, 'user' => $respUser], JSON_PRETTY_PRINT);
?>
