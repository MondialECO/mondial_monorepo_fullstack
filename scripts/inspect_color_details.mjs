import fs from 'fs';

const path = 'scripts/figma_color_57004_11484.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const node = data.nodes?.['57004:11484']?.document;

function printDeep(n, depth = 0) {
  let extra = '';
  if (n.characters) extra += ` characters="${n.characters.replace(/\n/g, '\\n')}"`;
  if (n.fills && n.fills.length > 0) {
    const f = n.fills[0];
    if (f.color) {
      extra += ` fill=rgba(${Math.round(f.color.r*255)},${Math.round(f.color.g*255)},${Math.round(f.color.b*255)},${f.opacity ?? 1})`;
    }
  }
  console.log('  '.repeat(depth) + `[${n.type}] "${n.name}"${extra}`);
  if (n.children) {
    for (const c of n.children) printDeep(c, depth + 1);
  }
}

function findNodeByName(n, name) {
  if (n.name && n.name.toLowerCase().includes(name.toLowerCase())) return n;
  if (n.children) {
    for (const c of n.children) {
      const res = findNodeByName(c, name);
      if (res) return res;
    }
  }
  return null;
}

const preview = findNodeByName(node, 'SECTION B: LIVE PREVIEW');
if (preview) {
  console.log('--- PREVIEW CONTENTS ---');
  printDeep(preview);
}

const footer = findNodeByName(node, 'FOOTER');
if (footer) {
  console.log('--- FOOTER CONTENTS ---');
  printDeep(footer);
} else {
  console.log('--- ROOT CHILDREN ---');
  if (node && node.children) {
    node.children.forEach(c => console.log(c.name));
  }
}
