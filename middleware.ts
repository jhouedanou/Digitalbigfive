import { updateSession } from "@/lib/supabase-middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Mettre à jour la session Supabase
  const response = await updateSession(request);
  
  // Ajouter les headers de sécurité pour les routes PDF
  if (request.nextUrl.pathname.startsWith("/api/pdf") || 
      request.nextUrl.pathname.startsWith("/dashboard/reader")) {
    
    // Headers de sécurité stricts
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()"
    );
    
    // Content Security Policy pour le lecteur PDF
    if (request.nextUrl.pathname.startsWith("/dashboard/reader")) {
      response.headers.set(
        "Content-Security-Policy",
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' https://fonts.gstatic.com",
          "connect-src 'self'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; ")
      );
    }
    
    // Empêcher le cache pour les PDFs
    if (request.nextUrl.pathname.startsWith("/api/pdf")) {
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private, max-age=0");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - _next/static, _next/image
     * - favicon.ico, sitemap.xml, robots.txt
     * - fichiers statiques (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
