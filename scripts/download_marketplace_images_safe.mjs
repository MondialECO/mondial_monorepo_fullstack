import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';

const imageMap = [
  { ref: 'c8ae5ee71c41ba32c19c79463b60d868dc74edc8', name: 'creator_avatar_small.png' },
  { ref: '400f381de9a92b7d33db1fba204a4bce43b6f081', name: 'service_bg_builder.png' },
  { ref: 'f67788ec885acdefb62d2d07ddf8712eb6042076', name: 'service_bg_structural.png' },
  { ref: '0bc54cf60c074c2909a4b7cc2e8f9c9ec9fce71a', name: 'service_bg_deal.png' },
  { ref: '07bf78a7f7fac5b24fb222e52d5a6972e11b710a', name: 'profile_alex_chen.png' },
  { ref: '8dcf5130ed246ee5df18eb10a2e4cf6cd7a1ba55', name: 'profile_sarah_jenkins.png' },
  { ref: 'b2c60e9e73e30a89ab83137d04166ba5385b73a6', name: 'profile_marcus_thorne.png' },
  { ref: 'f91d7e13a3a88639d1267c65d5643dc2a8eaeaff', name: 'profile_elena_rostova.png' },
];

async function downloadImages() {
  const res = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}/images`, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN },
  });
  if (!res.ok) {
    console.error('Failed to fetch image URLs:', res.status);
    return;
  }
  const data = await res.json();
  fs.mkdirSync('public/marketplace-public', { recursive: true });

  for (const item of imageMap) {
    const url = data.meta?.images?.[item.ref];
    if (!url) {
      console.warn(`No URL for ${item.name}`);
      continue;
    }
    const targetPath = `public/marketplace-public/${item.name}`;
    console.log(`Downloading ${item.name}...`);
    const imgRes = await fetch(url);
    if (imgRes.ok) {
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(targetPath, buffer);
      console.log(`✓ Saved ${targetPath}`);
    } else {
      console.error(`✗ Failed to download ${item.name}: ${imgRes.status}`);
    }
  }
}

downloadImages();
