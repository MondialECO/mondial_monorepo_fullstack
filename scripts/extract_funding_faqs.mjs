import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_entrepreneur_funding_node.json', 'utf8'));
const section10 = data.nodes['56877:100411'].document.children[9];

function findFaqInstances(node, faqs = []) {
  if (node.name === 'Faqs' || node.name === 'Accordion Item') {
    faqs.push(node);
  }
  if (node.children) {
    for (const c of node.children) {
      findFaqInstances(c, faqs);
    }
  }
  return faqs;
}

const faqs = findFaqInstances(section10);
console.log(`Found ${faqs.length} FAQ instances in Section 10`);

function extractText(node) {
  let texts = [];
  if (node.type === 'TEXT') {
    texts.push(node.characters);
  }
  if (node.children) {
    for (const c of node.children) {
      texts = texts.concat(extractText(c));
    }
  }
  return texts;
}

faqs.forEach((faq, idx) => {
  const texts = extractText(faq);
  console.log(`\nFAQ #${idx + 1} (id: ${faq.id}):`);
  texts.forEach(t => console.log(`  - ${JSON.stringify(t)}`));
});
