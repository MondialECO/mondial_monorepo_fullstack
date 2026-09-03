const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const FAQ_NODE_ID = '56877:116117';

async function fetchFAQ() {
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(FAQ_NODE_ID)}&depth=10`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': FIGMA_TOKEN } });
  const data = await res.json();
  const doc = data.nodes[FAQ_NODE_ID]?.document;
  
  function extractText(node, texts = []) {
    if (node.characters) {
      texts.push({ name: node.name, text: node.characters });
    }
    if (node.children) {
      node.children.forEach(c => extractText(c, texts));
    }
    return texts;
  }
  
  const texts = extractText(doc);
  texts.forEach(t => console.log(`[${t.name}]: ${t.text}`));
}
fetchFAQ();
