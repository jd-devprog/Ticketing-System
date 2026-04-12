<?php
header('Content-Type: application/json; charset=utf-8');

// Simple endpoint to simulate sending a password reset link.
// Expects POST with `email` field. In production replace with real lookup and mailer.

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$email = isset($_POST['email']) ? trim($_POST['email']) : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Please provide a valid email address.']);
    exit;
}

// Example validation: only accept emails containing an @ (no restriction here)
// Here we simulate success; in a real app check DB for user and send a secure token link.

// Simulate a short processing delay
usleep(300000);

// Respond with a generic message to avoid leaking account existence
echo json_encode([
    'success' => true,
    'message' => 'If that email is registered, a password reset link has been sent.'
]);

?>