const sharp = require('sharp');
const fs = require('fs');

// Convert SVG to PNG with Sharp
async function convertSvgToPng() {
  try {
    console.log("Converting simple logo SVG to PNG...");
    await sharp('quickgpt-simple-logo.svg')
      .resize(30, 30)
      .png()
      .toFile('quickgpt-simple-logo.png');
    console.log("Simple logo SVG converted successfully to PNG");
  } catch (error) {
    console.error("Error converting SVG to PNG:", error);
  }
}

// Run the conversion
convertSvgToPng();