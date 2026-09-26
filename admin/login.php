<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';
    if (hash_equals(ADMIN_PASSWORD, $password)) {
        $_SESSION['is_admin'] = true;
        header('Location: index.php');
        exit;
    }
    $error = 'That password is not right. Try again.';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Admin Login · Flappy Faces</title>
<link rel="stylesheet" href="../css/style.css">
</head>
<body class="admin-body">
  <div class="admin-login-card">
    <div class="admin-login-emoji">🪁</div>
    <h1>Ezra Bird Admin</h1>
    <p class="muted">Sign in to add or remove players.</p>
    <?php if ($error): ?>
      <p class="error-msg"><?= h($error) ?></p>
    <?php endif; ?>
    <form method="post">
      <label for="password">Admin password</label>
      <input type="password" id="password" name="password" autofocus required>
      <button type="submit" class="btn btn-primary btn-block">Log in</button>
    </form>
    <a class="back-link" href="../index.php">← Back to the game</a>
  </div>
</body>
</html>
