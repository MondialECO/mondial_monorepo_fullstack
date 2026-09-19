import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_market_study_node.json', 'utf8'));

function findNodes(node, namePart, results = []) {
  if (node.name && node.name.toLowerCase().includes(namePart.toLowerCase())) results.push(node);
  if (node.children) {
    for (const c of node.children) findNodes(c, namePart, results);
  }
  return results;
}

const root = Object.values(data.nodes)[0]?.document;

function getHex(c) {
  if (!c) return 'none';
  const r = Math.round((c.r || 0) * 255);
  const g = Math.round((c.g || 0) * 255);
  const b = Math.round((c.b || 0) * 255);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

const lines = [];

function dump(n, depth = 0) {
  const indent = '  '.repeat(depth);
  const fills = (n.fills || []).map(f => f.type + (f.color ? ':' + getHex(f.color) : '')).join(',');
  const strokes = (n.strokes || []).map(s => s.type + (s.color ? ':' + getHex(s.color) : '')).join(',');
  const pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].filter(x => x !== undefined).join('/');
  const radius = n.cornerRadius !== undefined ? `r:${n.cornerRadius}` : '';
  const textInfo = n.type === 'TEXT'
    ? `"${n.characters.replace(/\n/g, '\\n')}" [font: ${n.style?.fontFamily} weight:${n.style?.fontWeight} size:${n.style?.fontSize}px color:${n.fills?.[0]?.color ? getHex(n.fills[0].color) : ''}]`
    : '';
  const size = n.absoluteBoundingBox ? `${Math.round(n.absoluteBoundingBox.width)}x${Math.round(n.absoluteBoundingBox.height)}` : '';

  lines.push(`${indent}[${n.type}] "${n.name}" (${size} ${fills ? 'fill:' + fills : ''} ${strokes ? 'stroke:' + strokes : ''} ${pad ? 'pad:' + pad : ''} ${radius} ${textInfo})`);
  if (n.children) n.children.forEach(c => dump(c, depth + 1));
}

const sec3 = findNodes(root, 'SECTION 3')[0];
const sec4 = findNodes(root, 'SECTION 4')[0];

lines.push('=== SECTION 3 ===');
if (sec3) dump(sec3);

lines.push('\n=== SECTION 4 ===');
if (sec4) dump(sec4);

fs.writeFileSync('scripts/section3_4_full_dump.txt', lines.join('\n'), 'utf8');
console.log('Saved', lines.length, 'lines for section 3 & 4');
