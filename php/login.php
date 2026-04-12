<?php
header('Content-Type: application/json');

// Handle CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Support JSON body or form-encoded
    $contentType = isset($_SERVER['CONTENT_TYPE']) ? strtolower(trim($_SERVER['CONTENT_TYPE'])) : '';
    $input = [];
    if (strpos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?: [];
    } else {
        $input = $_POST;
    }

    $email = isset($input['email']) ? trim($input['email']) : '';
    $password = isset($input['password']) ? $input['password'] : '';

    if (empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Email and password are required']);
        exit();
    }

    // Attempt to authenticate against MySQL users table
    try {
        $cfg = require __DIR__ . '/config.php';
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $cfg['host'], $cfg['port'], $cfg['database']);
        $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

        $stmt = $pdo->prepare('SELECT id, email, password, displayName, role, department FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
            exit();
        }

        $hash = $user['password'];
        // Use PHP's password_verify to check bcrypt hashes
        $ok = false;
        if (!empty($hash) && function_exists('password_verify')) {
            $ok = password_verify($password, $hash);
        }

        if (!$ok) {
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
            exit();
        }

        // Successful login: return user object
        $respUser = [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'displayName' => $user['displayName'] ?? '',
            'role' => $user['role'] ?? 'user',
            'department' => isset($user['department']) ? ($user['department'] ?? '') : ''
        ];
        
        // Log what we're returning for debugging
        error_log('[LOGIN] User from DB: ' . json_encode($user));
        error_log('[LOGIN] Responding with: ' . json_encode($respUser));

        // record audit log for login
        try {
            // derive IP similar to Node helper
            $ip = '';
            if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
                $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
                $ip = trim($ips[0]);
            } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
                $ip = $_SERVER['REMOTE_ADDR'];
            }
            if ($ip === '::1') {
                $ip = '127.0.0.1';
            }
            if (strpos($ip, '::ffff:') === 0) {
                $parts = explode(':', $ip);
                $ip = end($parts);
            }
            $auditStmt = $pdo->prepare('INSERT INTO auditLog (userEmail, action, entityType, details, ipAddress) VALUES (?, ?, ?, ?, ?)');
            $auditStmt->execute([$email, 'User login', 'login', json_encode(['role'=>$user['role'] ?? null]), $ip]);
        } catch (Exception $ae) {
            error_log('Audit insert failed on login: '. $ae->getMessage());
        }

        echo json_encode(['success' => true, 'user' => $respUser]);
        exit();
    } catch (Exception $e) {
        error_log('Login error: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Server error']);
        exit();
    }
}
?>
