import fs from 'fs';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || process.env.FIGMA_TOKEN || "";
const FILE_KEY = 'yLDPLB9hIAIqfYY9uHuJom';
const MAIN_NODE_ID = '56877:89182';

const SECTION_NODE_IDS = [
  '56877:89182', // Full Creator Path Frame
  '56877:90262', // Hero Content
  '56877:89183', // Comparison Section (Raw Idea vs Structured)
  '56877:89261', // Six Phases Section
  '56877:89380', // Phase 01 Define Section
  '56877:89454', // Phase 03 Intelligence Section
  '56877:89549', // Phase 04 Resource Setup Section
  '56877:89619', // Phase 05 Ownership Paths Section
  '56877:89668', // Acquisition / Full Buyout Section
  '56877:89804', // Co-founder + Build Yourself Dual Path Section
  '56877:89958', // Mondial Difference Section
  '56877:90014', // Phase 06 Level Up Section
  '56877:90144', // Bottom Container / Stepper
  '56877:90145', // Creator Stepper
  '56877:90218', // FAQ
  '56877:90232', // Final CTA
];

async function fetchFigmaCreatorPath() {
  console.log('Fetching Figma Creator Path AST nodes...');
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
    fs.writeFileSync('scripts/figma_creator_path_nodes.json', JSON.stringify(data, null, 2));
    console.log('✓ Successfully saved scripts/figma_creator_path_nodes.json');

    // Fetch images for visual source of truth
    console.log('Requesting renders for Creator Path sections...');
    const imgUrl = `https://api.figma.com/v1/images/${FILE_KEY}?ids=${SECTION_NODE_IDS.join(',')}&format=png&scale=2`;
    const imgRes = await fetch(imgUrl, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
      },
    });

    if (imgRes.ok) {
      const imgData = await imgRes.json();
      fs.writeFileSync('scripts/figma_creator_path_images.json', JSON.stringify(imgData, null, 2));
      console.log('✓ Successfully saved scripts/figma_creator_path_images.json');
      console.log('Image URLs received for', Object.keys(imgData.images || {}).length, 'nodes');
    }
  } catch (err) {
    console.error('Error fetching Figma Creator Path:', err);
  }
}

fetchFigmaCreatorPath();
