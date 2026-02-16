import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  const resources = await prisma.resource.findMany({
    where: { 
      type: "paid",
    },
    select: { 
      id: true, 
      title: true, 
      filePath: true 
    },
    take: 10,
  });
  
  console.log("FilePaths in DB:");
  resources.forEach((r) => {
    console.log(`${r.id} | ${r.filePath}`);
  });
  
  await prisma.$disconnect();
}

main().catch(console.error);
