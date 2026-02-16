"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Bookmark,
  Sun,
  Moon,
  Menu,
  ChevronDown
} from "lucide-react";
import { getPDF, type PDFMetadata } from "@/lib/offline-storage";

declare global {
  interface Window {
    pdfjsLib: {
      getDocument: (src: { data: ArrayBuffer } | string) => {
        promise: Promise<PDFDocumentProxy>;
      };
      GlobalWorkerOptions: {
        workerSrc: string;
      };
    };
  }
}

interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> };
}

export default function LibraryReaderPage() {
  const params = useParams();
  const router = useRouter();
  const resourceId = params.id as string;

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watermark, setWatermark] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"left" | "right">("right");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Load PDF from IndexedDB
  useEffect(() => {
    loadPDF();
  }, [resourceId]);

  async function loadPDF() {
    try {
      setLoading(true);
      setError(null);

      // Load PDF.js
      if (!window.pdfjsLib) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          script.onload = () => resolve();
          document.head.appendChild(script);
        });

        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }

      // Get PDF from IndexedDB
      const storedPDF = await getPDF(resourceId);
      
      if (!storedPDF) {
        setError("Ce livre n'est pas disponible hors ligne. Synchronisez votre bibliothèque.");
        return;
      }

      if (storedPDF.isExpired) {
        setError("L'accès à ce livre a expiré. Reconnectez-vous pour le renouveler.");
        return;
      }

      // Set watermark
      setWatermark(storedPDF.watermarkData?.userEmail || "");

      // Load PDF document
      const loadingTask = window.pdfjsLib.getDocument({ data: storedPDF.data });
      const pdfDoc = await loadingTask.promise;

      setPdf(pdfDoc);
      setTotalPages(pdfDoc.numPages);

      // Restore reading progress
      const savedProgress = localStorage.getItem(`reading_progress_${resourceId}`);
      if (savedProgress) {
        const { page } = JSON.parse(savedProgress);
        setCurrentPage(page || 1);
      }

    } catch (err) {
      console.error("Error loading PDF:", err);
      setError("Impossible de charger le livre. Il est peut-être corrompu.");
    } finally {
      setLoading(false);
    }
  }

  // Render current page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    renderPage(currentPage);
    saveProgress();
  }, [pdf, currentPage, scale]);

  async function renderPage(pageNum: number) {
    if (!pdf || !canvasRef.current) return;

    const page = await pdf.getPage(pageNum);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;

    // Calculate scale to fit container
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth - 32;
    const containerHeight = container.clientHeight - 32;

    const viewport = page.getViewport({ scale: 1 });
    const scaleX = containerWidth / viewport.width;
    const scaleY = containerHeight / viewport.height;
    const optimalScale = Math.min(scaleX, scaleY, 2) * scale;

    const scaledViewport = page.getViewport({ scale: optimalScale });

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    await page.render({
      canvasContext: ctx,
      viewport: scaledViewport,
    }).promise;

    // Add watermark
    if (watermark) {
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.font = "20px Arial";
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      
      const diagonal = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
      const spacing = 200;
      
      for (let y = 0; y < canvas.height + 100; y += spacing) {
        for (let x = 0; x < canvas.width + 100; x += spacing) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(-Math.PI / 6);
          ctx.fillText(watermark, 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();
    }
  }

  // Save reading progress
  function saveProgress() {
    localStorage.setItem(`reading_progress_${resourceId}`, JSON.stringify({
      page: currentPage,
      totalPages,
      timestamp: Date.now(),
    }));
  }

  // Navigation
  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages || isFlipping) return;
    
    setIsFlipping(true);
    setFlipDirection(page > currentPage ? "right" : "left");
    
    setTimeout(() => {
      setCurrentPage(page);
      setIsFlipping(false);
    }, 300);
  }, [totalPages, currentPage, isFlipping]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowRight":
        case " ":
          nextPage();
          break;
        case "ArrowLeft":
          prevPage();
          break;
        case "Escape":
          router.push("/library");
          break;
        case "+":
        case "=":
          setScale(s => Math.min(s + 0.25, 3));
          break;
        case "-":
          setScale(s => Math.max(s - 0.25, 0.5));
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextPage, prevPage, router]);

  // Touch gestures
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startX = 0;
    let startY = 0;

    function handleTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function handleTouchEnd(e: TouchEvent) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      // Only register horizontal swipes
      if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          prevPage();
        } else {
          nextPage();
        }
      }
    }

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [nextPage, prevPage]);

  // Auto-hide controls
  useEffect(() => {
    const handleInteraction = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener("mousemove", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Prevent screenshot/copy
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "s" || e.key === "c")) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#80368D] border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-white">Chargement du livre...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Livre non disponible</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/library")}
            className="px-6 py-3 bg-gradient-to-r from-[#80368D] to-[#29358B] text-white rounded-xl font-medium hover:opacity-90 transition"
          >
            Retour à la bibliothèque
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed inset-0 ${isDarkMode ? "bg-gray-900" : "bg-gray-100"} flex flex-col select-none`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top bar */}
      <header 
        className={`absolute top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          showControls ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className={`${isDarkMode ? "bg-black/80" : "bg-white/90"} backdrop-blur-xl px-4 py-3 safe-area-inset-top`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/library")}
              className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-white/10" : "hover:bg-black/10"}`}
            >
              <ChevronLeft className={`w-6 h-6 ${isDarkMode ? "text-white" : "text-gray-800"}`} />
            </button>

            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-white/10" : "hover:bg-black/10"}`}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-white" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-800" />
                )}
              </button>

              {/* Zoom controls */}
              <div className={`flex items-center ${isDarkMode ? "bg-white/10" : "bg-black/10"} rounded-lg`}>
                <button
                  onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}
                  className="p-2"
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-gray-800"}`} />
                </button>
                <span className={`px-2 text-sm ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => setScale(s => Math.min(s + 0.25, 3))}
                  className="p-2"
                  disabled={scale >= 3}
                >
                  <ZoomIn className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-gray-800"}`} />
                </button>
                <button
                  onClick={() => setScale(1)}
                  className="p-2 border-l border-white/20"
                >
                  <RotateCcw className={`w-4 h-4 ${isDarkMode ? "text-white" : "text-gray-800"}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* PDF Viewer */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-auto p-4"
        onClick={() => setShowControls(true)}
      >
        <div 
          className={`relative transition-transform duration-300 ${
            isFlipping 
              ? flipDirection === "right" 
                ? "animate-flip-right" 
                : "animate-flip-left"
              : ""
          }`}
          style={{ perspective: "2000px" }}
        >
          <canvas
            ref={canvasRef}
            className={`max-w-full h-auto shadow-2xl rounded-lg ${
              isDarkMode ? "bg-white" : "bg-white"
            }`}
            style={{
              maxHeight: "calc(100vh - 200px)",
            }}
          />
        </div>
      </div>

      {/* Navigation areas */}
      <div className="fixed inset-y-0 left-0 w-1/5 cursor-pointer" onClick={prevPage} />
      <div className="fixed inset-y-0 right-0 w-1/5 cursor-pointer" onClick={nextPage} />

      {/* Bottom bar */}
      <footer 
        className={`absolute bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
          showControls ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className={`${isDarkMode ? "bg-black/80" : "bg-white/90"} backdrop-blur-xl px-4 py-4 safe-area-inset-bottom`}>
          {/* Progress bar */}
          <div className="mb-3">
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value))}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#80368D]"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`p-3 rounded-xl ${isDarkMode ? "bg-white/10 hover:bg-white/20" : "bg-black/10 hover:bg-black/20"} disabled:opacity-30 transition`}
            >
              <ChevronLeft className={`w-6 h-6 ${isDarkMode ? "text-white" : "text-gray-800"}`} />
            </button>

            <div className="flex items-center gap-4">
              <span className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                {currentPage} / {totalPages}
              </span>
            </div>

            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`p-3 rounded-xl ${isDarkMode ? "bg-white/10 hover:bg-white/20" : "bg-black/10 hover:bg-black/20"} disabled:opacity-30 transition`}
            >
              <ChevronRight className={`w-6 h-6 ${isDarkMode ? "text-white" : "text-gray-800"}`} />
            </button>
          </div>
        </div>
      </footer>

      {/* CSS for flip animation */}
      <style jsx>{`
        @keyframes flipRight {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(-90deg); }
          100% { transform: rotateY(0deg); }
        }
        @keyframes flipLeft {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(90deg); }
          100% { transform: rotateY(0deg); }
        }
        .animate-flip-right {
          animation: flipRight 0.3s ease-in-out;
        }
        .animate-flip-left {
          animation: flipLeft 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
