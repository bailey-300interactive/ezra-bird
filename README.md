# Flappy Faces 🐣

A gentle, kid-friendly Flappy Bird style game. The "bird" wears the face of
whoever you add — your kid, grandkids, cousins, the dog, whoever — and a
simple admin page lets you add or remove players any time. No sign-up, no
ads, no scary "you died" screens.

## What's inside

```
index.php          the game page kids play
api/faces.php       JSON endpoint the game calls to list active players
admin/              password-protected panel to add/hide/delete players
includes/           config, database connection, auth, helpers
css/style.css       all styling (game + admin)
js/game.js          game engine (canvas, physics, sound) — plain JS, no build step
sql/schema.sql      run this once to create the database table
uploads/            player photos are stored here (writable by the web server)
```

## 1. Requirements

Any standard LAMP stack: Linux, Apache (or Nginx), MySQL/MariaDB, PHP 7.4+
with the `pdo_mysql` extension. No Composer, no Node, no build step —
just copy the files up.

## 2. Install

1. Copy this whole folder into your web root, e.g. `/var/www/html/flappy-faces`.
2. Create the database and table:
   ```bash
   mysql -u root -p < sql/schema.sql
   ```
   (This also inserts one sample player using `uploads/sample_face.png` so
   the game isn't empty on first load.)
3. Edit `includes/config.php`:
   - Set `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` to match your database.
   - **Change `ADMIN_PASSWORD`** to something only you know.
4. Make sure the `uploads/` folder is writable by the web server user:
   ```bash
   chmod 775 uploads
   chown www-data:www-data uploads   # adjust user/group for your server
   ```
5. Visit `http://your-domain/flappy-faces/` — you should see the game.
6. Visit `http://your-domain/flappy-faces/admin/login.php` to add players.

## 3. Using the admin panel

- **Add a player**: type a name, choose a clear face photo (square photos
  work best — the game crops to a circle automatically), click "Add player."
- **Hide from game**: keeps the player in the list but leaves them out of
  the game — handy for temporarily removing someone without deleting them.
- **Delete**: removes the player and their photo for good (there's a
  confirmation prompt first).

## 4. How the game is kept kid-friendly

- Big gaps between obstacles and a slow fall speed — much easier than the
  original Flappy Bird.
- 3 hearts instead of instant game-over, with a short "safe" blink after
  each bump instead of the game ending immediately.
- Friendly chime sounds and a soft looping background melody generated
  right in the browser (no scary noises, no copyrighted music/files needed).
- Cheerful end-of-game messages ("Great flying!") instead of "You died."
- No ads, no external trackers, nothing loads from the internet except one
  Google Font for the rounded, playful headings (swap it out in
  `css/style.css` if you'd rather stay fully offline).

## 5. Customizing

- **Difficulty**: tweak `GRAVITY`, `FLAP_VELOCITY`, `GAP_HEIGHT`, and
  `PILLAR_SPEED` near the top of `js/game.js`.
- **Colors/fonts**: all in `css/style.css`, using CSS variables at the top.
- **Sounds**: `js/game.js`'s `Sound` object — tweak the `melody` array or
  the frequencies in `flap()`/`score()`/`bump()`/`cheer()`.
- **Obstacle look**: `drawFriendlyPillar()` in `js/game.js` — currently
  drawn as friendly green hedges; recolor or reshape as you like (a race
  theme with checkered-flag posts would suit a Cars/Lightning McQueen fan,
  for example).

## Security notes

This is a small family-use app, but a few things worth knowing:
- The admin password is a single shared password stored in `config.php` —
  fine for a private family site, not meant for a public multi-user system.
- Uploaded files are re-validated as real images and renamed randomly
  before being saved, so users can't upload arbitrary scripts.
- Put the whole app behind HTTPS if it's reachable from outside your home
  network.
