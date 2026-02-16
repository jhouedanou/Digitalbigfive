import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createSupabaseAdmin() {
  const email = "jeanluc@bigfiveabidjan.com";
  const password = "admin123456";

  // Variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Variables NEXT_PUBLIC_SUPABASE_URL requise");
    process.exit(1);
  }

  console.log("📧 Création admin:", email);
  console.log("🔗 Supabase URL:", supabaseUrl);

  // Client Supabase
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Essayer de se connecter d'abord
  console.log("\n1️⃣ Test connexion existante...");
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!signInError && signInData.user) {
    console.log("✅ L'utilisateur existe déjà et peut se connecter !");
    console.log("   ID Supabase:", signInData.user.id);
  } else {
    console.log("⚠️  Connexion échouée, création de l'utilisateur...");
    
    // Créer via signup
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: "Jean-Luc",
          last_name: "Admin",
        },
      },
    });

    if (signUpError) {
      console.error("❌ Erreur inscription:", signUpError.message);
      
      // Si l'utilisateur existe déjà mais ne peut pas se connecter,
      // il faut peut-être confirmer l'email manuellement dans Supabase Dashboard
      if (signUpError.message.includes("already registered")) {
        console.log("\n⚠️  L'utilisateur existe mais le mot de passe est peut-être différent.");
        console.log("   → Allez sur https://supabase.com/dashboard");
        console.log("   → Project → Authentication → Users");
        console.log("   → Trouvez", email);
        console.log("   → Cliquez sur 'Reset password' ou supprimez et recréez");
      }
    } else {
      console.log("✅ Utilisateur créé dans Supabase Auth");
      console.log("   ID:", signUpData.user?.id);
      
      if (signUpData.user?.identities?.length === 0) {
        console.log("\n⚠️  L'utilisateur existait déjà. Vérifiez le dashboard Supabase.");
      }
    }
  }

  // 2. Créer/mettre à jour dans Prisma
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const existingPrismaUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingPrismaUser) {
    await prisma.user.update({
      where: { email },
      data: { 
        role: "admin",
        password: hashedPassword,
      },
    });
    console.log("✅ Utilisateur Prisma mis à jour (rôle: admin)");
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: "Jean-Luc",
        lastName: "Admin",
        role: "admin",
        organization: "Big Five Abidjan",
        jobTitle: "Administrateur",
      },
    });
    console.log("✅ Utilisateur créé dans Prisma");
  }

  console.log("\n🎉 Admin prêt !");
  console.log("   Email:", email);
  console.log("   Mot de passe:", password);
  console.log("   Connectez-vous sur /login");
}

createSupabaseAdmin()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
