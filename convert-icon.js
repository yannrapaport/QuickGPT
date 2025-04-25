const svgToPng = require('svg-to-png');
const fs = require('fs');
const path = require('path');

// Check if file exists
if (!fs.existsSync('icon.svg')) {
  console.error('icon.svg file not found');
  process.exit(1);
}

async function convertToPng() {
  try {
    console.log('Converting SVG to PNG...');
    await svgToPng.convert('icon.svg', '.', {
      defaultWidth: 512,
      defaultHeight: 512
    });
    console.log('PNG created successfully as icon.png');
    
    // Rename the file to quickgpt-icon.png
    if (fs.existsSync('icon.png')) {
      fs.renameSync('icon.png', 'quickgpt-icon.png');
      console.log('File renamed to quickgpt-icon.png');
    } else {
      console.log('Expected icon.png but file not found');
      
      // Check what files were generated
      const files = fs.readdirSync('.');
      console.log('Files in directory:', files);
      
      // Look for any png files
      const pngFiles = files.filter(file => file.endsWith('.png'));
      if (pngFiles.length > 0) {
        console.log('Found PNG files:', pngFiles);
        // Rename the first one
        fs.renameSync(pngFiles[0], 'quickgpt-icon.png');
        console.log(`Renamed ${pngFiles[0]} to quickgpt-icon.png`);
      }
    }
  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
  }
}

convertToPng();