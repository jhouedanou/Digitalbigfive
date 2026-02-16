"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  X,
  Lock,
  Shield,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────

interface PDFReaderSecureProps {
  resourceId: string;
  title: string;
  userEmail: string;
  userName: string;
  enableWatermark: boolean;
}

interface SessionState {
  token: string;
  sessionId: string;
  expiresAt: number;
  isActive: boolean;
}

// ─── Configuration ──────────────────────────────────────────

const CONFIG = {
  TOKEN_REFRESH_INTERVAL: 14 * 60 * 1000, // 14 minutes (avant les 15 min de rotation)
  HEARTBEAT_INTERVAL: 60 * 1000, // 1 minute
  IDLE_TIMEOUT: 9 * 60 * 1000, // 9 minutes (avant les 10 min max)
  WARNING_BEFORE_EXPIRY: 2 * 60 * 1000, // Avertir 2 min avant expiration
};

// ─── Composant Principal ────────────────────────────────────

export default function SecurePDFReader({
  resourceId,
  title,
  userEmail,
  userName,
  enableWatermark,
}: PDFReaderSecureProps) {
  // ─── Refs ─────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<unknown>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── State ────────────────────────────────────────────────
  const [session, setSession] = useState<SessionState | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  // ─── Sécurité: Désactiver le clic droit ───────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // ─── Sécurité: Bloquer les raccourcis clavier ─────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Bloquer: Ctrl+S, Ctrl+P, Ctrl+Shift+S, Ctrl+Shift+I, Ctrl+U, F12, PrintScreen
      if (
        (e.ctrlKey && (e.key === "s" || e.key === "S")) ||
        (e.ctrlKey && (e.key === "p" || e.key === "P")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "S" || e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.ctrlKey && (e.key === "u" || e.key === "U")) ||
        e.key === "F12" ||
        e.key === "PrintScreen"
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, []);

  // ─── Sécurité: Bloquer l'impression via CSS ───────────────
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "pdf-security-styles";
    style.textContent = `
      @media print {
        body * { display: none !important; visibility: hidden !important; }
        body::before {
          content: "⚠️ L'impression de ce document est strictement interdite.";
          display: block !important;
          visibility: visible !important;
          font-size: 24px;
          text-align: center;
          padding: 100px 50px;
          color: #dc2626;
        }
      }
      
      .secure-pdf-container {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      
      .secure-pdf-container canvas {
        pointer-events: none !important;
      }
      
      .secure-pdf-container img {
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      const existingStyle = document.getElementById("pdf-security-styles");
      if (existingStyle) document.head.removeChild(existingStyle);
    };
  }, []);

  // ─── Sécurité: Blanquer le canvas si l'onglet n'est pas actif
  useEffect(() => {
    const handler = () => {
      if (document.hidden && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#1f2937";
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.fillStyle = "#9ca3af";
          ctx.font = "bold 18px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(
            "🔒 Document protégé",
            canvasRef.current.width / 2,
            canvasRef.current.height / 2 - 20
          );
          ctx.font = "14px Inter, sans-serif";
          ctx.fillText(
            "Revenez sur cette page pour continuer la lecture",
            canvasRef.current.width / 2,
            canvasRef.current.height / 2 + 20
          );
        }
      } else if (!document.hidden) {
        renderPage(pageNum);
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [pageNum]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Sécurité: Détection des DevTools ─────────────────────
  useEffect(() => {
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        // Log cette tentative
        fetch("/api/pdf/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: session?.token,
            action: "devtools_detected",
          }),
        }).catch(() => {});
      }
    };

    const interval = setInterval(detectDevTools, 1000);
    return () => clearInterval(interval);
  }, [session?.token]);

  // ─── Tracking de l'activité utilisateur ───────────────────
  useEffect(() => {
    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      setShowExpiryWarning(false);
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach(event => {
      document.addEventListener(event, resetActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetActivity);
      });
    };
  }, []);

  // ─── Vérification de l'inactivité ─────────────────────────
  useEffect(() => {
    const checkIdle = () => {
      const idle = Date.now() - lastActivityRef.current;
      
      if (idle > CONFIG.IDLE_TIMEOUT && session?.isActive) {
        setError("Session expirée pour cause d'inactivité. Veuillez rouvrir le document.");
        closeViewerSession();
      } else if (idle > CONFIG.IDLE_TIMEOUT - CONFIG.WARNING_BEFORE_EXPIRY) {
        setShowExpiryWarning(true);
        setRemainingTime(Math.ceil((CONFIG.IDLE_TIMEOUT - idle) / 1000));
      }
    };

    idleTimerRef.current = setInterval(checkIdle, 1000);
    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [session?.isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Initialisation: Charger le PDF ───────────────────────
  useEffect(() => {
    let cancelled = false;

    async function initSession() {
      try {
        // Obtenir un token de session
        const tokenRes = await fetch("/api/pdf/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId }),
        });

        if (!tokenRes.ok) {
          const data = await tokenRes.json();
          setError(data.error || "Impossible d'accéder à ce document.");
          setLoading(false);
          return;
        }

        const { token, sessionId, expiresIn } = await tokenRes.json();
        
        setSession({
          token,
          sessionId,
          expiresAt: Date.now() + expiresIn * 1000,
          isActive: true,
        });

        // Charger PDF.js
        await loadPDFJS();
        
        if (cancelled) return;

        // Charger le document
        const pdfjsLib = (window as unknown as { pdfjsLib: unknown }).pdfjsLib as {
          GlobalWorkerOptions: { workerSrc: string };
          getDocument: (config: { url: string; disableAutoFetch: boolean; disableStream: boolean }) => { promise: Promise<unknown> };
        };
        
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const pdf = await pdfjsLib.getDocument({
          url: `/api/pdf/${resourceId}?token=${encodeURIComponent(token)}`,
          disableAutoFetch: true,
          disableStream: true,
        }).promise;

        if (cancelled) return;

        pdfDocRef.current = pdf;
        setTotalPages((pdf as { numPages: number }).numPages);
        setLoading(false);

        // Démarrer le refresh automatique du token
        startTokenRefresh(token);
        startHeartbeat(token);

      } catch (err) {
        if (!cancelled) {
          console.error("PDF init error:", err);
          setError("Erreur de connexion au serveur.");
          setLoading(false);
        }
      }
    }

    initSession();

    return () => {
      cancelled = true;
      if (tokenRefreshTimerRef.current) clearInterval(tokenRefreshTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [resourceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Charger PDF.js ───────────────────────────────────────
  const loadPDFJS = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if ((window as unknown as { pdfjsLib: unknown }).pdfjsLib) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load PDF.js"));
      document.body.appendChild(script);
    });
  };

  // ─── Refresh automatique du token ─────────────────────────
  const startTokenRefresh = (initialToken: string) => {
    let currentToken = initialToken;

    tokenRefreshTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/pdf/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: currentToken }),
        });

        if (res.ok) {
          const { token: newToken, expiresIn } = await res.json();
          currentToken = newToken;
          setSession(prev => prev ? {
            ...prev,
            token: newToken,
            expiresAt: Date.now() + expiresIn * 1000,
          } : null);
        } else {
          setError("Session expirée. Veuillez rouvrir le document.");
          setSession(prev => prev ? { ...prev, isActive: false } : null);
        }
      } catch {
        console.error("Token refresh failed");
      }
    }, CONFIG.TOKEN_REFRESH_INTERVAL);
  };

  // ─── Heartbeat pour tracker l'activité ────────────────────
  const startHeartbeat = (initialToken: string) => {
    heartbeatTimerRef.current = setInterval(async () => {
      if (!session?.isActive) return;

      try {
        await fetch("/api/pdf/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: session?.token || initialToken,
            action: "heartbeat",
          }),
        });
      } catch {
        // Ignorer les erreurs de heartbeat
      }
    }, CONFIG.HEARTBEAT_INTERVAL);
  };

  // ─── Fermer la session ────────────────────────────────────
  const closeViewerSession = useCallback(async () => {
    if (session?.token) {
      try {
        await fetch("/api/pdf/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: session.token,
            action: "close",
          }),
        });
      } catch {
        // Ignorer
      }
    }
    setSession(prev => prev ? { ...prev, isActive: false } : null);
  }, [session?.token]);

  // ─── Cleanup à la fermeture ───────────────────────────────
  useEffect(() => {
    const handleUnload = () => {
      if (session?.token) {
        // Utiliser sendBeacon pour garantir l'envoi
        navigator.sendBeacon(
          "/api/pdf/activity",
          JSON.stringify({
            token: session.token,
            action: "close",
          })
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      closeViewerSession();
    };
  }, [session?.token, closeViewerSession]);

  // ─── Rendu d'une page ─────────────────────────────────────
  const renderPage = useCallback(
    async (num: number) => {
      if (!pdfDocRef.current || !canvasRef.current) return;

      const page = await (
        pdfDocRef.current as { getPage: (n: number) => Promise<unknown> }
      ).getPage(num);
      
      const viewport = (
        page as { getViewport: (opts: { scale: number }) => unknown }
      ).getViewport({ scale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d")!;
      
      canvas.height = (viewport as { height: number }).height;
      canvas.width = (viewport as { width: number }).width;

      await (
        page as { render: (opts: unknown) => { promise: Promise<void> } }
      ).render({
        canvasContext: context,
        viewport,
      }).promise;

      // ─── Watermark: Identité utilisateur sur chaque page ────
      if (enableWatermark && userEmail) {
        // Watermark diagonal répété
        context.save();
        context.font = "14px Arial";
        context.fillStyle = "rgba(0, 0, 0, 0.03)";
        context.rotate(-Math.PI / 6);

        for (let y = -canvas.height; y < canvas.height * 2; y += 100) {
          for (let x = -canvas.width; x < canvas.width * 2; x += 350) {
            context.fillText(`${userEmail} • ${userName}`, x, y);
          }
        }
        context.restore();

        // Licence en bas à droite
        context.save();
        context.font = "10px monospace";
        context.fillStyle = "rgba(0, 0, 0, 0.12)";
        context.textAlign = "right";
        const date = new Date().toLocaleDateString("fr-FR");
        const stamp = `Licence: ${userEmail} | ${date} | Page ${num}/${totalPages}`;
        context.fillText(stamp, canvas.width - 15, canvas.height - 15);
        context.restore();

        // Identifiant unique invisible (pour traçabilité)
        context.save();
        context.font = "1px Arial";
        context.fillStyle = "rgba(0, 0, 0, 0.001)";
        const hash = btoa(`${userEmail}:${resourceId}:${Date.now()}`).slice(0, 16);
        context.fillText(hash, 1, 1);
        context.restore();
      }

      // Logger la vue de page
      if (session?.token) {
        fetch("/api/pdf/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: session.token,
            action: "page_view",
            pageNumber: num,
          }),
        }).catch(() => {});
      }
    },
    [scale, enableWatermark, userEmail, userName, resourceId, totalPages, session?.token]
  );

  // ─── Rendu automatique lors du changement de page ─────────
  useEffect(() => {
    if (!loading && pdfDocRef.current) {
      renderPage(pageNum);
    }
  }, [pageNum, renderPage, loading]);

  // ─── Gestion du plein écran ───────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // ─── Navigation clavier ───────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && pageNum > 1) setPageNum(pageNum - 1);
      if (e.key === "ArrowRight" && pageNum < totalPages) setPageNum(pageNum + 1);
      if (e.key === "Escape" && isFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pageNum, totalPages, isFullscreen]);

  // ─── Affichage d'erreur ───────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <Lock size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard/produits"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ChevronLeft size={18} />
            Retour à mes produits
          </Link>
        </div>
      </div>
    );
  }

  // ─── Rendu principal ──────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="secure-pdf-container flex flex-col h-screen bg-gray-900"
      style={{ userSelect: "none" }}
      onDragStart={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    >
      {/* ─── Toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white shrink-0 border-b border-gray-700">
        {/* Gauche: Retour + Titre */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/produits"
            onClick={() => closeViewerSession()}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Fermer le lecteur"
          >
            <X size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-green-400" />
            <span className="text-sm font-medium truncate max-w-xs">{title}</span>
          </div>
        </div>

        {/* Centre: Zoom */}
        <div className="flex items-center gap-1 bg-gray-700/50 rounded-lg px-2 py-1">
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.25))}
            className="p-1.5 hover:bg-gray-600 rounded transition-colors"
            title="Zoom arrière"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs w-14 text-center font-mono">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(Math.min(3, scale + 0.25))}
            className="p-1.5 hover:bg-gray-600 rounded transition-colors"
            title="Zoom avant"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        {/* Droite: Navigation + Plein écran */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-700/50 rounded-lg px-2 py-1">
            <button
              onClick={() => setPageNum(Math.max(1, pageNum - 1))}
              disabled={pageNum <= 1}
              className="p-1.5 hover:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs w-16 text-center font-mono">
              {pageNum} / {totalPages}
            </span>
            <button
              onClick={() => setPageNum(Math.min(totalPages, pageNum + 1))}
              disabled={pageNum >= totalPages}
              className="p-1.5 hover:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      {/* ─── Bannière de sécurité ────────────────────────────── */}
      <div className="bg-gray-800 text-gray-400 text-xs text-center py-1.5 shrink-0 flex items-center justify-center gap-4 border-b border-gray-700">
        <div className="flex items-center gap-1.5">
          <Lock size={12} className="text-green-400" />
          <span>Document sécurisé</span>
        </div>
        <span className="text-gray-600">|</span>
        <span>Licence: {userName} ({userEmail})</span>
        {session?.isActive && (
          <>
            <span className="text-gray-600">|</span>
            <div className="flex items-center gap-1.5 text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Session active</span>
            </div>
          </>
        )}
      </div>

      {/* ─── Avertissement d'expiration ──────────────────────── */}
      {showExpiryWarning && remainingTime !== null && (
        <div className="bg-yellow-500/20 text-yellow-300 text-sm text-center py-2 shrink-0 flex items-center justify-center gap-2 animate-pulse">
          <AlertTriangle size={16} />
          <span>Session inactive — Expiration dans {remainingTime}s</span>
          <Clock size={16} />
        </div>
      )}

      {/* ─── Zone du Canvas ──────────────────────────────────── */}
      <div className="flex-1 overflow-auto flex justify-center items-start bg-gray-800 p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-gray-400 gap-4 h-full">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-blue-500" />
              <Shield size={20} className="absolute inset-0 m-auto text-blue-400" />
            </div>
            <div className="text-center">
              <p className="font-medium">Chargement sécurisé...</p>
              <p className="text-xs text-gray-500 mt-1">Vérification des droits d'accès</p>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="shadow-2xl rounded-lg"
            onDragStart={(e) => e.preventDefault()}
          />
        )}
      </div>

      {/* ─── Barre de progression ────────────────────────────── */}
      <div className="h-1 bg-gray-800 shrink-0">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
          style={{ width: `${(pageNum / totalPages) * 100}%` }}
        />
      </div>
    </div>
  );
}
