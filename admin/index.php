<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/db.php';

require_admin_login();

$message = '';
$error = '';

// --- Handle "add player" form submission ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add') {
    $name = trim($_POST['name'] ?? '');
    if ($name === '') {
        $error = 'Please give this player a name.';
    } elseif (empty($_FILES['photo']['name'])) {
        $error = 'Please choose a photo.';
    } else {
        try {
            $path = save_uploaded_face($_FILES['photo']);
            $stmt = get_db()->prepare(
                "INSERT INTO faces (name, image_path, is_active) VALUES (:name, :path, 1)"
            );
            $stmt->execute(['name' => $name, 'path' => $path]);
            $message = h($name) . ' was added! 🎉';
        } catch (Exception $e) {
            $error = $e->getMessage();
        }
    }
}

// --- Handle active/inactive toggle ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'toggle') {
    $id = (int)($_POST['id'] ?? 0);
    $stmt = get_db()->prepare("UPDATE faces SET is_active = 1 - is_active WHERE id = :id");
    $stmt->execute(['id' => $id]);
}

$faces = get_db()->query("SELECT * FROM faces ORDER BY created_at DESC")->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Manage Players · Fla</title>
<link rel="stylesheet" href="../css/style.css">
</head>
<body class="admin-body">
  <header class="admin-header">
    <h1>🪁 Ezra Bird — Manage Players</h1>
    <nav>
      <a href="../index.php" class="btn btn-ghost">Play the game</a>
      <a href="logout.php" class="btn btn-ghost">Log out</a>
    </nav>
  </header>

  <main class="admin-main">
    <?php if ($message): ?><p class="success-msg"><?= $message ?></p><?php endif; ?>
    <?php if ($error): ?><p class="error-msg"><?= h($error) ?></p><?php endif; ?>

    <section class="admin-card">
      <h2>Add a new player</h2>
      <form method="post" enctype="multipart/form-data" class="add-form">
        <input type="hidden" name="action" value="add">
        <div class="form-row">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" placeholder="e.g. Ethan" maxlength="60" required>
        </div>
        <div class="form-row">
          <label for="photo">Photo (a clear face photo works best)</label>
          <input type="file" id="photo" name="photo" accept="image/*" required>
        </div>
        <button type="submit" class="btn btn-primary">Add player</button>
      </form>
    </section>

    <section class="admin-card">
      <h2>Current players (<?= count($faces) ?>)</h2>
      <?php if (empty($faces)): ?>
        <p class="muted">No players yet — add one above!</p>
      <?php else: ?>
        <div class="face-grid">
          <?php foreach ($faces as $face): ?>
            <div class="face-tile <?= $face['is_active'] ? '' : 'is-inactive' ?>">
              <img src="../<?= h($face['image_path']) ?>" alt="<?= h($face['name']) ?>">
              <div class="face-tile-name"><?= h($face['name']) ?></div>
              <div class="face-tile-actions">
                <form method="post">
                  <input type="hidden" name="action" value="toggle">
                  <input type="hidden" name="id" value="<?= (int)$face['id'] ?>">
                  <button type="submit" class="btn btn-small">
                    <?= $face['is_active'] ? 'Hide from game' : 'Show in game' ?>
                  </button>
                </form>
                <form method="post" action="delete.php" onsubmit="return confirm('Remove ' + <?= json_encode($face['name']) ?> + ' for good?');">
                  <input type="hidden" name="id" value="<?= (int)$face['id'] ?>">
                  <button type="submit" class="btn btn-small btn-danger">Delete</button>
                </form>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </section>
  </main>
</body>
</html>
