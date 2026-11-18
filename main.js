const G = {
  money: 50, inv: [], plants: [], belt: [], started: false, cops: [], parts: [], traps: [],
  gear: { bat: 0, water: 0, trap: 0, cloak: 0, drink: 0 },
  slots: 4, reb: 0, mult: 1, turbo: 0, weather: 0, wt: 20, bt: 0.5, bs: 4, time: 0,
  gate: { locked: false, t: 0, cd: 0 }, dirty: 1, p: new Player()
};
const $ = id => document.getElementById(id);
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : Math.floor(n);

// ---------- Sons (Web Audio API) ----------
const AC = new (window.AudioContext || window.webkitAudioContext)();
function beep(f, d, type = 'square', slide = 0, v = .07) {
  if (AC.state === 'suspended') AC.resume();
  const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.linearRampToValueAtTime(f + slide, t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(AC.destination); o.start(); o.stop(t + d);
}
const SFX = {
  coin: () => { beep(880, .1); setTimeout(() => beep(1320, .15), 80); },
  siren: () => { beep(600, .5, 'sawtooth', 500); setTimeout(() => beep(1100, .5, 'sawtooth', -500), 500); },
  plant: () => beep(200, .2, 'triangle', -80),
  hatch: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .15, 'triangle'), i * 90)),
  alarm: () => { for (let i = 0; i < 4; i++) setTimeout(() => beep(i % 2 ? 500 : 900, .15), i * 160); }
};
function sfx(n) { try { SFX[n](); } catch (e) {} }

// ---------- Notificações ----------
function toast(msg, color = '#333') {
  const d = document.createElement('div');
  d.className = 'toast'; d.textContent = msg; d.style.background = color;
  $('toasts').appendChild(d); setTimeout(() => d.remove(), 3500);
  if ($('toasts').children.length > 4) $('toasts').firstChild.remove();
}
Net.on(m => {
  const p = G.p;
  if (m.t === 'ann') toast(m.m, '#fa0');
  if (m.t === 'take') G.belt = G.belt.filter(b => b.k !== m.k);
  if (m.t === 'belt' && Net.hostConn) {
    const old = Object.fromEntries(G.belt.map(b => [b.k, b]));
    G.belt = m.l.map(([k, id, x]) => { const b = old[k] || new BeltEgg(EGGS[id]); b.k = k; b.x = x; return b; });
  }
  if (m.t === 'slap' && Math.hypot(p.x - m.x, p.y - m.y) < 90) {
    const lost = G.inv.some(i => i.stolen); G.inv = G.inv.filter(i => !i.stolen);
    const a = Math.atan2(p.y - m.y, p.x - m.x);
    p.x = Math.max(14, Math.min(886, p.x + Math.cos(a) * 90)); p.y = Math.max(14, Math.min(586, p.y + Math.sin(a) * 90));
    toast(lost ? '🏏 Slap! Largaste o ovo roubado!' : '🏏 Levaste um slap!', '#e33'); G.dirty = 1;
  }
});

// ---------- Inputs ----------
const keys = {};
const Input = {
  jx: 0, jy: 0,
  vec() {
    let x = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
    let y = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
    if (!x && !y) { x = this.jx; y = this.jy; }
    const l = Math.hypot(x, y); return l > 1 ? [x / l, y / l] : [x, y];
  }
};
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); keys[k] = 1;
  if (k.startsWith('arrow') || k === ' ') e.preventDefault();
  const act = { b: buy, e: steal, f: () => plantInv(0), r: water, g: lockGate, v: sellPlant }[k];
  if (act) act();
  if (k >= '1' && k <= '5') useGear(GEAR[k - 1].id);
});
addEventListener('keyup', e => keys[e.key.toLowerCase()] = 0);
const joy = $('joy'), knob = $('knob');
function jm(e) {
  const t = e.touches[0], r = joy.getBoundingClientRect();
  let x = (t.clientX - r.left - r.width / 2) / (r.width / 2), y = (t.clientY - r.top - r.height / 2) / (r.height / 2);
  const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
  Input.jx = x; Input.jy = y; knob.style.transform = `translate(${x * 30}px,${y * 30}px)`; e.preventDefault();
}
joy.addEventListener('touchstart', jm); joy.addEventListener('touchmove', jm);
joy.addEventListener('touchend', () => { Input.jx = Input.jy = 0; knob.style.transform = ''; });

