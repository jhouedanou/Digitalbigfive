import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/pdf-logs
 * 
 * Récupère les logs d'accès aux PDFs pour l'admin.
 * Paramètres de query:
 * - resourceId: Filtrer par ressource
 * - userId: Filtrer par utilisateur
 * - action: Filtrer par action (open, page_view, close, blocked)
 * - from: Date de début (ISO)
 * - to: Date de fin (ISO)
 * - page: Numéro de page (défaut: 1)
 * - limit: Nombre par page (défaut: 50)
 */
export async function GET(req: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès réservé aux administrateurs" },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const resourceId = searchParams.get("resourceId");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const skip = (page - 1) * limit;

    // Construire le filtre
    const where: Record<string, unknown> = {};
    if (resourceId) where.resourceId = resourceId;
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, Date>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, Date>).lte = new Date(to);
    }

    // Récupérer les logs
    const [logs, total] = await Promise.all([
      prisma.pDFAccessLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.pDFAccessLog.count({ where }),
    ]);

    // Enrichir avec les infos utilisateur et ressource
    const userIds = [...new Set(logs.map(l => l.userId))];
    const resourceIds = [...new Set(logs.map(l => l.resourceId))];

    const [users, resources] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, firstName: true, lastName: true },
      }),
      prisma.resource.findMany({
        where: { id: { in: resourceIds } },
        select: { id: true, title: true },
      }),
    ]);

    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const resourceMap = Object.fromEntries(resources.map(r => [r.id, r]));

    const enrichedLogs = logs.map(log => ({
      ...log,
      user: userMap[log.userId] || null,
      resource: resourceMap[log.resourceId] || null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }));

    return NextResponse.json({
      logs: enrichedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("PDF logs error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/pdf-logs/stats
 * 
 * Statistiques globales d'accès aux PDFs.
 */
export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès réservé aux administrateurs" },
        { status: 403 }
      );
    }

    const { resourceId } = await req.json();

    // Statistiques globales ou par ressource
    const where = resourceId ? { resourceId } : {};

    const [
      totalSessions,
      activeSessions,
      totalPageViews,
      blockedAttempts,
      avgDuration,
      recentActivity,
    ] = await Promise.all([
      prisma.viewerSession.count({ where }),
      prisma.viewerSession.count({
        where: { ...where, isActive: true, expiresAt: { gt: new Date() } },
      }),
      prisma.pDFAccessLog.count({ where: { ...where, action: "page_view" } }),
      prisma.pDFAccessLog.count({ where: { ...where, action: "blocked" } }),
      prisma.viewerSession.aggregate({
        where,
        _avg: { duration: true, pagesViewed: true },
      }),
      prisma.pDFAccessLog.findMany({
        where: { ...where, action: "open" },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // Top ressources consultées
    const topResources = await prisma.pDFAccessLog.groupBy({
      by: ["resourceId"],
      where: { action: "open" },
      _count: { resourceId: true },
      orderBy: { _count: { resourceId: "desc" } },
      take: 5,
    });

    const topResourcesWithNames = await Promise.all(
      topResources.map(async (r) => {
        const resource = await prisma.resource.findUnique({
          where: { id: r.resourceId },
          select: { title: true },
        });
        return {
          resourceId: r.resourceId,
          title: resource?.title || "Inconnu",
          count: r._count.resourceId,
        };
      })
    );

    return NextResponse.json({
      totalSessions,
      activeSessions,
      totalPageViews,
      blockedAttempts,
      avgDuration: avgDuration._avg.duration || 0,
      avgPagesViewed: avgDuration._avg.pagesViewed || 0,
      topResources: topResourcesWithNames,
    });
  } catch (error) {
    console.error("PDF stats error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
