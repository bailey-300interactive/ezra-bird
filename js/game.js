/* ==========================================================
   Flappy Faces — a gentle, kid-friendly Flappy Bird style game
   No scary "game over", no violence, generous gaps, slow pace.
   ========================================================== */

(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const pickerOverlay = document.getElementById('pickerOverlay');
  const pickerGrid    = document.getElementById('pickerGrid');
  const startBtn      = document.getElementById('startBtn');
  const endOverlay     = document.getElementById('endOverlay');
  const endMessage     = document.getElementById('endMessage');
  const endScoreLabel  = document.getElementById('endScore');
  const playAgainBtn   = document.getElementById('playAgainBtn');
  const scoreLabel     = document.getElementById('scoreLabel');
  const heartsLabel    = document.getElementById('heartsLabel');
  const soundBtn       = document.getElementById('soundBtn');

  /* ---------------------- Friendly sound engine ---------------------- */
  const Sound = (() => {
    let ctxAudio = null;
    let muted = localStorage.getItem('flappyFacesMuted') === '1';
    let musicTimer = null;
    let musicStep = 0;
    const melody = [523.25, 587.33, 659.25, 587.33, 523.25, 659.25, 783.99, 659.25]; // C D E D C E G E

    function ensureCtx() {
      if (!ctxAudio) {
        try {
          const Ctor = window.AudioContext || window.webkitAudioContext;
          if (Ctor) ctxAudio = new Ctor();
        } catch (e) { ctxAudio = null; }
      }
      if (ctxAudio && ctxAudio.state === 'suspended') ctxAudio.resume();
      return ctxAudio;
    }

    // Web Audio isn't available on every browser/webview a family tablet might
    // run. All sound is optional flavor, so we just skip it silently rather
    // than let a missing API break the game.
    function tone(freq, duration, type = 'sine', gainPeak = 0.18, delay = 0) {
      if (muted) return;
      const ac = ensureCtx();
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
      gain.gain.setValueAtTime(0, ac.currentTime + delay);
      gain.gain.linearRampToValueAtTime(gainPeak, ac.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);
      osc.connect(gain).connect(ac.destination);
      osc.start(ac.currentTime + delay);
      osc.stop(ac.currentTime + delay + duration + 0.02);
    }

    function flap() {
      tone(340, 0.12, 'sine', 0.14);
      tone(520, 0.10, 'sine', 0.08, 0.03);
    }

    function score() {
      tone(784, 0.10, 'triangle', 0.16);
      tone(988, 0.14, 'triangle', 0.16, 0.08);
    }

    function bump() {
      tone(220, 0.16, 'sine', 0.16);
      tone(160, 0.20, 'sine', 0.14, 0.10);
    }

    function cheer() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.15, i * 0.09));
    }

    function startMusic() {
      stopMusic();
      if (muted) return;
      const ac = ensureCtx();
      musicStep = 0;
      musicTimer = setInterval(() => {
        if (muted) return;
        const freq = melody[musicStep % melody.length];
        tone(freq, 0.35, 'sine', 0.045);
        musicStep++;
      }, 380);
    }

    function stopMusic() {
      if (musicTimer) clearInterval(musicTimer);
      musicTimer = null;
    }

    function setMuted(val) {
      muted = val;
      localStorage.setItem('flappyFacesMuted', muted ? '1' : '0');
      if (muted) stopMusic();
    }

    function isMuted() { return muted; }

    return { flap, score, bump, cheer, startMusic, stopMusic, setMuted, isMuted, ensureCtx };
  })();

  soundBtn.textContent = Sound.isMuted() ? '🔈' : '🔊';
  soundBtn.addEventListener('click', () => {
    Sound.setMuted(!Sound.isMuted());
    soundBtn.textContent = Sound.isMuted() ? '🔈' : '🔊';
    if (state === 'playing') { Sound.isMuted() ? Sound.stopMusic() : Sound.startMusic(); }
  });

  /* ---------------------- Game constants ---------------------- */
  const GRAVITY = 0.32;
  const FLAP_VELOCITY = -6.4;
  const MAX_FALL_SPEED = 6.5;
  const PILLAR_WIDTH = 78;
  const GAP_HEIGHT = 210;          // very generous gap = kid friendly
  const PILLAR_SPEED = 1.9;
  const PILLAR_INTERVAL = 1750;    // ms between new pillars, gives time to react
  const GROUND_HEIGHT = 60;
  const BIRD_RADIUS = 26;
  const STARTING_LIVES = 3;
  const INVULN_MS = 1200;

  /* ---------------------- State ---------------------- */
  let state = 'picking'; // picking -> ready -> playing -> ended
  let faces = [];
  let selectedFace = null;
  let birdImg = null;

  let bird = { x: W * 0.32, y: H / 2, vy: 0, rotation: 0 };
  let pillars = [];
  let score = 0;
  let lives = STARTING_LIVES;
  let invulnUntil = 0;
  let lastPillarTime = 0;
  let groundOffset = 0;
  let cloudOffset = 0;
  let particles = [];
  let rafId, lastTs;

  function resetGameVars() {
    bird = { x: W * 0.32, y: H / 2, vy: 0, rotation: 0 };
    pillars = [];
    score = 0;
    lives = STARTING_LIVES;
    invulnUntil = 0;
    lastPillarTime = 0;
    groundOffset = 0;
    cloudOffset = 0;
    particles = [];
    updateHUD();
  }

  function updateHUD() {
    scoreLabel.textContent = score;
    heartsLabel.textContent = '❤️'.repeat(Math.max(lives, 0)) + '🤍'.repeat(STARTING_LIVES - Math.max(lives, 0));
  }

  /* ---------------------- Load faces from the PHP API ---------------------- */
  // Plain XMLHttpRequest rather than fetch()/async — keeps this working on
  // older embedded browsers/webviews some family tablets still use.
  function loadFaces() {
    const fallback = () => { faces = [{ id: 0, name: 'Buddy', image_path: null }]; buildPicker(); };
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'api/faces.php', true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.ok && data.faces && data.faces.length) {
            faces = data.faces;
          } else {
            faces = [{ id: 0, name: 'Buddy', image_path: null }];
          }
        } catch (e) {
          faces = [{ id: 0, name: 'Buddy', image_path: null }];
        }
        buildPicker();
      };
      xhr.onerror = fallback;
      xhr.send();
    } catch (e) {
      fallback();
    }
  }

  function buildPicker() {
    pickerGrid.innerHTML = '';
    faces.forEach((face) => {
      const btn = document.createElement('button');
      btn.className = 'picker-face';
      btn.type = 'button';

      const img = document.createElement('img');
      img.src = face.image_path || fallbackFaceDataUri();
      img.alt = face.name;
      btn.appendChild(img);

      const span = document.createElement('span');
      span.textContent = face.name;
      btn.appendChild(span);

      btn.addEventListener('click', () => {
        document.querySelectorAll('.picker-face').forEach(el => el.classList.remove('selected'));
        btn.classList.add('selected');
        selectFace(face);
      });

      pickerGrid.appendChild(btn);
    });

    // Auto-select the first face so kids can hit Start immediately.
    if (faces.length) {
      pickerGrid.firstChild.classList.add('selected');
      selectFace(faces[0]);
    }
  }

  function fallbackFaceDataUri() {
    // A simple friendly round smiley used only if no photos exist yet.
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <circle cx="50" cy="50" r="48" fill="#FFD166"/>
        <circle cx="34" cy="42" r="6" fill="#2B3A55"/>
        <circle cx="66" cy="42" r="6" fill="#2B3A55"/>
        <path d="M30 62 Q50 82 70 62" stroke="#2B3A55" stroke-width="6" fill="none" stroke-linecap="round"/>
      </svg>`);
  }

  function selectFace(face) {
    selectedFace = face;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { birdImg = img; startBtn.disabled = false; };
    img.onerror = () => { birdImg = null; startBtn.disabled = false; };
    img.src = face.image_path || fallbackFaceDataUri();
  }

  /* ---------------------- Input ---------------------- */
  function flap() {
    if (state === 'ready') beginPlaying();
    if (state !== 'playing') return;
    bird.vy = FLAP_VELOCITY;
    Sound.flap();
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); flap(); }
  });
  canvas.addEventListener('mousedown', flap);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); flap(); }, { passive: false });

  startBtn.addEventListener('click', () => {
    Sound.ensureCtx();
    pickerOverlay.classList.add('hidden');
    resetGameVars();
    state = 'ready';
    loop(performance.now());
  });

  playAgainBtn.addEventListener('click', () => {
    endOverlay.classList.add('hidden');
    resetGameVars();
    state = 'ready';
    loop(performance.now());
  });

  function beginPlaying() {
    state = 'playing';
    lastPillarTime = performance.now();
    Sound.startMusic();
  }

  /* ---------------------- Pillars ---------------------- */
  function spawnPillar() {
    const margin = 70;
    const gapCenter = margin + Math.random() * (H - GROUND_HEIGHT - margin * 2 - GAP_HEIGHT) + GAP_HEIGHT / 2;
    pillars.push({ x: W + PILLAR_WIDTH, gapCenter, passed: false });
  }

  function circleRectCollide(cx, cy, r, rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX, dy = cy - closestY;
    return (dx * dx + dy * dy) < (r * r);
  }

  function spawnParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 1.2) * 4,
        life: 1,
        color
      });
    }
  }

  /* ---------------------- Update ---------------------- */
  function update(dt, now) {
    cloudOffset = (cloudOffset + dt * 0.02) % W;
    groundOffset = (groundOffset + dt * 0.12) % 40;

    if (state !== 'playing') return;

    bird.vy = Math.min(bird.vy + GRAVITY, MAX_FALL_SPEED);
    bird.y += bird.vy;
    bird.rotation = Math.max(-0.5, Math.min(0.9, bird.vy / 8));

    if (now - lastPillarTime > PILLAR_INTERVAL) {
      spawnPillar();
      lastPillarTime = now;
    }

    const invulnerable = now < invulnUntil;

    pillars.forEach((p) => { p.x -= PILLAR_SPEED * (dt / 16.67); });
    while (pillars.length && pillars[0].x < -PILLAR_WIDTH) pillars.shift();

    pillars.forEach((p) => {
      if (!p.passed && p.x + PILLAR_WIDTH < bird.x) {
        p.passed = true;
        score++;
        updateHUD();
        Sound.score();
        spawnParticles(bird.x, bird.y, '#FFD166');
      }

      if (!invulnerable) {
        const topRectH = p.gapCenter - GAP_HEIGHT / 2;
        const bottomRectY = p.gapCenter + GAP_HEIGHT / 2;
        const hitTop = circleRectCollide(bird.x, bird.y, BIRD_RADIUS * 0.72, p.x, 0, PILLAR_WIDTH, topRectH);
        const hitBottom = circleRectCollide(bird.x, bird.y, BIRD_RADIUS * 0.72, p.x, bottomRectY, PILLAR_WIDTH, H - GROUND_HEIGHT - bottomRectY);
        if (hitTop || hitBottom) handleHit(now);
      }
    });

    // Ground / ceiling bump (soft, no instant death)
    if (!invulnerable) {
      if (bird.y + BIRD_RADIUS * 0.72 > H - GROUND_HEIGHT) {
        bird.y = H - GROUND_HEIGHT - BIRD_RADIUS * 0.72;
        handleHit(now);
      } else if (bird.y - BIRD_RADIUS * 0.72 < 0) {
        bird.y = BIRD_RADIUS * 0.72;
        bird.vy = 0;
      }
    } else {
      bird.y = Math.min(Math.max(bird.y, BIRD_RADIUS), H - GROUND_HEIGHT - BIRD_RADIUS);
    }

    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.03; });
    particles = particles.filter(p => p.life > 0);
  }

  function handleHit(now) {
    if (now < invulnUntil) return;
    lives--;
    updateHUD();
    Sound.bump();
    spawnParticles(bird.x, bird.y, '#FF6F59');
    invulnUntil = now + INVULN_MS;
    bird.vy = FLAP_VELOCITY * 0.6;
    if (lives <= 0) {
      endGame();
    }
  }

  function endGame() {
    state = 'ended';
    Sound.stopMusic();
    Sound.cheer();
    const messages = [
      'Great flying!', 'Nice job, pilot!', 'Woohoo, well done!', 'You did it!'
    ];
    endMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
    endScoreLabel.textContent = `You scored ${score} point${score === 1 ? '' : 's'}! 🌟`;
    endOverlay.classList.remove('hidden');
  }

  /* ---------------------- Draw ---------------------- */
  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#8FD9FF');
    grad.addColorStop(1, '#CFF3FF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // sun
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.arc(W - 70, 70, 42, 0, Math.PI * 2);
    ctx.fill();

    // clouds (two scrolling layers)
    drawCloud(80 - cloudOffset, 110, 1);
    drawCloud(300 - cloudOffset, 60, 0.8);
    drawCloud(420 - cloudOffset * 1.4, 180, 1.1);
    drawCloud(80 - cloudOffset + W, 110, 1);
    drawCloud(300 - cloudOffset + W, 60, 0.8);
    drawCloud(420 - cloudOffset * 1.4 + W, 180, 1.1);
  }

  function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.arc(24, -8, 18, 0, Math.PI * 2);
    ctx.arc(26, 10, 20, 0, Math.PI * 2);
    ctx.arc(-22, 8, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPillars() {
    pillars.forEach((p) => {
      const topH = p.gapCenter - GAP_HEIGHT / 2;
      const bottomY = p.gapCenter + GAP_HEIGHT / 2;
      const bottomH = H - GROUND_HEIGHT - bottomY;

      drawFriendlyPillar(p.x, 0, PILLAR_WIDTH, topH, true);
      drawFriendlyPillar(p.x, bottomY, PILLAR_WIDTH, bottomH, false);
    });
  }

  function drawFriendlyPillar(x, y, w, h, hangingDown) {
    if (h <= 0) return;
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, '#8BD46E');
    grad.addColorStop(1, '#6BB856');
    ctx.fillStyle = grad;
    roundRect(x, y, w, h, 16);
    ctx.fill();

    // cute cap
    ctx.fillStyle = '#7BC96F';
    const capY = hangingDown ? y + h - 18 : y;
    roundRect(x - 6, capY, w + 12, 18, 10);
    ctx.fill();

    // little flower/leaf detail
    ctx.fillStyle = '#FFEFA8';
    const flowerY = hangingDown ? y + h - 34 : y + 34;
    ctx.beginPath();
    ctx.arc(x + w / 2, flowerY, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawGround() {
    ctx.fillStyle = '#C9A25E';
    ctx.fillRect(0, H - GROUND_HEIGHT, W, GROUND_HEIGHT);
    ctx.fillStyle = '#5FAE55';
    ctx.fillRect(0, H - GROUND_HEIGHT, W, 14);
    ctx.fillStyle = '#4F9C46';
    for (let x = -40 - groundOffset; x < W + 40; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, H - GROUND_HEIGHT + 14);
      ctx.lineTo(x + 20, H - GROUND_HEIGHT);
      ctx.lineTo(x + 40, H - GROUND_HEIGHT + 14);
      ctx.fill();
    }
  }

  function drawBird(now) {
    const blinking = now < invulnUntil && Math.floor(now / 100) % 2 === 0;
    if (blinking) return;

    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation * 0.4);

    // wing
    const wingFlap = Math.sin(now / 90) * 10;
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.ellipse(-8, 6 + wingFlap * 0.2, 16, 10, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // body / face
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (birdImg) {
      ctx.drawImage(birdImg, -BIRD_RADIUS, -BIRD_RADIUS, BIRD_RADIUS * 2, BIRD_RADIUS * 2);
    } else {
      ctx.fillStyle = '#FFD166';
      ctx.fillRect(-BIRD_RADIUS, -BIRD_RADIUS, BIRD_RADIUS * 2, BIRD_RADIUS * 2);
    }
    ctx.restore();

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // little beak
    ctx.fillStyle = '#FF9F43';
    ctx.beginPath();
    ctx.moveTo(BIRD_RADIUS - 6, -4);
    ctx.lineTo(BIRD_RADIUS + 12, 2);
    ctx.lineTo(BIRD_RADIUS - 6, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawReadyHint() {
    if (state !== 'ready') return;
    ctx.fillStyle = 'rgba(43,58,85,0.75)';
    ctx.font = '700 20px Baloo 2, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Tap to fly! 🐣', W / 2, H / 2 - 60);
  }

  function render(now) {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawPillars();
    drawGround();
    drawParticles();
    drawBird(now);
    drawReadyHint();
  }

  /* ---------------------- Main loop ---------------------- */
  function loop(ts) {
    if (state === 'ended') return;
    if (!lastTs) lastTs = ts;
    const dt = Math.min(ts - lastTs, 34);
    lastTs = ts;
    update(dt, ts);
    render(ts);
    rafId = requestAnimationFrame(loop);
  }

  /* ---------------------- Boot ---------------------- */
  loadFaces();
  render(0); // draw an idle background frame behind the picker

  // Optional demo auto-play, handy for previewing/screenshotting the game
  // without needing to click through it by hand: add ?auto=play or
  // ?auto=end to the URL. Does nothing unless that param is present.
  try {
    const params = new URLSearchParams(window.location.search);
    const auto = params.get('auto');
    if (auto === 'play' || auto === 'end') {
      const kickoff = setInterval(() => {
        if (!startBtn.disabled) {
          clearInterval(kickoff);
          startBtn.click();
          // Simulate periodic taps like a real (gentle) player, via a real
          // keydown event, so physics/collisions run exactly as they would
          // for an actual kid tapping space/screen.
          const flapper = setInterval(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
          }, 700);
          if (auto === 'end') {
            setTimeout(() => { clearInterval(flapper); lives = 0; endGame(); }, 1600);
          } else {
            setTimeout(() => clearInterval(flapper), 4000);
          }
        }
      }, 150);
    }
  } catch (e) { /* URLSearchParams not available — ignore, demo mode only */ }
})();
