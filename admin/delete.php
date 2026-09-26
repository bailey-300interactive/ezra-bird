<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';

require_admin_login();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = (int)($_POST['id'] ?? 0);

    $stmt = get_db()->prepare("SELECT image_path FROM faces WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $face = $stmt->fetch();

    if ($face) {
        $del = get_db()->prepare("DELETE FROM faces WHERE id = :id");
        $del->execute(['id' => $id]);

        // Remove the photo file too, if it lives in our uploads folder.
        $filePath = __DIR__ . '/../' . $face['image_path'];
        if (is_file($filePath) && strpos(realpath($filePath), realpath(UPLOAD_DIR)) === 0) {
            @unlink($filePath);
        }
    }
}

header('Location: index.php');
exit;
