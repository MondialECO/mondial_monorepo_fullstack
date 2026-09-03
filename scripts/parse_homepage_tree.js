import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_homepage_node_data.json', 'utf8'));
const rootNode = Object.values(data.nodes)[0].document;

console.log('=== HOMEPAGE ROOT NODE ===');
console.log('Name:', rootNode.name);
console.log('Type:', rootNode.type);
console.log('Dimensions:', rootNode.absoluteBoundingBox);
console.log('Children count:', rootNode.children?.length);

if (rootNode.children) {
  rootNode.children.forEach((section, idx) => {
    const box = section.absoluteBoundingBox;
    const w = box ? Math.round(box.width) : 0;
    const h = box ? Math.round(box.height) : 0;
    console.log(`\n--- [SECTION ${idx + 1}] ${section.name} (${section.type}, ${w}x${h}) ---`);
    console.log(`  Layout: ${section.layoutMode}, Gap: ${section.itemSpacing}, Padding: ${section.paddingTop}/${section.paddingRight}/${section.paddingBottom}/${section.paddingLeft}`);
    
    // Print first 2 levels of children
    if (section.children) {
      section.children.forEach((c, cIdx) => {
        const cBox = c.absoluteBoundingBox;
        const cW = cBox ? Math.round(cBox.width) : 0;
        const cH = cBox ? Math.round(cBox.height) : 0;
        const text = c.characters ? ` -> "${c.characters.replace(/\n/g, ' ')}"` : '';
        console.log(`    - [${cIdx + 1}] ${c.name} (${c.type}, ${cW}x${cH})${text}`);
        if (c.children) {
          c.children.forEach((gc, gcIdx) => {
            const gcText = gc.characters ? ` -> "${gc.characters.replace(/\n/g, ' ')}"` : '';
            console.log(`        * [${gcIdx + 1}] ${gc.name} (${gc.type})${gcText}`);
          });
        }
      });
    }
  });
}
