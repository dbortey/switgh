<?php
// Test if posts.php is accessible and session is valid
header('Content-Type: application/json');
define('API_ACCESS', true);

try {
    require_once 'db.php';
    
    session_start();
    $database = new Database();
    $db = $database->getConnection();
    
    $sessionValid = false;
    $currentUserId = null;
    
    if (isset($_COOKIE['session_id'])) {
        $sessionData = $database->validateSession($_COOKIE['session_id']);
        if ($sessionData) {
            $sessionValid = true;
            $currentUserId = $sessionData['user_id'];
        }
    }
    
    echo json_encode([
        'session_cookie_exists' => isset($_COOKIE['session_id']),
        'session_cookie_value' => isset($_COOKIE['session_id']) ? substr($_COOKIE['session_id'], 0, 10) . '...' : null,
        'session_valid' => $sessionValid,
        'current_user_id' => $currentUserId,
        'test' => 'Posts endpoint reachable'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Test failed',
        'message' => $e->getMessage()
    ]);
}
