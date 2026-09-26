<?php
require_once __DIR__ . '/../includes/db.php';

header('Content-Type: application/json');

try {
    $stmt = get_db()->query(
        "SELECT id, name, image_path FROM faces WHERE is_active = 1 ORDER BY created_at ASC"
    );
    $faces = $stmt->fetchAll();
    echo json_encode(['ok' => true, 'faces' => $faces]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Could not load faces right now.']);
}
