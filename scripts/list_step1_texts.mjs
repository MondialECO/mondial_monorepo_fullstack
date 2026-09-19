import fs from 'fs';

const raw = fs.readFileSync('scripts/figma_step1_strategy_node.json', 'utf8');
const data = JSON.parse(raw);
const doc = Object.values(data.nodes)[0]?.document;

function getTexts(node, list = []) {
  if (node.type === 'TEXT') {
    list.push({
      text: node.characters,
      font: node.style?.fontFamily,
      size: node.style?.fontSize,
      weight: node.style?.fontWeight,
      parent: node.name
    });
  }
  if (node.children) {
    node.children.forEach(c => getTexts(c, list));
  }
  return list;
}

const all = getTexts(doc);
console.log(`Total text nodes: ${all.length}`);
all.forEach((t, i) => console.log(`${i+1}. [${t.font} ${t.weight} ${t.size}px] "${t.text}"`));
