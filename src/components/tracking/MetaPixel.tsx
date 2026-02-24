"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function MetaPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialized = useRef(false);
  const isInitialLoad = useRef(true);

  // Injecter le snippet officiel Meta Pixel au montage
  useEffect(() => {
    if (!pixelId || initialized.current) return;
    initialized.current = true;

    // Injecter le snippet standard Meta (identique au copier-coller Events Manager)
    const script = document.createElement("script");
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
    console.log("[MetaPixel] ✅ Pixel initialisé:", pixelId);
  }, [pixelId]);

  // Fire PageView sur chaque navigation client (pas au premier chargement)
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (
      typeof window !== "undefined" &&
      typeof (window as Record<string, unknown>).fbq === "function"
    ) {
      (window as Record<string, unknown> & { fbq: (...args: unknown[]) => void }).fbq(
        "track",
        "PageView"
      );
    }
  }, [pathname, searchParams]);

  if (!pixelId) return null;

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
