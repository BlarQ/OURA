'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  File,
  Download,
  ExternalLink,
  Maximize2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getDocumentMetadata, formatDocumentName } from '@/lib/utils/documentUtils';

interface DocumentPreviewProps {
  mediaUrl: string;
  stepTitle?: string;
  fileName?: string;
  fileSize?: string;
  compact?: boolean;
  onOpenModal?: (url: string, title: string, fileName?: string) => void;
}

export default function DocumentPreview({
  mediaUrl,
  stepTitle = 'Step Procedure Document',
  fileName,
  fileSize,
  compact = false,
  onOpenModal,
}: DocumentPreviewProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);

  const meta = getDocumentMetadata(mediaUrl);
  const displayName = formatDocumentName(mediaUrl, fileName, stepTitle);

  // If text or code file, fetch first few KB for inline preview
  useEffect(() => {
    if (meta.category === 'text' && !compact) {
      fetch(mediaUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Text fetch failed');
          return res.text();
        })
        .then((txt) => {
          setTextContent(txt);
        })
        .catch(() => {
          setTextContent(null);
        });
    }
  }, [mediaUrl, meta.category, compact]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenModal) {
      onOpenModal(mediaUrl, stepTitle, displayName);
    }
  };

  const getDocIcon = () => {
    if (meta.category === 'text') return <FileCode className="h-5 w-5 text-ink-black" />;
    if (meta.extension.includes('XLS') || meta.extension === 'CSV') {
      return <FileSpreadsheet className="h-5 w-5 text-ink-black" />;
    }
    if (meta.category === 'pdf') return <FileText className="h-5 w-5 text-red-600" />;
    return <File className="h-5 w-5 text-ink-black" />;
  };

  return (
    <div className="rounded-2xl border border-ash-gray bg-paper-white overflow-hidden shadow-xs hover:border-ink-black transition-colors">
      {/* Document Top Bar */}
      <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-ash-gray flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-lg bg-paper-white border border-ash-gray flex items-center justify-center shrink-0 shadow-xs">
            {getDocIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-extrabold text-ink-black truncate block max-w-xs sm:max-w-md">
                {displayName}
              </span>
              <span className="badge-sprout-green text-[10px] py-0.5 px-2 font-extrabold uppercase shrink-0">
                {meta.extension}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-pewter font-bold">
              <span>{meta.label}</span>
              {fileSize && (
                <>
                  <span>•</span>
                  <span>{fileSize}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {textContent && (
            <button
              type="button"
              onClick={handleCopy}
              className="btn-sprout-ghost text-xs py-1 px-2 flex items-center gap-1 cursor-pointer"
              title="Copy text"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
          )}

          {onOpenModal && (
            <button
              type="button"
              onClick={handleOpenModal}
              className="btn-sprout-primary text-xs py-1.5 px-2.5 sm:px-3 flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Fullscreen in-platform document preview"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          )}

          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-pewter hover:text-ink-black hover:bg-slate-200 rounded-md transition cursor-pointer"
            title="Open in new window"
          >
            <ExternalLink className="h-4 w-4" />
          </a>

          <a
            href={mediaUrl}
            download={displayName}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-pewter hover:text-ink-black hover:bg-slate-200 rounded-md transition cursor-pointer"
            title="Download document"
          >
            <Download className="h-4 w-4" />
          </a>

          {!compact && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1.5 text-pewter hover:text-ink-black hover:bg-slate-200 rounded-md transition cursor-pointer"
              title={isExpanded ? 'Collapse preview' : 'Expand preview'}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Embedded Document Preview Body (when expanded & not compact) */}
      {!compact && isExpanded && (
        <div className="bg-slate-900 overflow-hidden">
          {meta.category === 'pdf' ? (
            <div className="relative w-full h-96 sm:h-125 bg-slate-800">
              <iframe
                src={`${mediaUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0"
                title={displayName}
              />
            </div>
          ) : meta.category === 'text' && textContent !== null ? (
            <div className="p-4 sm:p-5 max-h-80 sm:max-h-96 overflow-auto font-mono text-xs text-slate-100 bg-slate-950 leading-relaxed whitespace-pre custom-scrollbar">
              {textContent}
            </div>
          ) : meta.category === 'office' ? (
            <div className="relative w-full h-96 sm:h-120 bg-paper-white">
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(mediaUrl)}&embedded=true`}
                className="w-full h-full border-0"
                title={displayName}
              />
            </div>
          ) : (
            <div className="p-6 text-center bg-slate-50 space-y-2 border-t border-ash-gray">
              <p className="text-xs text-pewter font-medium">
                Click &quot;Preview&quot; to inspect this document package in high resolution or download it directly.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
