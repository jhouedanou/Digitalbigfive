"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle } from "lucide-react";

interface ChariowWidgetProps {
  productId: string;
  storeDomain: string;
  ctaText?: string;
  primaryColor?: string;
  backgroundColor?: string;
  locale?: string;
  /** Compact mode for sidebar / repeated CTAs */
  compact?: boolean;
}

const REDIRECT_DELAY = 5; // seconds

export default function ChariowWidget({
  productId,
  storeDomain,
  ctaText = "Acheter maintenant",
  primaryColor = "#80368D",
  backgroundColor = "#FFFFFF",
  locale = "fr",
  compact = false,
}: ChariowWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [iframeHeight, setIframeHeight] = useState(500);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REDIRECT_DELAY);

  // Build iframe URL with query params
  const params = new URLSearchParams();
  if (primaryColor) params.set("primary_color", primaryColor);
  if (backgroundColor) params.set("background_color", backgroundColor);
  params.set("border_style", "rounded");
  params.set("cta_animation", "bounce_rotate");
  params.set("locale", locale);
  if (ctaText) params.set("custom_cta_text", ctaText);

  const iframeSrc = `https://${storeDomain}/widget/${productId}/checkout?${params.toString()}`;

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== `https://${storeDomain}`) return;

      const data = event.data;

      // Height adjustment
      const height =
        data?.height ??
        data?.data?.height ??
        (data?.type === "chariow-iframe-height" && data?.height);
      if (typeof height === "number" && height > 0) {
        setIframeHeight(height);
      }

      // Payment success
      if (
        data?.type === "PAYMENT_SUCCESSFUL" ||
        data?.type === "chariow-purchase-completed"
      ) {
        setPaymentSuccess(true);

        // Build redirect URL
        const returnUrl = data?.eventData?.return_url;
        const purchaseId = data?.purchaseId;
        const url =
          returnUrl ||
          (purchaseId
            ? `https://${storeDomain}/purchase/${purchaseId}`
            : `https://${storeDomain}`);
        setRedirectUrl(url);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [storeDomain]);

  // Countdown + redirect after payment success
  useEffect(() => {
    if (!paymentSuccess || !redirectUrl) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = redirectUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentSuccess, redirectUrl]);

  // Success state
  if (paymentSuccess) {
    return (
      <div
        ref={containerRef}
        className="w-full rounded-2xl border-2 border-green-200 bg-green-50 p-8 text-center"
      >
        <CheckCircle className="mx-auto mb-4 text-green-600" size={48} />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Merci pour votre achat !
        </h3>
        <p className="text-gray-600 mb-4">
          Votre paiement a bien été pris en compte. Vous allez recevoir votre
          produit par email.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Redirection automatique dans{" "}
          <span className="font-bold text-[#80368D]">{countdown}s</span>...
        </p>
        {redirectUrl && (
          <a
            href={redirectUrl}
            className="inline-block rounded-lg bg-[#80368D] px-6 py-3 text-white font-semibold hover:bg-[#6b2d76] transition-colors"
          >
            Accéder à mon produit maintenant
          </a>
        )}
      </div>
    );
  }

  const iframeEl = (
    <iframe
      src={iframeSrc}
      style={{
        width: "100%",
        minHeight: "500px",
        height: `${iframeHeight}px`,
        border: "none",
      }}
      title="Chariow Checkout"
      allow="payment"
      scrolling="auto"
    />
  );

  if (compact) {
    return (
      <div ref={containerRef} className="w-full">
        {iframeEl}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl border-2 border-[#80368D]/20 bg-gradient-to-br from-purple-50 to-white p-5 shadow-md"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#80368D] text-white text-sm font-bold">
          &#x1f6d2;
        </span>
        <span className="text-sm font-semibold text-gray-700">
          Paiement sécurisé &amp; accès immédiat
        </span>
      </div>
      {iframeEl}
      <p className="mt-3 text-center text-xs text-gray-400">
        Propulsé par Chariow — Paiement 100% sécurisé
      </p>
    </div>
  );
}
