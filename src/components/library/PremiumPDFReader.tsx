"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Sun,
  Moon,
  Type,
  Bookmark,
  BookOpen,
  Settings,
  X,
  Menu,
  Home,
  List,
  ChevronDown,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface PremiumReaderProps {
  resourceId: string;
  title: string;
  userEmail: string;
  userName: string;
  enableWatermark?: boolean;
  onClose?: () => void;
}

type Theme = "light" | "sepia" | "dark" | "black";

interface ReaderSettings {
  theme: Theme;
  fontSize: number;
  brightness: number;
  scrollMode: boolean;
  showProgress: boolean;
}

// ─── Default Settings ───────────────────────────────────────

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "light",
  fontSize: 100,
  brightness: 100,
  scrollMode: false,
  showProgress: true,
};

const THEMES = {
  light: {
    bg: "#FFFFFF",
    text: "#1a1a1a",
    secondary: "#666666",
    border: "#E5E5E5",
    toolbar: "#F8F8F8",
    name: "Clair",
  },
  sepia: {
    bg: "#F4ECD8",
    text: "#5B4636",
    secondary: "#8B7355",
    border: "#D4C8B0",
    toolbar: "#EAE0CC",
    name: "Sépia",
  },
  dark: {
    bg: "#1C1C1E",
    text: "#E5E5E5",
    secondary: "#8E8E93",
    border: "#38383A",
    toolbar: "#2C2C2E",
    name: "Sombre",
  },
  black: {
    bg: "#000000",
    text: "#CCCCCC",
    secondary: "#666666",
    border: "#1C1C1E",
    toolbar: "#0A0A0A",
    name: "Noir",
  },
};

// ─── Composant Principal ────────────────────────────────────

