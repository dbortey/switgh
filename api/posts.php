<?php
// Always output JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

define('API_ACCESS', true);
require_once 'db.php';

// Validate session for all requests
session_start();
$database = new Database();
$db = $database->getConnection();

// Validate user session
$sessionValid = false;
$currentUserId = null;

if (isset($_COOKIE['session_id'])) {
    $sessionData = $database->validateSession($_COOKIE['session_id']);
    if ($sessionData) {
        $sessionValid = true;
        $currentUserId = $sessionData['user_id'];
    }
}

if (!$sessionValid) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - please login']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'feed';

try {
    switch($action) {
        case 'feed':
            // GET /api/posts.php?action=feed - Get posts for news feed
            if ($method !== 'GET') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                exit();
            }
            
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            
            $stmt = $db->prepare("
                SELECT 
                    p.id,
                    p.user_id,
                    p.image_url,
                    p.video_url,
                    p.caption,
                    p.created_at,
                    u.username,
                    u.profile_pic,
                    COUNT(DISTINCT l.user_id) as like_count,
                    MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) as user_liked
                FROM posts p
                INNER JOIN users u ON p.user_id = u.id
                LEFT JOIN likes l ON p.id = l.post_id
                GROUP BY p.id, p.user_id, p.image_url, p.video_url, p.caption, p.created_at, u.username, u.profile_pic
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?
            ");
            
            $stmt->execute([$currentUserId, $limit, $offset]);
            $posts = $stmt->fetchAll();
            
            // Convert like_count and user_liked to proper types
            foreach ($posts as &$post) {
                $post['like_count'] = (int)$post['like_count'];
                $post['user_liked'] = (bool)$post['user_liked'];
            }
            
            echo json_encode(['posts' => $posts]);
            break;
            
        case 'create':
            // POST /api/posts.php?action=create - Create a new post
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                exit();
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $caption = trim($data['caption'] ?? '');
            $imageUrl = trim($data['image_url'] ?? '');
            $videoUrl = trim($data['video_url'] ?? '');
            
            // At least one of caption, image, or video must be present
            if (empty($caption) && empty($imageUrl) && empty($videoUrl)) {
                http_response_code(400);
                echo json_encode(['error' => 'Post must have a caption, image, or video']);
                exit();
            }
            
            // Validate URLs if provided
            if ($imageUrl && !filter_var($imageUrl, FILTER_VALIDATE_URL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid image URL']);
                exit();
            }
            
            if ($videoUrl && !filter_var($videoUrl, FILTER_VALIDATE_URL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid video URL']);
                exit();
            }
            
            $stmt = $db->prepare("
                INSERT INTO posts (user_id, image_url, video_url, caption)
                VALUES (?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $currentUserId,
                $imageUrl ?: null,
                $videoUrl ?: null,
                $caption ?: null
            ]);
            
            $postId = $db->lastInsertId();
            
            // Fetch the created post with user info
            $stmt = $db->prepare("
                SELECT 
                    p.id,
                    p.user_id,
                    p.image_url,
                    p.video_url,
                    p.caption,
                    p.created_at,
                    u.username,
                    u.profile_pic,
                    0 as like_count,
                    0 as user_liked
                FROM posts p
                INNER JOIN users u ON p.user_id = u.id
                WHERE p.id = ?
            ");
            
            $stmt->execute([$postId]);
            $post = $stmt->fetch();
            
            http_response_code(201);
            echo json_encode(['post' => $post]);
            break;
            
        case 'delete':
            // DELETE /api/posts.php?action=delete&id=123 - Delete a post
            if ($method !== 'DELETE') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                exit();
            }
            
            $postId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            
            if (!$postId) {
                http_response_code(400);
                echo json_encode(['error' => 'Post ID required']);
                exit();
            }
            
            // Check if post exists and belongs to current user
            $stmt = $db->prepare("SELECT user_id FROM posts WHERE id = ?");
            $stmt->execute([$postId]);
            $post = $stmt->fetch();
            
            if (!$post) {
                http_response_code(404);
                echo json_encode(['error' => 'Post not found']);
                exit();
            }
            
            if ($post['user_id'] != $currentUserId) {
                http_response_code(403);
                echo json_encode(['error' => 'You can only delete your own posts']);
                exit();
            }
            
            $stmt = $db->prepare("DELETE FROM posts WHERE id = ?");
            $stmt->execute([$postId]);
            
            echo json_encode(['message' => 'Post deleted successfully']);
            break;
            
        case 'like':
            // POST /api/posts.php?action=like&id=123 - Toggle like on a post
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
                exit();
            }
            
            $postId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            
            if (!$postId) {
                http_response_code(400);
                echo json_encode(['error' => 'Post ID required']);
                exit();
            }
            
            // Check if post exists
            $stmt = $db->prepare("SELECT id FROM posts WHERE id = ?");
            $stmt->execute([$postId]);
            
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'Post not found']);
                exit();
            }
            
            // Check if already liked
            $stmt = $db->prepare("SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?");
            $stmt->execute([$postId, $currentUserId]);
            $alreadyLiked = $stmt->fetch();
            
            if ($alreadyLiked) {
                // Unlike
                $stmt = $db->prepare("DELETE FROM likes WHERE post_id = ? AND user_id = ?");
                $stmt->execute([$postId, $currentUserId]);
                $liked = false;
            } else {
                // Like
                $stmt = $db->prepare("INSERT INTO likes (post_id, user_id) VALUES (?, ?)");
                $stmt->execute([$postId, $currentUserId]);
                $liked = true;
            }
            
            // Get updated like count
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM likes WHERE post_id = ?");
            $stmt->execute([$postId]);
            $result = $stmt->fetch();
            $likeCount = (int)$result['count'];
            
            echo json_encode([
                'liked' => $liked,
                'like_count' => $likeCount
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error occurred', 'details' => $e->getMessage()]);
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred', 'details' => $e->getMessage()]);
}
