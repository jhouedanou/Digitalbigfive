/**
 * Script to generate PWA icons from SVG
 * Run with: npx tsx scripts/generate-icons.ts
 */

import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Simple SVG icon
const createSvgIcon = (size: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#80368D"/>
      <stop offset="100%" style="stop-color:#29358B"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>
  <g transform="translate(100, 80)">
    <rect x="40" y="60" width="220" height="280" rx="8" fill="white" opacity="0.9"/>
    <rect x="60" y="80" width="180" height="8" rx="4" fill="#80368D" opacity="0.3"/>
    <rect x="60" y="100" width="160" height="6" rx="3" fill="#80368D" opacity="0.2"/>
    <rect x="60" y="116" width="170" height="6" rx="3" fill="#80368D" opacity="0.2"/>
    <rect x="60" y="132" width="140" height="6" rx="3" fill="#80368D" opacity="0.2"/>
    <circle cx="260" cy="280" r="50" fill="#29358B"/>
    <path d="M235 280 l15 15 l30 -30" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="256" y="460" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="bold">BIG FIVE</text>
</svg>`;

const iconsDir = join(process.cwd(), "public", "icons");

console.log("Generating PWA icons...\n");

// Since we can't generate PNG from SVG in pure Node.js without sharp,
// we'll create SVG icons and note that PNG conversion should be done separately
for (const size of sizes) {
  const svgContent = createSvgIcon(size);
  const filePath = join(iconsDir, `icon-${size}x${size}.svg`);
  writeFileSync(filePath, svgContent);
  console.log(`✓ Created icon-${size}x${size}.svg`);
}

console.log("\n📝 Note: For production, convert SVG icons to PNG using:");
console.log("   - https://cloudconvert.com/svg-to-png");
console.log("   - Or install sharp: npm install sharp");
console.log("\nAlternatively, use a service like realfavicongenerator.net\n");

// Update manifest to use SVG icons (browsers support this)
const manifestPath = join(process.cwd(), "public", "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

manifest.icons = sizes.map((size) => ({
  src: `/icons/icon-${size}x${size}.svg`,
  sizes: `${size}x${size}`,
  type: "image/svg+xml",
  purpose: "any maskable",
}));

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log("✓ Updated manifest.json to use SVG icons\n");

console.log("Done! 🎉");
