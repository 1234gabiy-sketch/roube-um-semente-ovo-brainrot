function slotPos(i) { return [110 + (i % 6) * 130, 450 + Math.floor(i / 6) * 70]; }

class Ent {
  constructor(x, y, icon) { this.x = x; this.y = y; this.i = icon; this.sp = 2; this.carry = null; this.dead = false; }
  go(tx, ty, s) {
    const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy) || 1;
    if (d > s) { this.x += dx / d * s; this.y += dy / d * s; }
    return d;
  }
}

class Player extends Ent {
  constructor() { super(450, 500, '🧑'); this.jail = 0; this.invis = 0; this.boost = 0; }
}

class BeltEgg {
  constructor(e) { this.e = e; this.x = -20; this.y = 300; this.gone = false; }
}

class Plant {
  constructor(e, mut, slot) {
    this.e = e; this.mut = mut; this.slot = slot; this.w = 0;
    this.age = 0; this.hatched = e.grow === 0; this.gone = false;
  }
  get ready() { return this.age >= this.e.grow; }
  get gps() { return this.e.gps * MUT[this.mut].m * G.mult * (this.ready ? 1 : 0.5); }
}

class Bot extends Ent {
  constructor() {
    super(Math.random() * 800 + 50, -20, '🥷');
    this.sp = 1.6 + Math.random() * 0.6; this.stun = 0; this.tgt = null;
  }
  update() {
    if (this.stun > 0) { this.stun--; return; }
    if (this.carry) { this.go(this.x, -40, this.sp * 1.3); if (this.y < -30) this.dead = true; return; }
    if (!this.tgt || this.tgt.gone) {
      this.tgt = null;
      const ripe = G.plants.filter(p => p.ready);
      if (!G.gate.locked && ripe.length && Math.random() < 0.6) this.tgt = ripe[0 | Math.random() * ripe.length];
      else if (G.belt.length) this.tgt = G.belt[0 | Math.random() * G.belt.length];
      if (!this.tgt) { this.go(450, 200, 1); return; }
    }
    const t = this.tgt, isPlant = t instanceof Plant;
    const [tx, ty] = isPlant ? slotPos(t.slot) : [t.x, t.y];
    if (this.go(tx, ty, this.sp) < 14) {
      t.gone = true;
      if (isPlant) { G.plants = G.plants.filter(p => p !== t); sfx('alarm'); toast('🚨 Um bot roubou ' + t.e.name + ' da tua quinta!', '#e33'); }
      else G.belt = G.belt.filter(b => b !== t);
      this.carry = t.e; this.tgt = null; G.dirty = 1;
      G.cops.push(new Cop(this));
    }
  }
}

class Cop extends Ent {
  constructor(target) {
    super(target.x < 450 ? -30 : 930, 300, '👮');
    this.t = target; this.sp = 2.3; this.life = 900;
  }
  update() {
    const t = this.t, isP = t instanceof Player;
    if (--this.life <= 0 || t.dead || (isP && !G.inv.some(i => i.stolen))) { this.dead = true; return; }
    if (isP && t.invis > 0) return; // perdeu-te de vista
    if (this.go(t.x, t.y, this.sp) < 18) {
      if (isP) {
        const fine = Math.min(G.money, 200 + G.inv.filter(i => i.stolen).length * 100);
        G.inv = G.inv.filter(i => !i.stolen); G.money -= fine;
        t.jail = G.reb > 0 ? 300 : 600; t.x = 60; t.y = 60;
        toast('👮 Preso! Multa de ' + fine + ' e ovo confiscado.', '#e33'); sfx('siren'); G.dirty = 1;
      } else { t.dead = true; t.carry = null; }
      this.dead = true;
    }
  }
}
