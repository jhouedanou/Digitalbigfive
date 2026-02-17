/**
 * PDF.js type declarations
 */

interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
}

interface PDFJSLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (opts: { data: ArrayBuffer } | string) => { 
    promise: Promise<PDFDocumentProxy>;
  };
}

declare global {
  interface Window {
    pdfjsLib: PDFJSLib;
  }
}

export { PDFDocumentProxy, PDFPageProxy, PDFJSLib };