// ---------- Ações ----------
function nearBelt() {
  let best = null, m = 70;
  G.belt.forEach(b => { const d = Math.hypot(b.x - G.p.x, b.y - G.p.y); if (d < m) { m = d; best = b; } });
  return best;
}
function take(b, stolen) {
  b.gone = true; G.belt = G.belt.filter(x => x !== b); G.inv.push({ e: b.e, stolen }); G.dirty = 1; Net.send({ t: 'take', k: b.k });
}
function buy() {
  const b = nearBelt(); if (!b || G.p.jail) return;
  if (G.money < b.e.price) return toast('💸 Sem dinheiro para ' + b.e.name, '#fa0');
  G.money -= b.e.price; take(b, false); sfx('coin');
}
function steal() {
  const b = nearBelt(); if (!b || G.p.jail) return;
  take(b, true); sfx('alarm');
  if (G.reb > 0 && Math.random() < .5) toast('🤑 Polícia Subornado! Ninguém viu nada...', '#3a3');
  else { G.cops.push(new Cop(G.p)); sfx('siren'); toast('🚨 ROUBASTE! Polícia Brainrot a caminho!', '#e33'); }
}
function plantInv(i) {
  const it = G.inv[i]; if (!it || G.p.jail) return;
  const used = G.plants.map(p => p.slot); let s = -1;
  for (let k = 0; k < G.slots; k++) if (!used.includes(k)) { s = k; break; }
  if (s < 0) return toast('Sem canteiros livres! Faz Rebirth para mais.', '#fa0');
  G.inv.splice(i, 1); G.plants.push(new Plant(it.e, 0, s));
  sfx('plant'); burst(...slotPos(s), '#8d5', 10); G.dirty = 1;
}
function water() {
  G.plants.forEach(pl => { const [x, y] = slotPos(pl.slot); if (Math.hypot(x - G.p.x, y - G.p.y) < 150) pl.w = G.turbo > 0 ? 8 : 4; });
  beep(500, .1, 'sine', 200);
}
function lockGate() {
  if (G.gate.locked || G.gate.cd > 0) return;
  G.gate.locked = true; G.gate.t = 45; toast('🔒 Lockdown de 45s ativado!', '#3a3');
}
function buyGear(id) {
  const g = GEAR.find(x => x.id === id);
  if (G.money < g.p) return toast('💸 Sem dinheiro', '#fa0');
  G.money -= g.p; G.gear[id]++; sfx('coin'); G.dirty = 1;
}
function useGear(id) {
  if (G.gear[id] < 1) return toast('Não tens esse equipamento. Compra na loja!', '#fa0');
  G.gear[id]--; G.dirty = 1; const p = G.p;
  if (id === 'bat') { Net.send({ t: 'slap', x: p.x, y: p.y }); burst(p.x, p.y, '#fff', 20); }
  if (id === 'water') G.turbo = 20;
  if (id === 'trap') G.traps.push({ x: p.x, y: p.y });
  if (id === 'cloak') p.invis = 300;
  if (id === 'drink') p.boost = 600;
  beep(700, .15, 'triangle', 300);
}
function rebirth() {
  const cost = 20000 * (G.reb + 1);
  if (G.money < cost) return toast('Precisas de $' + fmt(cost) + ' para Rebirth', '#fa0');
  G.reb++; G.slots = Math.min(12, G.slots + 2); G.mult = 1 + G.reb * .5;
  G.money = 50; G.plants = []; G.inv = []; G.dirty = 1;
  toast('🔄 REBIRTH ' + G.reb + '! Mais canteiros, x' + G.mult + ' dinheiro, Polícia Subornado desbloqueado', '#e0f');
  sfx('hatch');
}

// ---------- Interface ----------
function ui() {
  $('money').textContent = '💰 ' + fmt(G.money) + ' (+' + fmt(income()) + '/s)';
  $('weather').textContent = WEATHER[G.weather].n;
  $('gate').textContent = G.gate.locked ? '🔒 Portão ' + Math.ceil(G.gate.t) + 's' : G.gate.cd > 0 ? '⏳ Portão ' + Math.ceil(G.gate.cd) + 's' : '🔓 Portão aberto (G)';
  $('reb').textContent = '🔄 Rebirth ' + G.reb + ' | ' + (Net.code ? 'Sala ' + Net.code + ' (' + (Object.keys(Net.peers).length + 1) + ' jogadores)' : 'Solo');
  $('rbtn').textContent = 'Rebirth por $' + fmt(20000 * (G.reb + 1));
  if (!G.dirty) return; G.dirty = 0;
  $('shop').innerHTML = GEAR.map((g, i) =>
    `<div class="row"><b>${i + 1}. ${g.n}</b><button onclick="buyGear('${g.id}')">$${g.p}</button><button onclick="useGear('${g.id}')">x${G.gear[g.id]}</button></div>`).join('');
  $('inv').innerHTML = G.inv.map((it, i) =>
    `<span><button style="border-color:${RAR[it.e.r].c}" onclick="plantInv(${i})">${it.e.name}${it.stolen ? ' 🚨' : ''}</button><button onclick="sellItem(${i})">💲${fmt(it.e.price * .6)}</button></span>`).join('') || 'Vazia. Vai à esteira!';
}
// ---------- Vender ----------
function sellItem(i) {
  const it = G.inv[i]; if (!it) return;
  G.money += Math.floor(it.e.price * .6); G.inv.splice(i, 1); sfx('coin'); G.dirty = 1;
}
function sellPlant() {
  let b = null, m = 60;
  G.plants.forEach(pl => { const [x, y] = slotPos(pl.slot), d = Math.hypot(x - G.p.x, y - G.p.y); if (d < m) { m = d; b = pl; } });
  if (!b) return toast('Chega-te a uma planta para a vender', '#fa0');
  G.money += Math.floor(b.e.price * .6 * MUT[b.mut].m); G.plants = G.plants.filter(p => p !== b); sfx('coin');
}

// ---------- Menu de salas ----------
const mst = t => $('mstat').textContent = t;
function startGame() { G.started = true; $('menu').style.display = 'none'; G.dirty = 1; }
function solo() { startGame(); }
function createRoom() { mst('A criar sala...'); Net.create(c => { toast('Sala criada! Código: ' + c, '#3a3'); startGame(); }, e => mst('Erro: ' + e)); }
function joinRoom(c) {
  if (!/^\d{6}$/.test(c)) return mst('O código tem 6 números');
  mst('A entrar...'); Net.join(c, startGame, e => mst('Erro: ' + e));
}
function findRooms() {
  $('rooms').textContent = 'A procurar...';
  Net.list(l => { $('rooms').innerHTML = l.length ? l.map(c => `<button onclick="joinRoom('${c}')">Sala ${c}</button>`).join('') : 'Nenhuma sala encontrada'; });
}
setInterval(ui, 200);
requestAnimationFrame(loop);
