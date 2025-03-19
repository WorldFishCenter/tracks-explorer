import sharp from 'sharp';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDirectory = join(__dirname, '../public/icons');

// Create the icons directory if it doesn't exist
try {
  await fs.mkdir(iconDirectory, { recursive: true });
} catch (err) {
  if (err.code !== 'EEXIST') throw err;
}

// Base SVG icon - a simple map marker with a boat
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#206bc4"/>
  <path d="M256 96c-88 0-160 72-160 160 0 96 160 240 160 240s160-144 160-240c0-88-72-160-160-160zm0 80c44.2 0 80 35.8 80 80s-35.8 80-80 80-80-35.8-80-80 35.8-80 80-80z" fill="white"/>
  <path d="M296 256c0 22.1-17.9 40-40 40s-40-17.9-40-40 17.9-40 40-40 40 17.9 40 40z" fill="#206bc4"/>
</svg>
`;

// Save the SVG to a temporary file
const tempSvgPath = join(iconDirectory, 'temp.svg');
await fs.writeFile(tempSvgPath, svgIcon);

try {
  // Generate icons for each size
  await Promise.all(
    sizes.map(size => {
      return sharp(tempSvgPath)
        .resize(size, size)
        .png()
        .toFile(join(iconDirectory, `icon-${size}x${size}.png`));
    })
  );
  
  // Clean up temporary SVG file
  await fs.unlink(tempSvgPath);
  console.log('✅ Icons generated successfully!');
} catch (err) {
  console.error('❌ Error generating icons:', err);
} 