'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
  Loader2,
  Maximize2,
  FileText,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface PdfViewerProps {
  url: string;
  title?: string;
  fileName?: string;
  compact?: boolean;
  initialZoom?: number;
  onExpand?: () => void;
}

export default function PdfViewer({
  url,
  title = 'PDF Document',
  fileName,
  compact = false,
  initialZoom = 100,
  onExpand,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [viewMode, setViewMode] = useState<'canvas' | 'native'>('canvas');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  const displayName = fileName || (title.endsWith('.pdf') ? title : `${title}.pdf`);

  // Load PDF Document via PDF.js
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    async function loadPdf() {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument({
          url,
          cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setIsLoading(false);
      } catch (err: any) {
        console.warn('PDF.js canvas engine failed, falling back to native engine:', err);
        if (!isCancelled) {
          setViewMode('native');
          setIsLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore cancel error
        }
      }
    };
  }, [url]);

  // Render Page to Canvas
  const renderPage = useCallback(async (pageNumber: number, scalePercent: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;

    try {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore cancel error
        }
      }

      const page = await pdfDocRef.current.getPage(pageNumber);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const baseScale = compact ? 1.0 : 1.35;
      const scale = (scalePercent / 100) * baseScale;
      const viewport = page.getViewport({ scale });

      // Support High-DPI / Retina Displays
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
    } catch (renderErr: any) {
      if (renderErr?.name !== 'RenderingCancelledException') {
        console.error('Page render error:', renderErr);
      }
    }
  }, [compact]);

  // Trigger render when currentPage or zoom changes
  useEffect(() => {
    if (viewMode === 'canvas' && numPages > 0) {
      renderPage(currentPage, zoom);
    }
  }, [currentPage, zoom, viewMode, numPages, renderPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < numPages) setCurrentPage((prev) => prev + 1);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 20, 250));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 20, 50));
  const handleResetZoom = () => setZoom(100);

  return (
    <div className="rounded-2xl border border-ash-gray bg-slate-950 text-paper-white overflow-hidden shadow-md flex flex-col">
      {/* Top PDF Control Bar */}
      <div className="p-3 sm:p-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 z-10">
        {/* Left: Document Info & Page Navigator */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-md bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-extrabold text-paper-white truncate block max-w-xs sm:max-w-md">
              {displayName}
            </span>
            <span className="text-[10px] text-pewter font-bold flex items-center gap-1.5">
              <span className="badge-sprout-green text-[9px] py-0 px-1.5 font-bold">PDF</span>
              {numPages > 0 && <span>{numPages} {numPages === 1 ? 'Page' : 'Pages'}</span>}
            </span>
          </div>
        </div>

        {/* Center/Right: Navigation & Zoom Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Page Navigator (when canvas reader is active and numPages > 1) */}
          {viewMode === 'canvas' && numPages > 1 && (
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-md border border-slate-700">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={handlePrevPage}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded cursor-pointer transition"
                title="Previous Page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-[11px] font-bold text-slate-200 px-1.5 min-w-16 text-center">
                {currentPage} / {numPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= numPages}
                onClick={handleNextPage}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded cursor-pointer transition"
                title="Next Page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Zoom Controls (when canvas mode is active) */}
          {viewMode === 'canvas' && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded-md border border-slate-700">
              <button
                type="button"
                disabled={zoom <= 50}
                onClick={handleZoomOut}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded cursor-pointer transition"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[11px] font-bold text-slate-200 px-1 min-w-10 text-center">
                {zoom}%
              </span>
              <button
                type="button"
                disabled={zoom >= 250}
                onClick={handleZoomIn}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded cursor-pointer transition"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              {zoom !== 100 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1 text-slate-300 hover:text-white rounded cursor-pointer transition"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {/* Engine Switcher Toggle (Canvas vs Native) */}
          <button
            type="button"
            onClick={() => setViewMode((prev) => (prev === 'canvas' ? 'native' : 'canvas'))}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 text-xs hidden md:flex items-center gap-1 transition cursor-pointer"
            title={viewMode === 'canvas' ? 'Switch to Native Browser Frame' : 'Switch to In-App HD Reader'}
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold">{viewMode === 'canvas' ? 'HD Reader' : 'Native Frame'}</span>
          </button>

          {/* Expand / Fullscreen */}
          {onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition cursor-pointer"
              title="Fullscreen in-platform preview"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Open in new window */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition cursor-pointer"
            title="Open in new window"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          {/* Download Original File */}
          <a
            href={url}
            download={displayName}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition cursor-pointer"
            title="Download PDF"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Main PDF Viewer Canvas / Frame */}
      <div className={`relative w-full overflow-auto bg-slate-950 flex items-center justify-center custom-scrollbar ${compact ? 'h-96' : 'min-h-[420px] max-h-[680px] p-4 sm:p-6'}`}>
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 z-20">
            <Loader2 className="h-7 w-7 animate-spin text-sprout-green" />
            <span className="text-xs font-bold text-slate-300">Rendering PDF Document...</span>
          </div>
        )}

        {viewMode === 'canvas' ? (
          /* High-Definition HTML5 Canvas Page Viewer */
          <div className="flex flex-col items-center justify-center max-w-full my-auto">
            <div className="shadow-2xl rounded-sm overflow-hidden bg-white border border-slate-700 max-w-full">
              <canvas ref={canvasRef} className="block max-w-full h-auto" />
            </div>

            {numPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-slate-800 w-full text-xs text-slate-400">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={handlePrevPage}
                  className="btn-sprout-dark text-xs py-1 px-3 disabled:opacity-30 flex items-center gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous Page</span>
                </button>
                <span className="font-bold text-slate-200">
                  Page {currentPage} of {numPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= numPages}
                  onClick={handleNextPage}
                  className="btn-sprout-dark text-xs py-1 px-3 disabled:opacity-30 flex items-center gap-1"
                >
                  <span>Next Page</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Native Object & Embed Fallback Frame */
          <div className="w-full h-full min-h-[480px] bg-paper-white rounded-xl overflow-hidden shadow-2xl">
            <object
              data={`${url}#toolbar=1&navpanes=1`}
              type="application/pdf"
              className="w-full h-full min-h-[480px] border-0"
              title={displayName}
            >
              <embed
                src={`${url}#toolbar=1`}
                type="application/pdf"
                className="w-full h-full min-h-[480px]"
              />
              <div className="p-8 text-center bg-slate-900 text-white space-y-3">
                <FileText className="h-10 w-10 mx-auto text-sprout-green" />
                <p className="text-sm font-bold">PDF Reader Embed</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-sprout-primary text-xs"
                >
                  Open PDF in New Window
                </a>
              </div>
            </object>
          </div>
        )}
      </div>
    </div>
  );
}
