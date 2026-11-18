const cv = document.getElementById('c'), cx = cv.getContext('2d');
let last = performance.now(), frame = 0;

function roll() {
  let x = Math.random() * RAR.reduce((a, r) => a + r.w, 0);
  for (let i = 0; i < 7; i++) { x -= RAR[i].w; if (x <= 0) return i; }
  return 0;
}
function income() {
  const pro = G.plants.some(p => p.e.r === 6 && p.ready) ? 1.1 : 1; // passiva Pro
  return G.plants.reduce((a, p) => a + p.gps, 0) * pro;
}
function burst(x, y, c, n = 12) {
  for (let i = 0; i < n; i++) G.parts.push({ x, y, vx: (Math.random() - .5) * 5, vy: (Math.random() - .5) * 5, l: 40, c });
}

function step(dt) {
  frame++; G.time += dt; pad();
  const p = G.p;
  if (p.jail > 0) { if (--p.jail === 0) { respawn(); toast('Libertado! Tenta ser honesto.', '#6d6'); } }
  else {
    const v = Input.vec(), s = (p.boost > 0 ? 5 : 3.2) * (G.fast ? 2 : 1); p.mv = !!(v[0] || v[1]); if (v[0]) p.dir = v[0] > 0 ? 1 : -1;
    p.x = Math.max(14, Math.min(886, p.x + v[0] * s)); p.y = Math.max(14, Math.min(586, p.y + v[1] * s));
  }
  if (G.ghost) p.invis = 9; if (p.invis > 0) p.invis--; if (p.boost > 0) p.boost--;
  if (G.turbo > 0) G.turbo -= dt;

  // clima + mutações
  if ((G.wt -= dt) <= 0) {
    G.wt = 30; G.weather = G.fw != null ? G.fw : 0 | Math.random() * WEATHER.length; G.fw = null;
    const w = WEATHER[G.weather];
    if (w.mut) {
      toast('Evento: ' + w.n + '! Mutações a caminho', MUT[w.mut].c === 'rainbow' ? '#e0f' : MUT[w.mut].c || '#888');
      G.plants.forEach(pl => { if (!pl.mut && Math.random() < .4) { pl.mut = w.mut; burst(...slotPos(pl.slot), '#fff'); } });
    }
  }

  // esteira
  if (Net.isAuth() && (G.bt -= dt) <= 0) {
    G.bt = 2.2;
    const r = roll(), pool = EGGS.filter(e => e.r === r), e = pool[0 | Math.random() * pool.length];
    G.belt.push(new BeltEgg(e));
    if (r >= 5) { const m = '🌟 ' + RAR[r].n.toUpperCase() + ' NA ESTEIRA: ' + e.name + '!'; toast(m, RAR[r].c); Net.send({ t: 'ann', m }); }
  }
  G.belt.forEach(b => b.x += 1);
  if (Net.host && frame % 30 === 0) Net.send({ t: 'belt', l: G.belt.map(b => [b.k, b.e.id, Math.round(b.x)]) });
  G.belt = G.belt.filter(b => b.x < 920 || (b.gone = true, false));

  // plantas
  G.plants.forEach(pl => {
    pl.age += dt * (pl.w > 0 ? 3 : 1); pl.w -= dt;
    if (!pl.hatched && pl.ready) { pl.hatched = true; sfx('hatch'); burst(...slotPos(pl.slot), RAR[pl.e.r].c, 20); toast('🐣 ' + pl.e.name + ' chocou!', RAR[pl.e.r].c); }
  });
  const inc = income() * dt;
  if (inc > 0 && frame % 120 === 0) sfx('coin');
  G.money += inc; if (G.inf) G.money = 1e15;

  // portão
  if (G.gate.locked) { if ((G.gate.t -= dt) <= 0) { G.gate.locked = false; G.gate.cd = 20; } }
  else if (G.gate.cd > 0) G.gate.cd -= dt;

  // polícias e armadilhas
  G.cops.forEach(c => { c.update(); G.traps.forEach((t, i) => { if (Math.hypot(c.x - t.x, c.y - t.y) < 22) { c.stun = 240; G.traps.splice(i, 1); toast('🪤 Polícia preso na armadilha!', '#fa0'); } }); });
  G.cops = G.cops.filter(c => !c.dead);
  G.parts.forEach(q => { q.x += q.vx; q.y += q.vy; q.l--; }); G.parts = G.parts.filter(q => q.l > 0);

  if (frame % 6 === 0) { Net.send({ t: 'pos', x: p.x, y: p.y, s: G.seat, mv: p.mv, dir: p.dir, name: G.name }); Net.clean(); }
  if (frame % 30 === 0) Net.send({ t: 'farm', s: G.seat, g: G.gate.locked ? 1 : 0, l: G.plants.map(q => [q.e.id, q.mut, q.slot, q.ready ? 1 : 0]) });
}

