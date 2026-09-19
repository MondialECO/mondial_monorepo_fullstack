import fs from 'fs';
import path from 'path';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const NODE_ID = '57079:11396';

async function main() {
  console.log(`Fetching node ${NODE_ID} from Figma file ${FILE_KEY}...`);
  const nodeUrl = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(NODE_ID)}`;
  
  const nodeRes = await fetch(nodeUrl, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });

  if (!nodeRes.ok) {
    console.error('Node fetch failed:', nodeRes.status, await nodeRes.text());
    return;
  }

  const nodeData = await nodeRes.json();
  fs.writeFileSync('scripts/figma_business_model_node.json', JSON.stringify(nodeData, null, 2));
  console.log('✓ Saved scripts/figma_business_model_node.json');

  // Fetch rendered image
  console.log('Fetching image render for node...');
  const imgUrl = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(NODE_ID)}&scale=2&format=png`;
  const imgRes = await fetch(imgUrl, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });

  if (imgRes.ok) {
    const imgData = await imgRes.json();
    console.log('Image URLs:', imgData.images);
    const renderUrl = imgData.images[NODE_ID];
    if (renderUrl) {
      const downloadRes = await fetch(renderUrl);
      const buffer = Buffer.from(await downloadRes.arrayBuffer());
      fs.writeFileSync('scripts/figma_business_model_57079_11396.png', buffer);
      console.log('✓ Downloaded image to scripts/figma_business_model_57079_11396.png');
    }
  } else {
    console.error('Image render request failed:', imgRes.status, await imgRes.text());
  }
}

main().catch(console.error);
