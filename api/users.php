<?php
define('API_ACCESS', true);
require_once 'db.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            // Get all users or single user
            if (isset($_GET['id'])) {
                $stmt = $db->prepare("SELECT id, name, email FROM users WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                $user = $stmt->fetch();
                sendJSON($user ? $user : ['error' => 'User not found'], $user ? 200 : 404);
            } else {
                $stmt = $db->query("SELECT id, name, email FROM users LIMIT 100");
                $users = $stmt->fetchAll();
                sendJSON(['users' => $users]);
            }
            break;
            
        case 'POST':
            // Create new user
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['name']) || !isset($data['email'])) {
                sendJSON(['error' => 'Name and email required'], 400);
            }
            
            $stmt = $db->prepare("INSERT INTO users (name, email) VALUES (?, ?)");
            $stmt->execute([$data['name'], $data['email']]);
            
            sendJSON([
                'message' => 'User created',
                'id' => $db->lastInsertId()
            ], 201);
            break;
            
        default:
            sendJSON(['error' => 'Method not allowed'], 405);
    }
} catch(PDOException $e) {
    sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