function drawEgg(e, x, y, s, m) {
  cx.save(); cx.translate(x, y); cx.scale(s, s);
  cx.fillStyle = RAR[e.r].c; cx.beginPath(); cx.ellipse(0, 0, 13, 17, 0, 0, 7); cx.fill();
  cx.lineWidth = 3;
  cx.strokeStyle = m ? (MUT[m].c === 'rainbow' ? `hsl(${G.time * 200 % 360},100%,60%)` : MUT[m].c) : '#222';
  cx.stroke(); cx.restore();
}
function drawChar(x, y, col, t, mv, dir, o = {}) {
  const sw = mv ? Math.sin(t * 14) : 0, bob = mv ? Math.abs(Math.cos(t * 14)) * 2 : Math.sin(t * 3) * .8;
  cx.save(); cx.globalAlpha = o.a || 1; cx.translate(x, y - bob); cx.scale(dir < 0 ? -1 : 1, 1); cx.lineCap = 'round';
  cx.fillStyle = 'rgba(0,0,0,.25)'; cx.beginPath(); cx.ellipse(0, 19 + bob, 11, 4, 0, 0, 7); cx.fill();
  cx.lineWidth = 5; cx.strokeStyle = '#2b2b4a'; // pernas
  cx.beginPath(); cx.moveTo(-4, 6); cx.lineTo(-4 + sw * 6, 18); cx.moveTo(4, 6); cx.lineTo(4 - sw * 6, 18); cx.stroke();
  cx.strokeStyle = '#ffcf9f'; // braços (balançam ao contrário das pernas)
  cx.beginPath(); cx.moveTo(-8, -4); cx.lineTo(-12 - sw * 3, 5 + sw * 4); cx.moveTo(8, -4); cx.lineTo(12 + sw * 3, 5 - sw * 4); cx.stroke();
  cx.fillStyle = col; cx.fillRect(-8, -8, 16, 15); cx.strokeStyle = '#222'; cx.lineWidth = 2; cx.strokeRect(-8, -8, 16, 15);
  cx.fillStyle = '#ffcf9f'; cx.beginPath(); cx.arc(0, -15, 8, 0, 7); cx.fill(); cx.stroke();
  cx.fillStyle = '#222'; cx.fillRect(1, -17, 2, 3); cx.fillRect(5, -17, 2, 3);
  if (o.cop) { cx.fillStyle = '#0b2a8a'; cx.fillRect(-9, -25, 18, 6); cx.fillRect(-1, -20, 10, 2); }
  if (o.egg) { cx.fillStyle = '#fe8'; cx.beginPath(); cx.ellipse(0, -33, 6, 8, 0, 0, 7); cx.fill(); cx.stroke(); }
  cx.restore();
}

