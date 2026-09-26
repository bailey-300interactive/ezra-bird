<?php require_once __DIR__ . '/includes/config.php'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="apple-touch-icon" href="assets/img/app-icon-1024.png">
<title>Flappy Faces</title>
<link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="game-wrap">
    <h1 class="game-title">Ezra Bird 🐣</h1>
    <p class="game-subtitle">Tap or press SPACE to fly through the clouds!</p>

    <div class="stage">
      <canvas id="gameCanvas" width="480" height="640"></canvas>

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
