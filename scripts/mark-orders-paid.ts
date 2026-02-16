import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

// Marquer TOUTES les commandes pending comme payées
const MARK_ALL_PENDING = true;

async function main() {
  console.log("💳 Mise à jour des commandes\n");

  // Afficher les commandes pending
  const pendingOrders = await prisma.order.findMany({
    where: { status: "pending" },
    include: {
      user: { select: { email: true } },
      resource: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`📦 Commandes en attente: ${pendingOrders.length}\n`);

  if (pendingOrders.length === 0) {
    console.log("✅ Aucune commande en attente");
    await prisma.$disconnect();
    return;
  }

  // Marquer toutes les commandes comme payées
  if (MARK_ALL_PENDING) {
    console.log("🔄 Marquage de toutes les commandes comme payées...\n");
    
    for (const order of pendingOrders) {
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          status: "paid",
          paytechPaymentRef: `manual_${Date.now()}`,
        },
      });
      console.log(`✅ ${order.user.email} → "${order.resource.title}" (${order.amount} XOF)`);
    }
    
    console.log(`\n🎉 ${pendingOrders.length} commande(s) marquée(s) comme payée(s)`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
