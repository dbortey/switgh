<?php
define('API_ACCESS', true);
require_once 'config.php';
require_once 'db.php';

// CORS and headers
header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Example API endpoint
$database = new Database();
$db = $database->getConnection();

// Example: Get data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $query = "SELECT * FROM your_table LIMIT 10";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $results = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $results]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

// Example: Post data
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $query = "INSERT INTO your_table (column1, column2) VALUES (:value1, :value2)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':value1', $data['field1']);
        $stmt->bindParam(':value2', $data['field2']);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Data inserted successfully']);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
