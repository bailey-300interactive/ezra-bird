<?php
require_once __DIR__ . '/config.php';

/**
 * Handle a single uploaded photo, validate it, and save it into UPLOAD_DIR.
 * Returns the web-relative path (for storing in the DB) on success,
 * or throws an Exception with a friendly message on failure.
 */
function save_uploaded_face(array $file): string {
    if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('That photo did not upload. Please try again.');
    }
    if ($file['size'] > MAX_UPLOAD_BYTES) {
        throw new Exception('That photo is too big. Please choose one under 3MB.');
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ALLOWED_EXTENSIONS, true)) {
        throw new Exception('Please upload a JPG, PNG, GIF, or WEBP photo.');
    }

    // Confirm it's really an image (not just a renamed file).
    $imageInfo = @getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        throw new Exception('That file does not look like a valid photo.');
    }

    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }

    $safeName = 'face_' . bin2hex(random_bytes(6)) . '.' . $ext;
    $destination = UPLOAD_DIR . $safeName;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        throw new Exception('Could not save the photo on the server. Check folder permissions.');
    }

    return UPLOAD_URL . $safeName;
}

function h(string $text): string {
    return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
}
