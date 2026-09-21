'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  ArrowRight,
  LogOut,
  Trash2,
  Edit3,
  X,
  FileText,
  CheckCircle2,
  CalendarDays,
  BookOpen,
  Lock,
} from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import type { ManualListItem } from '@/lib/services/manuals';
import { deleteManual } from '@/lib/services/manuals';
import { createClient } from '@/lib/supabase/client';
import SecretCodeModal from '@/components/auth/SecretCodeModal';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import WeeklyPlanner from '@/components/planner/WeeklyPlanner';
import Interactive3DBackground from '@/components/common/Interactive3DBackground';

interface ManualsDashboardProps {
  initialManuals: ManualListItem[];
  userEmail?: string;
  userName?: string;
}

export default function ManualsDashboard({
  initialManuals,
  userEmail,
  userName = 'Adedamola Ogunlala',
}: ManualsDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'planner' | 'manuals'>('planner');
  const [manuals, setManuals] = useState<ManualListItem[]>(initialManuals);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [manualToDelete, setManualToDelete] = useState<ManualListItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Derive initials from user name (e.g. "Adedamola Ogunlala" -> "AO")
  const userInitials = useMemo(() => {
    const raw = (userName || userEmail?.split('@')[0] || 'AO').trim();
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return raw.substring(0, 2).toUpperCase();
  }, [userName, userEmail]);

  // Filter manuals by title or description
  const filteredManuals = useMemo(() => {
    if (!searchQuery.trim()) return manuals;
    const q = searchQuery.toLowerCase();
    return manuals.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.description_preview && m.description_preview.toLowerCase().includes(q))
    );
  }, [manuals, searchQuery]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleConfirmDelete = async () => {
    if (!manualToDelete) return;
    const success = await deleteManual(manualToDelete.id);
    if (success) {
      setManuals((prev) => prev.filter((m) => m.id !== manualToDelete.id));
      const deletedTitle = manualToDelete.title;
      setManualToDelete(null);
      setNotification(`"${deletedTitle}" was deleted successfully.`);
      setTimeout(() => setNotification(null), 4000);
    } else {
      throw new Error('Could not delete manual from database. Please try again.');
    }
  };

  const formatManualDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="relative min-h-screen bg-paper-white text-ink-black font-sans flex flex-col justify-between selection:bg-sprout-green selection:text-ink-black overflow-x-hidden">
      {/* 3D Interactive Mouse Background */}
      <Interactive3DBackground />

      <SecretCodeModal
        isOpen={showSecretModal}
        onClose={() => setShowSecretModal(false)}
        redirectTo="/signup"
      />

      <DeleteConfirmModal
        isOpen={!!manualToDelete}
        manualTitle={manualToDelete?.title || ''}
        onClose={() => setManualToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <div className="relative z-10">
        {/* Top Navigation Bar */}
        <header className="sticky top-2 sm:top-4 z-30 max-w-300 mx-auto px-3 sm:px-6 my-2 sm:my-3">
          <div className="nav-sprout h-14 sm:h-16 px-3.5 sm:px-5 flex items-center justify-between backdrop-blur-md bg-white/95">
            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 group cursor-pointer shrink-0"
            >
              <BrandLogo size="md" />
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-ink-black">
                AdeManual
              </span>
            </Link>

            {/* Desktop Navigation Tabs Switcher with Sliding Active Indicator */}
            <div className="hidden sm:flex items-center relative bg-slate-100 p-1 rounded-lg border border-ash-gray">
              <button
                type="button"
                onClick={() => setActiveTab('planner')}
                className={`relative z-10 px-3.5 sm:px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'planner'
                    ? 'text-white bg-ink-black shadow-sm'
                    : 'text-pewter hover:text-ink-black'
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Weekly IT Planner</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manuals')}
                className={`relative z-10 px-3.5 sm:px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'manuals'
                    ? 'text-white bg-ink-black shadow-sm'
                    : 'text-pewter hover:text-ink-black'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Procedure Playbooks ({manuals.length})</span>
              </button>
            </div>

            {/* User Info & Actions: Uses Initials (e.g. AO) on Mobile, Full Name on Desktop */}
            <div className="flex items-center gap-2 sm:gap-3 text-sm shrink-0">
              <div
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-3xl bg-slate-100 border border-ash-gray text-ink-black font-bold text-xs hover:border-ink-black transition-colors whitespace-nowrap"
                title={userName || userEmail || 'Adedamola Ogunlala'}
              >
                <span className="w-2 h-2 rounded-full bg-sprout-green shrink-0 animate-pulse" />
                {/* On mobile: 2-letter Initials AO */}
                <span className="sm:hidden font-extrabold">{userInitials}</span>
                {/* On desktop: Full name */}
                <span className="hidden sm:inline">{userName || userEmail?.split('@')[0]}</span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1 sm:p-0 text-[13px] font-bold text-pewter hover:text-ink-black transition cursor-pointer flex items-center gap-1 hover:translate-x-0.5"
                title="Sign out"
              >
                <LogOut className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Sub-Navigation Tabs (< 640px) */}
        <div className="sm:hidden max-w-300 mx-auto px-3 my-1.5">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-ash-gray">
            <button
              type="button"
              onClick={() => setActiveTab('planner')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'planner'
                  ? 'bg-ink-black text-white shadow-sm'
                  : 'text-pewter hover:text-ink-black'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Weekly Planner</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manuals')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'manuals'
                  ? 'bg-ink-black text-white shadow-sm'
                  : 'text-pewter hover:text-ink-black'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Playbooks ({manuals.length})</span>
            </button>
          </div>
        </div>

        {/* Main Workspace Container (Max-width 1200px) */}
        <main className="max-w-300 mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
          {/* Success Notification */}
          {notification && (
            <div className="p-3.5 sm:p-4 rounded-md bg-sprout-green/20 border border-sprout-green flex items-center justify-between text-xs font-bold text-ink-black animate-modal-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-ink-black" />
                <span>{notification}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="p-1 text-ink-black hover:opacity-75 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Welcome Banner */}
          <WelcomeBanner userName={userName} manualsCount={manuals.length} />

          {/* =====================================================================
              TAB 1: WEEKLY IT OPERATIONS PLANNER (5-Day Mon-Fri Calendar)
              ===================================================================== */}
          {activeTab === 'planner' && (
            <div key="tab-planner" className="space-y-4 sm:space-y-6 animate-tab-content">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 border-b border-ash-gray pb-3 sm:pb-4">
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-nowrap">
                    <h2 className="text-base sm:text-2xl md:text-3xl font-extrabold text-ink-black tracking-tight whitespace-nowrap">
                      Weekly IT Operations Planner
                    </h2>
                    <span className="badge-sprout-green text-[10px] sm:text-xs py-0.5 px-2 whitespace-nowrap shrink-0">
                      5-Day Weekdays
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-pewter leading-relaxed">
                    Schedule multiple operational tasks, server maintenance windows, and procedure execution per day.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                  <Link
                    href="/manuals/new"
                    className="btn-sprout-primary text-xs sm:text-sm w-full sm:w-auto text-center"
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                    <span>New Manual</span>
                  </Link>
                </div>
              </div>

              {/* 5-Day Weekly Planner Calendar */}
              <WeeklyPlanner manuals={manuals} />
            </div>
          )}

          {/* =====================================================================
              TAB 2: PROCEDURE MANUALS LIBRARY
              ===================================================================== */}
          {activeTab === 'manuals' && (
            <div key="tab-manuals" className="space-y-4 sm:space-y-6 animate-tab-content">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-ash-gray pb-4 sm:pb-5">
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-ink-black tracking-tight whitespace-nowrap">
                      IT Procedure Manuals
                    </h2>
                    <span className="badge-sprout-neutral text-[10px] sm:text-xs py-0.5 px-2 whitespace-nowrap shrink-0">
                      {manuals.length} {manuals.length === 1 ? 'Entry' : 'Entries'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-pewter">
                    Standard Operating Procedures with photo & video execution guides
                  </p>
                </div>

                <Link
                  href="/manuals/new"
                  className="btn-sprout-primary text-xs sm:text-sm shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  <span>New Manual</span>
                </Link>
              </div>

              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-pewter">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search procedures, systems, keywords..."
                  className="input-sprout w-full pl-9 sm:pl-10 pr-9 sm:pr-10 text-xs sm:text-sm py-2 px-3"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 sm:pr-3.5 flex items-center text-pewter hover:text-ink-black cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Procedure Cards List */}
              <div className="space-y-3 sm:space-y-4">
                {filteredManuals.length === 0 ? (
                  <div className="card-sprout p-8 sm:p-12 text-center space-y-3 sm:space-y-4 border-dashed">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-slate-100 border border-ash-gray text-ink-black mx-auto flex items-center justify-center">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-extrabold text-ink-black">
                        {searchQuery ? 'No matching procedures found' : 'No procedure manuals yet'}
                      </h3>
                      <p className="text-xs text-pewter max-w-sm mx-auto">
                        {searchQuery
                          ? `No procedure records matching "${searchQuery}". Clear your query or create a new playbook.`
                          : 'Get started by creating your first IT standard operating procedure.'}
                      </p>
                    </div>
                    <div className="pt-1 sm:pt-2">
                      <Link
                        href="/manuals/new"
                        className="btn-sprout-primary text-xs sm:text-sm"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        <span>Create First Manual</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  filteredManuals.map((item, idx) => (
                    <div
                      key={item.id}
                      className="card-sprout p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all duration-200 hover:border-ink-black hover:-translate-y-0.5 hover:shadow-md animate-tab-content"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0 pr-0 sm:pr-4">
                        <Link
                          href={`/manuals/${item.id}`}
                          className="text-base sm:text-xl font-extrabold text-ink-black hover:text-ink-black link-sprout block truncate"
                        >
                          {item.title}
                        </Link>
                        <p className="text-xs sm:text-sm text-pewter line-clamp-2 leading-relaxed">
                          {item.description_preview ||
                            'Sequential operating steps, command lines, and media documentation.'}
                        </p>
                        <div className="flex items-center gap-2 sm:gap-3 pt-0.5 text-[11px] sm:text-xs text-pewter font-bold">
                          <span className="badge-sprout-neutral text-[10px] sm:text-xs py-0.5 px-2">
                            {item.steps_count} {item.steps_count === 1 ? 'Step' : 'Steps'}
                          </span>
                          <span>•</span>
                          <span>{formatManualDate(item.updated_at || item.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center shrink-0">
                        <Link
                          href={`/manuals/${item.id}/edit`}
                          className="p-1.5 sm:p-2 text-pewter hover:text-ink-black hover:bg-slate-100 rounded-md transition cursor-pointer border border-transparent hover:border-ash-gray"
                          title="Edit Manual"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setManualToDelete(item)}
                          className="p-1.5 sm:p-2 text-pewter hover:text-red-600 hover:bg-red-50 rounded-md transition cursor-pointer border border-transparent hover:border-red-200"
                          title="Delete Manual"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <Link
                          href={`/manuals/${item.id}`}
                          className="btn-sprout-ghost text-xs py-1.5 px-2.5 sm:px-3 ml-0.5 sm:ml-1"
                        >
                          <span>Open Playbook</span>
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 max-w-300 w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 text-xs text-pewter flex items-center justify-between border-t border-ash-gray mt-8 sm:mt-12 bg-white/80 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span>AdeManual IT Operations</span>
          <span>•</span>
          <span>PostgreSQL RLS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-pewter/60">Protected Playbooks</span>
          <button
            type="button"
            onClick={() => setShowSecretModal(true)}
            aria-label="Security Authorization"
            className="p-1 text-pewter/30 hover:text-pewter/80 rounded transition cursor-pointer"
          >
            <Lock className="h-3 w-3 opacity-30 hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </footer>
    </div>
  );
}
