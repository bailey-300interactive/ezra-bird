<?php require_once __DIR__ . '/includes/config.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="apple-touch-icon" href="assets/img/app-icon-1024.png">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#8FD9FF">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Ezra Bird">
<title>Flappy Faces</title>
<link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="game-wrap">
    <h1 class="game-title">Ezra Bird 🐣</h1>
    <p class="game-subtitle">Tap or press SPACE to fly through the clouds!</p>

    <div class="stage" id="stage">
      <canvas id="gameCanvas" width="480" height="640"></canvas>

      <!-- On-screen toolbar during play: back to player select, quick face
           switcher (no need to leave the game), and a full-screen toggle.
           Hidden while the picker is open since it would sit under it. -->
      <div id="gameToolbar" class="game-toolbar hidden">
        <button id="backBtn" class="toolbar-btn" title="Back to player select" aria-label="Back to player select">⬅</button>
        <div id="miniFaceRow" class="mini-face-row"></div>
        <button id="fullscreenBtn" class="toolbar-btn" title="Full screen" aria-label="Full screen">⛶</button>
      </div>

      <!-- Face picker shown before the game starts -->
      <div id="pickerOverlay" class="overlay">
        <h2>Who's flying today?</h2>
        <div id="pickerGrid" class="picker-grid"></div>
        <button id="startBtn" class="btn btn-primary" disabled>Start!</button>
      </div>

      <!-- Shown after losing all hearts -->
      <div id="endOverlay" class="overlay hidden">
        <h2 id="endMessage">Great flying!</h2>
        <p id="endScore"></p>
        <button id="playAgainBtn" class="btn btn-primary">Play again</button>
        <button id="changePlayerBtn" class="btn btn-ghost">Choose a different flyer</button>
      </div>
    </div>

    <div class="hud">
      <div class="score-pill">Score: <span id="scoreLabel">0</span></div>
      <div class="hearts" id="heartsLabel">❤️❤️❤️</div>
      <button id="soundBtn" class="sound-toggle" title="Mute / unmute music">🔊</button>
    </div>

    <footer class="hint">Made for little pilots. No scary stuff, promise! · <a href="admin/login.php">Admin</a></footer>
  </div>

  <script src="js/game.js"></script>
</body>
</html>
