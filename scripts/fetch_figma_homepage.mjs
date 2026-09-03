import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const NODE_ID = '25223:491';

async function fetchFigmaHomepage() {
  console.log(`Fetching node ${NODE_ID} from file ${FILE_KEY}...`);

  // 1. Fetch Node Document & Geometry
  const nodeUrl = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(NODE_ID)}`;
  const nodeRes = await fetch(nodeUrl, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });

  if (!nodeRes.ok) {
    console.error(`Failed to fetch node: ${nodeRes.status} ${nodeRes.statusText}`);
    const text = await nodeRes.text();
    console.error(text);
    return;
  }

  const nodeData = await nodeRes.json();
  fs.writeFileSync('scripts/figma_homepage_node_data.json', JSON.stringify(nodeData, null, 2));
  console.log('✓ Node JSON saved to scripts/figma_homepage_node_data.json');

  // 2. Fetch Rendered Image of the node
  const imgUrl = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(NODE_ID)}&format=png&scale=2`;
  const imgRes = await fetch(imgUrl, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });

  if (imgRes.ok) {
    const imgData = await imgRes.json();
    const renderedImgUrl = imgData.images?.[NODE_ID];
    if (renderedImgUrl) {
      console.log(`Downloading rendered PNG from: ${renderedImgUrl}`);
      const pngRes = await fetch(renderedImgUrl);
      const arrayBuffer = await pngRes.arrayBuffer();
      fs.writeFileSync('public/figma_homepage_preview.png', Buffer.from(arrayBuffer));
      console.log('✓ Saved preview image to public/figma_homepage_preview.png');
    }
  } else {
    console.error(`Failed to get rendered image URL: ${imgRes.status}`);
  }
}

fetchFigmaHomepage().catch(console.error);
