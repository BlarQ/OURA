'use client';

import React, { useState, useEffect } from 'react';
import { useOura } from '../context/OuraContext';
import { Header } from '../components/layout/Header';
import { Navigation } from '../components/layout/Navigation';
import { SplashScreen } from '../components/layout/SplashScreen';
import { AuthScreen } from '../components/auth/AuthScreen';
import { LandingPage } from '../components/landing/LandingPage';

import { AttentionCenter } from '../components/dashboard/AttentionCenter';
import { TodaySummary } from '../components/dashboard/TodaySummary';
import { QuickActionModal } from '../components/dashboard/QuickActionModal';

import { MyFinances } from '../components/finance/MyFinances';
import { OurFinances } from '../components/finance/OurFinances';
import { FinancialSharing } from '../components/finance/FinancialSharing';

import { EquipmentTracker } from '../components/home/EquipmentTracker';
import { ApartmentSetup } from '../components/home/ApartmentSetup';
import { DreamHome } from '../components/home/DreamHome';
import { Inventory } from '../components/home/Inventory';

import { DutySchedule } from '../components/duty/DutySchedule';
import { CycleTracker } from '../components/health/CycleTracker';
import { MealPlanner } from '../components/meals/MealPlanner';

import { CoupleTasks } from '../components/productivity/CoupleTasks';
import { CoupleDecisions } from '../components/productivity/CoupleDecisions';
import { NotesVault } from '../components/productivity/NotesVault';
import { RemindersList } from '../components/productivity/RemindersList';

import { OuraAssistant } from '../components/ai/OuraAssistant';

