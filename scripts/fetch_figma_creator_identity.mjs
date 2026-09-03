import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const MAIN_NODE_ID = '56877:90350';

const SECTION_NODE_IDS = [
  '56877:90350', // Full Identity & Verification Frame
  '56877:90351', // Section 01: Hero
  '56877:90460', // Section 02: Trust Architecture
  '56877:90565', // Section 03: Creator Profile
  '56877:90632', // Section 04: Contact Verification
  '56877:90708', // Section 05: Identity & Liveness
  '56877:90790', // Section 06: Profile Readiness
  '56877:90895', // Section 07: Privacy & Control
  '56877:90976', // Section 08: Final / Completion
  '56877:91072', // Section 09: FAQ
];

async function fetchFigmaCreatorIdentity() {
  console.log('Fetching Figma Creator Identity AST nodes...');
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${SECTION_NODE_IDS.join(',')}`;

  try {
    const res = await fetch(url, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch nodes:', res.status, res.statusText);
      const text = await res.text();
      console.error('Response:', text);
      return;
    }

    const data = await res.json();
    fs.writeFileSync('scripts/figma_creator_identity_nodes.json', JSON.stringify(data, null, 2));
    console.log('✓ Successfully saved scripts/figma_creator_identity_nodes.json');

    // Fetch images for visual source of truth
    console.log('Requesting renders for Creator Identity sections...');
    const imgUrl = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${SECTION_NODE_IDS.join(',')}&format=png&scale=2`;
    const imgRes = await fetch(imgUrl, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
      },
    });

    if (imgRes.ok) {
      const imgData = await imgRes.json();
      fs.writeFileSync('scripts/figma_creator_identity_images.json', JSON.stringify(imgData, null, 2));
      console.log('✓ Successfully saved scripts/figma_creator_identity_images.json');
      console.log('Image URLs received for', Object.keys(imgData.images || {}).length, 'nodes');
    }
  } catch (err) {
    console.error('Error fetching Figma Creator Identity:', err);
  }
}

fetchFigmaCreatorIdentity();
