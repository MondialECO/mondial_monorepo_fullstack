import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('scripts/figma_header_images.json', 'utf8'));
const dir = 'public/figma_header';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function downloadImages() {
  for (const [nodeId, url] of Object.entries(data.images)) {
    const filename = `header_${nodeId.replace(':', '_')}.png`;
    const dest = path.join(dir, filename);
    console.log(`Downloading ${filename} ...`);
    const res = await fetch(url);
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buffer);
      console.log(`✓ Saved ${dest}`);
    } else {
      console.error(`Failed to download ${url}`);
    }
  }
}

downloadImages();