export default function Home() {
  const { activeTab, isAuthenticated } = useOura();
  const [showSplash, setShowSplash] = useState(true);
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('landing');

  // Sub-tabs state
  const [financeSubTab, setFinanceSubTab] = useState<'my' | 'our' | 'sharing'>('my');
  const [homeSubTab, setHomeSubTab] = useState<'equipment' | 'apartment' | 'dream' | 'inventory'>('equipment');
  const [productivitySubTab, setProductivitySubTab] = useState<'tasks' | 'decisions' | 'notes' | 'reminders'>('tasks');

  // PWA Standalone vs Browser Visit Auto-Detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://') ||
        localStorage.getItem('oura_pwa_mode') === 'true';

      if (isStandalone || isAuthenticated) {
        setViewMode('app');
        try {
          localStorage.setItem('oura_pwa_mode', 'true');
        } catch (e) {}
      } else {
        setViewMode('landing');
      }
    }
  }, [isAuthenticated]);

  // Mode 1: Product Landing Page (Web Browser Direct Visitors)
  if (viewMode === 'landing' && !isAuthenticated) {
    return <LandingPage onLaunchApp={() => setViewMode('app')} />;
  }

  // Mode 2: Installed PWA & Authenticated App Interface (Splash -> Login -> Dashboard)
  return (
    <div className="min-h-screen bg-[#f1f3fd] text-slate-900 font-sans antialiased selection:bg-[#695be8] selection:text-white flex flex-col">
      {/* 1. Animated Opening Splash Screen */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* 2. Authentication Landing Screen (Shown if user is NOT logged in and splash completed) */}
      {!showSplash && !isAuthenticated ? (
        <AuthScreen />
      ) : (
        /* 3. Main Dashboard & App Interface (Shown when authenticated) */
        <>
          <Header />

          <main className="max-w-4xl w-full mx-auto px-3 sm:px-6 -mt-12 relative z-20 space-y-5 pb-36 flex-1 min-w-0">
            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-5 animate-fadeInScale">
                <TodaySummary />
                <AttentionCenter />
              </div>
            )}

            {/* TAB 2: FINANCES */}
            {activeTab === 'finances' && (
              <div className="space-y-5 animate-fadeInScale">
                <div className="flex bg-white p-1.5 rounded-2xl shadow-ios border border-slate-200/60 max-w-md mx-auto">
                  <button
                    onClick={() => setFinanceSubTab('my')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap ${
                      financeSubTab === 'my' ? 'bg-[#695be8] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    My Finances
                  </button>
                  <button
                    onClick={() => setFinanceSubTab('our')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap ${
                      financeSubTab === 'our' ? 'bg-[#695be8] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Our Finances
                  </button>
                  <button
                    onClick={() => setFinanceSubTab('sharing')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap ${
                      financeSubTab === 'sharing' ? 'bg-[#695be8] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Permissions
                  </button>
                </div>

                {financeSubTab === 'my' && <MyFinances />}
                {financeSubTab === 'our' && <OurFinances />}
                {financeSubTab === 'sharing' && <FinancialSharing />}
              </div>
            )}

            {/* TAB 3: HOME & EQUIPMENT */}
            {activeTab === 'household' && (
              <div className="space-y-5 animate-fadeInScale">
                <div className="flex bg-white p-1.5 rounded-2xl shadow-ios border border-slate-200/60 max-w-lg mx-auto overflow-x-auto">
                  <button
                    onClick={() => setHomeSubTab('equipment')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                      homeSubTab === 'equipment' ? 'bg-[#695be8] text-white shadow-md' : 'text-slate-500'
                    }`}
                  >
                    Equipment
                  </button>
                  <button
                    onClick={() => setHomeSubTab('apartment')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                      homeSubTab === 'apartment' ? 'bg-[#695be8] text-white shadow-md' : 'text-slate-500'
                    }`}
                  >
                    Apartments
                  </button>
                  <button
                    onClick={() => setHomeSubTab('dream')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                      homeSubTab === 'dream' ? 'bg-[#695be8] text-white shadow-md' : 'text-slate-500'
                    }`}
                  >
                    Dream Home
                  </button>
                  <button
                    onClick={() => setHomeSubTab('inventory')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                      homeSubTab === 'inventory' ? 'bg-[#695be8] text-white shadow-md' : 'text-slate-500'
                    }`}
                  >
                    Inventory
                  </button>
                </div>

                {homeSubTab === 'equipment' && <EquipmentTracker />}
                {homeSubTab === 'apartment' && <ApartmentSetup />}
                {homeSubTab === 'dream' && <DreamHome />}
                {homeSubTab === 'inventory' && <Inventory />}
              </div>
            )}

            {/* TAB 4: DUTY */}
            {activeTab === 'duty' && (
              <div className="animate-fadeInScale">
                <DutySchedule />
              </div>
            )}

            {/* TAB 5: HEALTH */}
            {activeTab === 'health' && (
              <div className="animate-fadeInScale">
                <CycleTracker />
              </div>
            )}

            {/* TAB 6: MEALS */}
            {activeTab === 'meals' && (
              <div className="animate-fadeInScale">
                <MealPlanner />
              </div>
            )}

            {/* TAB 7: PRODUCTIVITY & TASKS */}
            {activeTab === 'productivity' && (
              <div className="space-y-5 animate-fadeInScale">
                <div className="flex bg-white p-1.5 rounded-2xl shadow-ios border border-slate-200/60 max-w-md mx-auto">
                  <button
                    onClick={() => setProductivitySubTab('tasks')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap ${
                      productivitySubTab === 'tasks' ? 'bg-[#695be8] text-white shadow-md' : 'text-slate-500'
                    }`}
                  >
                    Tasks
                  </button>
                  <button
                    onClick={() => setProductivitySubTab('decisions')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap ${
                      productivitySubTab === 'decisions' ? 'bg-[#695be8] text-white shadow-md' : 'text-slate-500'
                    }`}
                  >
                    Decisions
                  </button>
                  <button
                    onClick={() => setProductivitySubTab('notes')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap ${
                      productivitySubTab === 'notes' ? 'bg-[#695be8] text-white shadow-md' : 'text-slate-500'
                    }`}
                  >
                    Notes
                  </button>
                  <button
                    onClick={() => setProductivitySubTab('reminders')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 whitespace-nowrap ${
                      productivitySubTab === 'reminders' ? 'bg-[#695be8] text-white shadow-md' : 'text-slate-500'
                    }`}
                  >
                    Reminders
                  </button>
                </div>

                {productivitySubTab === 'tasks' && <CoupleTasks />}
                {productivitySubTab === 'decisions' && <CoupleDecisions />}
                {productivitySubTab === 'notes' && <NotesVault />}
                {productivitySubTab === 'reminders' && <RemindersList />}
              </div>
            )}

            {/* TAB 8: AI ASSISTANT */}
            {activeTab === 'ai' && (
              <div className="animate-fadeInScale">
                <OuraAssistant />
              </div>
            )}
          </main>

          <QuickActionModal />
          <Navigation />
        </>
      )}
    </div>
  );
}
