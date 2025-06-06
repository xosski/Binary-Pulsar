// exif-fragment-writer.js
const fs = require('fs');
const { exiftool } = require('exiftool-vendored');
const path = require('path');

function xorRotate(data, seed) {
    const rotated = data.split('').map((char, i) => {
        const shift = parseInt(seed[i % seed.length]) || 1;
        return String.fromCharCode(char.charCodeAt(0) ^ shift);
    }).join('');
    return Buffer.from(rotated).toString('base64');
}

async function writeFragmentToExif(imagePath, index, data, seed, outputDir = './output') {
    const encoded = xorRotate(data, seed);
    const jsonPayload = `{"index":${index},"data":"${encoded}"}`;

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const outputImage = path.join(outputDir, path.basename(imagePath));
    fs.copyFileSync(imagePath, outputImage);

    try {
        await exiftool.write(outputImage, {
            XPComment: jsonPayload,
            UserComment: `Fragment ${index} embedded via GhostShell`
        });
        console.log(`✅ Fragment ${index} written to ${outputImage}`);
    } catch (err) {
        console.error(`❌ Failed to write EXIF data:`, err);
    }
}

// Example usage:
// writeFragmentToExif('input.jpg', 0, 'console.log("Hello GhostCore")', '202506061845');

module.exports = { writeFragmentToExif };