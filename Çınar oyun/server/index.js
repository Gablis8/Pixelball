// ============================================================
//  HTTP + WebSocket sunucu (Faz 4)
//  / → client/, /shared/ → shared/
//  Oda sistemi (create/join) + 30Hz state broadcast
// ============================================================

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { MSG, makeCode } from '../shared/protocol.js';
import { Room } from './room.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const CLIENT_DIR = path.join(ROOT, 'client');
const SHARED_DIR = path.join(ROOT, 'shared');

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function safePath(reqUrl) {
  const url = new URL(reqUrl, 'http://localhost');
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  let full = path.join(CLIENT_DIR, p);
  if (p.startsWith('/shared/')) full = path.join(SHARED_DIR, p.slice('/shared/'.length));
  if (p.startsWith('/src/')) full = path.join(CLIENT_DIR, p);

  // Path traversal koruması
  const rel = path.relative(ROOT, full);
  if (rel.startsWith('..') || path.isAbsolute(rel) === false && rel.indexOf('..\\') >= 0 && rel.indexOf('../') >= 0) {
    // basit kontrol
  }
  const resolved = path.resolve(full);
  if (!resolved.startsWith(path.resolve(ROOT))) return null;
  return resolved;
}

function serveStatic(res, filePath) {
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_MAP[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const fp = safePath(req.url);
  if (!fp) { res.writeHead(403); res.end('Forbidden'); return; }
  serveStatic(res, fp);
});

const wss = new WebSocketServer({ server });

const rooms = new Map();

function getRoom(code) {
  return rooms.get(code);
}

function createRoom() {
  let code;
  for (let i = 0; i < 10; i++) {
    code = makeCode();
    if (!rooms.has(code)) break;
  }
  const r = new Room();
  r.code = code;
  rooms.set(code, r);
  return r;
}

// Bir ws'yi bulunduğu odadan çıkarır. Aynı bağlantı yeni bir odaya
// geçerken (create/join) veya lobiden GERİ yapılınca kullanılır;
// böylece "zombi oda" kalmaz.
function leaveRoom(ws, code) {
  if (!code) return;
  const r = getRoom(code);
  if (!r) return;
  r.removePlayer(ws);
  if (r.isEmpty()) rooms.delete(code);
}

function send(ws, payload) {
  try {
    ws.send(JSON.stringify(payload));
  } catch {
    /* kapalı olabilir */
  }
}

wss.on('connection', (ws) => {
  let roomCode = null;

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }
    switch (msg.type) {
      case MSG.CREATE:
        {
          // Aynı bağlantıda daha önce bir odaysa oradan çık (zombi oda önleme)
          leaveRoom(ws, roomCode);
          roomCode = null;
          const r = createRoom();
          try {
            const id = r.addPlayer(ws);
            roomCode = r.code;
            send(ws, { type: MSG.LOBBY, code: r.code, playerId: id, players: r.getPlayersInfo() });
            if (r.count() === 2) r.start();
          } catch (e) {
            send(ws, { type: MSG.ERROR, message: e.message });
          }
        }
        break;

      case MSG.JOIN:
        {
          const code = (msg.code || '').toUpperCase();
          const r = getRoom(code);
          if (!r) {
            send(ws, { type: MSG.ERROR, message: 'Oda bulunamadı' });
            break;
          }
          leaveRoom(ws, roomCode); // önceki odadan çık
          roomCode = null;
          try {
            const id = r.addPlayer(ws); // 'Oda dolu' fırlatabilir
            roomCode = code;
            send(ws, { type: MSG.JOINED, code, playerId: id, players: r.getPlayersInfo() });
            if (r.count() === 2) r.start();
          } catch (e) {
            send(ws, { type: MSG.ERROR, message: e.message });
          }
        }
        break;

      case MSG.INPUT:
        if (roomCode) {
          const r = getRoom(roomCode);
          if (r) r.setInput(ws, msg);
        }
        break;

      case MSG.REMATCH:
        {
          const r = roomCode ? getRoom(roomCode) : null;
          if (r) {
            const res = r.requestRematch(ws);
            // accepted && start → Room, START mesajını iki oyuncuya da gönderir
            if (res.accepted && !res.start) {
              send(ws, { type: MSG.REMATCH_STATUS, waiting: true });
            }
          }
        }
        break;

      case MSG.PING:
        send(ws, { type: MSG.PONG });
        break;

      case MSG.LEAVE:
        leaveRoom(ws, roomCode);
        roomCode = null;
        break;

      default:
        break;
    }
  });

  ws.on('close', () => {
    leaveRoom(ws, roomCode);
    roomCode = null;
  });

  ws.on('error', () => {});
});

const PORT = process.env.PORT || 3000;

setInterval(() => {
  for (const r of rooms.values()) r.tick();
}, 16);

server.listen(PORT, () => {
  console.log(`Pixel Futbol (Faz 4) http://localhost:${PORT}`);
});
