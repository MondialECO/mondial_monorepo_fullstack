import fs from 'fs';
import path from 'path';

const raw = JSON.parse(fs.readFileSync('scripts/figma_entrepreneur_build_node.json', 'utf8'));
const root = raw.nodes['56877:97662'].document;

const outDir = 'scripts/entrepreneur_build_sections';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function dumpTextAndStructure(node, depth = 0) {
  const indent = '  '.repeat(depth);
  let lines = [];
  
  let label = `${indent}[${node.type}] "${node.name}" (id: ${node.id}`;
  if (node.absoluteBoundingBox) {
    label += `, w: ${Math.round(node.absoluteBoundingBox.width)}, h: ${Math.round(node.absoluteBoundingBox.height)})`;
  } else {
    label += ')';
  }
  
  if (node.fills && node.fills.length > 0 && node.fills[0].color) {
    const c = node.fills[0].color;
    label += ` (color: rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}))`;
  }
  
  if (node.type === 'TEXT') {
    const chars = node.characters ? node.characters.replace(/\n/g, '\\n') : '';
    const style = node.style ? ` (font: ${node.style.fontFamily}, size: ${node.style.fontSize}, weight: ${node.style.fontWeight})` : '';
    label += ` -> "${chars}"${style}`;
    if (node.fills && node.fills.length > 0 && node.fills[0].color) {
      const c = node.fills[0].color;
      label += ` (color: rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}))`;
    }
  }
  
  lines.push(label);
  
  if (node.children) {
    for (const child of node.children) {
      lines = lines.concat(dumpTextAndStructure(child, depth + 1));
    }
  }
  
  return lines;
}

root.children.forEach((child, idx) => {
  const safeName = child.name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);
  const fileName = `section_${String(idx).padStart(2, '0')}_node_${child.id.replace(':', '_')}_${safeName}.txt`;
  const fullPath = path.join(outDir, fileName);
  
  const lines = dumpTextAndStructure(child, 0);
  fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
  console.log(`Saved ${fileName} (${lines.length} lines)`);
});
