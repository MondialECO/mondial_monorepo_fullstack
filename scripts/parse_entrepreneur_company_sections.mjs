import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('scripts/figma_entrepreneur_company_node.json', 'utf8'));
const rootDoc = data.nodes['56877:95645']?.document;

const outDir = 'scripts/entrepreneur_company_sections';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function dumpNode(node, depth = 0) {
  const indent = '  '.repeat(depth);
  let lines = [];

  let info = `${indent}[${node.type}] "${node.name}" (id: ${node.id}`;
  if (node.absoluteBoundingBox) {
    info += `, w: ${Math.round(node.absoluteBoundingBox.width)}, h: ${Math.round(node.absoluteBoundingBox.height)}`;
  }
  if (node.fills && node.fills.length > 0 && node.fills[0].color) {
    const c = node.fills[0].color;
    info += `) (color: rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`;
  }
  info += ')';

  if (node.type === 'TEXT') {
    const style = node.style || {};
    info += ` -> "${node.characters?.replace(/\n/g, '\\n')}" (font: ${style.fontFamily}, size: ${style.fontSize}, weight: ${style.fontWeight})`;
    if (node.fills && node.fills.length > 0 && node.fills[0].color) {
      const c = node.fills[0].color;
      info += ` (color: rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}))`;
    }
  }

  lines.push(info);

  if (node.children) {
    for (const child of node.children) {
      lines = lines.concat(dumpNode(child, depth + 1));
    }
  }

  return lines;
}

if (rootDoc && rootDoc.children) {
  rootDoc.children.forEach((child, idx) => {
    const safeName = `node_${child.id.replace(':', '_')}_${child.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const dumped = dumpNode(child);
    fs.writeFileSync(path.join(outDir, `${safeName}.txt`), dumped.join('\n'));
    console.log(`Saved section [${idx}]: ${safeName}.txt (${dumped.length} lines)`);
  });
}
