'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Terminal,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Layers,
  FileCode,
  FileCheck,
  Eye,
} from 'lucide-react';
import { createManual, createManualWithFile } from '@/lib/services/manuals';

const SUGGESTED_TITLES = [
  'Oracle DB Client Installation & TNS',
  'Cisco Core Switch VLAN Configuration',
  'SSH Key Rotation & Bastion Hardening',
  'ColSync Pipeline Background Cron Setup',
  'PostgreSQL Replication & Failover Playbook',
];

function formatTitleFromFilename(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  const clean = withoutExt
    .replace(/[_\-.]+/g, ' ')
    .replace(/%20/g, ' ')
    .trim();
  return clean
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function NewManualPage() {
  const router = useRouter();

  // Mode: 'upload' for Word/PDF/Image upload, 'scratch' for manual step builder
  const [creationMode, setCreationMode] = useState<'upload' | 'scratch'>('upload');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Submission & progress state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelection = (file: File) => {
    setSelectedFile(file);
    if (errorMessage) setErrorMessage(null);

    // Auto-populate title if empty or default
    if (!title.trim()) {
      setTitle(formatTitleFromFilename(file.name));
    }

    // Generate thumbnail preview if image
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit handler: redirectTarget determines whether to view the manual or go to the step builder
  const handleSubmit = async (redirectTarget: 'view' | 'edit') => {
    if (!title.trim()) {
      setErrorMessage('Please enter a title for your procedure manual.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setUploadPercent(10);
    setUploadStatus('Initializing playbook shell...');

    try {
      if (creationMode === 'upload' && selectedFile) {
        // Upload File Path (Word, PDF, or Image)
        const result = await createManualWithFile({
          title: title.trim(),
          file: selectedFile,
          description: description.trim() || undefined,
          onProgress: (percent, status) => {
            setUploadPercent(percent);
            setUploadStatus(status);
          },
        });

        if (result.error || !result.manualId) {
          throw new Error(result.error || 'Failed to upload manual file.');
        }

        setUploadPercent(100);
        setUploadStatus('Manual created! Loading procedure viewer...');

        setTimeout(() => {
          if (redirectTarget === 'view') {
            router.push(`/manuals/${result.manualId}`);
          } else {
            router.push(`/manuals/${result.manualId}/edit`);
          }
        }, 300);
      } else {
        // Scratch Path: create blank manual shell
        setUploadPercent(50);
        setUploadStatus('Creating playbook in database...');
        const newManualId = await createManual(title.trim());

        setUploadPercent(100);
        if (newManualId) {
          router.push(`/manuals/${newManualId}/edit`);
        } else {
          const demoId = `manual-${Date.now()}`;
          router.push(`/manuals/${demoId}/edit?title=${encodeURIComponent(title.trim())}`);
        }
      }
    } catch (err: any) {
      console.error('Error creating manual:', err);
      setErrorMessage(err?.message || 'Failed to create manual. Please try again.');
      setIsSubmitting(false);
      setUploadPercent(0);
      setUploadStatus('');
    }
  };

  // Helper for file type info
  const getFileCategory = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
      return { type: 'image', label: `${ext.toUpperCase()} Image`, color: 'text-emerald-600' };
    }
    if (ext === 'pdf' || file.type === 'application/pdf') {
      return { type: 'pdf', label: 'PDF Document', color: 'text-red-600' };
    }
    if (['doc', 'docx'].includes(ext)) {
      return { type: 'word', label: 'Word Document', color: 'text-blue-600' };
    }
    return { type: 'generic', label: `${ext.toUpperCase()} Document`, color: 'text-ink-black' };
  };

  return (
    <div className="min-h-screen bg-paper-white text-ink-black font-sans flex flex-col justify-between selection:bg-sprout-green selection:text-ink-black">
      <div>
        {/* Top Navbar */}
        <header className="sticky top-2 sm:top-4 z-30 max-w-300 mx-auto px-3 sm:px-6 my-2 sm:my-3">
          <div className="nav-sprout h-14 sm:h-16 px-3.5 sm:px-5 flex items-center justify-between">
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm font-bold text-ink-black flex items-center gap-1.5 link-sprout"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Back to Library</span>
            </Link>

            <span className="text-[11px] sm:text-xs font-bold text-pewter">
              New Procedure Playbook
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-210 mx-auto px-3.5 sm:px-6 pt-6 sm:pt-8 pb-16 space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="badge-sprout-green text-[10px] sm:text-xs py-0.5 px-2.5 whitespace-nowrap inline-flex items-center gap-1.5">
              <Terminal className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-ink-black" />
              <span>Standard Operating Procedure</span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-ink-black tracking-tight">
              Create IT Procedure Playbook
            </h1>

            <p className="text-xs sm:text-sm text-pewter leading-relaxed">
              Upload an existing Word document, PDF, or image manual to follow step-by-step, or build sequential steps from scratch.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 sm:p-4 rounded-md bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs sm:text-sm text-red-700 animate-tab-content">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-red-600 mt-0.5" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Creation Mode Tabs Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-ash-gray">
            <button
              type="button"
              onClick={() => {
                setCreationMode('upload');
                if (errorMessage) setErrorMessage(null);
              }}
              className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${creationMode === 'upload'
                  ? 'bg-ink-black text-paper-white shadow-xs'
                  : 'text-pewter hover:text-ink-black'
                }`}
            >
              <UploadCloud className="h-4 w-4 shrink-0" />
              <span>Upload Manual File</span>
              <span className="hidden sm:inline text-[10px] py-0.5 px-1.5 rounded-full bg-sprout-green text-ink-black font-extrabold uppercase">
                Word • PDF • Image
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCreationMode('scratch');
                if (errorMessage) setErrorMessage(null);
              }}
              className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${creationMode === 'scratch'
                  ? 'bg-ink-black text-paper-white shadow-xs'
                  : 'text-pewter hover:text-ink-black'
                }`}
            >
              <Terminal className="h-4 w-4 shrink-0" />
              <span>Build Step-by-Step</span>
            </button>
          </div>

          {/* Form Card */}
          <div className="card-sprout p-5 sm:p-7 space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(creationMode === 'upload' && selectedFile ? 'view' : 'edit');
              }}
              className="space-y-5"
            >
              {/* ==============================================================
                  MODE 1: UPLOAD MANUAL FILE (Word, PDF, Image)
                  ============================================================== */}
              {creationMode === 'upload' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-ink-black flex items-center justify-between">
                      <span>Manual Document or Image File</span>
                      <span className="text-pewter font-normal lowercase text-[11px] sm:text-xs">
                        Word (.docx, .doc), PDF, or Image
                      </span>
                    </label>
                  </div>

                  {/* Hidden native file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.svg,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {/* File Upload Dropzone / File Card */}
                  {!selectedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${isDragging
                          ? 'border-sprout-green bg-sprout-green/10 scale-[1.01]'
                          : 'border-ash-gray hover:border-ink-black bg-slate-50/60 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-12 w-12 rounded-2xl bg-paper-white border border-ash-gray flex items-center justify-center text-ink-black shadow-xs">
                          <UploadCloud className="h-6 w-6 text-ink-black" />
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-extrabold text-ink-black">
                            Drag & drop your manual file here, or{' '}
                            <span className="text-ink-black underline decoration-sprout-green decoration-2 underline-offset-2">
                              browse files
                            </span>
                          </p>
                          <p className="text-[11px] sm:text-xs text-pewter">
                            Upload a Word (.docx/.doc), PDF (.pdf), or Image (.png/.jpg) to follow as a manual
                          </p>
                        </div>

                        {/* Format Badges */}
                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                          <span className="badge-sprout-neutral text-[10px] py-0.5 px-2 font-bold">
                            📄 PDF Document
                          </span>
                          <span className="badge-sprout-neutral text-[10px] py-0.5 px-2 font-bold">
                            📘 Word (.docx / .doc)
                          </span>
                          <span className="badge-sprout-neutral text-[10px] py-0.5 px-2 font-bold">
                            🖼️ Image (.png / .jpg)
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Selected File Details Box */
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-ash-gray space-y-3">
                      <div className="flex items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Thumbnail if image, else category icon */}
                          {filePreviewUrl ? (
                            <div className="h-12 w-12 rounded-xl overflow-hidden bg-white border border-ash-gray shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={filePreviewUrl}
                                alt="Selected thumbnail"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-paper-white border border-ash-gray flex items-center justify-center shrink-0 shadow-xs">
                              {getFileCategory(selectedFile).type === 'pdf' ? (
                                <FileText className="h-6 w-6 text-red-600" />
                              ) : getFileCategory(selectedFile).type === 'word' ? (
                                <FileText className="h-6 w-6 text-blue-600" />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-emerald-600" />
                              )}
                            </div>
                          )}

                          <div className="min-w-0 space-y-0.5">
                            <span className="text-xs sm:text-sm font-extrabold text-ink-black block truncate max-w-xs sm:max-w-md">
                              {selectedFile.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-pewter">
                              <span>
                                {selectedFile.size > 1024 * 1024
                                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
                                  : `${Math.round(selectedFile.size / 1024)} KB`}
                              </span>
                              <span>•</span>
                              <span className="text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Ready for procedure manual
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-sprout-ghost text-xs py-1 px-2.5"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-1 text-pewter hover:text-red-600 hover:bg-white rounded-md transition cursor-pointer"
                            title="Remove file"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Title Input (Auto-filled on upload, editable) */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-ink-black flex items-center justify-between">
                  <span>Manual Title</span>
                  <span className="text-pewter font-normal lowercase text-[11px] sm:text-xs">
                    Required
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={
                      creationMode === 'upload'
                        ? 'e.g. Oracle DB Client Installation & TNS Setup'
                        : 'e.g. Cisco Core Switch VLAN Configuration'
                    }
                    className="input-sprout w-full font-bold text-xs sm:text-sm text-ink-black py-2 sm:py-2.5 px-3 sm:px-4"
                  />
                </div>
              </div>

              {/* Optional Manual Description (Upload Mode) */}
              {creationMode === 'upload' && (
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-ink-black flex items-center justify-between">
                    <span>Manual Overview & Notes</span>
                    <span className="text-pewter font-normal lowercase text-[11px] sm:text-xs">
                      Optional
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief procedural instructions, notes, or target system context..."
                    className="input-sprout w-full text-xs sm:text-sm text-ink-black py-2 px-3 resize-y"
                  />
                </div>
              )}

              {/* Template Suggestions */}
              <div className="space-y-2 pt-0.5">
                <span className="text-[11px] sm:text-xs font-bold text-pewter">
                  Standard IT Playbook Templates:
                </span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {SUGGESTED_TITLES.map((sampleTitle) => (
                    <button
                      key={sampleTitle}
                      type="button"
                      onClick={() => {
                        setTitle(sampleTitle);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className="px-2.5 sm:px-3 py-1 rounded-3xl bg-paper-white hover:bg-slate-100 border border-ash-gray text-[10px] sm:text-xs text-ink-black font-bold transition-all text-left cursor-pointer active:scale-95"
                    >
                      + {sampleTitle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Progress Bar (when active) */}
              {isSubmitting && (
                <div className="p-4 rounded-xl bg-slate-100 border border-ash-gray space-y-2.5 animate-tab-content">
                  <div className="flex items-center justify-between text-xs font-bold text-ink-black">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>{uploadStatus}</span>
                    </span>
                    <span>{uploadPercent}%</span>
                  </div>
                  <div className="w-full bg-ash-gray rounded-md h-2 overflow-hidden">
                    <div
                      className="h-full bg-sprout-green transition-all duration-300"
                      style={{ width: `${uploadPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-ash-gray flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
                <Link
                  href="/dashboard"
                  className="text-xs sm:text-sm font-bold text-pewter hover:text-ink-black link-sprout order-3 sm:order-1"
                >
                  Cancel
                </Link>

                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 w-full sm:w-auto order-1 sm:order-2">
                  {creationMode === 'upload' && selectedFile ? (
                    <>
                      {/* Secondary: Open in Step Builder to add more steps */}
                      <button
                        type="button"
                        disabled={isSubmitting || !title.trim()}
                        onClick={() => handleSubmit('edit')}
                        className="btn-sprout-ghost text-xs sm:text-sm py-2 px-3.5 w-full sm:w-auto active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Open in Step Builder</span>
                      </button>

                      {/* Primary: Create & View Directly */}
                      <button
                        type="button"
                        disabled={isSubmitting || !title.trim()}
                        onClick={() => handleSubmit('view')}
                        className="btn-sprout-primary text-xs sm:text-sm py-2 px-4 w-full sm:w-auto active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                            <span>Creating Playbook...</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5" />
                            <span>Create & View Manual</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </button>
                    </>
                  ) : (
                    /* Step Builder Scratch flow */
                    <button
                      type="submit"
                      disabled={isSubmitting || !title.trim()}
                      className="btn-sprout-primary text-xs sm:text-sm py-2 px-4 w-full sm:w-auto active:scale-95"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          <span>Creating Playbook...</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span>Continue to Step Builder</span>
                          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="max-w-300 w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 text-center text-xs text-pewter border-t border-ash-gray">
        AdeManual IT Systems • Standard Operating Procedures
      </footer>
    </div>
  );
}
