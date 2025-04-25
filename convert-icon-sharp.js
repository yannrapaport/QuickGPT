const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Path to SVG and output PNG
const svgPath = path.join(__dirname, 'icon.svg');
const pngPath = path.join(__dirname, 'quickgpt-icon.png');
const faviconPath = path.join(__dirname, 'favicon.ico');

// Function to convert SVG to PNG
async function convertSvgToPng() {
  try {
    console.log('Reading SVG file from', svgPath);
    
    if (!fs.existsSync(svgPath)) {
      console.error('SVG file not found at', svgPath);
      // For debugging, list files in the directory
      console.log('Files in current directory:', fs.readdirSync('.'));
      return;
    }
    
    console.log('SVG file exists. Converting to PNG...');
    
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(pngPath);
    
    console.log('Successfully created PNG at', pngPath);
    
    // Also create a smaller version for favicon
    await sharp(svgPath)
      .resize(32, 32)
      .toFile(faviconPath);
    
    console.log('Successfully created favicon at', faviconPath);
  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
  }
}

convertSvgToPng();