import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Variables d'environnement manquantes");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient();

const EMAIL = "analyticsbigfive@gmail.com";
const PASSWORD = "bigfive01";

async function main() {
  console.log(`📧 Configuration admin: ${EMAIL}`);
  console.log(`🔑 Nouveau mot de passe: ${PASSWORD}`);

  try {
    // 1. Chercher l'utilisateur dans Supabase Auth
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("❌ Erreur liste users:", listError.message);
      return;
    }

    const existingUser = users.users.find((u) => u.email === EMAIL);

    if (existingUser) {
      console.log(`✅ Utilisateur trouvé dans Supabase Auth: ${existingUser.id}`);
      
      // Mettre à jour le mot de passe
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: PASSWORD }
      );

      if (updateError) {
        console.error("❌ Erreur mise à jour mot de passe:", updateError.message);
      } else {
        console.log("✅ Mot de passe mis à jour dans Supabase Auth");
      }
    } else {
      console.log("⚠️ Utilisateur non trouvé dans Supabase Auth, création...");
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
      });

      if (createError) {
        console.error("❌ Erreur création:", createError.message);
      } else {
        console.log(`✅ Utilisateur créé: ${newUser.user?.id}`);
      }
    }

    // 2. Mettre à jour dans Prisma
    const hashedPassword = await bcrypt.hash(PASSWORD, 12);
    
    await prisma.user.upsert({
      where: { email: EMAIL },
      create: {
        email: EMAIL,
        password: hashedPassword,
        firstName: "Analytics",
        lastName: "BigFive",
        role: "admin",
      },
      update: {
        password: hashedPassword,
        role: "admin",
      },
    });

    console.log("✅ Utilisateur mis à jour dans Prisma (role: admin)");

    // 3. Test de connexion
    const testClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!);
    const { error: loginError } = await testClient.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD,
    });

    if (loginError) {
      console.error("❌ Test connexion échoué:", loginError.message);
    } else {
      console.log("✅ Test connexion réussi !");
    }

    console.log("\n🎉 Admin configuré !");
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Mot de passe: ${PASSWORD}`);
    console.log("   Connectez-vous sur /admin/login");

  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
