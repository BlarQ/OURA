'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import type { ManualWithSteps } from '@/lib/services/manuals';
import { deleteManual } from '@/lib/services/manuals';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

interface ProcedureViewerProps {
  manual: ManualWithSteps;
  authorName?: string;
}

export default function ProcedureViewer({
  manual,
  authorName = 'Adedamola',
}: ProcedureViewerProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'all' | 'walkthrough'>('all');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const steps = manual.steps && manual.steps.length > 0 ? manual.steps : [];

  const handleNext = () => {
    if (currentStepIndex === steps.length - 1) {
      setIsCompleted(true);
    } else {
      setCurrentStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setIsCompleted(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const progressPercentage =
    steps.length > 0
      ? Math.round(((currentStepIndex + 1) / steps.length) * 100)
      : 0;

  const currentStep = steps[currentStepIndex] || {
    step_order: 1,
    title: 'Procedure Overview',
    description: '',
    media_url: null,
    media_type: 'none',
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#040404] font-sans flex flex-col justify-between pb-16 selection:bg-[#98e58e] selection:text-[#040404]">
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        manualTitle={manual.title}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteManual}
      />

      <div>
        {/* Top Navbar */}
        <header className="sticky top-4 z-30 max-w-[1200px] mx-auto px-4 sm:px-6 my-3">
          <div className="nav-sprout h-16 px-5 flex items-center justify-between">
            <Link
              href="/dashboard"
              className="text-sm font-bold text-[#040404] flex items-center gap-1.5 link-sprout"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Library</span>
            </Link>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-[#f4f4f4] p-1 rounded-[6px] border border-[#d9d9d9]">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 text-xs font-bold rounded-[6px] transition-all cursor-pointer ${
                  viewMode === 'all'
                    ? 'bg-[#040404] text-[#ffffff]'
                    : 'text-[#6e797a] hover:text-[#040404]'
                }`}
              >
                Full Playbook
              </button>
              <button
                type="button"
                onClick={() => setViewMode('walkthrough')}
                className={`px-3 py-1 text-xs font-bold rounded-[6px] transition-all cursor-pointer ${
                  viewMode === 'walkthrough'
                    ? 'bg-[#040404] text-[#ffffff]'
                    : 'text-[#6e797a] hover:text-[#040404]'
                }`}
              >
                Step Execution
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-[#6e797a] hover:text-red-600 hover:bg-red-50 rounded-[6px] transition cursor-pointer border border-transparent hover:border-red-200"
                title="Delete Manual"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <Link
                href={`/manuals/${manual.id}/edit`}
                className="btn-sprout-ghost text-xs"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1" />
                <span>Edit Manual</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Liquid Step Progress Bar (in Walkthrough mode) */}
        {viewMode === 'walkthrough' && (
          <div className="w-full bg-[#d9d9d9] h-1.5 overflow-hidden">
            <div
              className="h-full bg-[#98e58e] transition-all duration-300 ease-out"
              style={{ width: `${isCompleted ? 100 : progressPercentage}%` }}
            />
          </div>
        )}

        {/* Main Content Area */}
        <main className="max-w-[960px] mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Header */}
          <div className="space-y-2 border-b border-[#d9d9d9] pb-6">
            <div className="badge-sprout-green">
              <Terminal className="h-3.5 w-3.5" />
              <span>Standard Operating Procedure</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#040404] tracking-tight">
              {manual.title}
            </h1>
            <p className="text-sm text-[#6e797a]">
              Documented by {authorName} • {steps.length}{' '}
              {steps.length === 1 ? 'Step' : 'Steps'}
            </p>
          </div>

          {/* ================================================================
              VIEW MODE 1: FULL PLAYBOOK (All Steps Listed Sequentially)
              ================================================================ */}
          {viewMode === 'all' && (
            <div className="space-y-6">
              {steps.length === 0 ? (
                <div className="card-sprout p-10 text-center space-y-3">
                  <p className="text-[#6e797a] text-sm">No steps added to this manual yet.</p>
                  <Link
                    href={`/manuals/${manual.id}/edit`}
                    className="btn-sprout-primary"
                  >
                    Add Steps Now
                  </Link>
                </div>
              ) : (
                steps.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    className="card-sprout p-6 sm:p-8 space-y-5 transition-colors hover:border-[#040404]"
                  >
                    {/* Step Title Header */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="px-3.5 py-1.5 rounded-[6px] bg-[#040404] text-[#ffffff] font-extrabold text-xs tracking-wider uppercase shrink-0">
                        Step {step.step_order || idx + 1}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#040404] leading-snug">
                        {step.title || `Step ${idx + 1}`}
                      </h2>
                    </div>

                    {/* Step Description */}
                    {step.description && (
                      <p className="text-base text-[#040404] leading-relaxed whitespace-pre-wrap">
                        {step.description}
                      </p>
                    )}

                    {/* Media Render: Optimized Image or Native Video Player */}
                    {step.media_url && (
                      <div className="pt-2">
                        {step.media_type === 'video' || step.media_url.endsWith('.mp4') ? (
                          <div className="rounded-[16px] overflow-hidden bg-black border border-[#d9d9d9] max-w-2xl">
                            <video
                              controls
                              playsInline
                              preload="metadata"
                              src={step.media_url}
                              className="w-full max-h-[460px] object-contain rounded-[16px]"
                            />
                          </div>
                        ) : (
                          <div className="rounded-[16px] overflow-hidden bg-[#ffffff] border border-[#d9d9d9] max-w-2xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={step.media_url}
                              alt={step.title}
                              loading="lazy"
                              className="w-full max-h-[460px] object-contain rounded-[16px]"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ================================================================
              VIEW MODE 2: STEP EXECUTION WALKTHROUGH
              ================================================================ */}
          {viewMode === 'walkthrough' && (
            <div>
              {isCompleted ? (
                /* Completed Card */
                <div className="card-sprout p-8 sm:p-12 text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-[#98e58e] text-[#040404] mx-auto flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <div className="badge-sprout-green">
                      <span>Execution Verified</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#040404]">
                      Procedure Successfully Completed
                    </h2>
                    <p className="text-sm text-[#6e797a] max-w-md mx-auto leading-relaxed">
                      You have executed and verified all {steps.length} steps for &quot;{manual.title}&quot;.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStepIndex(0);
                        setIsCompleted(false);
                      }}
                      className="btn-sprout-ghost"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      <span>Restart Procedure</span>
                    </button>
                    <Link
                      href="/dashboard"
                      className="btn-sprout-primary"
                    >
                      Return to Dashboard →
                    </Link>
                  </div>
                </div>
              ) : (
                /* Step Walkthrough Card */
                <div className="space-y-6">
                  <div className="card-sprout p-6 sm:p-9 space-y-6">
                    {/* Header */}
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="px-3.5 py-1.5 rounded-[6px] bg-[#040404] text-[#ffffff] font-extrabold text-xs tracking-wider uppercase shrink-0">
                        Step {currentStepIndex + 1} of {steps.length}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-[#040404] leading-snug">
                        {currentStep.title || `Step ${currentStepIndex + 1}`}
                      </h2>
                    </div>

                    {/* Description */}
                    {currentStep.description && (
                      <p className="text-base text-[#040404] leading-relaxed whitespace-pre-wrap">
                        {currentStep.description}
                      </p>
                    )}

                    {/* Media */}
                    {currentStep.media_url && (
                      <div className="pt-2">
                        {currentStep.media_type === 'video' || currentStep.media_url.endsWith('.mp4') ? (
                          <div className="rounded-[16px] overflow-hidden bg-black border border-[#d9d9d9] max-w-2xl">
                            <video
                              controls
                              playsInline
                              src={currentStep.media_url}
                              className="w-full max-h-[460px] object-contain rounded-[16px]"
                            />
                          </div>
                        ) : (
                          <div className="rounded-[16px] overflow-hidden bg-[#ffffff] border border-[#d9d9d9] max-w-2xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={currentStep.media_url}
                              alt={currentStep.title}
                              className="w-full max-h-[460px] object-contain rounded-[16px]"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step Dots */}
                    {steps.length > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-2 border-t border-[#d9d9d9]">
                        {steps.map((_, dotIdx) => (
                          <button
                            key={dotIdx}
                            type="button"
                            onClick={() => setCurrentStepIndex(dotIdx)}
                            className={`h-2 rounded-[6px] transition-all cursor-pointer ${
                              dotIdx === currentStepIndex
                                ? 'w-8 bg-[#040404]'
                                : dotIdx < currentStepIndex
                                ? 'w-2 bg-[#98e58e]'
                                : 'w-2 bg-[#d9d9d9] hover:bg-[#6e797a]'
                            }`}
                            title={`Jump to Step ${dotIdx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      disabled={currentStepIndex === 0}
                      onClick={handlePrevious}
                      className="btn-sprout-ghost disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      <span>Previous</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="btn-sprout-primary"
                    >
                      <span>
                        {currentStepIndex === steps.length - 1 ? 'Finish Procedure' : 'Next Step'}
                      </span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 pt-8 text-center text-xs text-[#6e797a] border-t border-[#d9d9d9]">
        Step {currentStepIndex + 1} of {steps.length} • AdeManual IT Operating Procedures
      </footer>
    </div>
  );
}
