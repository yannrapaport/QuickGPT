const sharp = require('sharp');
const fs = require('fs');

// Convert SVG to PNG with Sharp (more modern approach)
async function convertSvgToPng() {
  try {
    console.log("Converting rocket SVG to PNG...");
    await sharp('quickgpt-logo-rocket.svg')
      .resize(30, 30)
      .png()
      .toFile('quickgpt-logo-rocket.png');
    console.log("Rocket SVG converted successfully to PNG");

    console.log("Converting jet SVG to PNG...");
    await sharp('quickgpt-logo-jet.svg')
      .resize(30, 30)
      .png()
      .toFile('quickgpt-logo-jet.png');
    console.log("Jet SVG converted successfully to PNG");
  } catch (error) {
    console.error("Error converting SVG to PNG:", error);
  }
}

// Run the conversion
convertSvgToPng();