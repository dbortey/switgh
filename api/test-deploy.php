<?php
// Simple test file to verify deployment
header('Content-Type: application/json');
echo json_encode([
    'message' => 'Deployment test successful',
    'timestamp' => date('Y-m-d H:i:s'),
    'files_in_directory' => scandir(__DIR__)
]);
