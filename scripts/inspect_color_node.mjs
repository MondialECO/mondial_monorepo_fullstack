import fs from 'fs';

const path = 'scripts/figma_color_57004_11484.json';
if (fs.existsSync(path)) {
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  const node = data.nodes?.['57004:11484']?.document;
  console.log('=== Node Summary ===');
  console.log('Name:', node?.name);
  console.log('Type:', node?.type);
  console.log('BoundingBox:', node?.absoluteBoundingBox);

  const texts = [];
  function collectTexts(n) {
    if (n.characters) {
      texts.push({ name: n.name, text: n.characters, font: n.style });
    }
    if (n.children) {
      for (const c of n.children) collectTexts(c);
    }
  }
  collectTexts(node);
  console.log('\n=== All Texts in Node (' + texts.length + ') ===');
  texts.forEach((t, i) => {
    console.log(`[${i}] ${t.name}: "${t.text.replace(/\n/g, ' \\n ')}" (Font: ${t.font?.fontFamily} ${t.font?.fontWeight} ${t.font?.fontSize}px)`);
  });

  console.log('\n=== Detailed Structural Tree ===');
  function dumpTree(n, depth = 0) {
    if (depth > 6) return;
    const info = n.characters ? ` -> "${n.characters.replace(/\n/g, ' ')}"` : '';
    console.log('  '.repeat(depth) + `[${n.type}] ${n.name}${info}`);
    if (n.children) {
      for (const c of n.children) dumpTree(c, depth + 1);
    }
  }
  dumpTree(node);
} else {
  console.log('File does not exist yet.');
}
