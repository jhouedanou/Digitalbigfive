import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

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

  // Serve file
  const filePath = path.join(process.cwd(), "public", download.resource.filePath);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: "Fichier introuvable" },
      { status: 404 }
    );
  }

  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(download.resource.filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
