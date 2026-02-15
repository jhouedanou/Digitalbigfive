import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await hash("admin123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bigfive.agency" },
    update: {},
    create: {
      email: "admin@bigfive.agency",
      password: adminPassword,
      firstName: "Admin",
      lastName: "Big Five",
      role: "admin",
    },
  });
  console.log("Admin user created:", admin.email);

  // Create test client
  const clientPassword = await hash("client123456", 12);
  const client = await prisma.user.upsert({
    where: { email: "client@example.com" },
    update: {},
    create: {
      email: "client@example.com",
      password: clientPassword,
      firstName: "Marie",
      lastName: "Dupont",
      organization: "Agency XYZ",
      jobTitle: "Responsable Marketing",
      role: "client",
    },
  });
  console.log("Client user created:", client.email);

  // Create free resources
  const freeResources = [
    {
      title: "Guide complet du Social Media Marketing 2026",
      slug: "guide-social-media-marketing-2026",
      shortDescription:
        "Tout ce qu'il faut savoir pour maîtriser les réseaux sociaux en 2026.",
      longDescription:
        "<h3>Ce que vous allez apprendre</h3><ul><li>Les tendances Social Media 2026</li><li>Stratégies de contenu par plateforme</li><li>Outils et automatisations</li><li>Mesure de la performance</li></ul><p>Ce guide de 45 pages vous accompagne pas à pas dans la construction d'une stratégie Social Media efficace.</p>",
      type: "free",
      category: "Social Media",
      resourceType: "Guide",
      level: "Débutant",
      format: "PDF",
      coverImage: "/uploads/cover-social-media.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "3.2 MB",
      pageCount: 45,
      estimatedTime: "30 min",
      status: "published",
    },
    {
      title: "Check-list SEA : Optimiser vos campagnes Google Ads",
      slug: "checklist-sea-google-ads",
      shortDescription:
        "50 points de contrôle pour des campagnes Google Ads performantes.",
      longDescription:
        "<h3>Une check-list complète</h3><p>Vérifiez chaque aspect de vos campagnes Google Ads grâce à cette check-list exhaustive couvrant la structure, les enchères, le ciblage et le reporting.</p>",
      type: "free",
      category: "Publicité",
      resourceType: "Check-list",
      level: "Intermédiaire",
      format: "PDF",
      coverImage: "/uploads/cover-sea.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "1.8 MB",
      pageCount: 12,
      estimatedTime: "15 min",
      status: "published",
    },
    {
      title: "Template de reporting mensuel Data & Analytics",
      slug: "template-reporting-data-analytics",
      shortDescription:
        "Un template prêt à l'emploi pour structurer vos rapports mensuels.",
      longDescription:
        "<h3>Gagnez du temps sur vos reportings</h3><p>Ce template inclut des sections pré-formatées pour KPIs, graphiques, insights et recommandations. Compatible Google Sheets et Excel.</p>",
      type: "free",
      category: "Data & Performance",
      resourceType: "Template",
      level: "Intermédiaire",
      format: "Spreadsheet",
      coverImage: "/uploads/cover-template.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "850 KB",
      pageCount: null,
      estimatedTime: "10 min",
      status: "published",
    },
    {
      title: "Étude : Tendances du marketing digital en Afrique",
      slug: "etude-tendances-marketing-digital-afrique",
      shortDescription:
        "Analyse approfondie du marché digital africain et ses opportunités.",
      longDescription:
        "<h3>Comprendre le marché africain</h3><p>Cette étude de 60 pages analyse les tendances clés, les comportements consommateurs et les opportunités de croissance dans 10 marchés africains majeurs.</p>",
      type: "free",
      category: "Stratégie",
      resourceType: "Étude",
      level: "Avancé",
      format: "PDF",
      coverImage: "/uploads/cover-etude.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "5.1 MB",
      pageCount: 60,
      estimatedTime: "45 min",
      status: "published",
    },
  ];

  for (const resource of freeResources) {
    await prisma.resource.upsert({
      where: { slug: resource.slug },
      update: {},
      create: resource,
    });
  }
  console.log(`${freeResources.length} free resources created`);

  // Create paid products
  const paidProducts = [
    {
      title: "Masterclass : Stratégie de contenu Social Media",
      slug: "masterclass-strategie-contenu-social-media",
      shortDescription:
        "Apprenez à créer une stratégie de contenu Social Media qui génère des résultats mesurables.",
      longDescription:
        "<h3>Le problème</h3><p>Vous publiez du contenu mais sans résultats concrets ? Vous ne savez pas quel contenu créer ni quand le publier ?</p><h3>La solution</h3><p>Cette masterclass de 120 pages vous donne un framework complet pour planifier, créer et optimiser votre contenu Social Media.</p><h3>Ce que vous obtenez</h3><ul><li>Framework de stratégie de contenu en 7 étapes</li><li>20 templates de posts par plateforme</li><li>Calendrier éditorial prêt à l'emploi</li><li>Guide de copywriting pour les réseaux sociaux</li><li>Tableur de suivi des KPIs</li></ul>",
      type: "paid",
      category: "Social Media",
      resourceType: "Formation",
      level: "Intermédiaire",
      format: "PDF",
      coverImage: "/uploads/cover-masterclass.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "15 MB",
      pageCount: 120,
      estimatedTime: "3h",
      status: "published",
      price: 49.0,
      originalPrice: 79.0,
      currency: "EUR",
      sku: "MC-SM-001",
      allowDownload: false,
      enableWatermark: true,
    },
    {
      title: "Kit complet Facebook & Instagram Ads",
      slug: "kit-complet-facebook-instagram-ads",
      shortDescription:
        "Tout pour lancer et optimiser vos campagnes publicitaires Meta avec succès.",
      longDescription:
        "<h3>Arrêtez de gaspiller votre budget pub</h3><p>Ce kit complet vous guide de A à Z dans la création de campagnes Facebook et Instagram Ads rentables.</p><h3>Contenu du kit</h3><ul><li>Guide stratégique de 80 pages</li><li>Templates de audiences personnalisées</li><li>Checklist de lancement de campagne</li><li>Tableur de suivi ROAS</li><li>Exemples de créatives performantes</li></ul>",
      type: "paid",
      category: "Publicité",
      resourceType: "Guide",
      level: "Débutant",
      format: "PDF",
      coverImage: "/uploads/cover-ads-kit.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "22 MB",
      pageCount: 80,
      estimatedTime: "2h30",
      status: "published",
      price: 39.0,
      originalPrice: null,
      currency: "EUR",
      sku: "KIT-ADS-001",
      allowDownload: false,
      enableWatermark: true,
    },
    {
      title: "E-book : Data-Driven Marketing pour PME",
      slug: "ebook-data-driven-marketing-pme",
      shortDescription:
        "Exploitez la puissance des données pour prendre de meilleures décisions marketing.",
      longDescription:
        "<h3>Le marketing piloté par les données n'est pas réservé aux grandes entreprises</h3><p>Cet e-book montre comment les PME peuvent utiliser les données disponibles pour optimiser chaque euro investi en marketing.</p><h3>Au programme</h3><ul><li>Mise en place d'un stack analytics</li><li>Création de tableaux de bord actionnables</li><li>Attribution multi-touch simplifiée</li><li>Tests A/B et expérimentation</li><li>Automatisation des rapports</li></ul>",
      type: "paid",
      category: "Data & Performance",
      resourceType: "E-book",
      level: "Avancé",
      format: "PDF",
      coverImage: "/uploads/cover-ebook-data.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "8 MB",
      pageCount: 95,
      estimatedTime: "2h",
      status: "published",
      price: 29.0,
      originalPrice: 49.0,
      currency: "EUR",
      sku: "EB-DATA-001",
      allowDownload: true,
      enableWatermark: true,
    },
  ];

  for (const product of paidProducts) {
    const created = await prisma.resource.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });

    // Add FAQs for paid products
    const faqCount = await prisma.fAQ.count({
      where: { resourceId: created.id },
    });

    if (faqCount === 0) {
      await prisma.fAQ.createMany({
        data: [
          {
            resourceId: created.id,
            question: "Quel est le format du produit ?",
            answer:
              "Le produit est au format PDF, lisible directement en ligne depuis votre espace client.",
            sortOrder: 0,
          },
          {
            resourceId: created.id,
            question: "Comment accéder au produit après achat ?",
            answer:
              "Après paiement, vous recevez un email de confirmation et le produit est immédiatement disponible dans votre espace client.",
            sortOrder: 1,
          },
          {
            resourceId: created.id,
            question: "Puis-je télécharger le produit ?",
            answer:
              "La lecture en ligne est le mode par défaut. Le téléchargement peut être autorisé selon le produit.",
            sortOrder: 2,
          },
          {
            resourceId: created.id,
            question: "Y a-t-il des mises à jour incluses ?",
            answer:
              "Oui, toutes les mises à jour futures sont incluses dans votre achat.",
            sortOrder: 3,
          },
          {
            resourceId: created.id,
            question: "Quelle est la politique de remboursement ?",
            answer:
              "Nous offrons une garantie de remboursement de 30 jours si le produit ne vous convient pas.",
            sortOrder: 4,
          },
        ],
      });
    }
  }
  console.log(`${paidProducts.length} paid products created with FAQs`);

  // Create a sample order for the test client
  const sampleProduct = await prisma.resource.findFirst({
    where: { type: "paid", status: "published" },
  });

  if (sampleProduct) {
    const existingOrder = await prisma.order.findFirst({
      where: { userId: client.id, resourceId: sampleProduct.id },
    });

    if (!existingOrder) {
      await prisma.order.create({
        data: {
          userId: client.id,
          resourceId: sampleProduct.id,
          amount: sampleProduct.price || 0,
          currency: sampleProduct.currency,
          status: "paid",
          stripePaymentId: "pi_sample_test_001",
        },
      });
      console.log("Sample order created for test client");
    }
  }

  // Create sample contacts
  const contacts = [
    {
      firstName: "Jean",
      lastName: "Martin",
      email: "jean.martin@example.com",
      organization: "StartupCo",
      jobTitle: "CEO",
      gdprConsent: true,
    },
    {
      firstName: "Sophie",
      lastName: "Bernard",
      email: "sophie.bernard@example.com",
      organization: "AgenceWeb",
      jobTitle: "Social Media Manager",
      gdprConsent: true,
    },
  ];

  for (const contact of contacts) {
    const existing = await prisma.contact.findFirst({
      where: { email: contact.email },
    });
    if (!existing) {
      await prisma.contact.create({ data: contact });
    }
  }
  console.log(`${contacts.length} sample contacts created`);

  console.log("\nSeed completed successfully!");
  console.log("Admin login: admin@bigfive.agency / admin123456");
  console.log("Client login: client@example.com / client123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
