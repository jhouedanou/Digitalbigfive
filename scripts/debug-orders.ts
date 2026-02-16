import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  console.log("📊 Diagnostic des commandes et produits\n");

  // 1. Vérifier les commandes
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      resource: { select: { title: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  console.log(`📦 Total commandes: ${orders.length}`);
  
  if (orders.length === 0) {
    console.log("   ⚠️  Aucune commande trouvée !\n");
  } else {
    console.log("\n📦 Dernières commandes:");
    orders.forEach((o) => {
      console.log(`   - ${o.id.slice(0, 8)}... | ${o.status.padEnd(10)} | ${o.amount} ${o.resource.title?.slice(0, 30)} | ${o.user.email}`);
    });
  }

  // 2. Vérifier les commandes par statut
  const ordersByStatus = await prisma.order.groupBy({
    by: ["status"],
    _count: true,
  });
  
  console.log("\n📊 Commandes par statut:");
  ordersByStatus.forEach((g) => {
    console.log(`   - ${g.status}: ${g._count}`);
  });

  // 3. Vérifier les ressources payantes
  const paidResources = await prisma.resource.findMany({
    where: { type: "paid", status: "published" },
    select: { id: true, title: true, price: true },
  });

  console.log(`\n💰 Produits payants publiés: ${paidResources.length}`);
  paidResources.forEach((r) => {
    console.log(`   - ${r.title} (${r.price} XOF)`);
  });

  // 4. Vérifier les utilisateurs
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  });

  console.log(`\n👥 Utilisateurs: ${users.length}`);
  users.forEach((u) => {
    console.log(`   - ${u.email} (${u.role})`);
  });

  // 5. Vérifier les commandes payées
  const paidOrders = await prisma.order.findMany({
    where: { status: "paid" },
    include: {
      user: { select: { email: true } },
      resource: { select: { title: true } },
    },
  });

  console.log(`\n✅ Commandes PAYÉES: ${paidOrders.length}`);
  if (paidOrders.length > 0) {
    paidOrders.forEach((o) => {
      console.log(`   - ${o.user.email} a acheté "${o.resource.title}" pour ${o.amount} XOF`);
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
