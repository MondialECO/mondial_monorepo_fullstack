import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_investor_profile_node.json', 'utf8'));
const section10 = data.nodes['56877:110243'].document.children[9];

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

function findFaqInstances(node, faqs = []) {
  if (node.name === 'Accordion Item' || node.name === 'Faqs' || (node.name && node.name.startsWith('Item'))) {
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
console.log(`Found ${faqs.length} FAQ candidate instances in Section 10`);

faqs.forEach((faq, idx) => {
  const texts = extractText(faq);
  if (texts.length > 0) {
    console.log(`\nFAQ #${idx + 1} (id: ${faq.id}):`);
    texts.forEach(t => console.log(`  - ${JSON.stringify(t)}`));
  }
});
