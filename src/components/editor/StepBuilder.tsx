'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Camera,
  UploadCloud,
  Video,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import type { ManualWithSteps } from '@/lib/services/manuals';
import { saveManualWithSteps, uploadMediaToStorage, deleteManual } from '@/lib/services/manuals';
import { compressVideoClient } from '@/lib/videoCompression';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

export interface StepItem {
  id?: string;
  step_order: number;
  title: string;
  description: string;
  media_url: string | null;
  media_type: 'image' | 'video' | 'document' | 'audio' | 'none';
  media_file_name?: string;
  media_file_size?: string;
}

interface StepBuilderProps {
  manual: ManualWithSteps;
}

export default function StepBuilder({ manual }: StepBuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTitle = searchParams.get('title') || manual.title;

  const [title, setTitle] = useState(initialTitle);
  const [steps, setSteps] = useState<StepItem[]>(
    manual.steps && manual.steps.length > 0
      ? manual.steps.map((s, idx) => ({
          id: s.id,
          step_order: idx + 1,
          title: s.title || '',
          description: s.description || '',
          media_url: s.media_url || null,
          media_type: (s.media_type as any) || (s.media_url ? (s.media_url.endsWith('.mp4') ? 'video' : 'image') : 'none'),
          media_file_name: s.media_url ? 'Attachment Synced' : undefined,
          media_file_size: s.media_url ? 'Ready' : undefined,
        }))
      : [
          {
            step_order: 1,
            title: 'Initial Setup & Prerequisites',
            description: 'Verify prerequisites and prepare target environment.',
            media_url: null,
            media_type: 'none',
          },
        ]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Upload & Compression State per Step
  const [activeUploadIdx, setActiveUploadIdx] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [uploadPercent, setUploadPercent] = useState<number>(0);

  // File input refs
  const cameraInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const imageFileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const videoFileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Auto-save debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 2500);
    return () => clearTimeout(timer);
  }, [title, steps]);

  const handleAutoSave = async () => {
    if (!title.trim()) return;
    setLastSavedTime('Saving...');
    try {
      const ok = await saveManualWithSteps(manual.id, title, steps);
      if (ok) {
        setLastSavedTime('Synced');
        setSaveError(null);
      } else {
        setLastSavedTime('Sync failed');
      }
    } catch {
      setLastSavedTime('Sync failed');
    }
  };

  const handleManualSaveAndPublish = async () => {
    if (!title.trim()) {
      setSaveError('Please enter a playbook title.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const ok = await saveManualWithSteps(manual.id, title, steps);
      if (!ok) throw new Error('Database save error');

      setTimeout(() => {
        router.push(`/manuals/${manual.id}`);
      }, 400);
    } catch (err: any) {
      console.error('Failed to save manual:', err);
      setSaveError(err?.message || 'Failed to save manual.');
      setIsSaving(false);
    }
  };

  const handleDeleteManual = async () => {
    const success = await deleteManual(manual.id);
    if (success) {
      router.push('/dashboard');
      router.refresh();
    } else {
      throw new Error('Failed to delete manual from database.');
    }
  };

  const addStep = () => {
    const newStepOrder = steps.length + 1;
    setSteps([
      ...steps,
      {
        step_order: newStepOrder,
        title: '',
        description: '',
        media_url: null,
        media_type: 'none',
      },
    ]);
  };

  const removeStep = (indexToRemove: number) => {
    if (steps.length <= 1) return;
    const updated = steps
      .filter((_, idx) => idx !== indexToRemove)
      .map((s, idx) => ({ ...s, step_order: idx + 1 }));
    setSteps(updated);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    )
      return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...steps];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const normalized = reordered.map((s, idx) => ({ ...s, step_order: idx + 1 }));
    setSteps(normalized);
  };

  const updateStepField = (
    index: number,
    field: keyof StepItem,
    value: any
  ) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  // Image Upload Handler (Native Camera or Photo Picker)
  const handleImageUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveUploadIdx(index);
    setUploadPercent(20);
    setUploadStatusText('Uploading image to Supabase Storage...');

    try {
      const fileNameCustom = `img_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const publicUrl = await uploadMediaToStorage(file, manual.id, fileNameCustom, file.type);

      if (!publicUrl) throw new Error('Storage upload failed');

      setUploadPercent(100);
      setUploadStatusText('Image uploaded successfully!');

      const formattedSize =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      updateStepField(index, 'media_url', publicUrl);
      updateStepField(index, 'media_type', 'image');
      updateStepField(index, 'media_file_name', file.name);
      updateStepField(index, 'media_file_size', formattedSize);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setSaveError('Failed to upload image. Please try again.');
    } finally {
      setTimeout(() => {
        setActiveUploadIdx(null);
        setUploadPercent(0);
        setUploadStatusText('');
      }, 400);
    }
  };

  // Video Upload Handler with Client-Side FFmpeg Compression
  const handleVideoUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveUploadIdx(index);
    setUploadPercent(5);
    setUploadStatusText('Compressing video via FFmpeg (720p)...');

    try {
      const { blob: compressedBlob, compressedSize, compressionRatio, name } =
        await compressVideoClient(file, (percent, status) => {
          setUploadPercent(Math.min(percent, 85));
          setUploadStatusText(status);
        });

      setUploadPercent(90);
      setUploadStatusText('Uploading compressed video to Storage...');

      const fileNameCustom = `vid_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const publicUrl = await uploadMediaToStorage(
        compressedBlob,
        manual.id,
        fileNameCustom,
        'video/mp4'
      );

      if (!publicUrl) throw new Error('Video storage upload failed');

      setUploadPercent(100);
      setUploadStatusText('Video compressed and uploaded!');

      const formattedSize =
        compressedSize > 1024 * 1024
          ? `${(compressedSize / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(compressedSize / 1024)} KB`;

      updateStepField(index, 'media_url', publicUrl);
      updateStepField(index, 'media_type', 'video');
      updateStepField(index, 'media_file_name', name || file.name);
      updateStepField(index, 'media_file_size', `${formattedSize} (${compressionRatio})`);
    } catch (err: any) {
      console.error('Video compression or upload failed:', err);
      setSaveError('Video upload failed. Please try again.');
    } finally {
      setTimeout(() => {
        setActiveUploadIdx(null);
        setUploadPercent(0);
        setUploadStatusText('');
      }, 400);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#040404] font-sans pb-28 selection:bg-[#98e58e] selection:text-[#040404]">
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        manualTitle={title || manual.title}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteManual}
      />

      {/* Top Navbar */}
      <header className="sticky top-4 z-30 max-w-[1200px] mx-auto px-4 sm:px-6 my-3">
        <div className="nav-sprout h-16 px-5 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-bold text-[#040404] flex items-center gap-1.5 link-sprout"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#98e58e]" />
            <span className="text-sm font-extrabold text-[#040404]">
              Playbook Step Editor
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-[#6e797a] hover:text-red-600 hover:bg-red-50 rounded-[6px] transition cursor-pointer border border-transparent hover:border-red-200"
              title="Delete Manual"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleManualSaveAndPublish}
              disabled={isSaving || !title.trim()}
              className="btn-sprout-primary"
            >
              {isSaving ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publishing...</span>
                </span>
              ) : (
                <span>Save & Publish</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Builder Container (Max-width 1200px) */}
      <main className="max-w-[960px] mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {saveError && (
          <div className="p-4 rounded-[6px] bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span className="font-semibold">{saveError}</span>
          </div>
        )}

        {/* Manual Title Box & Auto-save Status (16px radius, 1px ash-gray border) */}
        <div className="card-sprout p-6 sm:p-8 space-y-3">
          <div className="space-y-1">
            <label className="text-[12px] font-extrabold uppercase tracking-wider text-[#6e797a]">
              Playbook Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cisco Core Switch VLAN Configuration & Trunk Setup"
              className="w-full text-2xl sm:text-3xl font-extrabold text-[#040404] placeholder:text-[#cbcece] border-b border-[#d9d9d9] hover:border-[#040404] focus:border-[#040404] focus:outline-none pb-2 transition-colors bg-transparent"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#6e797a] pt-1">
            <Check className="h-3.5 w-3.5 text-[#040404]" />
            <span>Database Status: {lastSavedTime}</span>
          </div>
        </div>

        {/* Sequential Step Cards */}
        <div className="space-y-6">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="card-sprout p-6 sm:p-8 space-y-5 transition-colors hover:border-[#040404]"
            >
              {/* Step Header */}
              <div className="flex items-center justify-between border-b border-[#d9d9d9] pb-4">
                <div className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-[6px] bg-[#040404] text-[#ffffff] font-extrabold text-xs tracking-wider uppercase">
                  STEP {idx + 1}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveStep(idx, 'up')}
                    className="p-1.5 text-[#6e797a] hover:text-[#040404] hover:bg-[#f4f4f4] disabled:opacity-30 disabled:cursor-not-allowed rounded-[6px] transition cursor-pointer"
                    title="Move Step Up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === steps.length - 1}
                    onClick={() => moveStep(idx, 'down')}
                    className="p-1.5 text-[#6e797a] hover:text-[#040404] hover:bg-[#f4f4f4] disabled:opacity-30 disabled:cursor-not-allowed rounded-[6px] transition cursor-pointer"
                    title="Move Step Down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(idx)}
                      className="p-1.5 text-[#6e797a] hover:text-red-600 hover:bg-red-50 rounded-[6px] transition cursor-pointer ml-1"
                      title="Delete Step"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Step Title Input */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-extrabold text-[#040404]">
                  Step Title
                </label>
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => updateStepField(idx, 'title', e.target.value)}
                  placeholder="e.g. Open TNSNAMES.ORA in Administrator Mode"
                  className="input-sprout w-full font-bold text-sm"
                />
              </div>

              {/* Step Description Input */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-extrabold text-[#040404]">
                  Description & Command Lines
                </label>
                <textarea
                  rows={3}
                  value={step.description}
                  onChange={(e) => updateStepField(idx, 'description', e.target.value)}
                  placeholder="Detailed procedural instructions, commands, or troubleshooting notes..."
                  className="input-sprout w-full text-sm resize-y"
                />
              </div>

              {/* Media Upload & Preview Zone */}
              <div className="space-y-2 pt-2 border-t border-[#d9d9d9]">
                <label className="text-[13px] font-extrabold text-[#040404] block">
                  Media Attachment
                </label>

                {step.media_url ? (
                  /* Attached Media Preview */
                  <div className="p-4 rounded-[16px] bg-[#f4f4f4] border border-[#d9d9d9] space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-[6px] bg-[#040404] text-[#ffffff] flex items-center justify-center shrink-0">
                          {step.media_type === 'video' ? (
                            <Video className="h-4 w-4" />
                          ) : (
                            <ImageIcon className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#040404] block truncate max-w-xs sm:max-w-md">
                            {step.media_file_name || (step.media_type === 'video' ? 'Video Attachment' : 'Image Attachment')}
                          </span>
                          <span className="text-[11px] text-[#6e797a] font-bold">
                            ✓ {step.media_file_size || 'Attached to step'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          updateStepField(idx, 'media_url', null);
                          updateStepField(idx, 'media_type', 'none');
                          updateStepField(idx, 'media_file_name', undefined);
                          updateStepField(idx, 'media_file_size', undefined);
                        }}
                        className="p-1.5 text-[#6e797a] hover:text-red-600 hover:bg-white rounded-[6px] transition cursor-pointer"
                        title="Remove attachment"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Media Thumbnail / Video Player */}
                    <div className="pt-2 border-t border-[#d9d9d9]">
                      {step.media_type === 'video' ? (
                        <div className="relative rounded-[16px] overflow-hidden bg-black max-w-lg border border-[#d9d9d9]">
                          <video
                            controls
                            src={step.media_url}
                            className="w-full max-h-64 object-contain rounded-[16px]"
                          />
                        </div>
                      ) : (
                        <div className="relative rounded-[16px] overflow-hidden bg-white max-w-sm border border-[#d9d9d9]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={step.media_url}
                            alt={step.title}
                            className="w-full max-h-56 object-cover rounded-[16px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Empty Upload Zone */
                  <div className="relative">
                    {/* Native Mobile Camera Input */}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={(el) => {
                        cameraInputRefs.current[idx] = el;
                      }}
                      onChange={(e) => handleImageUpload(idx, e)}
                      className="hidden"
                    />

                    {/* Regular Image File Picker */}
                    <input
                      type="file"
                      accept="image/*"
                      ref={(el) => {
                        imageFileInputRefs.current[idx] = el;
                      }}
                      onChange={(e) => handleImageUpload(idx, e)}
                      className="hidden"
                    />

                    {/* Video File Picker */}
                    <input
                      type="file"
                      accept="video/*,.mp4,.mov,.webm,.avi,.mkv"
                      ref={(el) => {
                        videoFileInputRefs.current[idx] = el;
                      }}
                      onChange={(e) => handleVideoUpload(idx, e)}
                      className="hidden"
                    />

                    {activeUploadIdx === idx ? (
                      /* Active Upload Progress Box */
                      <div className="p-6 rounded-[16px] bg-[#f4f4f4] border border-[#d9d9d9] text-center space-y-3">
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#040404]">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{uploadStatusText}</span>
                        </div>
                        <div className="w-full bg-[#d9d9d9] rounded-[6px] h-2 overflow-hidden">
                          <div
                            className="h-full bg-[#040404] transition-all duration-300"
                            style={{ width: `${uploadPercent}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-[#6e797a] font-bold block">
                          {uploadPercent}% Completed
                        </span>
                      </div>
                    ) : (
                      /* 3 Clean Action Triggers */
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-[16px] border border-dashed border-[#cbcece] bg-[#ffffff]">
                        <button
                          type="button"
                          onClick={() => cameraInputRefs.current[idx]?.click()}
                          className="btn-sprout-ghost w-full py-2.5 text-xs flex items-center justify-center gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          <span>Snap Camera</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => imageFileInputRefs.current[idx]?.click()}
                          className="btn-sprout-ghost w-full py-2.5 text-xs flex items-center justify-center gap-2"
                        >
                          <UploadCloud className="h-4 w-4" />
                          <span>Choose Image</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => videoFileInputRefs.current[idx]?.click()}
                          className="btn-sprout-ghost w-full py-2.5 text-xs flex items-center justify-center gap-2"
                        >
                          <Video className="h-4 w-4" />
                          <span>720p Video (FFmpeg)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 'Add Next Step' Button */}
        <button
          type="button"
          onClick={addStep}
          className="w-full py-4 border border-dashed border-[#040404] hover:bg-[#f4f4f4] rounded-[16px] text-[#040404] font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Next Step (Step {steps.length + 1})</span>
        </button>
      </main>
    </div>
  );
}
