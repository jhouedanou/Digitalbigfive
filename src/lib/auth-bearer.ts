import { createClient } from "@supabase/supabase-js";
import { prisma } from "./prisma";
import { auth, type AppSession } from "./auth";
import { NextRequest } from "next/server";

/**
 * Auth qui supporte:
 * 1. Cookies Supabase (web classique)
 * 2. Bearer token dans Authorization header (app Electron)
 */
export async function authFromRequest(
  req: NextRequest
): Promise<AppSession | null> {
  // 1. Essayer le Bearer token d'abord (Electron app)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return authFromToken(token);
  }

  // 2. Fallback sur l'auth cookies classique (web)
  return auth();
}

/**
 * Auth via access_token Supabase (pour l'app Electron)
 */
async function authFromToken(accessToken: string): Promise<AppSession | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
    );

    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !supabaseUser?.email) return null;

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
  } catch {
    return null;
  }
}
