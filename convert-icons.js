const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  try {
    // Convert single bolt icon
    await sharp('icon-single-bolt.svg')
      .resize(192, 192)
      .png()
      .toFile('quickgpt-icon-single.png');
    
    console.log('✓ Single bolt icon converted to PNG');
    
    // Convert double bolt icon
    await sharp('icon-double-bolt.svg')
      .resize(192, 192)
      .png()
      .toFile('quickgpt-icon-double.png');
    
    console.log('✓ Double bolt icon converted to PNG');
    
    // Create favicon (using single bolt)
    await sharp('icon-single-bolt.svg')
      .resize(32, 32)
      .png()
      .toFile('favicon.png');
    
    console.log('✓ Favicon created');
  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
  }
}

convertSvgToPng();