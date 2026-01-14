<?php
define('API_ACCESS', true);
require_once 'config.php';

class Database {
    private $conn = null;
    
    public function __construct() {
        try {
            $this->conn = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit();
        }
    }
    
    public function getConnection() {
        return $this->conn;
    }
}

// Helper function to send JSON response
function sendJSON($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
    
    // Handle preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
    
    echo json_encode($data);
    exit();
}

// Session Management Functions

/**
 * Start a new session for a user
 * @param PDO $db Database connection
 * @param int $user_id User ID
 * @param bool $remember_me Whether to create a long-lived session
 * @return string Session ID
 */
function startSession($db, $user_id, $remember_me = false) {
    // Generate secure session ID
    $session_id = bin2hex(random_bytes(32));
    
    // Calculate expiration time
    // Remember me: 30 days, Regular: 24 hours
    $expires_hours = $remember_me ? 720 : 24;
    $expires_at = date('Y-m-d H:i:s', time() + ($expires_hours * 3600));
    
    // Insert session into database
    $stmt = $db->prepare("INSERT INTO sessions (session_id, user_id, expires_at, remember_me) VALUES (?, ?, ?, ?)");
    $stmt->execute([$session_id, $user_id, $expires_at, $remember_me ? 1 : 0]);
    
    // Set cookie
    $cookie_time = $remember_me ? (time() + 30 * 24 * 3600) : 0; // 0 = session cookie
    setcookie('session_id', $session_id, [
        'expires' => $cookie_time,
        'path' => '/',
        'httponly' => true,
        'secure' => isset($_SERVER['HTTPS']),
        'samesite' => 'Lax'
    ]);
    
    return $session_id;
}

/**
 * Validate current session and return user ID
 * @param PDO $db Database connection
 * @return int|false User ID if valid, false otherwise
 */
function validateSession($db) {
    $session_id = $_COOKIE['session_id'] ?? null;
    
    if (!$session_id) {
        return false;
    }
    
    // Check if session exists and is not expired
    $stmt = $db->prepare("SELECT user_id, expires_at FROM sessions WHERE session_id = ?");
    $stmt->execute([$session_id]);
    $session = $stmt->fetch();
    
    if (!$session) {
        return false;
    }
    
    // Check if expired
    if (strtotime($session['expires_at']) < time()) {
        // Delete expired session
        $stmt = $db->prepare("DELETE FROM sessions WHERE session_id = ?");
        $stmt->execute([$session_id]);
        return false;
    }
    
    return $session['user_id'];
}

/**
 * Destroy current session
 * @param PDO $db Database connection
 */
function destroySession($db) {
    $session_id = $_COOKIE['session_id'] ?? null;
    
    if ($session_id) {
        // Delete from database
        $stmt = $db->prepare("DELETE FROM sessions WHERE session_id = ?");
        $stmt->execute([$session_id]);
    }
    
    // Clear cookie
    setcookie('session_id', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'httponly' => true,
        'secure' => isset($_SERVER['HTTPS']),
        'samesite' => 'Lax'
    ]);
}

/**
 * Update user's online status
 * @param PDO $db Database connection
 * @param int $user_id User ID
 * @param bool $status Online status (true/false)
 */
function updateOnlineStatus($db, $user_id, $status) {
    $stmt = $db->prepare("UPDATE users SET online_status = ? WHERE id = ?");
    $stmt->execute([$status ? 1 : 0, $user_id]);
}
?>
