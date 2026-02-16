// Types d'auth pour l'application (Supabase Auth + Prisma)
export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AppSession {
  user: AppUser;
}
