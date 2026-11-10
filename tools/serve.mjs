// Kleiner Entwicklungsserver für Protein-Gym: node tools/serve.mjs [port]
// Liefert die Dateien des Projektordners ohne Browser-Cache (Änderungen sofort sichtbar).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.jpg', 'image/jpeg'],
  ['.woff2', 'font/woff2'],
]);

function send(res, status, type, body) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

export function startServer(port = 4195) {
  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = resolve(ROOT, '.' + path);
      if (file !== ROOT && !file.startsWith(ROOT + sep)) return send(res, 403, 'text/plain; charset=utf-8', 'Verboten');
      const info = await stat(file).catch(() => null);
      if (info && info.isDirectory()) file = resolve(file, 'index.html');
      const data = await readFile(file);
      send(res, 200, MIME.get(extname(file).toLowerCase()) || 'application/octet-stream', data);
    } catch {
      send(res, 404, 'text/plain; charset=utf-8', 'Nicht gefunden');
    }
  });
  return new Promise((ok) => server.listen(port, () => ok({ server, port: server.address().port })));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { port } = await startServer(Number(process.argv[2] || process.env.PORT || 4195));
  console.log(`Protein-Gym: http://localhost:${port}/`);
}
