const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\rimay\\.gemini\\antigravity-ide\\brain\\763c3685-a12c-4065-a1fe-05b144f0de84';
const destDir = path.resolve(__dirname, '../public/assets/images/arena');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const mappings = [
  { src: 'hero_arena_banner_1789099036263.jpg', dest: 'hero-arena-banner.jpg' },
  { src: 'match_br_bermuda_1789099065310.jpg', dest: 'match-br-bermuda.jpg' },
  { src: 'match_clash_squad_1789099084009.jpg', dest: 'match-clash-squad.jpg' },
  { src: 'match_1v1_duel_1789099103768.jpg', dest: 'match-1v1-duel.jpg' },
  { src: 'match_purgatory_solo_1789099121121.jpg', dest: 'match-purgatory-solo.jpg' },
];

for (const m of mappings) {
  const sourceFile = path.join(srcDir, m.src);
  const targetFile = path.join(destDir, m.dest);
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`Copied ${m.src} -> ${targetFile} (${fs.statSync(targetFile).size} bytes)`);
}
