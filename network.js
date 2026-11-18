// Tenta WebSocket (ws://host:8080). Sem servidor, usa BroadcastChannel entre abas.
// Os bots vivem em entities.js e funcionam sempre, com ou sem rede.
const Net = {
  id: Math.random().toString(36).slice(2),
  mode: 'local', peers: {}, handlers: [], bc: null, ws: null,
  init() {
    try {
      this.bc = new BroadcastChannel('brainrot-garden');
      this.bc.onmessage = e => this.rx(e.data);
    } catch (e) {}
    try {
      const w = new WebSocket('ws://' + (location.hostname || 'localhost') + ':8080');
      w.onopen = () => { this.ws = w; this.mode = 'ws'; };
      w.onmessage = e => { try { this.rx(JSON.parse(e.data)); } catch (_) {} };
      w.onerror = () => {};
    } catch (e) {}
  },
  send(m) {
    m.id = this.id;
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(m));
    else if (this.bc) this.bc.postMessage(m);
  },
  rx(m) {
    if (!m || m.id === this.id) return;
    if (m.t === 'pos') this.peers[m.id] = { x: m.x, y: m.y, seen: Date.now() };
    this.handlers.forEach(f => f(m));
  },
  on(f) { this.handlers.push(f); },
  clean() { for (const k in this.peers) if (Date.now() - this.peers[k].seen > 2000) delete this.peers[k]; }
};
Net.init();
