const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
    try {
        // Create SVG content with dynamic color (will be replaced)
        const colors = {
            single: {
                background: '#4f46e5', // Default color in light theme
                foreground: '#ffffff'  // White for lightning bolt
            },
            double: {
                background: '#4f46e5', // Default color in light theme
                foreground: '#ffffff'  // White for lightning bolt
            }
        };

        console.log('Starting SVG to PNG conversion...');

        // Convert single bolt logo
        const singleSvg = fs.readFileSync('./quickgpt-logo-single.svg', 'utf8');
        await sharp(Buffer.from(singleSvg))
            .resize(512, 512)
            .toFile('./quickgpt-icon-single.png');
        
        console.log('Created single bolt icon: quickgpt-icon-single.png');

        // Convert double bolt logo
        const doubleSvg = fs.readFileSync('./quickgpt-logo-double.svg', 'utf8');
        await sharp(Buffer.from(doubleSvg))
            .resize(512, 512)
            .toFile('./quickgpt-icon-double.png');
        
        console.log('Created double bolt icon: quickgpt-icon-double.png');

        console.log('SVG to PNG conversion completed successfully!');
    } catch (error) {
        console.error('Error during SVG to PNG conversion:', error);
    }
}

convertSvgToPng();