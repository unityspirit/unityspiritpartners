const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');

async function run() {
  try {
    console.log('Starting AI background removal...');
    const blob = await removeBackground('assets/logo_orig.png');
    const buffer = Buffer.from(await blob.arrayBuffer());
    fs.writeFileSync('assets/logo.png', buffer);
    console.log('Successfully saved transparent logo to assets/logo.png');
  } catch (error) {
    console.error('Failed to remove background:', error);
  }
}

run();
