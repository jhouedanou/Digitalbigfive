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
} from "lucide-react";
import Link from "next/link";

interface PDFReaderProps {
  resourceId: string;
  title: string;
  userEmail: string;
  enableWatermark: boolean;
}

export default function PDFReader({
  resourceId,
  title,
  userEmail,
  enableWatermark,
}: PDFReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<unknown>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Disable right-click
  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // Load PDF.js from CDN
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as unknown as Record<string, unknown>).pdfjsLib as {
        GlobalWorkerOptions: { workerSrc: string };
        getDocument: (url: string) => { promise: Promise<unknown> };
      };
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

      pdfjsLib
        .getDocument(`/api/pdf/${resourceId}`)
        .promise.then((pdf: unknown) => {
          setPdfDoc(pdf);
          setTotalPages((pdf as { numPages: number }).numPages);
          setLoading(false);
        })
        .catch((err: unknown) => {
          console.error("PDF load error:", err);
          setLoading(false);
        });
    };
    document.body.appendChild(script);
  }, [resourceId]);

  const renderPage = useCallback(
    async (num: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      const page = await (pdfDoc as { getPage: (n: number) => Promise<unknown> }).getPage(num);
      const viewport = (page as { getViewport: (opts: { scale: number }) => unknown }).getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d")!;
      canvas.height = (viewport as { height: number }).height;
      canvas.width = (viewport as { width: number }).width;

      await (page as { render: (opts: unknown) => { promise: Promise<void> } }).render({
        canvasContext: context,
        viewport,
      }).promise;

      // Watermark
      if (enableWatermark && userEmail) {
        context.save();
        context.font = "14px Arial";
        context.fillStyle = "rgba(0, 0, 0, 0.06)";
        context.rotate(-Math.PI / 6);

        for (let y = -canvas.height; y < canvas.height * 2; y += 100) {
          for (let x = -canvas.width; x < canvas.width * 2; x += 300) {
            context.fillText(userEmail, x, y);
          }
        }
        context.restore();
      }
    },
    [pdfDoc, scale, enableWatermark, userEmail]
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
      if (e.key === "ArrowRight" && pageNum < totalPages) setPageNum(pageNum + 1);
      if (e.key === "Escape" && isFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pageNum, totalPages, isFullscreen]);

  return (
    <div
      ref={containerRef}
      className="pdf-viewer-container flex flex-col"
      style={{ userSelect: "none" }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/produits"
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X size={20} />
          </Link>
          <span className="text-sm font-medium truncate max-w-xs">{title}</span>
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

      {/* Canvas area */}
      <div className="flex-1 overflow-auto flex justify-center bg-gray-800 p-4">
        {loading ? (
          <div className="flex items-center justify-center text-gray-400">
            Chargement du document...
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
      <div className="h-1 bg-gray-900">
        <div
          className="h-full bg-blue-500 transition-all"
          style={{ width: `${(pageNum / totalPages) * 100}%` }}
        />
      </div>
    </div>
  );
}
