'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Terminal,
} from 'lucide-react';
import { createManual } from '@/lib/services/manuals';

const SUGGESTED_TITLES = [
  'Oracle DB Client Installation & TNS',
  'Cisco Core Switch VLAN Configuration',
  'SSH Key Rotation & Bastion Hardening',
  'ColSync Pipeline Background Cron Setup',
  'PostgreSQL Replication & Failover Playbook',
];

export default function NewManualPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a title for your procedure manual.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const newManualId = await createManual(title.trim());

      if (newManualId) {
        router.push(`/manuals/${newManualId}/edit`);
      } else {
        const demoId = `manual-${Date.now()}`;
        router.push(`/manuals/${demoId}/edit?title=${encodeURIComponent(title.trim())}`);
      }
    } catch (err: any) {
      console.error('Error creating manual:', err);
      setErrorMessage(err?.message || 'Failed to create manual. Please try again.');
      setIsSubmitting(false);
    }
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
              Create Playbook Shell
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-190 mx-auto px-3.5 sm:px-6 pt-6 sm:pt-10 pb-16 space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="badge-sprout-green text-[10px] sm:text-xs py-0.5 px-2.5 whitespace-nowrap inline-flex items-center gap-1.5">
              <Terminal className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-ink-black" />
              <span>New Procedure Manual</span>
            </div>

            {/* Single line title on mobile and desktop */}
            <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-ink-black tracking-tight whitespace-nowrap">
              Create IT Procedure Playbook
            </h1>

            <p className="text-xs sm:text-sm text-pewter leading-relaxed">
              Define the title for your procedure manual. You will then structure sequential steps, commands, and media attachments.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 sm:p-4 rounded-md bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs sm:text-sm text-red-700">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-red-600 mt-0.5" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Form Card (16px radius, 1px ash-gray border) */}
          <div className="card-sprout p-5 sm:p-7 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-ink-black flex items-center justify-between">
                  <span>Manual Title</span>
                  <span className="text-pewter font-normal lowercase text-[11px] sm:text-xs">Required</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="e.g. Oracle DB Client Installation & TNS Setup"
                    className="input-sprout w-full font-bold text-xs sm:text-sm text-ink-black py-2 sm:py-2.5 px-3 sm:px-4"
                  />
                </div>
              </div>

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

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-ash-gray flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
                <Link
                  href="/dashboard"
                  className="text-xs sm:text-sm font-bold text-pewter hover:text-ink-black link-sprout order-2 sm:order-1"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="btn-sprout-primary text-xs sm:text-sm py-2 px-4 w-full sm:w-auto order-1 sm:order-2 active:scale-95"
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