export default function PremiumPDFReader({
  resourceId,
  title,
  userEmail,
  userName,
  enableWatermark = true,
  onClose,
}: PremiumReaderProps) {
  // ─── Refs ─────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);

  // ─── State ────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [isCurrentPageBookmarked, setIsCurrentPageBookmarked] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  const theme = THEMES[settings.theme];

  // ─── Load Settings from LocalStorage ──────────────────────
  useEffect(() => {
    const savedSettings = localStorage.getItem("reader_settings");
    if (savedSettings) {
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
    }

    const savedBookmarks = localStorage.getItem(`bookmarks_${resourceId}`);
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }

    const savedProgress = localStorage.getItem(`reading_progress_${resourceId}`);
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      if (progress.page) {
        setPageNum(progress.page);
      }
    }
  }, [resourceId]);

  // ─── Save Settings ────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("reader_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`bookmarks_${resourceId}`, JSON.stringify(bookmarks));
  }, [bookmarks, resourceId]);

  // ─── Save Progress ────────────────────────────────────────
  useEffect(() => {
    if (totalPages > 0) {
      localStorage.setItem(
        `reading_progress_${resourceId}`,
        JSON.stringify({
          page: pageNum,
          totalPages,
          lastRead: Date.now(),
        })
      );
    }
  }, [pageNum, totalPages, resourceId]);

  // ─── Check if Current Page is Bookmarked ──────────────────
  useEffect(() => {
    setIsCurrentPageBookmarked(bookmarks.includes(pageNum));
  }, [pageNum, bookmarks]);

  // ─── Auto-hide Toolbar ────────────────────────────────────
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (showToolbar && !showSettings && !showToc) {
      timeout = setTimeout(() => {
        setShowToolbar(false);
      }, 10000);
    }

    return () => clearTimeout(timeout);
  }, [showToolbar, showSettings, showToc, pageNum]);

  // ─── Load PDF ─────────────────────────────────────────────
  useEffect(() => {
    loadPDF();
  }, [resourceId]);

  async function loadPDF() {
    setLoading(true);
    setError("");

    try {
      console.log("[PremiumPDFReader] Starting to load PDF:", resourceId);
      
      // Get PDF session token
      const tokenRes = await fetch("/api/pdf/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resourceId }),
      });
      
      console.log("[PremiumPDFReader] Token response status:", tokenRes.status);
      
      if (!tokenRes.ok) {
        const errorData = await tokenRes.json().catch(() => ({}));
        console.error("[PremiumPDFReader] Token error:", errorData);
        throw new Error(errorData.error || "Impossible d'obtenir le token de session");
      }

      const tokenData = await tokenRes.json();
      console.log("[PremiumPDFReader] Token received, fetching PDF...");

      // Load PDF.js
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      // Fetch PDF - token must be in query parameter, not header
      const pdfUrl = `/api/pdf/${resourceId}?token=${encodeURIComponent(tokenData.token)}`;
      console.log("[PremiumPDFReader] Fetching PDF from:", pdfUrl);
      
      const pdfRes = await fetch(pdfUrl, {
        credentials: "include",
      });
      console.log("[PremiumPDFReader] PDF response status:", pdfRes.status);

      if (!pdfRes.ok) {
        const errorData = await pdfRes.json().catch(() => ({}));
        console.error("[PremiumPDFReader] PDF fetch error:", errorData);
        throw new Error(errorData.error || "Impossible de charger le PDF");
      }

      const pdfData = await pdfRes.arrayBuffer();
      console.log("[PremiumPDFReader] PDF data received, size:", pdfData.byteLength);
      
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      console.log("[PremiumPDFReader] PDF loaded, pages:", pdf.numPages);

      pdfDocRef.current = pdf;
      setTotalPages(pdf.numPages);
      setLoading(false);
      
      // Note: renderPage sera appelé par le useEffect qui surveille loading
    } catch (err) {
      console.error("PDF load error:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      setLoading(false);
    }
  }

  async function renderPage(num: number) {
    if (!pdfDocRef.current || !canvasRef.current) {
      console.log("[PremiumPDFReader] renderPage - missing refs:", {
        pdfDoc: !!pdfDocRef.current,
        canvas: !!canvasRef.current
      });
      return;
    }

    console.log("[PremiumPDFReader] Rendering page:", num);

    try {
      const page = await pdfDocRef.current.getPage(num);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.error("[PremiumPDFReader] No canvas context");
        return;
      }

      // Calculate scale based on container width
      const container = containerRef.current;
      const containerWidth = container?.clientWidth || window.innerWidth;
      const viewport = page.getViewport({ scale: 1 });
      const baseScale = (containerWidth - 40) / viewport.width;
      const finalScale = baseScale * scale * (settings.fontSize / 100);

      console.log("[PremiumPDFReader] Canvas dimensions:", {
        containerWidth,
        viewportWidth: viewport.width,
        baseScale,
        finalScale
      });

      const scaledViewport = page.getViewport({ scale: finalScale });

      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      await page.render({
        canvasContext: ctx,
        viewport: scaledViewport,
      }).promise;

      console.log("[PremiumPDFReader] Page rendered successfully");

      // Add watermark if enabled
      if (enableWatermark) {
        addWatermark(ctx, canvas.width, canvas.height);
      }
    } catch (err) {
      console.error("Page render error:", err);
    }
  }

  function addWatermark(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = settings.theme === "light" || settings.theme === "sepia" ? "#000" : "#FFF";

    const text = `${userName} - ${userEmail}`;
    const date = new Date().toLocaleDateString("fr-FR");

    // Diagonal watermarks
    const spacing = 200;
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 6);

    for (let y = -height; y < height * 2; y += spacing) {
      for (let x = -width; x < width * 2; x += spacing) {
        ctx.fillText(text, x, y);
        ctx.fillText(date, x, y + 20);
      }
    }

    ctx.restore();
  }

  // ─── Initial Render when PDF is loaded ────────────────────
  useEffect(() => {
    if (!loading && pdfDocRef.current && canvasRef.current) {
      console.log("[PremiumPDFReader] PDF ready, rendering first page");
      // Small delay to ensure canvas is mounted
      setTimeout(() => {
        renderPage(pageNum);
      }, 100);
    }
  }, [loading]);

  // ─── Re-render on Settings Change ─────────────────────────
  useEffect(() => {
    if (pdfDocRef.current && !loading) {
      renderPage(pageNum);
    }
  }, [scale, settings.fontSize]);

  // ─── Navigation ───────────────────────────────────────────
  function goToPage(num: number) {
    if (num >= 1 && num <= totalPages) {
      setPageNum(num);
      renderPage(num);
    }
  }

  function prevPage() {
    goToPage(pageNum - 1);
  }

  function nextPage() {
    goToPage(pageNum + 1);
  }

  // ─── Zoom ─────────────────────────────────────────────────
  function zoomIn() {
    setScale((prev) => Math.min(prev + 0.25, 3));
  }

  function zoomOut() {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  }

  // ─── Fullscreen ───────────────────────────────────────────
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  // ─── Bookmarks ────────────────────────────────────────────
  function toggleBookmark() {
    if (isCurrentPageBookmarked) {
      setBookmarks(bookmarks.filter((b) => b !== pageNum));
    } else {
      setBookmarks([...bookmarks, pageNum].sort((a, b) => a - b));
    }
  }

  // ─── Touch/Click Handling ─────────────────────────────────
  function handleCanvasClick(e: React.MouseEvent) {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    // Double tap to toggle toolbar
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      setShowToolbar(!showToolbar);
      return;
    }
    setLastTap(now);

    // Tap zones for navigation
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width * 0.3) {
      prevPage();
    } else if (x > width * 0.7) {
      nextPage();
    } else {
      setShowToolbar(!showToolbar);
    }
  }

  // ─── Keyboard Navigation ──────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "ArrowLeft":
        case "PageUp":
          prevPage();
          break;
        case "ArrowRight":
        case "PageDown":
        case " ":
          nextPage();
          break;
        case "Home":
          goToPage(1);
          break;
        case "End":
          goToPage(totalPages);
          break;
        case "Escape":
          if (showSettings) setShowSettings(false);
          else if (showToc) setShowToc(false);
          else if (isFullscreen) toggleFullscreen();
          break;
        case "+":
        case "=":
          zoomIn();
          break;
        case "-":
          zoomOut();
          break;
        case "b":
          toggleBookmark();
          break;
        case "f":
          toggleFullscreen();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pageNum, totalPages, showSettings, showToc, isFullscreen]);

  // ─── Render ───────────────────────────────────────────────

  if (loading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: theme.bg }}
      >
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: `${theme.border}`, borderTopColor: "#F97316" }}
          />
          <p style={{ color: theme.text }}>Chargement du livre...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: theme.bg }}
      >
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: theme.text }}>
            Erreur de chargement
          </h2>
          <p className="mb-4" style={{ color: theme.secondary }}>
            {error}
          </p>
          <button
            onClick={loadPDF}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        backgroundColor: theme.bg,
        filter: `brightness(${settings.brightness}%)`,
      }}
    >
      {/* Top Toolbar */}
      <header
        className={`absolute top-0 left-0 right-0 z-20 transition-transform duration-300 safe-area-inset-top ${
          showToolbar ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ backgroundColor: `${theme.toolbar}E6` }}
      >
        <div className="flex items-center justify-between px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose || (() => window.history.back())}
              className="p-2 rounded-lg transition hover:bg-white/10"
              style={{ color: theme.text }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="hidden sm:block">
              <h1
                className="font-semibold truncate max-w-xs"
                style={{ color: theme.text }}
              >
                {title}
              </h1>
              <p className="text-xs" style={{ color: theme.secondary }}>
                Page {pageNum} sur {totalPages}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-lg transition ${
                isCurrentPageBookmarked ? "text-orange-500" : ""
              }`}
              style={{ color: isCurrentPageBookmarked ? undefined : theme.text }}
              title="Ajouter un marque-page"
            >
              <Bookmark
                className="w-5 h-5"
                fill={isCurrentPageBookmarked ? "currentColor" : "none"}
              />
            </button>
            <button
              onClick={() => setShowToc(true)}
              className="p-2 rounded-lg transition hover:bg-white/10"
              style={{ color: theme.text }}
              title="Table des matières"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg transition hover:bg-white/10"
              style={{ color: theme.text }}
              title="Paramètres"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg transition hover:bg-white/10 hidden sm:block"
              style={{ color: theme.text }}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Canvas Area */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center relative"
        onClick={handleCanvasClick}
      >
        <canvas ref={canvasRef} className="max-w-full" />

        {/* Always-visible navigation arrows */}
        {pageNum > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); prevPage(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {pageNum < totalPages && (
          <button
            onClick={(e) => { e.stopPropagation(); nextPage(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Persistent page indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm font-medium z-10">
          {pageNum} / {totalPages}
        </div>
      </div>

      {/* Bottom Toolbar */}
      <footer
        className={`absolute bottom-0 left-0 right-0 z-20 transition-transform duration-300 safe-area-inset-bottom ${
          showToolbar ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ backgroundColor: `${theme.toolbar}E6` }}
      >
        <div className="backdrop-blur-xl px-4 py-3">
          {/* Progress Bar */}
          {settings.showProgress && (
            <div className="mb-3">
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: theme.border }}
              >
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${(pageNum / totalPages) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: theme.secondary }}>
                  Page {pageNum}
                </span>
                <span className="text-xs" style={{ color: theme.secondary }}>
                  {Math.round((pageNum / totalPages) * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevPage}
              disabled={pageNum <= 1}
              className="p-3 rounded-xl transition disabled:opacity-30"
              style={{ backgroundColor: theme.border, color: theme.text }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={zoomOut}
                disabled={scale <= 0.5}
                className="p-2 rounded-lg transition disabled:opacity-30"
                style={{ color: theme.text }}
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span
                className="text-sm font-medium w-12 text-center"
                style={{ color: theme.text }}
              >
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={scale >= 3}
                className="p-2 rounded-lg transition disabled:opacity-30"
                style={{ color: theme.text }}
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={nextPage}
              disabled={pageNum >= totalPages}
              className="p-3 rounded-xl transition disabled:opacity-30"
              style={{ backgroundColor: theme.border, color: theme.text }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </footer>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setShowSettings(false)}
          theme={theme}
        />
      )}

      {/* Table of Contents / Bookmarks */}
      {showToc && (
        <TableOfContents
          bookmarks={bookmarks}
          currentPage={pageNum}
          totalPages={totalPages}
          onGoToPage={(page) => {
            goToPage(page);
            setShowToc(false);
          }}
          onClose={() => setShowToc(false)}
          theme={theme}
        />
      )}
    </div>
  );
}

// ─── Settings Panel ─────────────────────────────────────────

function SettingsPanel({
  settings,
  onSettingsChange,
  onClose,
  theme,
}: {
  settings: ReaderSettings;
  onSettingsChange: (settings: ReaderSettings) => void;
  onClose: () => void;
  theme: typeof THEMES.light;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/50">
      <div
        className="w-full max-w-md rounded-t-3xl p-6 animate-slide-up safe-area-inset-bottom"
        style={{ backgroundColor: theme.toolbar }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
            Paramètres de lecture
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full"
            style={{ backgroundColor: theme.border, color: theme.text }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Selection */}
        <div className="mb-6">
          <label
            className="text-sm font-medium mb-3 block"
            style={{ color: theme.secondary }}
          >
            Thème
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(THEMES) as Theme[]).map((themeKey) => (
              <button
                key={themeKey}
                onClick={() =>
                  onSettingsChange({ ...settings, theme: themeKey })
                }
                className={`p-3 rounded-xl border-2 transition ${
                  settings.theme === themeKey
                    ? "border-orange-500"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: THEMES[themeKey].bg }}
              >
                <div
                  className="w-6 h-6 rounded-full mx-auto mb-1"
                  style={{
                    backgroundColor: THEMES[themeKey].text,
                  }}
                />
                <span
                  className="text-xs"
                  style={{ color: THEMES[themeKey].text }}
                >
                  {THEMES[themeKey].name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="mb-6">
          <label
            className="text-sm font-medium mb-3 block"
            style={{ color: theme.secondary }}
          >
            Taille du texte: {settings.fontSize}%
          </label>
          <div className="flex items-center gap-4">
            <Type className="w-4 h-4" style={{ color: theme.text }} />
            <input
              type="range"
              min="75"
              max="150"
              value={settings.fontSize}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  fontSize: parseInt(e.target.value),
                })
              }
              className="flex-1 accent-orange-500"
            />
            <Type className="w-6 h-6" style={{ color: theme.text }} />
          </div>
        </div>

        {/* Brightness */}
        <div className="mb-6">
          <label
            className="text-sm font-medium mb-3 block"
            style={{ color: theme.secondary }}
          >
            Luminosité: {settings.brightness}%
          </label>
          <div className="flex items-center gap-4">
            <Moon className="w-5 h-5" style={{ color: theme.text }} />
            <input
              type="range"
              min="50"
              max="100"
              value={settings.brightness}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  brightness: parseInt(e.target.value),
                })
              }
              className="flex-1 accent-orange-500"
            />
            <Sun className="w-5 h-5" style={{ color: theme.text }} />
          </div>
        </div>

        {/* Toggle Options */}
        <div className="space-y-3">
          <label
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ backgroundColor: theme.border }}
          >
            <span style={{ color: theme.text }}>Afficher la progression</span>
            <input
              type="checkbox"
              checked={settings.showProgress}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  showProgress: e.target.checked,
                })
              }
              className="w-5 h-5 accent-orange-500"
            />
          </label>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

