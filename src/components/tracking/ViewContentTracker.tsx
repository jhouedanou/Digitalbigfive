"use client";

import { useEffect, useRef } from "react";
import { trackPixelEvent } from "@/lib/pixel";

interface ViewContentTrackerProps {
  contentId: string;
  contentName: string;
  contentCategory: string;
  value?: number;
  currency?: string;
}

/**
 * Client Component invisible qui fire un événement ViewContent (Pixel + CAPI)
 * au montage. À placer sur chaque page produit.
 */
export default function ViewContentTracker({
  contentId,
  contentName,
  contentCategory,
  value,
  currency = "XOF",
}: ViewContentTrackerProps) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const eventId = `viewcontent_${contentId}_${Date.now()}`;

    // 1. Pixel côté client
    trackPixelEvent(
      "ViewContent",
      {
        content_ids: [contentId],
        content_name: contentName,
        content_category: contentCategory,
        content_type: "product",
        value,
        currency,
      },
      eventId
    );

    // 2. CAPI côté serveur (via endpoint dédié, non bloquant)
    fetch("/api/tracking/viewcontent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId,
        contentName,
        contentCategory,
        value,
        currency,
        eventId,
        sourceUrl: window.location.href,
      }),
    }).catch(() => {
      /* non bloquant */
    });
  }, [contentId, contentName, contentCategory, value, currency]);

  return null;
}
