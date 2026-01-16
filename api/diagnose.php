<?php
// Enable error display for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

$results = [
    'php_version' => phpversion(),
    'tests' => []
];

// Test 1: Can we include config?
try {
    define('API_ACCESS', true);
    require_once 'config.php';
    $results['tests']['config_loaded'] = true;
    $results['db_host'] = DB_HOST;
    $results['db_name'] = DB_NAME;
    $results['db_user'] = DB_USER;
} catch (Exception $e) {
    $results['tests']['config_loaded'] = false;
    $results['config_error'] = $e->getMessage();
}

// Test 2: Can we connect to database?
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";charset=utf8mb4",
        DB_USER,
        DB_PASS
    );
    $results['tests']['db_connection'] = true;
} catch (PDOException $e) {
    $results['tests']['db_connection'] = false;
    $results['db_connection_error'] = $e->getMessage();
}

// Test 3: Does the database exist?
if ($results['tests']['db_connection']) {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS
        );
        $results['tests']['db_exists'] = true;
        
        // Test 4: Check if users table exists
        $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
        $results['tests']['users_table_exists'] = $stmt->rowCount() > 0;
        
        // Test 5: Check if sessions table exists
        $stmt = $pdo->query("SHOW TABLES LIKE 'sessions'");
        $results['tests']['sessions_table_exists'] = $stmt->rowCount() > 0;
        
        // List all tables
        $stmt = $pdo->query("SHOW TABLES");
        $results['tables'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
    } catch (PDOException $e) {
        $results['tests']['db_exists'] = false;
        $results['db_exists_error'] = $e->getMessage();
    }
}

echo json_encode($results, JSON_PRETTY_PRINT);
