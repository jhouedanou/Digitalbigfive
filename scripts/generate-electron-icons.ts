/**
 * Generate Electron icons from existing PNG icons.
 * Run: npx tsx scripts/generate-electron-icons.ts
 */
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const SOURCE_PNG = path.join(__dirname, "../public/icons/icon-512x512.png");
const OUTPUT_DIR = path.join(__dirname, "../electron/assets");

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Check source exists
  if (!fs.existsSync(SOURCE_PNG)) {
    console.error(`Source not found: ${SOURCE_PNG}`);
    process.exit(1);
  }

  console.log(`Using source: ${SOURCE_PNG}`);

  // Generate icon.png (512x512 for Linux)
  await sharp(SOURCE_PNG)
    .resize(512, 512)
    .png()
    .toFile(path.join(OUTPUT_DIR, "icon.png"));
  console.log("Generated icon.png (512x512)");

  // Generate icon.ico (multi-resolution for Windows)
  // sharp can create ico with multiple sizes
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const icoBuffers: Buffer[] = [];
  for (const size of icoSizes) {
    const buf = await sharp(SOURCE_PNG).resize(size, size).png().toBuffer();
    icoBuffers.push(buf);
  }
  // Create a simple ICO file manually
  await createIco(icoBuffers, icoSizes, path.join(OUTPUT_DIR, "icon.ico"));
  console.log("Generated icon.ico (multi-resolution)");

  // Generate tray-icon.png (16x16)
  await sharp(SOURCE_PNG)
    .resize(16, 16)
    .png()
    .toFile(path.join(OUTPUT_DIR, "tray-icon.png"));
  console.log("Generated tray-icon.png (16x16)");

  // Generate tray-icon@2x.png (32x32 for retina)
  await sharp(SOURCE_PNG)
    .resize(32, 32)
    .png()
    .toFile(path.join(OUTPUT_DIR, "tray-icon@2x.png"));
  console.log("Generated tray-icon@2x.png (32x32)");

  // Generate icon.icns placeholder (macOS) - just copy 512x512 PNG
  // Real .icns generation requires platform-specific tools
  // electron-builder can use a 512x512 PNG and convert it automatically
  await sharp(SOURCE_PNG)
    .resize(512, 512)
    .png()
    .toFile(path.join(OUTPUT_DIR, "icon.icns.png"));
  console.log("Generated icon.icns.png (512x512 - electron-builder will convert)");
  // Note: For macOS builds, electron-builder can use icon.png if icon.icns is missing

  console.log("\nDone! Icons generated in electron/assets/");
  console.log(
    "Note: For macOS .icns, electron-builder will auto-convert from icon.png"
  );
}

async function createIco(
  pngBuffers: Buffer[],
  sizes: number[],
  outputPath: string
): Promise<void> {
  // ICO file format:
  // Header: 6 bytes
  // Directory entries: 16 bytes each
  // Image data: PNG data for each image

  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * numImages;
  let dataOffset = headerSize + dirSize;

  // Calculate total size
  let totalSize = dataOffset;
  for (const buf of pngBuffers) {
    totalSize += buf.length;
  }

  const ico = Buffer.alloc(totalSize);

  // Write header
  ico.writeUInt16LE(0, 0); // Reserved
  ico.writeUInt16LE(1, 2); // Type: 1 = ICO
  ico.writeUInt16LE(numImages, 4); // Number of images

  // Write directory entries
  for (let i = 0; i < numImages; i++) {
    const offset = headerSize + i * dirEntrySize;
    const size = sizes[i];
    const pngData = pngBuffers[i];

    ico.writeUInt8(size >= 256 ? 0 : size, offset); // Width (0 = 256)
    ico.writeUInt8(size >= 256 ? 0 : size, offset + 1); // Height (0 = 256)
    ico.writeUInt8(0, offset + 2); // Color palette
    ico.writeUInt8(0, offset + 3); // Reserved
    ico.writeUInt16LE(1, offset + 4); // Color planes
    ico.writeUInt16LE(32, offset + 6); // Bits per pixel
    ico.writeUInt32LE(pngData.length, offset + 8); // Image size
    ico.writeUInt32LE(dataOffset, offset + 12); // Data offset

    // Write image data
    pngData.copy(ico, dataOffset);
    dataOffset += pngData.length;
  }

  fs.writeFileSync(outputPath, ico);
}

main().catch(console.error);
