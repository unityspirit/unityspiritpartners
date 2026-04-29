const { Jimp } = require('jimp');

async function processLogo() {
  try {
    const image = await Jimp.read('assets/logo.png');
    // We assume the background might be black or white. Let's check the top-left pixel.
    const bgPixel = image.getPixelColor(0, 0);
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      // Get the color of the current pixel
      const currentPixel = image.getPixelColor(x, y);
      
      // If it matches the background pixel exactly, make it transparent
      if (currentPixel === bgPixel) {
        this.bitmap.data[idx + 3] = 0; // Alpha channel
      }
    });
    
    await image.write('assets/logo_transparent.png');
    console.log('Background removed with Jimp and saved to logo_transparent.png');
  } catch (err) {
    console.error('Error with Jimp:', err);
  }
}

processLogo();
