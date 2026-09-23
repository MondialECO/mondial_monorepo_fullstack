import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_compliance_57156_9158.json', 'utf8'));
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
  const fills = (n.fills || []).filter(f => f.visible !== false).map(f => f.type + (f.color ? ':' + getHex(f.color) : '')).join(',');
  const strokes = (n.strokes || []).filter(s => s.visible !== false).map(s => s.type + (s.color ? ':' + getHex(s.color) : '')).join(',');
  const pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].filter(x => x !== undefined).join('/');
  const radius = n.cornerRadius !== undefined ? 'r:' + n.cornerRadius : '';
  const textInfo = n.type === 'TEXT'
    ? '"' + (n.characters || '').replace(/\n/g, '\\n') + '" [font:' + n.style?.fontFamily + ' w:' + n.style?.fontWeight + ' size:' + n.style?.fontSize + 'px color:' + (n.fills?.[0]?.color ? getHex(n.fills[0].color) : '') + ']'
    : '';
  const size = n.absoluteBoundingBox ? Math.round(n.absoluteBoundingBox.width) + 'x' + Math.round(n.absoluteBoundingBox.height) : '';
  const layout = (n.layoutMode || '') + (n.itemSpacing !== undefined ? ' gap:' + n.itemSpacing : '');

  lines.push(`${indent}[${n.type}] "${n.name}" (${size} ${layout} ${fills ? 'fill:' + fills : ''} ${strokes ? 'stroke:' + strokes : ''} ${pad ? 'pad:' + pad : ''} ${radius} ${textInfo})`);
  if (n.children) n.children.forEach(c => dump(c, depth + 1));
}

dump(root);
fs.writeFileSync('scripts/figma_compliance_dump.txt', lines.join('\n'), 'utf8');
console.log('Saved figma_compliance_dump.txt with ' + lines.length + ' lines');
