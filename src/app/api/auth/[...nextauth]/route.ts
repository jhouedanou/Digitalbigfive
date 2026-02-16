// Cette route n'est plus nécessaire avec Supabase Auth.
// Les callbacks d'auth sont gérés côté client via @supabase/ssr.
// Ce fichier peut être supprimé.

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Auth gérée par Supabase" });
}

export async function POST() {
  return NextResponse.json({ message: "Auth gérée par Supabase" });
}
