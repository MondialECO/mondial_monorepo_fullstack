const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const FAQ_IDS = [
  '56877:99145',
  '56877:99146',
  '56877:99147',
  '56877:99148',
  '56877:99149',
  '56877:99150',
  '56877:99151',
  '56877:99152',
];

async function getFaqs() {
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${FAQ_IDS.join(',')}`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': FIGMA_TOKEN } });
  const data = await res.json();

  for (const id of FAQ_IDS) {
    const doc = data.nodes[id]?.document;
    if (!doc) continue;
    
    function collectTexts(n) {
      let t = [];
      if (n.type === 'TEXT') {
        t.push(n.characters);
      }
      if (n.children) {
        for (const c of n.children) {
          t = t.concat(collectTexts(c));
        }
      }
      return t;
    }

    const texts = collectTexts(doc);
    console.log(`\n--- FAQ ${id} ---`);
    console.log(texts.join('\n'));
  }
}

getFaqs().catch(console.error);
