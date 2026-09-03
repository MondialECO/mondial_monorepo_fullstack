import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('scripts/figma_provider_earnings_node.json', 'utf8'));
const root = data.nodes['56877:107796'].document;

const outDir = 'scripts/provider_earnings_sections';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function dumpNode(node, depth = 0) {
  const indent = '  '.repeat(depth);
  let text = '';
  const name = node.name || 'Unnamed';
  const type = node.type || 'UNKNOWN';
  const id = node.id;
  const w = Math.round(node.absoluteBoundingBox?.width || 0);
  const h = Math.round(node.absoluteBoundingBox?.height || 0);
  const y = Math.round(node.absoluteBoundingBox?.y || 0);

  let extra = '';
  if (node.fills && node.fills.length > 0 && node.fills[0].color) {
    const c = node.fills[0].color;
    extra += ` (color: rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}))`;
  }

  if (node.type === 'TEXT') {
    const chars = JSON.stringify(node.characters || '');
    const style = node.style;
    const font = style ? ` (font: ${style.fontFamily}, size: ${style.fontSize}, weight: ${style.fontWeight})` : '';
    text += `${indent}[TEXT] "${name}" (id: ${id}, w: ${w}, h: ${h}, y: ${y})${extra} -> ${chars}${font}${extra}\n`;
  } else {
    text += `${indent}[${type}] "${name}" (id: ${id}, w: ${w}, h: ${h}, y: ${y})${extra}\n`;
  }

  if (node.children) {
    for (const child of node.children) {
      text += dumpNode(child, depth + 1);
    }
  }

  return text;
}

root.children.forEach((child, idx) => {
  const sanitized = child.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = path.join(outDir, `section_${String(idx).padStart(2, '0')}_node_${child.id.replace(':', '_')}_${sanitized}.txt`);
  const content = dumpNode(child, 0);
  fs.writeFileSync(filename, content);
  console.log(`Wrote ${filename} (${content.length} chars)`);
});
