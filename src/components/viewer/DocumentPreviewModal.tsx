'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  FileCode,
  FileSpreadsheet,
  File,
  Copy,
  Check,
  Loader2,
  Maximize2,
} from 'lucide-react';
import { useModalScrollLock } from '@/lib/hooks/useModalScrollLock';
import { getDocumentMetadata, formatDocumentName } from '@/lib/utils/documentUtils';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string | null;
  documentTitle?: string;
  documentFileName?: string;
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  documentUrl,
  documentTitle = 'Document Preview',
  documentFileName,
}: DocumentPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState<number>(100);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useModalScrollLock(isOpen, onClose);

  const meta = documentUrl ? getDocumentMetadata(documentUrl) : null;
  const displayName = documentUrl
    ? formatDocumentName(documentUrl, documentFileName, documentTitle)
    : documentTitle;

  // If it's a text-based document, fetch content directly for high-fidelity code/text viewer
  useEffect(() => {
    if (isOpen && documentUrl && meta?.category === 'text') {
      setIsLoadingText(true);
      setTextContent(null);
      fetch(documentUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load text');
          return res.text();
        })
        .then((text) => {
          setTextContent(text);
          setIsLoadingText(false);
        })
        .catch(() => {
          setIsLoadingText(false);
          setTextContent(null);
        });
    } else {
      setTextContent(null);
      setIsLoadingText(false);
    }
    setZoom(100);
    setIframeError(false);
  }, [isOpen, documentUrl, meta?.category]);

  if (!isOpen || !documentUrl || !mounted) return null;

  const handleCopy = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 60));
  const handleResetZoom = () => setZoom(100);

  const getDocIcon = () => {
    if (meta?.category === 'text') return <FileCode className="h-4 w-4 text-ink-black" />;
    if (meta?.extension.includes('XLS') || meta?.extension === 'CSV') {
      return <FileSpreadsheet className="h-4 w-4 text-ink-black" />;
    }
    if (meta?.category === 'pdf') return <FileText className="h-4 w-4 text-red-600" />;
    return <File className="h-4 w-4 text-ink-black" />;
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-99999 w-screen h-screen flex flex-col bg-black/85 backdrop-blur-md animate-backdrop-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Controls Header Bar */}
      <header className="h-16 px-4 sm:px-6 bg-paper-white border-b border-ash-gray flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div className="h-9 w-9 rounded-md bg-slate-100 border border-ash-gray flex items-center justify-center shrink-0">
            {getDocIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-ink-black uppercase tracking-wider block truncate max-w-xs sm:max-w-md">
                {displayName}
              </span>
              {meta && (
                <span className="badge-sprout-green text-[10px] py-0.5 px-2 font-bold shrink-0">
                  {meta.extension}
                </span>
              )}
            </div>
            <span className="text-[11px] text-pewter font-bold block truncate">
              {documentTitle}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom controls for PDF / Text / Frames */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-ash-gray mr-2">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 60}
              className="p-1 text-pewter hover:text-ink-black rounded disabled:opacity-40 transition cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-bold text-ink-black px-1 min-w-10 text-center">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="p-1 text-pewter hover:text-ink-black rounded disabled:opacity-40 transition cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            {zoom !== 100 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1 text-pewter hover:text-ink-black rounded transition cursor-pointer ml-0.5"
                title="Reset zoom"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Copy button (for text files) */}
          {textContent !== null && (
            <button
              type="button"
              onClick={handleCopy}
              className="btn-sprout-ghost text-xs py-1.5 px-2.5 hidden sm:flex items-center gap-1 cursor-pointer"
              title="Copy all document text"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          )}

          {/* Open in new window / tab */}
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-pewter hover:text-ink-black hover:bg-slate-100 rounded-md transition cursor-pointer border border-transparent hover:border-ash-gray"
            title="Open in new window"
          >
            <ExternalLink className="h-4 w-4" />
          </a>

          {/* Download File */}
          <a
            href={documentUrl}
            download={displayName}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-pewter hover:text-ink-black hover:bg-slate-100 rounded-md transition cursor-pointer border border-transparent hover:border-ash-gray"
            title="Download original document"
          >
            <Download className="h-4 w-4" />
          </a>

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 ml-1 text-pewter hover:text-ink-black hover:bg-slate-100 rounded-md transition cursor-pointer border border-ash-gray bg-paper-white"
            aria-label="Close document preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Document Viewer Canvas */}
      <main className="flex-1 w-full overflow-auto bg-slate-900 flex items-center justify-center p-2 sm:p-6 custom-scrollbar">
        <div
          className="w-full h-full max-w-6xl mx-auto flex items-center justify-center transition-all duration-200"
          style={{ transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined, transformOrigin: 'top center' }}
        >
          {/* PDF Viewer Mode */}
          {meta?.category === 'pdf' && (
            <div className="w-full h-full bg-paper-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-700">
              <iframe
                src={`${documentUrl}#toolbar=1&navpanes=1&statusbar=1`}
                className="w-full h-full border-0 rounded-xl"
                title={displayName}
              />
            </div>
          )}

          {/* Text / Code Viewer Mode */}
          {meta?.category === 'text' && (
            <div className="w-full h-full bg-slate-950 text-slate-100 rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-800">
              {isLoadingText ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-pewter">
                  <Loader2 className="h-6 w-6 animate-spin text-sprout-green" />
                  <span className="text-xs font-bold">Loading document content...</span>
                </div>
              ) : textContent !== null ? (
                <div className="flex-1 overflow-auto p-4 sm:p-6 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre custom-scrollbar">
                  {textContent}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-300">
                  <FileText className="h-10 w-10 text-slate-500" />
                  <p className="text-sm font-bold">Unable to render inline text preview directly.</p>
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-sprout-primary text-xs mt-2"
                  >
                    Open Document in New Tab
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Office Document Preview Mode (Word, Excel, PowerPoint) */}
          {meta?.category === 'office' && (
            <div className="w-full h-full bg-paper-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-700">
              {!iframeError ? (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`}
                  className="w-full h-full border-0 rounded-xl"
                  title={displayName}
                  onError={() => setIframeError(true)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center bg-paper-white">
                  <div className="h-16 w-16 rounded-full bg-slate-100 border border-ash-gray flex items-center justify-center mx-auto text-ink-black">
                    <FileSpreadsheet className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-ink-black">{displayName}</h3>
                    <p className="text-xs text-pewter max-w-md mx-auto">
                      Office files (.docx, .xlsx, .pptx) are best opened in their native application or dedicated online viewer.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <a
                      href={documentUrl}
                      download={displayName}
                      className="btn-sprout-primary text-xs"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      <span>Download Document</span>
                    </a>
                    <a
                      href={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(documentUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-sprout-ghost text-xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      <span>View with Office Online</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generic / Archive Document Mode */}
          {(meta?.category === 'generic' || meta?.category === 'archive') && (
            <div className="w-full max-w-xl bg-paper-white rounded-2xl shadow-2xl p-8 text-center space-y-5 border border-ash-gray">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-ash-gray flex items-center justify-center mx-auto text-ink-black">
                <File className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <div className="badge-sprout-green text-xs mx-auto inline-block">
                  {meta.label}
                </div>
                <h3 className="text-xl font-extrabold text-ink-black">{displayName}</h3>
                <p className="text-xs text-pewter">
                  This document package can be opened in your local workstation tools.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={documentUrl}
                  download={displayName}
                  className="btn-sprout-primary text-xs"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  <span>Download Document File</span>
                </a>
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-sprout-ghost text-xs"
                >
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  <span>Open in Browser</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );

  return createPortal(modalContent, document.body);
}
