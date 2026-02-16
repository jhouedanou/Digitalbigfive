import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SecurePDFReader from "@/components/dashboard/SecurePDFReader";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReaderPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: resourceId } = await params;

  // Verify access
  const order = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      resourceId,
      status: "paid",
    },
    include: { resource: true },
  });

  const isAdmin = session.user.role === "admin";

  if (!order && !isAdmin) notFound();

  const resource = order?.resource || await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) notFound();

  return (
    <SecurePDFReader
      resourceId={resourceId}
      title={resource.title}
      userEmail={session.user.email}
      userName={session.user.name || "Utilisateur"}
      enableWatermark={resource.enableWatermark}
    />
  );
}
