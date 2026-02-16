import { createClient } from "@/lib/supabase-server";
import { prisma } from "./prisma";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AppSession {
  user: AppUser;
}

/**
 * Récupère la session utilisateur côté serveur (Server Components / Route Handlers).
 * Remplace l'ancien `auth()` de NextAuth.
 */
export async function auth(): Promise<AppSession | null> {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser?.email) return null;

  // Chercher l'utilisateur dans notre base Prisma
  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email },
  });

  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
    },
  };
}
