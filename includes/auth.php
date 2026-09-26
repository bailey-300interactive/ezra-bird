<?php
require_once __DIR__ . '/config.php';

function is_admin_logged_in(): bool {
    return !empty($_SESSION['is_admin']);
}

function require_admin_login(): void {
    if (!is_admin_logged_in()) {
        header('Location: login.php');
        exit;
    }
}
