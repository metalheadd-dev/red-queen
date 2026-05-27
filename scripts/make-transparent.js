const path = require('path');
const fs = require('fs');

async function main() {
  const { Jimp } = await import('jimp');
  
  const logoPath = path.join(__dirname, '../public/logo.png');
  const tokenPath = path.join(__dirname, '../public/token-image.png');
  const storePath = path.join(__dirname, '../redqueen-mobile/store_icon.png');
  
  console.log('Reading image from:', logoPath);
  const image = await Jimp.read(logoPath);
  
  // Go through every pixel. If it's black (rgb all near 0), make it transparent.
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  
  console.log(`Image loaded. Dimensions: ${width}x${height}. Processing pixels...`);
  
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const color = image.getPixelColor(x, y);
      
      // Decoding color values
      const r = (color >> 24) & 0xff;
      const g = (color >> 16) & 0xff;
      const b = (color >> 8) & 0xff;
      const a = color & 0xff;
      
      // If it is black or very dark grey, make it transparent
      if (r < 15 && g < 15 && b < 15) {
        // rgba(0, 0, 0, 0) in hex is 0x00000000
        image.setPixelColor(0x00000000, x, y);
      }
    }
  }
  
  console.log('Writing transparent images...');
  await image.write(logoPath);
  await image.write(tokenPath);
  
  if (fs.existsSync(storePath)) {
    await image.write(storePath);
    console.log('Updated redqueen-mobile/store_icon.png');
  }
  
  console.log('Successfully made background transparent!');
}

main().catch(console.error);
