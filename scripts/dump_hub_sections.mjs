import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_brand_kit_hub_57004_12057.json', 'utf-8'));

function dumpSection(name, root) {
  console.log(`\n=== SECTION: ${name} ===`);
  function traverse(node, depth = 0) {
    const indent = '  '.repeat(depth);
    if (node.name.includes(name) || depth > 0) {
      const text = node.characters ? ` [TEXT: "${node.characters.replace(/\n/g, ' ')}"]` : '';
      const fills = node.fills ? ` [Fills: ${JSON.stringify(node.fills.map(f => f.color || f.type))}]` : '';
      console.log(`${indent}${node.name} (${node.type})${text}`);
      if (node.children && depth < 4) {
        for (const child of node.children) {
          traverse(child, depth + 1);
        }
      }
    } else if (node.children) {
      for (const child of node.children) {
        traverse(child, 0);
      }
    }
  }
  traverse(root);
}

const doc = Object.values(data.nodes)[0]?.document;
dumpSection("IDENTITY BLOCK", doc);
dumpSection("SECTION 1 — LOGO", doc);
dumpSection("SECTION 2 — COLOUR", doc);
dumpSection("SECTION 3 — TYPOGRAPHY", doc);
dumpSection("SECTION 4 — STRATEGY", doc);
dumpSection("SECTION 5 — USED BY", doc);
dumpSection("SECTION 6 — COMING SOON", doc);
dumpSection("FOOTER STRIP", doc);
