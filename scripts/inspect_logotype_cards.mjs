import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('scripts/figma_logotype_node.json', 'utf8'));
const root = Object.values(raw.nodes)[0].document;

function findCards(node) {
  let cards = [];
  if (node.name && node.name.startsWith('CARD')) {
    cards.push(node);
  }
  if (node.children) {
    for (const child of node.children) {
      cards = cards.concat(findCards(child));
    }
  }
  return cards;
}

const cards = findCards(root);
console.log(`Found ${cards.length} cards`);

for (const card of cards) {
  console.log(`\n========================================`);
  console.log(`CARD NAME: ${card.name}`);
  
  function getTexts(n) {
    let t = [];
    if (n.characters) t.push({ name: n.name, text: n.characters });
    if (n.children) {
      for (const c of n.children) t = t.concat(getTexts(c));
    }
    return t;
  }
  
  console.log('Texts in card:', JSON.stringify(getTexts(card), null, 2));
}
