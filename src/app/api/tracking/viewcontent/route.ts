import { NextRequest, NextResponse } from "next/server";
import { sendCAPIEvent } from "@/lib/meta-tracking";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, contentName, contentCategory, value, currency, eventId, sourceUrl } = body;

    if (!contentId || !eventId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    // Envoyer via CAPI (non bloquant côté réponse)
    sendCAPIEvent({
      eventName: "ViewContent",
      eventId,
      ip,
      userAgent,
      sourceUrl,
      customData: {
        content_ids: [contentId],
        content_name: contentName,
        content_category: contentCategory,
        content_type: "product",
        value,
        currency: currency || "XOF",
      },
    }).catch((err) => {
      console.error("[CAPI ViewContent] Failed:", err);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[CAPI ViewContent] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
