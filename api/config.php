<?php
// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    die('Access denied');
}

// Database configuration
define('DB_HOST', 'localhost'); // Usually localhost on Hostinger
define('DB_NAME', 'u194804399_switghchat');
define('DB_USER', 'u194804399_schat');
define('DB_PASS', '2Zj@O45^@');

// CORS settings (adjust domain after deployment)
define('ALLOWED_ORIGIN', 'https://switgh.com/'); // Change to your domain in production
?>
