import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

// Créer un client Supabase avec la Service Role Key pour contourner RLS
function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante. Ajoutez-la dans .env.local depuis Supabase Dashboard > Settings > API > service_role"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Formater la taille du fichier en format lisible
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Valider le type de fichier (PDF uniquement)
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Type de fichier non autorisé. Utilisez uniquement des fichiers PDF." },
        { status: 400 }
      );
    }

    // Max 50MB pour les PDF
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Le fichier ne doit pas dépasser 50 Mo." },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${Date.now()}-${originalName}`;
    const filePath = `pdfs/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Utiliser le client admin pour contourner RLS
    const supabaseAdmin = getAdminSupabaseClient();

    const { error: uploadError } = await supabaseAdmin.storage
      .from("uploads")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload PDF error:", uploadError);
      return NextResponse.json(
        { error: `Erreur d'upload: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("uploads")
      .getPublicUrl(filePath);

    // Retourner l'URL, le chemin et la taille formatée
    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
      fileSize: formatFileSize(file.size),
      fileSizeBytes: file.size,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Upload PDF error:", error);
    const message = error instanceof Error ? error.message : "Erreur lors de l'upload du PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
