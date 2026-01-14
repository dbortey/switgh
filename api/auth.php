<?php
define('API_ACCESS', true);
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

// Get request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch($action) {
        case 'register':
            if ($method !== 'POST') {
                sendJSON(['error' => 'Method not allowed'], 405);
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $username = strtolower(trim($data['username'] ?? ''));
            $password = $data['password'] ?? '';
            
            // Validate username format
            if (!preg_match('/^[a-z0-9._]{3,30}$/', $username)) {
                sendJSON(['error' => 'Username must be 3-30 characters, lowercase letters, numbers, dots, or underscores only'], 400);
            }
            
            if (strpos($username, '..') !== false) {
                sendJSON(['error' => 'Username cannot contain consecutive dots'], 400);
            }
            
            if ($username[0] === '.' || substr($username, -1) === '.') {
                sendJSON(['error' => 'Username cannot start or end with a dot'], 400);
            }
            
            // Validate password
            if (strlen($password) < 6) {
                sendJSON(['error' => 'Password must be at least 6 characters'], 400);
            }
            
            // Check if username exists
            $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetch()) {
                sendJSON(['error' => 'Username already taken'], 409);
            }
            
            // Hash password and create user
            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $db->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
            $stmt->execute([$username, $password_hash]);
            
            $user_id = $db->lastInsertId();
            
            // Create session
            $session_id = startSession($db, $user_id, false);
            
            // Get user data
            $stmt = $db->prepare("SELECT id, username, profile_pic, online_status FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch();
            
            sendJSON([
                'success' => true,
                'message' => 'Account created successfully',
                'user' => $user,
                'session_id' => $session_id
            ], 201);
            break;
            
        case 'login':
            if ($method !== 'POST') {
                sendJSON(['error' => 'Method not allowed'], 405);
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $username = strtolower(trim($data['username'] ?? ''));
            $password = $data['password'] ?? '';
            $remember_me = $data['remember_me'] ?? false;
            
            // Get user by username
            $stmt = $db->prepare("SELECT id, username, password_hash, profile_pic, online_status FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch();
            
            if (!$user || !password_verify($password, $user['password_hash'])) {
                sendJSON(['error' => 'Invalid username or password'], 401);
            }
            
            // Create session
            $session_id = startSession($db, $user['id'], $remember_me);
            
            // Update online status
            updateOnlineStatus($db, $user['id'], true);
            
            // Remove password_hash from response
            unset($user['password_hash']);
            $user['online_status'] = true;
            
            sendJSON([
                'success' => true,
                'message' => 'Login successful',
                'user' => $user,
                'session_id' => $session_id
            ]);
            break;
            
        case 'logout':
            if ($method !== 'POST') {
                sendJSON(['error' => 'Method not allowed'], 405);
            }
            
            $user_id = validateSession($db);
            if (!$user_id) {
                sendJSON(['error' => 'Not authenticated'], 401);
            }
            
            // Update online status
            updateOnlineStatus($db, $user_id, false);
            
            // Destroy session
            destroySession($db);
            
            sendJSON([
                'success' => true,
                'message' => 'Logout successful'
            ]);
            break;
            
        case 'check':
            if ($method !== 'GET') {
                sendJSON(['error' => 'Method not allowed'], 405);
            }
            
            $user_id = validateSession($db);
            if (!$user_id) {
                sendJSON(['authenticated' => false, 'user' => null]);
            }
            
            // Get user data
            $stmt = $db->prepare("SELECT id, username, profile_pic, online_status FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch();
            
            if (!$user) {
                destroySession($db);
                sendJSON(['authenticated' => false, 'user' => null]);
            }
            
            sendJSON([
                'authenticated' => true,
                'user' => $user
            ]);
            break;
            
        default:
            sendJSON(['error' => 'Invalid action'], 400);
    }
} catch(PDOException $e) {
    sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
