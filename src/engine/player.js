// Spielfigur und NPC-Bewegung (reine Logik, ohne Zeichnen).

export function createPlayer(x, y) {
  return { x, y, dir: 'down', t: 0, moving: false, path: [], speed: 340 };
}

export function setPath(p, path) {
  p.path = path.slice();
}

/** Bewegt die Figur um dt Sekunden. Gibt true zurück, wenn sie in diesem Schritt am Ziel angekommen ist. */
export function updatePlayer(p, dt) {
  if (!p.path.length) {
    p.moving = false;
    return false;
  }
  let budget = p.speed * dt;
  p.moving = true;
  p.t += dt;
  while (budget > 0 && p.path.length) {
    const target = p.path[0];
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.01) p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    if (dist <= budget) {
      p.x = target.x;
      p.y = target.y;
      p.path.shift();
      budget -= dist;
    } else {
      p.x += (dx / dist) * budget;
      p.y += (dy / dist) * budget;
      budget = 0;
    }
  }
  if (!p.path.length) {
    p.moving = false;
    return true;
  }
  return false;
}
