import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const prisma = new PrismaClient();

async function main() {
  // Update paid resources to point to the actual PDF
  const actualPdfPath = "pdfs/1771275795565-CAHIER_DES_CHARGES_-_PLATEFORME_DE_BOOTCAMP.pdf";
  
  console.log("🔧 Updating paid resources to use actual PDF...\n");
  
  // Get all paid resources
  const paidResources = await prisma.resource.findMany({
    where: { type: "paid" },
  });
  
  console.log(`Found ${paidResources.length} paid resources`);
  
  // Update them to point to the actual PDF
  const result = await prisma.resource.updateMany({
    where: { type: "paid" },
    data: { filePath: actualPdfPath },
  });
  
  console.log(`✅ Updated ${result.count} resources to use: ${actualPdfPath}`);
  
  // Verify
  const updated = await prisma.resource.findFirst({
    where: { type: "paid" },
    select: { id: true, title: true, filePath: true },
  });
  
  console.log("\nVerification:");
  console.log(`  ${updated?.title}`);
  console.log(`  filePath: ${updated?.filePath}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
