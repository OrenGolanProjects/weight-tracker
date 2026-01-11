const fs = require('fs');
const path = require('path');

// This script generates simple placeholder PWA icons using Canvas API
// Run with: node scripts/generate-icons.js

async function generateIcons() {
  try {
    const { createCanvas } = require('canvas');

    const sizes = [
      { size: 192, filename: 'icon-192x192.png' },
      { size: 512, filename: 'icon-512x512.png' },
    ];

    const publicDir = path.join(__dirname, '../public');

    for (const { size, filename } of sizes) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');

      // Background - app theme color
      ctx.fillStyle = '#1976d2';
      ctx.fillRect(0, 0, size, size);

      // White text "WT"
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${size * 0.4}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WT', size / 2, size / 2);

      // Save to file
      const buffer = canvas.toBuffer('image/png');
      const filepath = path.join(publicDir, filename);
      fs.writeFileSync(filepath, buffer);
      console.log(`✓ Generated ${filename}`);
    }

    // Generate simple favicon.ico (using 32x32 PNG)
    const canvas = createCanvas(32, 32);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1976d2';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WT', 16, 16);

    const buffer = canvas.toBuffer('image/png');
    const filepath = path.join(publicDir, 'favicon-32x32.png');
    fs.writeFileSync(filepath, buffer);
    console.log('✓ Generated favicon-32x32.png (use this as favicon.ico)');

    console.log('\n✅ All PWA icons generated successfully!');
    console.log('📁 Location: public/');
    console.log('\nNote: favicon-32x32.png can be renamed to favicon.ico if needed');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.log('\nTo install canvas package, run:');
    console.log('  pnpm add -D canvas');
    process.exit(1);
  }
}

generateIcons();
