<?php
// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    die('Access denied');
}

// Database configuration
define('DB_HOST', 'localhost'); // Usually localhost on Hostinger
define('DB_NAME', 'switghchat');
define('DB_USER', 'schat');
define('DB_PASS', 'fFe!|>iu:W7@');

// CORS settings (adjust domain after deployment)
define('ALLOWED_ORIGIN', 'https://switgh.com/'); // Change to your domain in production
?>
