const sharp = require('sharp');
const fs = require('fs');

// Convert SVG to PNG with Sharp
async function convertSvgToPng() {
  try {
    console.log("Converting power button SVG to PNG...");
    await sharp('power-button.svg')
      .resize(30, 30)
      .png()
      .toFile('power-button.png');
    console.log("Power button SVG converted successfully to PNG");

    console.log("Converting model switch button SVG to PNG...");
    await sharp('model-switch-button.svg')
      .resize(30, 30)
      .png()
      .toFile('model-switch-button.png');
    console.log("Model switch button SVG converted successfully to PNG");

    console.log("Converting drawer up icon SVG to PNG...");
    await sharp('drawer-up-icon.svg')
      .resize(50, 24)
      .png()
      .toFile('drawer-up-icon.png');
    console.log("Drawer up icon SVG converted successfully to PNG");

    console.log("Converting drawer down icon SVG to PNG...");
    await sharp('drawer-down-icon.svg')
      .resize(50, 24)
      .png()
      .toFile('drawer-down-icon.png');
    console.log("Drawer down icon SVG converted successfully to PNG");
  } catch (error) {
    console.error("Error converting SVG to PNG:", error);
  }
}

// Run the conversion
convertSvgToPng();