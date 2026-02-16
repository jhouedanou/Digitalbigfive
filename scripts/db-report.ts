import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  console.log("📊 RAPPORT COMPLET DE LA BASE DE DONNÉES\n");
  console.log("=".repeat(60));

  // 1. UTILISATEURS
  console.log("\n👥 UTILISATEURS");
  console.log("-".repeat(40));
  const users = await prisma.user.findMany({
    include: {
      _count: { select: { orders: true } },
      orders: { where: { status: "paid" }, select: { amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Total: ${users.length}`);
  users.forEach((u) => {
    const totalSpent = u.orders.reduce((sum, o) => sum + o.amount, 0);
    console.log(`  • ${u.email}`);
    console.log(`    Rôle: ${u.role} | Commandes: ${u._count.orders} | Dépensé: ${totalSpent} XOF`);
  });

  // 2. COMMANDES
  console.log("\n💳 COMMANDES");
  console.log("-".repeat(40));
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { email: true } },
      resource: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const paidOrders = orders.filter((o) => o.status === "paid");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);

  console.log(`Total commandes: ${orders.length}`);
  console.log(`Commandes payées: ${paidOrders.length}`);
  console.log(`Revenus totaux: ${totalRevenue.toLocaleString()} XOF`);
  console.log("\nDétail:");
  orders.forEach((o) => {
    console.log(`  • ${o.status.padEnd(10)} | ${o.amount.toLocaleString().padStart(6)} XOF | ${o.resource.title.slice(0, 35)}...`);
    console.log(`    Client: ${o.user.email} | Date: ${o.createdAt.toLocaleDateString()}`);
  });

  // 3. RESSOURCES
  console.log("\n📚 RESSOURCES");
  console.log("-".repeat(40));
  const resources = await prisma.resource.findMany({
    include: {
      _count: { select: { orders: true, downloads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const published = resources.filter((r) => r.status === "published");
  const paid = resources.filter((r) => r.type === "paid");
  const free = resources.filter((r) => r.type === "free");

  console.log(`Total: ${resources.length} (${published.length} publiées)`);
  console.log(`Payantes: ${paid.length} | Gratuites: ${free.length}`);
  console.log("\nRessources publiées:");
  published.forEach((r) => {
    const price = r.price ? `${r.price.toLocaleString()} XOF` : "Gratuit";
    console.log(`  • [${r.type}] ${r.title.slice(0, 40)}...`);
    console.log(`    Prix: ${price} | Ventes: ${r._count.orders} | DL: ${r._count.downloads}`);
  });

  // 4. CONTACTS
  console.log("\n📧 CONTACTS");
  console.log("-".repeat(40));
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log(`Total contacts: ${await prisma.contact.count()}`);
  if (contacts.length > 0) {
    console.log("Derniers contacts:");
    contacts.forEach((c) => {
      console.log(`  • ${c.firstName} ${c.lastName} <${c.email}>`);
    });
  }

  // 5. TÉMOIGNAGES
  console.log("\n⭐ TÉMOIGNAGES");
  console.log("-".repeat(40));
  const testimonials = await prisma.testimonial.findMany({
    include: {
      user: { select: { email: true } },
      resource: { select: { title: true } },
    },
  });

  const pending = testimonials.filter((t) => t.status === "pending");
  const approved = testimonials.filter((t) => t.status === "approved");

  console.log(`Total: ${testimonials.length} (${approved.length} approuvés, ${pending.length} en attente)`);

  // 6. STATISTIQUES ADMIN
  console.log("\n📈 STATISTIQUES POUR L'ADMIN");
  console.log("-".repeat(40));
  console.log(`Revenus totaux: ${totalRevenue.toLocaleString()} XOF`);
  console.log(`Commandes payées: ${paidOrders.length}`);
  console.log(`Clients (rôle client): ${users.filter((u) => u.role === "client").length}`);
  console.log(`Admins: ${users.filter((u) => u.role === "admin").length}`);
  console.log(`Ressources publiées: ${published.length}`);
  console.log(`Avis en attente: ${pending.length}`);

  console.log("\n" + "=".repeat(60));
  console.log("✅ Rapport terminé");

  await prisma.$disconnect();
}

main().catch(console.error);
