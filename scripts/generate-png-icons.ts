/**
 * Script to generate PNG PWA icons from SVG using sharp
 * Run with: npx tsx scripts/generate-png-icons.ts
 */
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const iconsDir = join(process.cwd(), "public", "icons");
const svgSource = join(iconsDir, "icon.svg");

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

async function generateIcons() {
  console.log("🎨 Generating PNG icons from SVG...\n");

  if (!existsSync(svgSource)) {
    console.error("❌ icon.svg not found in public/icons/");
    process.exit(1);
  }

  const svgBuffer = readFileSync(svgSource);

  for (const size of sizes) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  ✅ icon-${size}x${size}.png`);
  }

  // Generate maskable icon (with extra padding for safe zone)
  // Maskable icons need the important content within a "safe zone" (circle of 40% radius)
  const maskableSize = 512;
  const padding = Math.round(maskableSize * 0.1); // 10% padding on each side
  const innerSize = maskableSize - padding * 2;

  await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 128, g: 54, b: 141, alpha: 1 }, // #80368D
    })
    .png()
    .toFile(join(iconsDir, "maskable-icon-512x512.png"));
  console.log(`  ✅ maskable-icon-512x512.png`);

  // Apple touch icon (180x180 is the recommended size)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(iconsDir, "apple-touch-icon.png"));
  console.log(`  ✅ apple-touch-icon.png`);

  // Favicon 32x32
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(iconsDir, "favicon-32x32.png"));
  console.log(`  ✅ favicon-32x32.png`);

  // Favicon 16x16
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(join(iconsDir, "favicon-16x16.png"));
  console.log(`  ✅ favicon-16x16.png`);

  // MS Tile
  await sharp(svgBuffer)
    .resize(144, 144)
    .png()
    .toFile(join(iconsDir, "mstile-144x144.png"));
  console.log(`  ✅ mstile-144x144.png`);

  console.log("\n✨ All PNG icons generated successfully!");
  console.log("📝 Don't forget to update manifest.json with the new PNG paths.\n");
}

generateIcons().catch(console.error);
