import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGrid, findPath, isBlockedAt, nearestWalkable, lineOfSight } from '../src/engine/grid.js';
import { createPlayer, setPath, updatePlayer } from '../src/engine/player.js';

const room = { width: 640, height: 480, blocked: [[300, 0, 40, 380]] }; // Wand mit Lücke unten

test('gesperrte Zonen sind nicht begehbar, freie Fläche schon', () => {
  const g = buildGrid(room, 0);
  assert.equal(isBlockedAt(g, 320, 100), true);
  assert.equal(isBlockedAt(g, 100, 100), false);
  assert.equal(isBlockedAt(g, -5, 10), true, 'außerhalb der Welt gesperrt');
});

test('der Weg führt um die Wand durch die Lücke', () => {
  const g = buildGrid(room, 0);
  const path = findPath(g, { x: 100, y: 100 }, { x: 540, y: 100 });
  assert.ok(path.length >= 2, 'mindestens ein Umweg-Punkt');
  const through = path.some((p) => p.y > 380);
  assert.ok(through, 'Weg geht unter der Wand durch');
  let from = { x: 100, y: 100 };
  for (const p of path) {
    assert.ok(lineOfSight(g, from, p), 'jeder Abschnitt hat freie Sicht');
    from = p;
  }
  const end = path[path.length - 1];
  assert.ok(Math.hypot(end.x - 540, end.y - 100) < 1);
});

test('gerader Weg bleibt gerade', () => {
  const g = buildGrid(room, 0);
  const path = findPath(g, { x: 50, y: 50 }, { x: 250, y: 300 });
  assert.equal(path.length, 1);
});

test('ein gesperrtes Ziel wird auf die nächste freie Stelle gelegt', () => {
  const g = buildGrid(room, 0);
  const path = findPath(g, { x: 100, y: 100 }, { x: 320, y: 100 });
  assert.equal(path.length >= 1, true);
  const end = path[path.length - 1];
  assert.equal(isBlockedAt(g, end.x, end.y), false);
  assert.ok(Math.abs(end.x - 320) <= 30);
});

test('völlig abgeriegelter Bereich ergibt keinen Weg', () => {
  const closed = { width: 640, height: 480, blocked: [[200, 0, 40, 480]] };
  const g = buildGrid(closed, 0);
  assert.deepEqual(findPath(g, { x: 50, y: 50 }, { x: 500, y: 50 }), []);
});

test('nearestWalkable findet eine freie Zelle neben einem Block', () => {
  const g = buildGrid(room, 0);
  const p = nearestWalkable(g, 320, 200);
  assert.ok(p);
  assert.equal(isBlockedAt(g, p.x, p.y), false);
});

test('Sicherheitsabstand (margin) hält die Figur von der Wand fern', () => {
  const g = buildGrid(room, 20);
  assert.equal(isBlockedAt(g, 285, 100), true);
  assert.equal(isBlockedAt(g, 250, 100), false);
});

test('Figur läuft den Weg ab und meldet die Ankunft genau einmal', () => {
  const p = createPlayer(0, 0);
  setPath(p, [{ x: 100, y: 0 }, { x: 100, y: 100 }]);
  let arrivals = 0;
  for (let i = 0; i < 200; i++) if (updatePlayer(p, 0.05)) arrivals++;
  assert.equal(arrivals, 1);
  assert.deepEqual([p.x, p.y], [100, 100]);
  assert.equal(p.moving, false);
});

test('Blickrichtung folgt der Bewegung', () => {
  const p = createPlayer(0, 0);
  setPath(p, [{ x: 50, y: 0 }]);
  updatePlayer(p, 0.05);
  assert.equal(p.dir, 'right');
  setPath(p, [{ x: p.x, y: -50 }]);
  updatePlayer(p, 0.05);
  assert.equal(p.dir, 'up');
});
