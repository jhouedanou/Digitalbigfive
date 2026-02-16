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
    // ── Nouvelles ressources gratuites ──
    {
      title: "Guide du Community Management en 2026",
      slug: "guide-community-management-2026",
      shortDescription:
        "Techniques et bonnes pratiques pour animer et engager votre communauté en ligne.",
      longDescription:
        "<h3>Devenez un Community Manager efficace</h3><p>Ce guide couvre l'ensemble des compétences nécessaires pour gérer une communauté en ligne :</p><ul><li>Définir votre ton de voix et charte éditoriale</li><li>Gérer les commentaires négatifs et les crises</li><li>Créer de l'engagement organique quotidien</li><li>Outils de modération et de planification</li><li>Mesurer la satisfaction de votre communauté</li></ul><p>Avec des cas pratiques issus du marché africain et francophone.</p>",
      type: "free",
      category: "Social Media",
      resourceType: "Guide",
      level: "Débutant",
      format: "PDF",
      coverImage: "/uploads/cover-community-management.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "4.1 MB",
      pageCount: 38,
      estimatedTime: "25 min",
      status: "published",
    },
    {
      title: "Calendrier éditorial Social Media – Template Notion",
      slug: "calendrier-editorial-social-media-notion",
      shortDescription:
        "Un calendrier éditorial Notion complet et prêt à l'emploi pour planifier vos contenus.",
      longDescription:
        "<h3>Organisez votre contenu comme un pro</h3><p>Ce template Notion inclut :</p><ul><li>Vue calendrier avec code couleur par plateforme</li><li>Base de données d'idées de contenu avec catégories</li><li>Workflow de validation (brouillon → validation → publication)</li><li>Suivi des performances post-publication</li><li>Bibliothèque de hashtags par thématique</li></ul><p>Compatible avec la version gratuite de Notion. Dupliquez-le et commencez à planifier immédiatement.</p>",
      type: "free",
      category: "Social Media",
      resourceType: "Template",
      level: "Débutant",
      format: "Notion",
      coverImage: "/uploads/cover-calendrier-editorial.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "N/A",
      pageCount: null,
      estimatedTime: "10 min",
      status: "published",
    },
    {
      title: "Check-list : Audit digital complet de votre entreprise",
      slug: "checklist-audit-digital-entreprise",
      shortDescription:
        "100 points de contrôle pour évaluer la maturité digitale de votre entreprise.",
      longDescription:
        "<h3>Faites le diagnostic de votre présence digitale</h3><p>Cette check-list exhaustive vous permet d'évaluer :</p><ul><li>Votre site web (UX, SEO, vitesse, mobile)</li><li>Vos réseaux sociaux (profils, contenu, engagement)</li><li>Votre stratégie publicitaire (budget, ciblage, performance)</li><li>Vos outils analytics (tracking, KPIs, reporting)</li><li>Votre stratégie email et CRM</li></ul><p>Chaque point est accompagné d'une note de priorité (critique, important, recommandé) pour vous aider à prioriser vos actions.</p>",
      type: "free",
      category: "Stratégie",
      resourceType: "Check-list",
      level: "Intermédiaire",
      format: "PDF",
      coverImage: "/uploads/cover-audit-digital.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "2.5 MB",
      pageCount: 18,
      estimatedTime: "20 min",
      status: "published",
    },
    {
      title: "Template de Dashboard KPIs Marketing",
      slug: "template-dashboard-kpis-marketing",
      shortDescription:
        "Un tableau de bord Google Sheets pour suivre vos KPIs marketing en temps réel.",
      longDescription:
        "<h3>Visualisez vos performances en un coup d'œil</h3><p>Ce template Google Sheets automatisé comprend :</p><ul><li>Dashboard global avec les KPIs clés (trafic, conversions, ROI)</li><li>Onglet Social Media (followers, engagement rate, reach)</li><li>Onglet Paid Media (CPC, CTR, ROAS, CPA)</li><li>Onglet SEO (positions, trafic organique, backlinks)</li><li>Onglet Email Marketing (taux d'ouverture, clics, désabonnements)</li></ul><p>Graphiques automatiques et formules pré-configurées. Il suffit de saisir vos données.</p>",
      type: "free",
      category: "Data & Performance",
      resourceType: "Outil",
      level: "Intermédiaire",
      format: "Spreadsheet",
      coverImage: "/uploads/cover-kpi-dashboard.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "1.2 MB",
      pageCount: null,
      estimatedTime: "15 min",
      status: "published",
    },
    {
      title: "Guide TikTok Ads : De zéro à la première campagne",
      slug: "guide-tiktok-ads-premiere-campagne",
      shortDescription:
        "Apprenez à créer et lancer votre première campagne publicitaire sur TikTok.",
      longDescription:
        "<h3>TikTok, le canal publicitaire à ne pas ignorer</h3><p>Ce guide pas à pas vous accompagne de la création de votre compte TikTok Business Manager jusqu'au lancement de votre première campagne :</p><ul><li>Créer et configurer votre compte publicitaire</li><li>Comprendre les formats publicitaires TikTok</li><li>Définir votre audience et ciblage</li><li>Créer des créatives qui performent sur TikTok</li><li>Configurer le pixel et le suivi des conversions</li><li>Analyser vos premiers résultats</li></ul><p>Inclut 5 exemples de campagnes réussies avec budgets et résultats détaillés.</p>",
      type: "free",
      category: "Publicité",
      resourceType: "Guide",
      level: "Débutant",
      format: "PDF",
      coverImage: "/uploads/cover-tiktok-ads.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "6.3 MB",
      pageCount: 52,
      estimatedTime: "35 min",
      status: "published",
    },
    {
      title: "Étude : ROI des réseaux sociaux pour les PME en 2026",
      slug: "etude-roi-reseaux-sociaux-pme-2026",
      shortDescription:
        "Chiffres clés et benchmarks sur le retour sur investissement des réseaux sociaux.",
      longDescription:
        "<h3>Quel est le vrai ROI du Social Media ?</h3><p>Cette étude basée sur l'analyse de 500+ PME francophones révèle :</p><ul><li>Le ROI moyen par plateforme (Facebook, Instagram, LinkedIn, TikTok)</li><li>Les secteurs qui performent le mieux en social media</li><li>Le budget moyen et son évolution sur 3 ans</li><li>Les métriques qui comptent vraiment</li><li>Les erreurs les plus coûteuses</li></ul><p>Données collectées entre janvier et décembre 2025 auprès d'entreprises de 5 à 250 employés.</p>",
      type: "free",
      category: "Data & Performance",
      resourceType: "Étude",
      level: "Avancé",
      format: "PDF",
      coverImage: "/uploads/cover-etude.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "7.8 MB",
      pageCount: 72,
      estimatedTime: "50 min",
      status: "published",
    },
    {
      title: "Check-list : Lancer sa stratégie LinkedIn B2B",
      slug: "checklist-strategie-linkedin-b2b",
      shortDescription:
        "30 étapes pour construire une présence LinkedIn B2B qui génère des leads.",
      longDescription:
        "<h3>LinkedIn, la machine à leads B2B</h3><p>Cette check-list actionnable couvre :</p><ul><li>Optimisation du profil personnel et de la page entreprise</li><li>Stratégie de contenu LinkedIn (posts, articles, newsletters)</li><li>Techniques de prospection non-intrusives</li><li>LinkedIn Ads : quand et comment les utiliser</li><li>Social Selling Index : comment l'améliorer</li></ul><p>Chaque étape est cochable et accompagnée de ressources complémentaires.</p>",
      type: "free",
      category: "Social Media",
      resourceType: "Check-list",
      level: "Intermédiaire",
      format: "PDF",
      coverImage: "/uploads/cover-linkedin-strategy.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "1.5 MB",
      pageCount: 15,
      estimatedTime: "15 min",
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
      price: 32000,
      originalPrice: 52000,
      currency: "XOF",
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
      price: 25000,
      originalPrice: null,
      currency: "XOF",
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
      price: 19000,
      originalPrice: 32000,
      currency: "XOF",
      sku: "EB-DATA-001",
      allowDownload: true,
      enableWatermark: true,
    },
    // ── Nouveaux produits payants ──
    {
      title: "Masterclass Email Marketing : De 0 à 10 000 abonnés",
      slug: "masterclass-email-marketing-abonnes",
      shortDescription:
        "Construisez une liste email rentable et créez des séquences qui convertissent.",
      longDescription:
        "<h3>L'email n'est pas mort, loin de là</h3><p>Avec un ROI moyen de 42€ pour chaque euro investi, l'email marketing reste le canal le plus rentable. Cette masterclass de 110 pages vous montre comment en tirer parti.</p><h3>Ce que vous apprendrez</h3><ul><li>Choisir et configurer votre outil d'emailing</li><li>Créer des lead magnets irrésistibles</li><li>Construire des séquences de bienvenue qui convertissent</li><li>Segmenter votre audience pour des messages ultra-ciblés</li><li>Rédiger des objets d'email qui boostent les ouvertures</li><li>A/B tester vos campagnes pour améliorer chaque envoi</li></ul><h3>Bonus inclus</h3><ul><li>50 templates d'emails prêts à l'emploi</li><li>Swipe file de 100 objets d'emails performants</li><li>Tableur de suivi des KPIs email</li></ul>",
      type: "paid",
      category: "Stratégie",
      resourceType: "Formation",
      level: "Intermédiaire",
      format: "PDF",
      coverImage: "/uploads/cover-email-marketing.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "12 MB",
      pageCount: 110,
      estimatedTime: "2h30",
      status: "published",
      price: 29000,
      originalPrice: 45000,
      currency: "XOF",
      sku: "MC-EM-001",
      allowDownload: false,
      enableWatermark: true,
    },
    {
      title: "Kit Influence Marketing : Collaborer avec les créateurs",
      slug: "kit-influence-marketing-createurs",
      shortDescription:
        "Le guide complet pour identifier, contacter et collaborer avec les influenceurs.",
      longDescription:
        "<h3>L'influence marketing accessible à toutes les entreprises</h3><p>Plus besoin d'un budget de multinationale pour travailler avec des influenceurs. Ce kit vous montre comment collaborer efficacement avec des micro et nano-influenceurs.</p><h3>Contenu du kit</h3><ul><li>Guide stratégique de 75 pages</li><li>Template de brief influenceur professionnel</li><li>Modèle de contrat de collaboration</li><li>Tableur de suivi des partenariats et ROI</li><li>Base de données de 200+ influenceurs francophones par niche</li></ul><h3>Pourquoi ce kit est différent</h3><p>Contrairement aux guides génériques, ce kit est spécifiquement adapté au marché francophone et africain avec des cas d'étude concrets et des budgets réalistes pour les PME.</p>",
      type: "paid",
      category: "Social Media",
      resourceType: "Guide",
      level: "Intermédiaire",
      format: "PDF",
      coverImage: "/uploads/cover-influence-marketing.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "18 MB",
      pageCount: 75,
      estimatedTime: "2h",
      status: "published",
      price: 23000,
      originalPrice: null,
      currency: "XOF",
      sku: "KIT-INF-001",
      allowDownload: false,
      enableWatermark: true,
    },
    {
      title: "Formation Canva : Design professionnel pour les réseaux sociaux",
      slug: "formation-canva-design-reseaux-sociaux",
      shortDescription:
        "Maîtrisez Canva pour créer des visuels pro sans être graphiste.",
      longDescription:
        "<h3>Vous n'avez pas besoin d'être designer</h3><p>Avec Canva, n'importe qui peut créer des visuels professionnels. Cette formation vidéo + PDF vous montre comment, étape par étape.</p><h3>Programme de la formation</h3><ul><li>Principes de design graphique (couleurs, typographie, composition)</li><li>Maîtriser l'interface Canva (gratuit et Pro)</li><li>Créer des posts Instagram, stories et reels</li><li>Créer des carrousels LinkedIn engageants</li><li>Créer des thumbnails YouTube qui attirent les clics</li><li>Créer des templates réutilisables pour votre marque</li></ul><h3>Ce que vous recevez</h3><ul><li>Guide PDF de 90 pages avec captures d'écran</li><li>50 templates Canva personnalisables</li><li>Charte graphique type prête à adapter</li></ul>",
      type: "paid",
      category: "Formation",
      resourceType: "Formation",
      level: "Débutant",
      format: "PDF",
      coverImage: "/uploads/cover-formation-canva.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "25 MB",
      pageCount: 90,
      estimatedTime: "3h",
      status: "published",
      price: 19000,
      originalPrice: 32000,
      currency: "XOF",
      sku: "FM-CAN-001",
      allowDownload: false,
      enableWatermark: true,
    },
    {
      title: "E-book Copywriting Digital : L'art d'écrire pour convertir",
      slug: "ebook-copywriting-digital-convertir",
      shortDescription:
        "Les techniques de copywriting pour transformer vos visiteurs en clients.",
      longDescription:
        "<h3>Les mots ont le pouvoir de vendre</h3><p>Le copywriting est la compétence #1 du marketing digital. Cet e-book vous enseigne les frameworks et techniques utilisés par les meilleurs copywriters.</p><h3>Au programme</h3><ul><li>Les fondamentaux du copywriting (AIDA, PAS, BAB)</li><li>Rédiger des pages de vente qui convertissent</li><li>Écrire des emails qui sont ouverts et cliqués</li><li>Créer des publications Social Media engageantes</li><li>Optimiser vos landing pages pour la conversion</li><li>Rédiger des publicités percutantes (Google, Meta, LinkedIn)</li></ul><h3>Bonus</h3><ul><li>100 formules de titres prêtes à l'emploi</li><li>Swipe file de 50 pages de vente analysées</li><li>Templates de landing pages à fort taux de conversion</li></ul>",
      type: "paid",
      category: "Stratégie",
      resourceType: "E-book",
      level: "Avancé",
      format: "PDF",
      coverImage: "/uploads/cover-copywriting.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "10 MB",
      pageCount: 130,
      estimatedTime: "3h30",
      status: "published",
      price: 25000,
      originalPrice: 39000,
      currency: "XOF",
      sku: "EB-CW-001",
      allowDownload: true,
      enableWatermark: true,
    },
    {
      title: "Stratégie Digitale 360° : Plan d'action pour PME",
      slug: "strategie-digitale-360-plan-action-pme",
      shortDescription:
        "Un plan d'action digital complet pour structurer et accélérer la croissance de votre PME.",
      longDescription:
        "<h3>Votre feuille de route digitale en 90 jours</h3><p>Vous savez que le digital est important mais vous ne savez pas par où commencer ? Ce guide vous donne un plan d'action concret, prioritisé et réaliste.</p><h3>Les 6 piliers couverts</h3><ul><li><strong>Présence Web</strong> : site, SEO, blog</li><li><strong>Social Media</strong> : plateformes, contenu, engagement</li><li><strong>Publicité</strong> : Google Ads, Meta Ads, budget</li><li><strong>Email Marketing</strong> : liste, séquences, automation</li><li><strong>Analytics</strong> : tracking, KPIs, reporting</li><li><strong>Branding</strong> : identité, positionnement, différenciation</li></ul><h3>Inclus</h3><ul><li>Guide de 140 pages</li><li>Plan d'action à 90 jours sur tableur</li><li>Canvas de positionnement de marque</li><li>Calculateur de budget marketing digital</li></ul>",
      type: "paid",
      category: "Stratégie",
      resourceType: "Guide",
      level: "Intermédiaire",
      format: "PDF",
      coverImage: "/uploads/cover-strategie-digitale.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "20 MB",
      pageCount: 140,
      estimatedTime: "4h",
      status: "published",
      price: 39000,
      originalPrice: 58000,
      currency: "XOF",
      sku: "GD-SD-001",
      allowDownload: false,
      enableWatermark: true,
    },
    {
      title: "Guide du Branding Digital : Construire une identité de marque forte",
      slug: "guide-branding-digital-identite-marque",
      shortDescription:
        "Créez une identité de marque mémorable et cohérente sur tous vos canaux digitaux.",
      longDescription:
        "<h3>Votre marque, votre différence</h3><p>Dans un monde digital saturé, seule une marque forte peut se démarquer. Ce guide vous accompagne dans la construction d'une identité de marque cohérente et impactante.</p><h3>Ce que vous allez construire</h3><ul><li>Votre plateforme de marque (mission, vision, valeurs)</li><li>Votre identité visuelle (logo, couleurs, typographie)</li><li>Votre ton de voix et charte éditoriale</li><li>Vos guidelines pour les réseaux sociaux</li><li>Votre brand book digital complet</li></ul><h3>Bonus</h3><ul><li>Template de brand book Canva/Figma</li><li>Exemples de 15 marques africaines inspirantes</li><li>Checklist de cohérence de marque</li></ul>",
      type: "paid",
      category: "Stratégie",
      resourceType: "Guide",
      level: "Débutant",
      format: "PDF",
      coverImage: "/uploads/cover-branding-guide.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "14 MB",
      pageCount: 85,
      estimatedTime: "2h",
      status: "published",
      price: 22000,
      originalPrice: null,
      currency: "XOF",
      sku: "GD-BR-001",
      allowDownload: false,
      enableWatermark: true,
    },
    {
      title: "LinkedIn Ads Mastery : Publicité B2B avancée",
      slug: "linkedin-ads-mastery-publicite-b2b",
      shortDescription:
        "Maîtrisez LinkedIn Ads pour générer des leads B2B qualifiés à coût maîtrisé.",
      longDescription:
        "<h3>LinkedIn Ads : le canal B2B par excellence</h3><p>Les CPCs LinkedIn sont élevés, mais les leads générés valent de l'or. Ce guide avancé vous montre comment maximiser votre ROI sur la plateforme publicitaire LinkedIn.</p><h3>Programme complet</h3><ul><li>Architecture de campagne optimale (ABM, retargeting, lookalike)</li><li>Ciblage avancé (titres, compétences, groupes, entreprises)</li><li>Formats publicitaires (Sponsored Content, InMail, Conversation Ads)</li><li>Lead Gen Forms : bonnes pratiques et intégrations CRM</li><li>Stratégies d'enchères et optimisation budgétaire</li><li>Reporting avancé et attribution</li></ul><h3>Ressources incluses</h3><ul><li>Guide de 100 pages</li><li>Tableur de calcul de budget et prévisions</li><li>Templates de publicités performantes</li><li>Matrice de ciblage par secteur</li></ul>",
      type: "paid",
      category: "Publicité",
      resourceType: "Formation",
      level: "Avancé",
      format: "PDF",
      coverImage: "/uploads/cover-linkedin-strategy.svg",
      filePath: "/uploads/sample.pdf",
      fileSize: "16 MB",
      pageCount: 100,
      estimatedTime: "2h30",
      status: "published",
      price: 35000,
      originalPrice: 52000,
      currency: "XOF",
      sku: "FM-LI-001",
      allowDownload: false,
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
          monerooPaymentId: "sample_test_001",
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
