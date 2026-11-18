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
  frame++; G.time += dt;
  const p = G.p;
  if (p.jail > 0) { if (--p.jail === 0) { p.x = 450; p.y = 500; toast('Libertado! Tenta ser honesto.', '#6d6'); } }
  else {
    const v = Input.vec(), s = p.boost > 0 ? 5 : 3.2;
    p.x = Math.max(14, Math.min(886, p.x + v[0] * s)); p.y = Math.max(14, Math.min(586, p.y + v[1] * s));
  }
  if (p.invis > 0) p.invis--; if (p.boost > 0) p.boost--;
  if (G.turbo > 0) G.turbo -= dt;

  // clima + mutações
  if ((G.wt -= dt) <= 0) {
    G.wt = 30; G.weather = 0 | Math.random() * WEATHER.length;
    const w = WEATHER[G.weather];
    if (w.mut) {
      toast('Evento: ' + w.n + '! Mutações a caminho', MUT[w.mut].c === 'rainbow' ? '#e0f' : MUT[w.mut].c || '#888');
      G.plants.forEach(pl => { if (!pl.mut && Math.random() < .4) { pl.mut = w.mut; burst(...slotPos(pl.slot), '#fff'); } });
    }
  }

  // esteira
  if ((G.bt -= dt) <= 0) {
    G.bt = 2.2;
    const r = roll(), pool = EGGS.filter(e => e.r === r), e = pool[0 | Math.random() * pool.length];
    G.belt.push(new BeltEgg(e));
    if (r >= 5) { const m = '🌟 ' + RAR[r].n.toUpperCase() + ' NA ESTEIRA: ' + e.name + '!'; toast(m, RAR[r].c); Net.send({ t: 'ann', m }); }
  }
  G.belt.forEach(b => b.x += 1);
  G.belt = G.belt.filter(b => b.x < 920 || (b.gone = true, false));

  // plantas
  G.plants.forEach(pl => {
    pl.age += dt * (pl.w > 0 ? 3 : 1); pl.w -= dt;
    if (!pl.hatched && pl.ready) { pl.hatched = true; sfx('hatch'); burst(...slotPos(pl.slot), RAR[pl.e.r].c, 20); toast('🐣 ' + pl.e.name + ' chocou!', RAR[pl.e.r].c); }
  });
  const inc = income() * dt;
  if (inc > 0 && frame % 120 === 0) sfx('coin');
  G.money += inc;

  // portão
  if (G.gate.locked) { if ((G.gate.t -= dt) <= 0) { G.gate.locked = false; G.gate.cd = 20; } }
  else if (G.gate.cd > 0) G.gate.cd -= dt;

  // bots, polícias, armadilhas
  if ((G.bs -= dt) <= 0) { G.bs = 7; if (G.bots.length < 4) G.bots.push(new Bot()); }
  G.bots.forEach(b => {
    b.update();
    G.traps.forEach((t, i) => { if (Math.hypot(b.x - t.x, b.y - t.y) < 20) { b.stun = 240; G.traps.splice(i, 1); toast('🪤 Bot apanhado na armadilha!', '#fa0'); } });
  });
  G.cops.forEach(c => c.update());
  G.bots = G.bots.filter(b => !b.dead); G.cops = G.cops.filter(c => !c.dead);
  G.parts.forEach(q => { q.x += q.vx; q.y += q.vy; q.l--; }); G.parts = G.parts.filter(q => q.l > 0);

  if (frame % 6 === 0) { Net.send({ t: 'pos', x: p.x, y: p.y }); Net.clean(); }
}

function drawEgg(e, x, y, s, m) {
  cx.save(); cx.translate(x, y); cx.scale(s, s);
  cx.fillStyle = RAR[e.r].c; cx.beginPath(); cx.ellipse(0, 0, 13, 17, 0, 0, 7); cx.fill();
  cx.lineWidth = 3;
  cx.strokeStyle = m ? (MUT[m].c === 'rainbow' ? `hsl(${G.time * 200 % 360},100%,60%)` : MUT[m].c) : '#222';
  cx.stroke(); cx.restore();
}
function icon(en, a = 1) {
  cx.globalAlpha = a; cx.font = '26px serif'; cx.textAlign = 'center'; cx.fillText(en.i, en.x, en.y + 9);
  if (en.carry) cx.fillText('🥚', en.x, en.y - 14);
  cx.globalAlpha = 1;
}

function draw() {
  cx.fillStyle = '#7ed957'; cx.fillRect(0, 0, 900, 600);
  cx.fillStyle = '#6cc84a';
  for (let i = 0; i < 900; i += 60) for (let j = 0; j < 600; j += 60) if ((i + j) / 60 % 2 === 0) cx.fillRect(i, j, 60, 60);
  cx.fillStyle = '#555'; cx.fillRect(20, 20, 80, 80); cx.fillStyle = '#fff'; cx.font = '13px sans-serif'; cx.textAlign = 'center'; cx.fillText('CADEIA', 60, 64);

  // esteira
  cx.fillStyle = '#c0262d'; cx.fillRect(0, 278, 900, 44);
  cx.fillStyle = '#8f1a20'; for (let x = -30 + (G.time * 60) % 30; x < 900; x += 30) cx.fillRect(x, 278, 6, 44);
  G.belt.forEach(b => {
    drawEgg(b.e, b.x, b.y, 1, 0);
    cx.fillStyle = '#fff'; cx.font = '10px sans-serif'; cx.textAlign = 'center'; cx.fillText('$' + fmt(b.e.price), b.x, b.y + 32);
  });

  // quinta
  cx.fillStyle = '#b5834f'; cx.fillRect(40, 400, 820, 190);
  cx.lineWidth = 6; cx.strokeStyle = G.gate.locked ? '#e33' : '#3c3'; cx.strokeRect(40, 400, 820, 190);
  for (let i = 0; i < G.slots; i++) { const [x, y] = slotPos(i); cx.fillStyle = '#5a3a1c'; cx.fillRect(x - 32, y - 26, 64, 52); }
  G.plants.forEach(pl => {
    const [x, y] = slotPos(pl.slot);
    if (pl.ready) { drawEgg(pl.e, x, y, 1, pl.mut); cx.font = '18px serif'; cx.fillText('🐣', x, y + 6); }
    else { drawEgg(pl.e, x, y, .6, pl.mut); cx.fillStyle = '#222'; cx.fillRect(x - 24, y + 20, 48, 5); cx.fillStyle = '#4f4'; cx.fillRect(x - 24, y + 20, 48 * pl.age / pl.e.grow, 5); }
    if (pl.w > 0) { cx.font = '14px serif'; cx.fillText('💧', x + 18, y - 14); }
  });
  G.traps.forEach(t => { cx.font = '20px serif'; cx.fillText('🪤', t.x, t.y + 6); });

  // entidades
  Object.values(Net.peers).forEach(q => icon({ x: q.x, y: q.y, i: '🧑' }, .6));
  G.bots.forEach(b => icon(b, b.stun > 0 ? .5 : 1));
  G.cops.forEach(c => { icon(c); cx.font = '16px serif'; cx.fillText(frame % 20 < 10 ? '🔴' : '🔵', c.x, c.y - 20); });
  icon(G.p, G.p.invis > 0 ? .3 : 1);
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
  step(dt); draw(); requestAnimationFrame(loop);
}
