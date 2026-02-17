"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  X,
  Shield,
  Loader2,
  ZoomIn,
  ZoomOut,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import type { PDFDocumentProxy, PDFPageProxy } from "@/types/pdfjs.d";

interface FlipPDFReaderProps {
  resourceId: string;
  title: string;
  userEmail: string;
  userName: string;
}

export default function FlipPDFReader({
  resourceId,
  title,
  userEmail,
  userName,
}: FlipPDFReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const pdfDataRef = useRef<ArrayBuffer | null>(null);
  
  const [currentSpread, setCurrentSpread] = useState(0); // 0 = pages 1-2, 1 = pages 3-4, etc.
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"left" | "right" | null>(null);
  const [pageImages, setPageImages] = useState<Map<number, string>>(new Map());
  const [downloading, setDownloading] = useState(false);

  // Calculate which pages to show
  const leftPage = currentSpread * 2 + 1;
  const rightPage = currentSpread * 2 + 2;
  const totalSpreads = Math.ceil(totalPages / 2);

  // Load PDF.js
  useEffect(() => {
    loadPDF();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load PDF
  async function loadPDF() {
    try {
      setLoading(true);
      
      // Get PDF session token
      const tokenRes = await fetch("/api/pdf/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resourceId }),
      });

      if (!tokenRes.ok) {
        const data = await tokenRes.json().catch(() => ({}));
        throw new Error(data.error || "Impossible d'obtenir le token de session");
      }

      const tokenData = await tokenRes.json();

      // Load PDF.js
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      // Fetch PDF with token
      const pdfRes = await fetch(`/api/pdf/${resourceId}?token=${encodeURIComponent(tokenData.token)}`, {
        credentials: "include",
      });

      if (!pdfRes.ok) {
        const data = await pdfRes.json().catch(() => ({}));
        throw new Error(data.error || "Impossible de charger le PDF");
      }

      const pdfArrayBuffer = await pdfRes.arrayBuffer();
      pdfDataRef.current = pdfArrayBuffer;
      
      // Load PDF document
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
      pdfDocRef.current = pdfDoc as unknown as PDFDocumentProxy;
      setTotalPages(pdfDoc.numPages);
      
      // Pre-render all pages as images
      await prerenderPages(pdfDoc as any);
      
      setLoading(false);
      
    } catch (err) {
      console.error("PDF load error:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement du PDF");
      setLoading(false);
    }
  }

  // Pre-render pages to images for smooth flipping
  async function prerenderPages(pdfDoc: PDFDocumentProxy) {
    const images = new Map<number, string>();
    const renderScale = 1.5; // Higher quality for images
    
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      try {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: renderScale });
        
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          
          // Add watermark
          drawWatermark(ctx, viewport.width, viewport.height);
          
          images.set(i, canvas.toDataURL("image/jpeg", 0.9));
        }
      } catch (err) {
        console.error(`Error rendering page ${i}:`, err);
      }
    }
    
    setPageImages(images);
  }

  // Draw watermark
  function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.font = "12px Arial";
    ctx.fillStyle = "#80368D";
    
    const text = `${userEmail}`;
    const angle = -Math.PI / 6;
    
    ctx.translate(width / 2, height / 2);
    ctx.rotate(angle);
    
    for (let y = -height; y < height; y += 60) {
      for (let x = -width; x < width; x += 200) {
        ctx.fillText(text, x, y);
      }
    }
    
    ctx.restore();
  }

  // Download PDF
  const handleDownload = async () => {
    if (!pdfDataRef.current) return;
    
    setDownloading(true);
    try {
      const blob = new Blob([pdfDataRef.current], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
    setDownloading(false);
  };

  // Flip to next spread
  const nextSpread = useCallback(() => {
    if (currentSpread >= totalSpreads - 1 || isFlipping) return;
    
    setIsFlipping(true);
    setFlipDirection("left");
    
    setTimeout(() => {
      setCurrentSpread((s) => s + 1);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 600);
  }, [currentSpread, totalSpreads, isFlipping]);

  // Flip to previous spread
  const prevSpread = useCallback(() => {
    if (currentSpread <= 0 || isFlipping) return;
    
    setIsFlipping(true);
    setFlipDirection("right");
    
    setTimeout(() => {
      setCurrentSpread((s) => s - 1);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 600);
  }, [currentSpread, isFlipping]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextSpread();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSpread();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSpread, prevSpread]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/produits"
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-white font-medium text-sm line-clamp-1">{title}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <BookOpen className="w-3 h-3 text-[#80368D]" />
                <span>Mode livre • Page {leftPage}{rightPage <= totalPages ? `-${rightPage}` : ""} sur {totalPages}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={downloading || loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#80368D] hover:bg-[#6a2d75] text-white rounded-lg transition disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Télécharger</span>
            </button>

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
              <button 
                onClick={() => setScale((s) => Math.max(0.5, s - 0.1))} 
                className="p-1 hover:bg-white/10 rounded"
              >
                <ZoomOut className="w-4 h-4 text-white" />
              </button>
              <span className="text-white text-sm px-2 min-w-[50px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={() => setScale((s) => Math.min(2, s + 0.1))} 
                className="p-1 hover:bg-white/10 rounded"
              >
                <ZoomIn className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-lg">
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-white" />
              ) : (
                <Maximize className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Book Container */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-[#80368D] animate-spin" />
              <BookOpen className="w-8 h-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-400">Préparation du livre...</p>
          </div>
        ) : (
          <div 
            className="relative perspective-[2000px]"
            style={{ transform: `scale(${scale})` }}
          >
            {/* Book */}
            <div className="relative flex shadow-2xl rounded-lg overflow-hidden">
              {/* Left Page */}
              <div 
                className={`relative bg-white transition-transform duration-600 origin-right ${
                  isFlipping && flipDirection === "right" ? "animate-flip-right" : ""
                }`}
                style={{ 
                  width: "min(45vw, 400px)", 
                  height: "min(65vh, 566px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {leftPage <= totalPages && pageImages.get(leftPage) ? (
                  <img
                    src={pageImages.get(leftPage)}
                    alt={`Page ${leftPage}`}
                    className="w-full h-full object-contain select-none pointer-events-none"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400">Couverture</span>
                  </div>
                )}
                {/* Page number */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 bg-white/80 px-2 py-0.5 rounded">
                  {leftPage}
                </div>
                {/* Page shadow */}
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
              </div>

              {/* Book spine */}
              <div className="w-2 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 shadow-inner" />

              {/* Right Page */}
              <div 
                className={`relative bg-white transition-transform duration-600 origin-left ${
                  isFlipping && flipDirection === "left" ? "animate-flip-left" : ""
                }`}
                style={{ 
                  width: "min(45vw, 400px)", 
                  height: "min(65vh, 566px)",
                  transformStyle: "preserve-3d",
                }}
              >
                {rightPage <= totalPages && pageImages.get(rightPage) ? (
                  <img
                    src={pageImages.get(rightPage)}
                    alt={`Page ${rightPage}`}
                    className="w-full h-full object-contain select-none pointer-events-none"
                    draggable={false}
                  />
                ) : rightPage <= totalPages ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center text-gray-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Fin du document</p>
                    </div>
                  </div>
                )}
                {/* Page number */}
                {rightPage <= totalPages && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 bg-white/80 px-2 py-0.5 rounded">
                    {rightPage}
                  </div>
                )}
                {/* Page shadow */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={prevSpread}
              disabled={currentSpread <= 0 || isFlipping}
              className="absolute left-[-60px] top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            
            <button
              onClick={nextSpread}
              disabled={currentSpread >= totalSpreads - 1 || isFlipping}
              className="absolute right-[-60px] top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            {/* Click areas for page turning */}
            <div 
              className="absolute inset-y-0 left-0 w-1/3 cursor-pointer z-10"
              onClick={prevSpread}
            />
            <div 
              className="absolute inset-y-0 right-0 w-1/3 cursor-pointer z-10"
              onClick={nextSpread}
            />
          </div>
        )}
      </div>

      {/* Page thumbnails / Progress bar */}
      <div className="bg-black/30 backdrop-blur-sm border-t border-white/10 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          {/* Progress bar */}
          <div className="flex items-center gap-4 mb-2">
            <span className="text-xs text-gray-400 min-w-[40px]">
              {Math.round((leftPage / totalPages) * 100)}%
            </span>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#80368D] to-[#29358B] transition-all duration-300"
                style={{ width: `${(leftPage / totalPages) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 min-w-[60px] text-right">
              {leftPage}-{Math.min(rightPage, totalPages)} / {totalPages}
            </span>
          </div>

          {/* Quick navigation */}
          <div className="flex items-center justify-center gap-1 overflow-x-auto py-1">
            {Array.from({ length: totalSpreads }, (_, i) => (
              <button
                key={i}
                onClick={() => !isFlipping && setCurrentSpread(i)}
                className={`w-8 h-1 rounded-full transition-all ${
                  i === currentSpread 
                    ? "bg-[#80368D] w-12" 
                    : "bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Security footer */}
      <div className="bg-black/50 px-4 py-2">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <Shield className="w-3 h-3 text-green-500" />
          <span>Document protégé • {userEmail}</span>
          <span>•</span>
          <span>© Big Five Digital</span>
        </div>
      </div>

      {/* CSS for flip animations */}
      <style jsx global>{`
        @keyframes flipLeft {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(-180deg);
          }
        }
        
        @keyframes flipRight {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(180deg);
          }
        }
        
        .animate-flip-left {
          animation: flipLeft 0.6s ease-in-out forwards;
          backface-visibility: hidden;
        }
        
        .animate-flip-right {
          animation: flipRight 0.6s ease-in-out forwards;
          backface-visibility: hidden;
        }
        
        .perspective-\\[2000px\\] {
          perspective: 2000px;
        }
        
        .duration-600 {
          transition-duration: 600ms;
        }
      `}</style>
    </div>
  );
}
