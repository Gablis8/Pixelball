// ============================================================
//  WebSocket bağlantı sarmalayıcı (Faz 4)
// ============================================================

import { MSG } from '/shared/protocol.js';

export class Connection {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.handlers = new Map();
    this.connected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.ws.onopen = () => {
          this.connected = true;
          resolve();
        };
        this.ws.onerror = (err) => reject(err);
        this.ws.onmessage = (ev) => {
          let msg;
          try { msg = JSON.parse(ev.data); } catch { return; }
          const h = this.handlers.get(msg.type);
          if (h) h(msg);
        };
        this.ws.onclose = () => {
          this.connected = false;
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  on(type, fn) {
    this.handlers.set(type, fn);
  }

  send(type, data = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type, ...data }));
  }

  close() {
    if (this.ws) this.ws.close();
  }
}
