import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Library Sync API - Cross-Platform Endpoint
 * Returns user's purchased products with metadata for all platforms
 * 
 * Supports: Web, Android, iOS, macOS, Windows, Linux
 * 
 * Headers:
 * - X-Platform: android | ios | macos | windows | linux | web
 * - X-App-Version: 1.0.0
 * - X-Device-Id: unique device identifier
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Non autorisé", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // Get platform info from headers
  const platform = request.headers.get("X-Platform") || "web";
  const appVersion = request.headers.get("X-App-Version") || "1.0.0";
  const deviceId = request.headers.get("X-Device-Id");

  try {
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImage: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get all paid orders with resources
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        status: "paid",
      },
      include: {
        resource: {
          select: {
            id: true,
            title: true,
            shortDescription: true,
            coverImage: true,
            fileSize: true,
            pageCount: true,
            category: true,
            level: true,
            format: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format products for the library
    const products = orders.map((order) => ({
      id: order.resource.id,
      title: order.resource.title,
      description: order.resource.shortDescription,
      author: "Digital Big Five",
      coverImage: order.resource.coverImage,
      fileSize: order.resource.fileSize,
      pageCount: order.resource.pageCount || 0,
      category: order.resource.category,
      level: order.resource.level,
      format: order.resource.format,
      purchasedAt: order.createdAt.toISOString(),
      lastUpdated: order.resource.updatedAt.toISOString(),
      // Platform-specific download URL
      downloadUrl: `/api/pdf/${order.resource.id}?platform=${platform}`,
      // Offline sync URL
      offlineUrl: `/api/pdf/prepare-offline`,
    }));

    // Log sync event if device ID provided
    if (deviceId) {
      // Could log device sync for analytics
      console.log(`Library sync: user=${user.id}, device=${deviceId}, platform=${platform}`);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        avatar: user.profileImage,
      },
      products,
      sync: {
        timestamp: new Date().toISOString(),
        platform,
        appVersion,
        totalProducts: products.length,
      },
      // API version for compatibility checks
      apiVersion: "2.0",
      // Features available for this user
      features: {
        offlineReading: true,
        watermarking: true,
        crossDeviceSync: true,
        readingProgress: true,
      },
    });
  } catch (error) {
    console.error("Library sync error:", error);
    return NextResponse.json(
      { error: "Erreur de synchronisation", code: "SYNC_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * POST - Update reading progress and sync state
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Non autorisé", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { resourceId, currentPage, totalPages, lastReadAt, deviceId } = body;

    if (!resourceId) {
      return NextResponse.json(
        { error: "resourceId requis", code: "MISSING_RESOURCE_ID" },
        { status: 400 }
      );
    }

    // Verify the user owns this resource
    const order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        resourceId,
        status: "paid",
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Ressource non autorisée", code: "RESOURCE_NOT_FOUND" },
        { status: 403 }
      );
    }

    // Store reading progress (could use a dedicated table)
    // For now, we'll use the user's metadata or a cache
    // In production, this would update a ReadingProgress table

    const progress = {
      userId: session.user.id,
      resourceId,
      currentPage: currentPage || 0,
      totalPages: totalPages || 0,
      percent: totalPages ? Math.round((currentPage / totalPages) * 100) : 0,
      lastReadAt: lastReadAt || new Date().toISOString(),
      deviceId,
      syncedAt: new Date().toISOString(),
    };

    // Log progress update
    console.log(`Progress update: user=${session.user.id}, resource=${resourceId}, page=${currentPage}/${totalPages}`);

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("Progress sync error:", error);
    return NextResponse.json(
      { error: "Erreur de synchronisation", code: "SYNC_ERROR" },
      { status: 500 }
    );
  }
}
