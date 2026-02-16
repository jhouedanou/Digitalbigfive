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
} from "lucide-react";
import Link from "next/link";

interface PDFReaderProps {
  resourceId: string;
  title: string;
  userEmail: string;
  userName: string;
  enableWatermark: boolean;
}

export default function PDFReader({
  resourceId,
  title,
  userEmail,
  userName,
  enableWatermark,
}: PDFReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<unknown>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // ──── Security: Disable right-click ────
  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // ──── Security: Block keyboard shortcuts for save/print/copy ────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.key === "s") ||
        (e.ctrlKey && e.key === "p") ||
        (e.ctrlKey && e.shiftKey && e.key === "S") ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.key === "u") ||
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

  // ──── Security: Block print via CSS ────
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        body * { display: none !important; }
        body::after {
          content: "L'impression de ce document est interdite.";
          display: block;
          font-size: 24px;
          text-align: center;
          padding: 50px;
        }
      }
      .pdf-viewer-container canvas {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // ──── Security: Blank canvas on tab switch (anti-screenshot) ────
  useEffect(() => {
    const handler = () => {
      if (document.hidden && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.fillStyle = "#333";
          ctx.font = "20px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            "Document protégé — revenez sur la page pour continuer",
            canvasRef.current.width / 2,
            canvasRef.current.height / 2
          );
        }
      } else {
        renderPage(pageNum);
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [pageNum]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──── Load PDF with secure token ────
  useEffect(() => {
    let cancelled = false;

    async function loadPDF() {
      try {
        // Step 1: Get a signed viewer token
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

        const { token } = await tokenRes.json();

        // Step 2: Load PDF.js
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.onload = () => {
          if (cancelled) return;
          const pdfjsLib = (
            window as unknown as Record<string, unknown>
          ).pdfjsLib as {
            GlobalWorkerOptions: { workerSrc: string };
            getDocument: (config: {
              url: string;
              disableAutoFetch: boolean;
              disableStream: boolean;
            }) => { promise: Promise<unknown> };
          };
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

          pdfjsLib
            .getDocument({
              url: `/api/pdf/${resourceId}?token=${encodeURIComponent(token)}`,
              disableAutoFetch: true,
              disableStream: true,
            })
            .promise.then((pdf: unknown) => {
              if (cancelled) return;
              setPdfDoc(pdf);
              setTotalPages((pdf as { numPages: number }).numPages);
              setLoading(false);
            })
            .catch((err: unknown) => {
              if (cancelled) return;
              console.error("PDF load error:", err);
              setError("Impossible de charger le document.");
              setLoading(false);
            });
        };
        document.body.appendChild(script);
      } catch {
        if (!cancelled) {
          setError("Erreur de connexion au serveur.");
          setLoading(false);
        }
      }
    }

    loadPDF();
    return () => {
      cancelled = true;
    };
  }, [resourceId]);

  const renderPage = useCallback(
    async (num: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      const page = await (
        pdfDoc as { getPage: (n: number) => Promise<unknown> }
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

      // ──── Watermark: user identity stamped across every page ────
      if (enableWatermark && userEmail) {
        context.save();
        context.font = "14px Arial";
        context.fillStyle = "rgba(0, 0, 0, 0.04)";
        context.rotate(-Math.PI / 6);

        for (let y = -canvas.height; y < canvas.height * 2; y += 80) {
          for (let x = -canvas.width; x < canvas.width * 2; x += 280) {
            context.fillText(`${userEmail} — ${userName}`, x, y);
          }
        }
        context.restore();

        // Bottom-right licence stamp
        context.save();
        context.font = "10px monospace";
        context.fillStyle = "rgba(0, 0, 0, 0.15)";
        context.textAlign = "right";
        const stamp = `Licence: ${userEmail} | ${new Date().toLocaleDateString("fr-FR")}`;
        context.fillText(stamp, canvas.width - 10, canvas.height - 10);
        context.restore();
      }
    },
    [pdfDoc, scale, enableWatermark, userEmail, userName]
  );

  useEffect(() => {
    renderPage(pageNum);
  }, [pageNum, renderPage]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && pageNum > 1) setPageNum(pageNum - 1);
      if (e.key === "ArrowRight" && pageNum < totalPages)
        setPageNum(pageNum + 1);
      if (e.key === "Escape" && isFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pageNum, totalPages, isFullscreen]);

  // ──── Error state ────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <Lock size={48} className="text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link
          href="/dashboard/produits"
          className="bg-[#80368D] text-white px-6 py-2 rounded-lg hover:bg-[#6a2d76]"
        >
          Retour à mes produits
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="pdf-viewer-container flex flex-col h-screen"
      style={{ userSelect: "none" }}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/produits"
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-green-400" />
            <span className="text-sm font-medium truncate max-w-xs">
              {title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.25))}
            className="p-1.5 hover:bg-gray-700 rounded"
            title="Zoom arrière"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-xs w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(Math.min(3, scale + 0.25))}
            className="p-1.5 hover:bg-gray-700 rounded"
            title="Zoom avant"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageNum(Math.max(1, pageNum - 1))}
            disabled={pageNum <= 1}
            className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs">
            {pageNum} / {totalPages}
          </span>
          <button
            onClick={() => setPageNum(Math.min(totalPages, pageNum + 1))}
            disabled={pageNum >= totalPages}
            className="p-1.5 hover:bg-gray-700 rounded disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-gray-700 rounded ml-2"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      {/* Security banner */}
      <div className="bg-gray-800 text-gray-400 text-xs text-center py-1 shrink-0">
        <Lock size={10} className="inline mr-1" />
        Document sécurisé — Licence personnelle de {userName} ({userEmail})
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto flex justify-center bg-gray-800 p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent" />
            <span>Chargement sécurisé du document...</span>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="shadow-2xl"
            onDragStart={(e) => e.preventDefault()}
          />
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-900 shrink-0">
        <div
          className="h-full bg-[#80368D] transition-all"
          style={{ width: `${(pageNum / totalPages) * 100}%` }}
        />
      </div>
    </div>
  );
}
