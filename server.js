const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.ttf':  'font/ttf',
  '.mp4':  'video/mp4',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';

  const filePath = path.join(ROOT, url);

  // Basic path traversal protection
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  const ext  = path.extname(filePath).toLowerCase();
  const type = mime[ext] || 'application/octet-stream';

  // Range requests for video (needed for MP4 seek)
  const stat = (() => { try { return fs.statSync(filePath); } catch { return null; } })();
  if (!stat) { res.writeHead(404); res.end('Not Found'); return; }

  const rangeHeader = req.headers['range'];
  if (rangeHeader && ext === '.mp4') {
    const size   = stat.size;
    const [startStr, endStr] = rangeHeader.replace('bytes=', '').split('-');
    const start  = parseInt(startStr, 10);
    const end    = endStr ? parseInt(endStr, 10) : size - 1;
    const chunk  = end - start + 1;

    res.writeHead(206, {
      'Content-Range':  `bytes ${start}-${end}/${size}`,
      'Accept-Ranges':  'bytes',
      'Content-Length': chunk,
      'Content-Type':   type,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Type':   type,
    'Content-Length': stat.size,
    'Accept-Ranges':  'bytes',
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\n  Portfolio disponible sur :\n\n  http://localhost:${PORT}\n`);
});