function draw() {
  cx.fillStyle = '#7ed957'; cx.fillRect(0, 0, 900, 600);
  cx.fillStyle = '#6cc84a';
  for (let i = 0; i < 900; i += 60) for (let j = 0; j < 600; j += 60) if ((i + j) / 60 % 2 === 0) cx.fillRect(i, j, 60, 60);
  cx.fillStyle = '#555'; cx.fillRect(420, 232, 60, 40); cx.fillStyle = '#fff'; cx.font = '12px sans-serif'; cx.textAlign = 'center'; cx.fillText('CADEIA', 450, 256);

  // esteira
  cx.fillStyle = '#c0262d'; cx.fillRect(0, 278, 900, 44);
  cx.fillStyle = '#8f1a20'; for (let x = -30 + (G.time * 60) % 30; x < 900; x += 30) cx.fillRect(x, 278, 6, 44);
  G.belt.forEach(b => {
    drawEgg(b.e, b.x, b.y, 1, 0);
    cx.fillStyle = '#fff'; cx.font = '10px sans-serif'; cx.textAlign = 'center'; cx.fillText('$' + fmt(b.e.price), b.x, b.y + 32);
  });

  // 8 bases
  for (let s = 0; s < 8; s++) {
    const [bx, by] = basePos(s), me = s === G.seat, f = Object.values(Net.farms).find(a => a.s === s);
    if (!me && !f) { cx.fillStyle = '#9aa39a'; cx.fillRect(bx, by, 200, 215); cx.fillStyle = '#fff'; cx.font = '13px sans-serif'; cx.textAlign = 'center'; cx.fillText('Base ' + (s + 1) + ' (livre)', bx + 100, by + 110); continue; }
    const locked = me ? G.gate.locked : f.g;
    cx.fillStyle = '#b5834f'; cx.fillRect(bx, by, 200, 215);
    cx.lineWidth = me ? 6 : 3; cx.strokeStyle = SEATC[s]; cx.strokeRect(bx, by, 200, 215);
    cx.fillStyle = locked ? '#e33' : '#3c3'; cx.fillRect(bx + 60, s < 4 ? by - 3 : by + 211, 80, 7);
    cx.fillStyle = '#fff'; cx.font = '12px sans-serif'; cx.textAlign = 'center'; cx.fillText(me ? 'A TUA BASE' : 'Base ' + (s + 1), bx + 100, by + 12);
    const list = me ? G.plants.map(p => [p.e.id, p.mut, p.slot, p.ready, p]) : f.l;
    const n = me ? G.slots : Math.max(4, ...f.l.map(a => a[2] + 1));
    for (let i = 0; i < n; i++) { const [x, y] = slotPos(i, s); cx.fillStyle = '#5a3a1c'; cx.fillRect(x - 28, y - 21, 56, 42); }
    list.forEach(([id, m, sl, rd, pl]) => {
      const [x, y] = slotPos(sl, s), e = EGGS[id];
      drawEgg(e, x, y, rd ? 1 : .6, m);
      if (rd) { cx.font = '16px serif'; cx.fillText('🐣', x, y + 6); }
      else if (pl) { cx.fillStyle = '#222'; cx.fillRect(x - 22, y + 14, 44, 4); cx.fillStyle = '#4f4'; cx.fillRect(x - 22, y + 14, 44 * pl.age / e.grow, 4); }
      if (pl && pl.w > 0) { cx.font = '13px serif'; cx.fillText('💧', x + 18, y - 12); }
    });
  }
  G.traps.forEach(t => { cx.font = '20px serif'; cx.textAlign = 'center'; cx.fillText('🪤', t.x, t.y + 6); });

  // personagens
  const nm = (x, y, t) => { cx.fillStyle = '#fff'; cx.font = '11px sans-serif'; cx.textAlign = 'center'; cx.fillText(t, x, y - 48); };
  Object.values(Net.peers).forEach((q, k) => { drawChar(q.x, q.y, SEATC[q.s | 0], G.time + k, q.mv, q.dir, { a: .9 }); nm(q.x, q.y, q.name || 'Jogador ' + ((q.s | 0) + 1)); });
  G.cops.forEach(c => {
    drawChar(c.x, c.y, '#1e4fd8', G.time, c.stun > 0 ? 0 : 1, G.p.x < c.x ? -1 : 1, { cop: 1 });
    cx.fillStyle = frame % 20 < 10 ? '#f22' : '#26f'; cx.beginPath(); cx.arc(c.x, c.y - 33, 4, 0, 7); cx.fill();
  });
  drawChar(G.p.x, G.p.y, SEATC[G.seat], G.time, G.p.mv, G.p.dir, { a: G.p.invis > 0 ? .3 : 1, egg: G.inv.some(i => i.stolen) });
  nm(G.p.x, G.p.y, G.name || 'Tu');
  G.parts.forEach(q => { cx.fillStyle = q.c; cx.globalAlpha = q.l / 40; cx.fillRect(q.x, q.y, 4, 4); cx.globalAlpha = 1; });

  // noite + clima
  const night = (Math.sin(G.time * Math.PI / 60) + 1) / 2;
  cx.fillStyle = `rgba(10,10,70,${night * .5 + (G.weather === 4 ? .25 : 0)})`; cx.fillRect(0, 0, 900, 600);
  if (G.weather === 1) { cx.strokeStyle = '#9f6'; for (let i = 0; i < 60; i++) { const x = (i * 97 + frame * 3) % 900, y = (i * 53 + frame * 12) % 600; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x - 3, y + 12); cx.stroke(); } }
  if (G.weather === 2) { cx.fillStyle = 'rgba(255,200,0,.15)'; cx.fillRect(0, 0, 900, 600); }
  if (G.weather === 3) { cx.fillStyle = `hsla(${G.time * 100 % 360},100%,60%,.12)`; cx.fillRect(0, 0, 900, 600); }
}

function loop(t) {
  const dt = Math.min(.05, (t - last) / 1000); last = t;
  if (G.started) step(dt); draw(); requestAnimationFrame(loop);
}
