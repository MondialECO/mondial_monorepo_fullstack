import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_market_study_node.json', 'utf8'));

function findNodes(node, namePart, results = []) {
  if (node.name && node.name.includes(namePart)) results.push(node);
  if (node.children) {
    for (const c of node.children) findNodes(c, namePart, results);
  }
  return results;
}

const section2 = findNodes(data.nodes['57078:11039'].document, 'SECTION 2')[0];

function getHex(c) {
  if (!c) return 'none';
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
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
    ? `"${n.characters.replace(/\n/g, ' ')}" [font: ${n.style?.fontFamily} weight:${n.style?.fontWeight} size:${n.style?.fontSize}px color:${n.fills?.[0]?.color ? getHex(n.fills[0].color) : ''}]`
    : '';
  const size = n.absoluteBoundingBox ? `${Math.round(n.absoluteBoundingBox.width)}x${Math.round(n.absoluteBoundingBox.height)}` : '';

  lines.push(`${indent}[${n.type}] "${n.name}" (${size} ${fills ? 'fill:' + fills : ''} ${strokes ? 'stroke:' + strokes : ''} ${pad ? 'pad:' + pad : ''} ${radius} ${textInfo})`);
  if (n.children) n.children.forEach(c => dump(c, depth + 1));
}

dump(section2);

fs.writeFileSync('scripts/section2_full_dump.txt', lines.join('\n'), 'utf8');
console.log('Saved', lines.length, 'lines');
