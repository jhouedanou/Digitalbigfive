import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const download = await prisma.download.findUnique({
    where: { token },
    include: { resource: true },
  });

  if (!download) {
    return NextResponse.json(
      { error: "Lien invalide" },
      { status: 404 }
    );
  }

  if (download.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Ce lien a expiré" },
      { status: 410 }
    );
  }

  // Mark as downloaded
  await prisma.download.update({
    where: { id: download.id },
    data: { downloadedAt: new Date() },
  });

  const filePath = download.resource.filePath;

  // Si le fichier est une URL complète (Supabase Storage), rediriger
  if (filePath.startsWith("http")) {
    return NextResponse.redirect(filePath);
  }

  // Si c'est un chemin Supabase Storage relatif
  if (filePath.startsWith("pdfs/") || filePath.startsWith("covers/")) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}`;
    return NextResponse.redirect(publicUrl);
  }

  // Fallback: construire l'URL Supabase à partir du nom de fichier
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const fileName = filePath.replace(/^\/?(uploads\/)?/, "");
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/uploads/${fileName}`;
  
  return NextResponse.redirect(publicUrl);
}
