import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_market_study_node.json', 'utf8'));
const root = data.nodes['57078:11039'].document;

function getRGBA(c, op = 1) {
  if (!c) return 'none';
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  const a = c.a !== undefined ? c.a : op;
  const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${hex} (rgba(${r},${g},${b},${a}))`;
}

function dumpNode(node, depth = 0) {
  const indent = '  '.repeat(depth);
  const fills = (node.fills || []).map(f => f.type + (f.color ? ':' + getRGBA(f.color, f.opacity) : '')).join(' | ');
  const strokes = (node.strokes || []).map(s => s.type + (s.color ? ':' + getRGBA(s.color, s.opacity) : '')).join(' | ');
  const pad = [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft].filter(x => x !== undefined).join('/');
  const radius = node.cornerRadius !== undefined ? `r:${node.cornerRadius}` : '';
  const textInfo = node.type === 'TEXT'
    ? `TEXT: "${node.characters}" [font: ${node.style?.fontFamily} weight:${node.style?.fontWeight} size:${node.style?.fontSize}px color:${node.fills?.[0]?.color ? getRGBA(node.fills[0].color) : ''}]`
    : '';

  const meta = [fills ? `fill: ${fills}` : '', strokes ? `stroke: ${strokes}` : '', pad ? `pad: ${pad}` : '', radius, textInfo].filter(Boolean).join(' | ');

  console.log(`${indent}[${node.type}] "${node.name}" (${meta})`);

  if (node.children) {
    for (const c of node.children) dumpNode(c, depth + 1);
  }
}

dumpNode(root);
