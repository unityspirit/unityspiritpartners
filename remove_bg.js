const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const path = require('path');

async function processLogo() {
  const inputPath = path.resolve(__dirname, 'assets/logo.png');
  const outputPath = path.resolve(__dirname, 'assets/logo_transparent.png');

  try {
    const fileBuffer = fs.readFileSync(inputPath);
    
    // Removing background
    const blob = await removeBackground(fileBuffer);
    
    // Convert Blob to ArrayBuffer to Buffer
    const buffer = Buffer.from(await blob.arrayBuffer());
    
    fs.writeFileSync(outputPath, buffer);
    console.log('Background removed successfully and saved to logo_transparent.png');
  } catch (error) {
    console.error('Error removing background:', error);
  }
}

processLogo();
