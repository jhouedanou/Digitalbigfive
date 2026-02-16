import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Secret key for signing tokens (should be in env)
const TOKEN_SECRET = process.env.PDF_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-key";
const EXPIRATION_DAYS = 30; // PDFs expire after 30 days offline

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    console.log("[prepare-offline] Session:", session?.user?.id);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { resourceId } = body;
    console.log("[prepare-offline] ResourceId:", resourceId);

    if (!resourceId) {
      return NextResponse.json(
        { error: "ID de ressource requis" },
        { status: 400 }
      );
    }

    // Verify user owns this resource
    const order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        resourceId,
        status: "paid",
      },
      include: {
        resource: true,
        user: true,
      },
    });

    console.log("[prepare-offline] Order found:", !!order);

    if (!order) {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à cette ressource" },
        { status: 403 }
      );
    }

    const resource = order.resource;
    console.log("[prepare-offline] FilePath:", resource.filePath);

    if (!resource.filePath) {
      return NextResponse.json(
        { error: "Fichier non disponible" },
        { status: 404 }
      );
    }

    // Clean file path - remove leading slash and "uploads/" prefix if present
    let cleanPath = resource.filePath.startsWith("/")
      ? resource.filePath.slice(1)
      : resource.filePath;
    
    // Remove "uploads/" prefix since we're already accessing the "uploads" bucket
    if (cleanPath.startsWith("uploads/")) {
      cleanPath = cleanPath.slice(8); // Remove "uploads/"
    }
    
    console.log("[prepare-offline] Original path:", resource.filePath);
    console.log("[prepare-offline] Clean path:", cleanPath);
    console.log("[prepare-offline] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("[prepare-offline] Service key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Download PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("uploads")
      .download(cleanPath);

    if (downloadError || !fileData) {
      console.error("[prepare-offline] Download error:", downloadError);
      console.error("[prepare-offline] FileData exists:", !!fileData);
      return NextResponse.json(
        { error: `Impossible de télécharger le fichier: ${downloadError?.message || 'Unknown'}` },
        { status: 500 }
      );
    }

    console.log("[prepare-offline] File downloaded, size:", fileData.size);

    // Convert blob to buffer
    const pdfBuffer = Buffer.from(await fileData.arrayBuffer());

    // Create signed token for expiration
    const now = Date.now();
    const expiresAt = now + EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

    const tokenPayload = {
      userId: session.user.id,
      resourceId,
      issuedAt: now,
      expiresAt,
    };

    // Create HMAC signature
    const payloadString = JSON.stringify(tokenPayload);
    const signature = crypto
      .createHmac("sha256", TOKEN_SECRET)
      .update(payloadString)
      .digest("base64");

    const signedToken = {
      ...tokenPayload,
      signature,
    };

    // Watermark data (embedded in token, used for display)
    const watermarkData = {
      userId: session.user.id,
      userEmail: order.user.email,
      purchaseDate: order.createdAt.toISOString(),
      resourceTitle: resource.title,
    };

    // Return PDF data with signed token
    return NextResponse.json({
      success: true,
      pdf: pdfBuffer.toString("base64"),
      token: signedToken,
      watermarkData,
      title: resource.title,
      expiresAt,
      expirationDays: EXPIRATION_DAYS,
    });
  } catch (error) {
    console.error("Prepare offline error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la préparation" },
      { status: 500 }
    );
  }
}

// Verify access rights (called when coming back online)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { resourceIds } = await request.json();

    if (!Array.isArray(resourceIds)) {
      return NextResponse.json(
        { error: "Liste de ressources requise" },
        { status: 400 }
      );
    }

    // Check which resources the user still has access to
    const validOrders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        resourceId: { in: resourceIds },
        status: "paid",
      },
      select: {
        resourceId: true,
      },
    });

    const validResourceIds = validOrders.map((o) => o.resourceId);
    const revokedResourceIds = resourceIds.filter(
      (id) => !validResourceIds.includes(id)
    );

    return NextResponse.json({
      valid: validResourceIds,
      revoked: revokedResourceIds,
    });
  } catch (error) {
    console.error("Verify access error:", error);
    return NextResponse.json(
      { error: "Erreur de vérification" },
      { status: 500 }
    );
  }
}

// Verify token signature (client-side validation backup)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token requis" },
        { status: 400 }
      );
    }

    const tokenData = JSON.parse(Buffer.from(token, "base64").toString());
    const { signature, ...payload } = tokenData;

    // Verify signature
    const payloadString = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac("sha256", TOKEN_SECRET)
      .update(payloadString)
      .digest("base64");

    const isValid = signature === expectedSignature;
    const isExpired = payload.expiresAt < Date.now();

    return NextResponse.json({
      valid: isValid && !isExpired,
      expired: isExpired,
      expiresAt: payload.expiresAt,
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "Token invalide" },
      { status: 400 }
    );
  }
}
