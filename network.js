// Salas com código de 6 números via PeerJS (servidor público de sinalização, sem backend teu).
// Quem cria a sala é o anfitrião: gere a esteira e retransmite as mensagens.
const LOBBY = 'brz-lobby-v1';
const Net = {
  id: Math.random().toString(36).slice(2),
  host: false, code: '', peers: {}, handlers: [], conns: [], hostConn: null, rooms: {},
  isAuth() { return !this.hostConn; },
  mk(id) { return typeof Peer === 'undefined' ? null : (id ? new Peer(id) : new Peer()); },
  create(ok, err) {
    const code = '' + (100000 + (Math.random() * 900000 | 0)), p = this.mk('brz-' + code);
    if (!p) return err('PeerJS não carregou (sem internet?)');
    p.on('open', () => { this.host = true; this.code = code; p.on('connection', c => this.add(c)); this.reg(); ok(code); });
    p.on('error', e => e.type === 'unavailable-id' ? this.create(ok, err) : err(e.type));
  },
  add(c) {
    c.on('open', () => this.conns.push(c));
    c.on('data', m => this.rx(m, c));
    c.on('close', () => { this.conns = this.conns.filter(x => x !== c); });
  },
  join(code, ok, err) {
    const p = this.mk(); if (!p) return err('PeerJS não carregou (sem internet?)');
    p.on('open', () => {
      const c = p.connect('brz-' + code, { reliable: true });
      c.on('open', () => { this.hostConn = c; this.code = code; ok(); });
      c.on('data', m => this.rx(m));
      c.on('close', () => toast('A sala fechou', '#e33'));
    });
    p.on('error', e => err(e.type === 'peer-unavailable' ? 'Essa sala não existe' : e.type));
  },
  send(m) {
    m.id = this.id;
    if (this.host) this.conns.forEach(c => c.open && c.send(m));
    else if (this.hostConn && this.hostConn.open) this.hostConn.send(m);
  },
  rx(m, from) {
    if (!m || m.id === this.id) return;
    if (this.host) this.conns.forEach(c => c !== from && c.open && c.send(m)); // retransmite
    if (m.t === 'pos') this.peers[m.id] = { x: m.x, y: m.y, seen: Date.now() };
    this.handlers.forEach(f => f(m));
  },
  on(f) { this.handlers.push(f); },
  clean() { for (const k in this.peers) if (Date.now() - this.peers[k].seen > 2000) delete this.peers[k]; },

  // ---- Lobby: o primeiro anfitrião vira lista de salas, os outros registam-se nele ----
  reg() {
    const code = this.code, lp = this.mk(LOBBY); if (!lp) return;
    lp.on('open', () => {
      lp.on('connection', c => c.on('data', m => {
        if (m.t === 'reg') this.rooms[m.code] = Date.now();
        if (m.t === 'list') c.send({ t: 'rooms', l: Object.keys(this.rooms).filter(k => Date.now() - this.rooms[k] < 12000) });
      }));
      this.rooms[code] = Date.now(); setInterval(() => { this.rooms[code] = Date.now(); }, 5000);
    });
    lp.on('error', e => {
      if (e.type !== 'unavailable-id') return;
      const q = this.mk();
      q.on('open', () => {
        const c = q.connect(LOBBY);
        c.on('open', () => { const beat = () => c.open && c.send({ t: 'reg', code }); beat(); setInterval(beat, 5000); });
      });
    });
  },
  list(cb) {
    let done = false; const fin = r => { if (!done) { done = true; cb(r); } };
    const q = this.mk(); if (!q) return fin([]);
    q.on('open', () => {
      const c = q.connect(LOBBY);
      c.on('open', () => c.send({ t: 'list' }));
      c.on('data', m => { if (m.t === 'rooms') { fin(m.l); q.destroy(); } });
    });
    q.on('error', () => fin([])); setTimeout(() => fin([]), 4000);
  }
};
