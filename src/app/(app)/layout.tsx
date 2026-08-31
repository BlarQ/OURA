'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { MobileNav } from '@/components/layout/MobileNav';
import { QuickCreateModal } from '@/components/layout/QuickCreateModal';
import { SearchModal } from '@/components/search/SearchModal';
import { AlarmBannerModal } from '@/components/layout/AlarmBannerModal';
import { ConfirmModal } from '@/components/layout/ConfirmModal';
import { AppTourModal } from '@/components/layout/AppTourModal';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { authService } from '@/lib/services/auth';
import { initAlarmScheduler } from '@/lib/services/alarmScheduler';
import { requestNotificationPermission } from '@/lib/utils/audio';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    async function guardAuth() {
      const user = await authService.getCurrentUser();
      if (!user || !user.email) {
        router.push('/login');
      } else {
        setIsAuthChecked(true);
      }
    }
    guardAuth();

    requestNotificationPermission();
    const cleanup = initAlarmScheduler();
    return () => {
      if (cleanup) cleanup();
    };
  }, [router]);

  const handleSelectQuickCreateOption = (type: string) => {
    switch (type) {
      case 'TASK':
        router.push('/tasks');
        break;
      case 'ACTIVITY':
        router.push('/activities');
        break;
      case 'EXPENSE':
        router.push('/money/expenses');
        break;
      case 'INCOME':
        router.push('/money/income');
        break;
      case 'PLAN':
        router.push('/plans');
        break;
      case 'REMINDER':
        router.push('/notifications');
        break;
      case 'NOTE':
        router.push('/notes');
        break;
    }
  };

  if (!isAuthChecked) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-row font-sans selection:bg-indigo-600 selection:text-white">
      {/* Animated Entrance Splash Screen */}
      <SplashScreen />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden pb-16 md:pb-0">
        <AppHeader
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenQuickCreate={() => setIsQuickCreateOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-6 md:p-8 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        onOpenQuickCreate={() => setIsQuickCreateOpen(true)}
        onOpenMoreMenu={() => setIsSearchOpen(true)}
      />

      {/* Quick Create Modal */}
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onSelectOption={handleSelectQuickCreateOption}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Interactive Alarm Blasting Banner Modal */}
      <AlarmBannerModal />

      {/* Global Custom Confirmation & Toast Popup Manager */}
      <ConfirmModal />

      {/* Interactive 5-Step App Tour Modal */}
      <AppTourModal />
    </div>
  );
}
