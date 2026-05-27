const path = require('path');
const fs = require('fs');

async function main() {
  const { Jimp } = await import('jimp');
  
  const rawPath = 'C:\\Users\\Voronovskiy\\.gemini\\antigravity\\brain\\95b588e9-b686-4467-9e32-d0c45ecc4bb3\\media__1779897611476.png';
  const logoPath = path.join(__dirname, '../public/logo.png');
  const tokenPath = path.join(__dirname, '../public/token-image.png');
  const storePath = path.join(__dirname, '../redqueen-mobile/store_icon.png');
  
  console.log('Reading raw image from:', rawPath);
  const image = await Jimp.read(rawPath);
  
  const originalWidth = image.bitmap.width;
  const originalHeight = image.bitmap.height;
  console.log(`Loaded image size: ${originalWidth}x${originalHeight}`);
  
  // Crop to zoom in on the head. Let's crop a centered 840x840 area.
  // This makes the queen head ~22% larger in the frame.
  const cropSize = 840;
  const cropX = Math.floor((originalWidth - cropSize) / 2);
  const cropY = Math.floor((originalHeight - cropSize) / 2);
  
  console.log(`Cropping centered area: x=${cropX}, y=${cropY}, size=${cropSize}...`);
  // Try object argument (Jimp v1) and fallback to positional if needed
  try {
    image.crop({ x: cropX, y: cropY, w: cropSize, h: cropSize });
  } catch (e) {
    image.crop(cropX, cropY, cropSize, cropSize);
  }
  
  // Now make background transparent
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  console.log(`Processing transparency on cropped image: ${width}x${height}...`);
  
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const color = image.getPixelColor(x, y);
      
      const r = (color >> 24) & 0xff;
      const g = (color >> 16) & 0xff;
      const b = (color >> 8) & 0xff;
      
      // If it is black or very dark grey, make it transparent
      if (r < 15 && g < 15 && b < 15) {
        image.setPixelColor(0x00000000, x, y);
      }
    }
  }
  
  console.log('Writing processed images...');
  await image.write(logoPath);
  await image.write(tokenPath);
  
  if (fs.existsSync(storePath)) {
    await image.write(storePath);
    console.log('Updated redqueen-mobile/store_icon.png');
  }
  
  console.log('Successfully completed logo zoom & transparency processing!');
}

main().catch(console.error);
