"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { WifiOff, Wifi, Clock, AlertTriangle, Download } from "lucide-react";
import type { WatermarkData } from "@/lib/crypto";

interface SecurePDFReaderProps {
  pdfData: ArrayBuffer;
  watermarkData: WatermarkData;
  expiresAt: number;
  title: string;
  isOffline?: boolean;
}

export default function SecurePDFReader({
  pdfData,
  watermarkData,
  expiresAt,
  title,
  isOffline = false,
}: SecurePDFReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline">(
    typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline"
  );

  // Calculate time remaining
  const timeRemaining = expiresAt - Date.now();
  const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));
  const isExpired = timeRemaining <= 0;

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setConnectionStatus("online");
    const handleOffline = () => setConnectionStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load PDF.js dynamically
  useEffect(() => {
    const loadPDFJS = async () => {
      if (isExpired) {
        setError("Ce document a expiré et ne peut plus être lu.");
        setLoading(false);
        return;
      }

      try {
        // Dynamic import of PDF.js
        const pdfjsLib = await import("pdfjs-dist");
        
        // Set worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        // Load document
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;

        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setLoading(false);
      } catch (err) {
        console.error("PDF loading error:", err);
        setError("Impossible de charger le PDF");
        setLoading(false);
      }
    };

    loadPDFJS();
  }, [pdfData, isExpired]);

  // Render current page with watermark
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page
      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      // Apply watermark
      applyWatermark(context, canvas.width, canvas.height);
    } catch (err) {
      console.error("Page render error:", err);
    }
  }, [pdfDoc, currentPage, scale]);

  // Apply watermark to canvas
  const applyWatermark = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.save();

    // Semi-transparent watermark
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#80368D";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";

    // Diagonal watermark pattern
    const watermarkText = `${watermarkData.userEmail} - ${new Date(watermarkData.purchaseDate).toLocaleDateString("fr-FR")}`;

    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 6); // -30 degrees

    // Repeat watermark across page
    for (let y = -height; y < height * 2; y += 100) {
      for (let x = -width; x < width * 2; x += 300) {
        ctx.fillText(watermarkText, x, y);
      }
    }

    ctx.restore();

    // Bottom watermark bar
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "#f3e8f5";
    ctx.fillRect(0, height - 30, width, 30);

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#80368D";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `Document acheté par ${watermarkData.userEmail} | Big Five Agency`,
      width / 2,
      height - 10
    );
    ctx.restore();
  };

  // Re-render on page or scale change
  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Prevent right-click and screenshot attempts
  useEffect(() => {
    const preventContext = (e: MouseEvent) => e.preventDefault();
    const preventKeyboard = (e: KeyboardEvent) => {
      // Prevent Print Screen, Ctrl+P, Ctrl+S
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && (e.key === "p" || e.key === "s" || e.key === "c"))
      ) {
        e.preventDefault();
        alert("L'impression et la copie sont désactivées pour ce document.");
      }
    };

    document.addEventListener("contextmenu", preventContext);
    document.addEventListener("keydown", preventKeyboard);

    return () => {
      document.removeEventListener("contextmenu", preventContext);
      document.removeEventListener("keydown", preventKeyboard);
    };
  }, []);

  if (isExpired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-red-50 rounded-xl p-8">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-700 mb-2">Document expiré</h2>
        <p className="text-red-600 text-center max-w-md">
          Ce document a expiré et ne peut plus être lu hors ligne.
          Reconnectez-vous à Internet pour le télécharger à nouveau.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#80368D]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-red-50 rounded-xl p-8">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-700 mb-2">Erreur</h2>
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-none">
            {title}
          </h1>

          {/* Connection status */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              connectionStatus === "online"
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {connectionStatus === "online" ? (
              <Wifi size={12} />
            ) : (
              <WifiOff size={12} />
            )}
            {connectionStatus === "online" ? "En ligne" : "Hors ligne"}
          </div>
        </div>

        {/* Expiration info */}
        <div className="flex items-center gap-2 text-sm">
          <Clock size={14} className="text-gray-400" />
          <span
            className={`${
              daysRemaining <= 3 ? "text-red-600" : "text-gray-600"
            }`}
          >
            {daysRemaining > 0 ? `${daysRemaining} jour${daysRemaining > 1 ? "s" : ""} restant${daysRemaining > 1 ? "s" : ""}` : "Expiré"}
          </span>
        </div>
      </div>

      {/* PDF Viewer */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center p-4"
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      >
        <canvas
          ref={canvasRef}
          className="shadow-lg max-w-full"
          style={{
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-white border-t px-4 py-3 flex items-center justify-between">
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Précédent
          </button>

          <span className="text-sm text-gray-600">
            Page {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant →
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            −
          </button>

          <span className="text-sm text-gray-600 w-16 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            +
          </button>
        </div>
      </div>

      {/* Watermark info bar */}
      <div className="bg-[#f3e8f5] px-4 py-2 text-xs text-[#80368D] text-center">
        Document sécurisé • Acheté par {watermarkData.userEmail} le{" "}
        {new Date(watermarkData.purchaseDate).toLocaleDateString("fr-FR")}
      </div>
    </div>
  );
}
