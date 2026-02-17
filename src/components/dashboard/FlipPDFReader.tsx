"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
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
  FileText,
} from "lucide-react";
import Link from "next/link";
import type { PDFDocumentProxy, PDFPageProxy } from "@/types/pdfjs.d";
import InstallPWAButton from "@/components/pwa/InstallPWAButton";

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
  
  const [currentSpread, setCurrentSpread] = useState(0);
  const [currentPage, setCurrentPage] = useState(1); // For mobile single-page mode
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"left" | "right" | null>(null);
  const [pageImages, setPageImages] = useState<Map<number, string>>(new Map());
  const [isMobile, setIsMobile] = useState(false);
  const [readingMode, setReadingMode] = useState<"book" | "classic">("book");

  // Derived: use classic single-page mode?
  const useClassicMode = isMobile || readingMode === "classic";

  // Load reading mode preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("pdf-reading-mode");
    if (saved === "book" || saved === "classic") {
      setReadingMode(saved);
    }
  }, []);

  // Toggle between book and classic mode (desktop only)
  const toggleReadingMode = useCallback(() => {
    const newMode = readingMode === "book" ? "classic" : "book";
    setReadingMode(newMode);
    localStorage.setItem("pdf-reading-mode", newMode);

    if (newMode === "classic") {
      // Switching to classic: sync currentPage from spread position
      setCurrentPage(currentSpread * 2 + 1);
    } else {
      // Switching to book: sync spread from currentPage
      setCurrentSpread(Math.floor((currentPage - 1) / 2));
    }
  }, [readingMode, currentSpread, currentPage]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate which pages to show (desktop flip mode)
  const leftPage = currentSpread * 2 + 1;
  const rightPage = currentSpread * 2 + 2;
  const totalSpreads = Math.ceil(totalPages / 2);

  // Load PDF
  useEffect(() => {
    loadPDF();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPDF() {
    try {
      setLoading(true);

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      // Fetch PDF directement — l'auth se fait via cookies Supabase
      const pdfRes = await fetch(`/api/pdf/${resourceId}`, {
        credentials: "include",
      });

      if (!pdfRes.ok) {
        const data = await pdfRes.json().catch(() => ({}));
        throw new Error(data.error || "Impossible de charger le PDF");
      }

      const pdfArrayBuffer = await pdfRes.arrayBuffer();
      
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
      pdfDocRef.current = pdfDoc as unknown as PDFDocumentProxy;
      setTotalPages(pdfDoc.numPages);
      
      await prerenderPages(pdfDoc as any);
      
      setLoading(false);
      
    } catch (err) {
      console.error("PDF load error:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement du PDF");
      setLoading(false);
    }
  }

  async function prerenderPages(pdfDoc: PDFDocumentProxy) {
    const images = new Map<number, string>();
    const renderScale = 2;
    
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
          drawWatermark(ctx, viewport.width, viewport.height);
          images.set(i, canvas.toDataURL("image/jpeg", 0.92));
        }
      } catch (err) {
        console.error(`Error rendering page ${i}:`, err);
      }
    }
    
    setPageImages(images);
  }

  function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.globalAlpha = 0.05;
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

  // ─── Desktop Flip Navigation ──────────────────────────────
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

  // ─── Mobile Single-Page Navigation ────────────────────────
  const nextPage = useCallback(() => {
    if (currentPage >= totalPages) return;
    setCurrentPage((p) => p + 1);
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage <= 1) return;
    setCurrentPage((p) => p - 1);
  }, [currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        useClassicMode ? nextPage() : nextSpread();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        useClassicMode ? prevPage() : prevSpread();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSpread, prevSpread, nextPage, prevPage, useClassicMode]);

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
    const handler = (e: MouseEvent) => { e.preventDefault(); return false; };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // Security: Block print/save shortcuts
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

  // Current page info for display
  const displayPageInfo = useClassicMode
    ? `Page ${currentPage} sur ${totalPages}`
    : `Page ${leftPage}${rightPage <= totalPages ? `-${rightPage}` : ""} sur ${totalPages}`;

  const progressPercent = useClassicMode
    ? (currentPage / totalPages) * 100
    : (leftPage / totalPages) * 100;

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
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-3 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link
              href="/dashboard/produits"
              className="p-1.5 hover:bg-white/10 rounded-lg transition flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-white font-medium text-sm line-clamp-1">{title}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <BookOpen className="w-3 h-3 text-[#80368D] flex-shrink-0" />
                <span className="truncate">{useClassicMode ? "Mode classique" : "Mode livre"} • {displayPageInfo}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Toggle reading mode + Install app - grouped */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleReadingMode}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#80368D]/80 hover:bg-[#80368D] rounded-lg transition text-white text-xs font-medium border border-white/20"
                title={readingMode === "book" ? "Passer en mode classique" : "Passer en mode livre"}
              >
                {readingMode === "book" ? (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Classique</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    <span>Livre</span>
                  </>
                )}
              </button>

              {/* Install App button - real PWA prompt */}
              <InstallPWAButton variant="mini" />
            </div>

            {/* Zoom - desktop only */}
            {!isMobile && (
              <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                <button 
                  onClick={() => setScale((s) => Math.max(0.5, s - 0.1))} 
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <ZoomOut className="w-4 h-4 text-white" />
                </button>
                <span className="text-white text-xs px-1 min-w-[40px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button 
                  onClick={() => setScale((s) => Math.min(2, s + 0.1))} 
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <ZoomIn className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="p-1.5 hover:bg-white/10 rounded-lg">
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-white" />
              ) : (
                <Maximize className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-1 md:p-4 overflow-hidden"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-[#80368D] animate-spin" />
              <BookOpen className="w-8 h-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-400">Préparation du livre...</p>
          </div>
        ) : useClassicMode ? (
          /* ═══ Classic single-page mode (mobile + desktop classic) ═══ */
          <div 
            className="relative w-full h-full flex items-center justify-center"
            style={!isMobile ? { transform: `scale(${scale})`, transformOrigin: "center center" } : undefined}
          >
            {/* Page image */}
            <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden" style={{ maxWidth: "100%", maxHeight: "calc(100vh - 140px)" }}>
              {pageImages.get(currentPage) ? (
                <img
                  src={pageImages.get(currentPage)}
                  alt={`Page ${currentPage}`}
                  className="w-full h-full object-contain select-none pointer-events-none"
                  draggable={false}
                  style={{ maxHeight: "calc(100vh - 140px)" }}
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-gray-50">
                  <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                </div>
              )}
            </div>

            {/* Mobile navigation arrows */}
            {currentPage > 1 && (
              <button
                onClick={prevPage}
                className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:bg-black/60 transition z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {currentPage < totalPages && (
              <button
                onClick={nextPage}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:bg-black/60 transition z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Tap zones for mobile */}
            <div 
              className="absolute inset-y-0 left-0 w-1/3 z-[5]"
              onClick={prevPage}
            />
            <div 
              className="absolute inset-y-0 right-0 w-1/3 z-[5]"
              onClick={nextPage}
            />
          </div>
        ) : (
          /* ═══ DESKTOP: Flip book mode ═══ */
          <div 
            className="relative perspective-[2000px]"
            style={{ transform: `scale(${scale})` }}
          >
            <div className="relative flex shadow-2xl rounded-lg overflow-hidden">
              {/* Left Page */}
              <div 
                className={`relative bg-white transition-transform duration-600 origin-right ${
                  isFlipping && flipDirection === "right" ? "animate-flip-right" : ""
                }`}
                style={{ 
                  width: "min(47vw, 480px)", 
                  height: "min(70vh, 620px)",
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
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 bg-white/80 px-2 py-0.5 rounded">
                  {leftPage}
                </div>
                <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/8 to-transparent pointer-events-none" />
              </div>

              {/* Book spine */}
              <div className="w-1.5 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 shadow-inner" />

              {/* Right Page */}
              <div 
                className={`relative bg-white transition-transform duration-600 origin-left ${
                  isFlipping && flipDirection === "left" ? "animate-flip-left" : ""
                }`}
                style={{ 
                  width: "min(47vw, 480px)", 
                  height: "min(70vh, 620px)",
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
                {rightPage <= totalPages && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 bg-white/80 px-2 py-0.5 rounded">
                    {rightPage}
                  </div>
                )}
                <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/8 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Desktop navigation arrows */}
            <button
              onClick={prevSpread}
              disabled={currentSpread <= 0 || isFlipping}
              className="absolute left-[-50px] top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            
            <button
              onClick={nextSpread}
              disabled={currentSpread >= totalSpreads - 1 || isFlipping}
              className="absolute right-[-50px] top-1/2 -translate-y-1/2 p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            {/* Click areas */}
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

      {/* Progress bar */}
      <div className="bg-black/30 backdrop-blur-sm border-t border-white/10 px-3 py-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs text-gray-400 min-w-[35px]">
              {Math.round(progressPercent)}%
            </span>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#80368D] to-[#29358B] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 min-w-[50px] text-right">
              {useClassicMode 
                ? `${currentPage} / ${totalPages}`
                : `${leftPage}-${Math.min(rightPage, totalPages)} / ${totalPages}`
              }
            </span>
          </div>

          {/* Quick navigation dots */}
          {!useClassicMode && (
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
          )}
        </div>
      </div>

      {/* Security footer */}
      <div className="bg-black/50 px-3 py-1.5">
        <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
          <Shield className="w-3 h-3 text-green-500" />
          <span>Document protégé • {userEmail}</span>
          <span>•</span>
          <span>© Big Five Digital</span>
        </div>
      </div>

      {/* CSS for flip animations */}
      <style jsx global>{`
        @keyframes flipLeft {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(-180deg); }
        }
        @keyframes flipRight {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(180deg); }
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
