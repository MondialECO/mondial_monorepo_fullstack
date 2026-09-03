import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/figma_provider_project_node.json', 'utf8'));

const sec04_a = data.nodes['56877:106323'].document.children[3]; // 56877:106743
const sec04_b = data.nodes['56877:106323'].document.children[4]; // 56877:106810
const faqSec = data.nodes['56877:106323'].document.children[13]; // 56877:107771

console.log('--- SECTION 04 A vs B ---');
console.log(`Sec 04 A: id=${sec04_a.id}, name="${sec04_a.name}", bbox=`, sec04_a.absoluteBoundingBox);
console.log(`Sec 04 B: id=${sec04_b.id}, name="${sec04_b.name}", bbox=`, sec04_b.absoluteBoundingBox);

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

console.log('\n--- SECTION 04 A Texts ---');
console.log(extractText(sec04_a));

console.log('\n--- SECTION 04 B Texts ---');
console.log(extractText(sec04_b));

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

const faqs = findFaqInstances(faqSec);
console.log(`\nFound ${faqs.length} FAQ candidate instances in FAQ Section`);

faqs.forEach((faq, idx) => {
  const texts = extractText(faq);
  if (texts.length > 0) {
    console.log(`\nFAQ #${idx + 1} (id: ${faq.id}):`);
    texts.forEach(t => console.log(`  - ${JSON.stringify(t)}`));
  }
});
