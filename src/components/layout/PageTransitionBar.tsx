"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Barre de progression en haut de page style NProgress.
 * Se déclenche automatiquement à chaque changement de route.
 */
export default function PageTransitionBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start progress animation
    setLoading(true);
    setProgress(30);

    const t1 = setTimeout(() => setProgress(60), 100);
    const t2 = setTimeout(() => setProgress(80), 200);
    const t3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-[#80368D] via-[#FF9F0A] to-[#29358B] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
          transition: progress >= 100
            ? "width 200ms ease-out, opacity 300ms ease-out 100ms"
            : "width 300ms ease-out",
        }}
      />
      {/* Glow effect */}
      <div
        className="absolute top-0 right-0 h-full w-24 opacity-50"
        style={{
          background: "linear-gradient(to right, transparent, #FF9F0A)",
          transform: `translateX(${progress >= 100 ? "100%" : "0"})`,
          display: progress === 0 ? "none" : "block",
        }}
      />
    </div>
  );
}
