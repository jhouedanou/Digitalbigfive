import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdmin() {
  const email = "jeanluc@bigfiveabidjan.com";
  const password = "admin123456";
  
  // Hasher le nouveau mot de passe
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Vérifier si l'admin existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("⚠️  L'utilisateur existe déjà:", email);
    
    // Mettre à jour le rôle et le mot de passe
    await prisma.user.update({
      where: { email },
      data: { 
        role: "admin",
        password: hashedPassword 
      },
    });
    console.log("✅ Rôle mis à jour en 'admin'");
    console.log("✅ Mot de passe mis à jour");
    
    return;
  }

  // Créer l'admin
  const admin = await prisma.user.create({
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

  console.log("✅ Administrateur créé avec succès:");
  console.log("   Email:", admin.email);
  console.log("   Rôle:", admin.role);
  console.log("   ID:", admin.id);
}

createAdmin()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