// ─── Table of Contents ──────────────────────────────────────

function TableOfContents({
  bookmarks,
  currentPage,
  totalPages,
  onGoToPage,
  onClose,
  theme,
}: {
  bookmarks: number[];
  currentPage: number;
  totalPages: number;
  onGoToPage: (page: number) => void;
  onClose: () => void;
  theme: typeof THEMES.light;
}) {
  const [activeTab, setActiveTab] = useState<"pages" | "bookmarks">("bookmarks");

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/50">
      <div
        className="w-full max-w-md h-[60vh] rounded-t-3xl flex flex-col animate-slide-up safe-area-inset-bottom"
        style={{ backgroundColor: theme.toolbar }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.border }}>
          <h2 className="text-lg font-semibold" style={{ color: theme.text }}>
            Navigation
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full"
            style={{ backgroundColor: theme.border, color: theme.text }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: theme.border }}>
          <button
            onClick={() => setActiveTab("bookmarks")}
            className={`flex-1 py-3 text-sm font-medium transition ${
              activeTab === "bookmarks"
                ? "text-orange-500 border-b-2 border-orange-500"
                : ""
            }`}
            style={{ color: activeTab === "bookmarks" ? undefined : theme.secondary }}
          >
            Marque-pages ({bookmarks.length})
          </button>
          <button
            onClick={() => setActiveTab("pages")}
            className={`flex-1 py-3 text-sm font-medium transition ${
              activeTab === "pages"
                ? "text-orange-500 border-b-2 border-orange-500"
                : ""
            }`}
            style={{ color: activeTab === "pages" ? undefined : theme.secondary }}
          >
            Pages
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === "bookmarks" ? (
            bookmarks.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark
                  className="w-12 h-12 mx-auto mb-3"
                  style={{ color: theme.secondary }}
                />
                <p style={{ color: theme.secondary }}>
                  Aucun marque-page
                </p>
                <p className="text-sm mt-1" style={{ color: theme.secondary }}>
                  Appuyez sur l'icône marque-page pour en ajouter
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {bookmarks.map((page) => (
                  <button
                    key={page}
                    onClick={() => onGoToPage(page)}
                    className="w-full flex items-center justify-between p-4 rounded-xl transition"
                    style={{
                      backgroundColor: page === currentPage ? `${theme.border}` : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Bookmark
                        className="w-5 h-5 text-orange-500"
                        fill="currentColor"
                      />
                      <span style={{ color: theme.text }}>Page {page}</span>
                    </div>
                    <ChevronRight
                      className="w-5 h-5"
                      style={{ color: theme.secondary }}
                    />
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => onGoToPage(page)}
                  className={`aspect-square rounded-lg text-sm font-medium transition ${
                    page === currentPage
                      ? "bg-orange-500 text-white"
                      : bookmarks.includes(page)
                      ? "bg-orange-500/20"
                      : ""
                  }`}
                  style={{
                    backgroundColor:
                      page !== currentPage && !bookmarks.includes(page)
                        ? theme.border
                        : undefined,
                    color:
                      page === currentPage
                        ? undefined
                        : bookmarks.includes(page)
                        ? "#F97316"
                        : theme.text,
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
