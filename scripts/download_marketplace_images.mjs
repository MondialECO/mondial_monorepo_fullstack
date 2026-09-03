import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';

function findImageNodes(node, images = []) {
  if (node.fills) {
    for (const fill of node.fills) {
      if (fill.type === 'IMAGE' && fill.imageRef) {
        images.push({
          nodeId: node.id,
          name: node.name,
          imageRef: fill.imageRef,
          width: node.absoluteBoundingBox?.width,
          height: node.absoluteBoundingBox?.height,
        });
      }
    }
  }
  if (node.children) {
    node.children.forEach(c => findImageNodes(c, images));
  }
  return images;
}

const files = fs.readdirSync('scripts/marketplace_sections').filter(f => f.startsWith('deep_'));
const allImages = [];
files.forEach(f => {
  const data = JSON.parse(fs.readFileSync(`scripts/marketplace_sections/${f}`, 'utf8'));
  const imgs = findImageNodes(data);
  imgs.forEach(img => {
    if (!allImages.find(x => x.imageRef === img.imageRef)) {
      allImages.push(img);
    }
  });
});

console.log(`Found ${allImages.length} unique images across marketplace sections:`);
allImages.forEach(img => console.log(`- [${img.nodeId}] "${img.name}" (${img.width}x${img.height}) ref: ${img.imageRef}`));

fs.writeFileSync('scripts/marketplace_images.json', JSON.stringify(allImages, null, 2));

async function downloadImages() {
  if (allImages.length === 0) return;
  const res = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}/images`, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN },
  });
  if (!res.ok) {
    console.error('Failed to fetch image URLs:', res.status, res.statusText);
    return;
  }
  const data = await res.json();
  fs.mkdirSync('public/marketplace-public', { recursive: true });

  for (const img of allImages) {
    const url = data.meta?.images?.[img.imageRef];
    if (!url) {
      console.warn(`No URL for imageRef ${img.imageRef}`);
      continue;
    }
    const safeName = img.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const filename = `${safeName}_${img.imageRef.substring(0, 8)}.png`;
    const targetPath = `public/marketplace-public/${filename}`;
    
    console.log(`Downloading ${filename}...`);
    const imgRes = await fetch(url);
    if (imgRes.ok) {
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(targetPath, buffer);
      console.log(`Saved ${targetPath}`);
      img.localPath = `/marketplace-public/${filename}`;
    }
  }
  fs.writeFileSync('scripts/marketplace_images.json', JSON.stringify(allImages, null, 2));
}

downloadImages();
