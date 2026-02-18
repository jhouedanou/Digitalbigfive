import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const contacts = await prisma.contact.findMany({
    where: { NOT: { email: { contains: "@download.local" } } },
    orderBy: { createdAt: "desc" },
    include: {
      downloads: {
        include: { resource: { select: { title: true } } },
      },
    },
  });

  // Generate CSV
  const headers = ["Prénom", "Nom", "Email", "Téléphone", "Organisation", "Fonction", "Date", "Ressources"];
  const rows = contacts.map((c) => [
    c.firstName,
    c.lastName,
    c.email,
    c.phone || "",
    c.organization || "",
    c.jobTitle || "",
    c.createdAt.toISOString().split("T")[0],
    c.downloads.map((d) => d.resource.title).join("; "),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacts-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
