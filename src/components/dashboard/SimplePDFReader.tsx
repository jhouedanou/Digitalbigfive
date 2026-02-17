"use client";

import { useState, useEffect, useRef } from "react";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  X,
  Shield,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import type { PDFDocumentProxy, PDFPageProxy } from "@/types/pdfjs.d";

interface SimplePDFReaderProps {
  resourceId: string;
  title: string;
  userEmail: string;
  userName: string;
}

export default function SimplePDFReader({
  resourceId,
  title,
  userEmail,
  userName,
}: SimplePDFReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load PDF.js
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      loadPDF();
    };
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load PDF using prepare-offline API (returns base64 PDF)
  async function loadPDF() {
    try {
      setLoading(true);
      
      const res = await fetch("/api/pdf/prepare-offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur de chargement");
      }

      const { pdf: pdfBase64 } = await res.json();
      
      // Convert base64 to ArrayBuffer
      const binaryString = atob(pdfBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Load PDF
      const pdfDoc = await window.pdfjsLib.getDocument({ data: bytes.buffer }).promise;
      pdfDocRef.current = pdfDoc;
      setTotalPages(pdfDoc.numPages);
      setLoading(false);
      
    } catch (err) {
      console.error("PDF load error:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement du PDF");
      setLoading(false);
    }
  }

  // Render current page
  async function renderPage(num: number) {
    if (!pdfDocRef.current || !canvasRef.current) return;
    
    try {
      const page = await pdfDocRef.current.getPage(num);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return;
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;
      
      // Add watermark
      drawWatermark(ctx, viewport.width, viewport.height);
      
    } catch (err) {
      console.error("Render error:", err);
    }
  }

  // Draw watermark
  function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.font = "14px Arial";
    ctx.fillStyle = "#80368D";
    
    const text = `${userEmail} • ${new Date().toLocaleDateString("fr-FR")}`;
    const angle = -Math.PI / 6; // -30 degrees
    
    ctx.translate(width / 2, height / 2);
    ctx.rotate(angle);
    
    // Repeat watermark
    for (let y = -height; y < height; y += 80) {
      for (let x = -width; x < width; x += 300) {
        ctx.fillText(text, x, y);
      }
    }
    
    ctx.restore();
  }

  // Render on page change or scale change
  useEffect(() => {
    if (!loading && pdfDocRef.current) {
      renderPage(pageNum);
    }
  }, [pageNum, scale, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Security: Disable right-click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // Security: Block print shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P")) ||
        e.key === "PrintScreen"
      ) {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, []);

  // Navigation
  const prevPage = () => setPageNum((p) => Math.max(1, p - 1));
  const nextPage = () => setPageNum((p) => Math.min(totalPages, p + 1));
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.2));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.2));

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard/produits"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#80368D] text-white rounded-lg hover:bg-[#6a2d75] transition"
          >
            Retour à mes produits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/produits"
              className="p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-white font-medium text-sm line-clamp-1">{title}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Shield className="w-3 h-3 text-green-500" />
                <span>Document protégé</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Page nav */}
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg px-2 py-1">
              <button onClick={prevPage} disabled={pageNum <= 1} className="p-1 hover:bg-gray-600 rounded disabled:opacity-50">
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <span className="text-white text-sm px-2">
                {pageNum} / {totalPages}
              </span>
              <button onClick={nextPage} disabled={pageNum >= totalPages} className="p-1 hover:bg-gray-600 rounded disabled:opacity-50">
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg px-2 py-1">
              <button onClick={zoomOut} className="p-1 hover:bg-gray-600 rounded">
                <ZoomOut className="w-4 h-4 text-white" />
              </button>
              <span className="text-white text-sm px-2">{Math.round(scale * 100)}%</span>
              <button onClick={zoomIn} className="p-1 hover:bg-gray-600 rounded">
                <ZoomIn className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-700 rounded-lg">
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-white" />
              ) : (
                <Maximize className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-gray-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="w-12 h-12 text-[#80368D] animate-spin" />
            <p className="text-gray-400">Chargement du document...</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="shadow-2xl rounded-lg"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <span>🔒 {userEmail}</span>
          <span>•</span>
          <span>© Big Five Digital</span>
        </div>
      </footer>
    </div>
  );
}
