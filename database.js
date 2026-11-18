// w = peso de spawn, p = preço base, g = $/s base, t = segundos para chocar
const RAR = [
  { n: 'Noob',    c: '#9aa3a8', w: 40,  p: 10,     g: 1,    t: 0 },
  { n: 'Comum',   c: '#5fd35f', w: 28,  p: 50,     g: 4,    t: 6 },
  { n: 'Incomum', c: '#3fa7ff', w: 16,  p: 250,    g: 15,   t: 12 },
  { n: 'Raro',    c: '#a24bff', w: 9,   p: 1200,   g: 60,   t: 20 },
  { n: 'Épico',   c: '#ff3cc8', w: 5,   p: 6000,   g: 250,  t: 30 },
  { n: 'Mítico',  c: '#ffa51f', w: 1.8, p: 30000,  g: 1000, t: 45 },
  { n: 'Pro',     c: '#00f5ff', w: 0.2, p: 200000, g: 6000, t: 60 }
];

const NAMES = [
  ['Ovo de Terra Noob', 'Semente Noobini Pizzanini', 'Broto de Batata Lagada', 'Ovo Quadriculado', 'Semente de Relva Seca'],
  ['Ovo Skibidi Bebé', 'Semente de Tomate Sigma', 'Ovo Capybara Chill', 'Broto de Banana Dancing', 'Semente Smurf Cat'],
  ['Ovo Tung Tung Sahur', 'Semente Tralalero Tralala', 'Ovo Grimace Shake', 'Broto Bombardiro Crocodilo', 'Semente de Milho Mewing'],
  ['Ovo Brr Brr Patapim', 'Semente Lirili Larila', 'Ovo Chimpanzini Bananini', 'Broto de Cacto Rizzler', 'Semente Fanum Tax'],
  ['Ovo Ballerina Cappuccina', 'Semente Cappuccino Assassino', 'Ovo Gyatt Dourado', 'Broto de Árvore Ohio', 'Semente Trippi Troppi'],
  ['Ovo Frigo Camelo Supremo', 'Semente Dragon Fruit Omega', 'Ovo Gigachad Ancestral', 'Broto de Lótus Cósmica', 'Semente Brainrot God'],
  ['Ovo Admin Supremo', 'Semente Infinita Pro Max', 'Ovo Nyan Cat Galáctico', 'Broto do Criador do Servidor', 'Semente Singularity Brainrot']
];

const EGGS = [];
NAMES.forEach((list, r) => list.forEach((name, i) => EGGS.push({
  id: EGGS.length, name, r,
  price: Math.round(RAR[r].p * (1 + i * 0.3)),
  gps: RAR[r].g * (1 + i * 0.25),
  grow: RAR[r].t
})));

const GEAR = [
  { id: 'bat',   n: 'Taco Slap',          p: 150 },
  { id: 'water', n: 'Regador Turbo',      p: 200 },
  { id: 'trap',  n: 'Armadilha de Urso',  p: 120 },
  { id: 'cloak', n: 'Capa Invisível',     p: 300 },
  { id: 'drink', n: 'Bebida Energética',  p: 100 }
];

const MUT = [
  { n: 'Normal',   m: 1,  c: '' },
  { n: 'Dourado',  m: 1.5, c: '#ffd60a' },
  { n: 'Diamante', m: 2.5, c: '#8ff6ff' },
  { n: 'Arco-Íris', m: 5, c: 'rainbow' },
  { n: 'Glitch',   m: 10, c: '#ff00ff' }
];

// mut = mutação aplicada às plantas quando o evento começa
const WEATHER = [
  { n: '☀️ Céu Limpo',            mut: 0 },
  { n: '☣️ Chuva Ácida',          mut: 2 },
  { n: '🔥 Calor Dourado',        mut: 1 },
  { n: '🌈 Tempestade Arco-Íris', mut: 3 },
  { n: '🌑 Noite Sigma',          mut: 4 }
];
