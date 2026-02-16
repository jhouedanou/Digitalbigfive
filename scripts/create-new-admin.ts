import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createNewAdmin() {
  const email = "bigfiveadmin2026@gmail.com";
  const password = "admin123456";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

  console.log("📧 Création nouvel admin:", email);

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Créer dans Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("❌ Erreur Supabase:", error.message);
    
    // Essayer de se connecter si l'utilisateur existe
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!signInError) {
      console.log("✅ L'utilisateur existe et peut se connecter");
    } else {
      console.error("❌ Impossible de se connecter:", signInError.message);
    }
  } else {
    console.log("✅ Créé dans Supabase Auth");
    console.log("   ID:", data.user?.id);
  }

  // 2. Créer/mettre à jour dans Prisma
  const hashedPassword = await bcrypt.hash(password, 12);
  
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      password: hashedPassword,
      firstName: "Admin",
      lastName: "BigFive",
      role: "admin",
      organization: "Big Five",
      jobTitle: "Administrateur",
    },
    update: {
      role: "admin",
      password: hashedPassword,
    },
  });

  console.log("✅ Créé/mis à jour dans Prisma");

  console.log("\n🎉 Nouvel admin prêt !");
  console.log("   Email:", email);
  console.log("   Mot de passe:", password);
}

createNewAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
