import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Rafraîchir la session si nécessaire
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si pas d'utilisateur authentifié et qu'on accède à une route protégée,
  // supprimer les cookies Supabase résiduels pour éviter les sessions fantômes
  if (!user) {
    const allCookies = request.cookies.getAll();
    const supabaseCookies = allCookies.filter(
      (c) => c.name.startsWith("sb-") || c.name.includes("supabase")
    );
    for (const cookie of supabaseCookies) {
      supabaseResponse.cookies.set(cookie.name, "", {
        maxAge: 0,
        path: "/",
      });
    }
  }

  return supabaseResponse;
}
