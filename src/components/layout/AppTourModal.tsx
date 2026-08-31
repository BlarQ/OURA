'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Sun, Calendar, DollarSign, Compass, FileText,
  ChevronRight, ChevronLeft, CheckCircle2, X, Play
} from 'lucide-react';

export function AppTourModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isPromptMode, setIsPromptMode] = useState<boolean>(true); // Initial prompt vs active tour
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const showTour = localStorage.getItem('oura_show_app_tour');
      if (showTour === 'true') {
        setIsOpen(true);
        setIsPromptMode(true);
      }

      // Listen for custom trigger event (e.g. from Settings)
      const handleTrigger = () => {
        setIsOpen(true);
        setIsPromptMode(true);
        setCurrentStep(1);
      };
      window.addEventListener('oura_start_app_tour', handleTrigger);
      return () => window.removeEventListener('oura_start_app_tour', handleTrigger);
    }
  }, []);

  if (!isOpen) return null;

  const handleAcceptTour = () => {
    setIsPromptMode(false);
    setCurrentStep(1);
  };

  const handleSkipTour = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('oura_show_app_tour');
    }
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      // Optionally navigate preview route for immersion
      if (nextStep === 2) router.push('/calendar');
      else if (nextStep === 3) router.push('/money/overview');
      else if (nextStep === 4) router.push('/plans');
      else if (nextStep === 5) router.push('/notes');
    } else {
      handleFinishTour();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);

      if (prevStep === 1) router.push('/today');
      else if (prevStep === 2) router.push('/calendar');
      else if (prevStep === 3) router.push('/money/overview');
      else if (prevStep === 4) router.push('/plans');
    }
  };

  const handleFinishTour = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('oura_show_app_tour');
    }
    router.push('/today');
  };

  const steps = [
    {
      step: 1,
      title: 'Your Daily Command Center',
      subtitle: 'Today Dashboard (/today)',
      icon: Sun,
      color: 'bg-amber-500 text-white',
      desc: 'Overview of your daily tasks, task progress completion gauge, available financial balance, and active goals in one unified view.',
    },
    {
      step: 2,
      title: 'Calendar & Work Shift Roster',
      subtitle: 'Interactive Schedule (/calendar)',
      icon: Calendar,
      color: 'bg-indigo-500 text-white',
      desc: 'Click any date to inspect tasks and events. Click "⚡ Roster Templates" to generate Sapphire (2-2-2), Flexi-Remote, or custom work shifts for the entire year!',
    },
    {
      step: 3,
      title: 'Complete Financial & Salary OS',
      subtitle: 'Money Hub (/money/overview)',
      icon: DollarSign,
      color: 'bg-emerald-500 text-white',
      desc: 'Track base salary, monthly income & expenses, category budgets, bill payment reminders, running balances, and savings goals.',
    },
    {
      step: 4,
      title: 'Multi-Item Planning',
      subtitle: 'Apartment Setup & Projects (/plans)',
      icon: Compass,
      color: 'bg-purple-500 text-white',
      desc: 'Organize complex multi-item life plans, itemized budgets, estimated vs actual costs, and project milestones.',
    },
    {
      step: 5,
      title: 'Mobile Notepad & Quick Create',
      subtitle: 'Notes & (+) Shortcut (/notes)',
      icon: FileText,
      color: 'bg-blue-500 text-white',
      desc: 'Draft quick thoughts, edit notes, copy/share formatted notes as messages directly to WhatsApp/SMS, and use the (+) button anywhere!',
    },
  ];

  const currentTourData = steps[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200 dark:border-slate-800 animate-scaleUp relative overflow-hidden">
        {/* PROMPT MODE: OFFER TOUR OR SKIP */}
        {isPromptMode ? (
          <div className="space-y-6 text-center">
            <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mb-2 border border-indigo-100 dark:border-indigo-900">
              <Sparkles className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Welcome to OURA! 👋
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Would you like a quick 2-minute guided tour of your new personal life, work roster, and financial workspace?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleSkipTour}
                className="w-full sm:w-1/2 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all"
              >
                Skip for Now
              </button>
              <button
                onClick={handleAcceptTour}
                className="w-full sm:w-1/2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Take Quick Tour</span>
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE TOUR MODE (STEPS 1 - 5) */
          <div className="space-y-6">
            {/* Header & Step Counter */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-xl">
                Step {currentStep} of 5
              </span>

              <button
                onClick={handleFinishTour}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Close Tour"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Card Content */}
            <div className="space-y-4 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className={`p-4 rounded-3xl ${currentTourData.color} shadow-md`}>
                  <currentTourData.icon className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {currentTourData.subtitle}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {currentTourData.title}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {currentTourData.desc}
              </p>
            </div>

            {/* Navigation Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {/* Step Dots */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`w-2 h-2 rounded-full transition-all ${
                      s === currentStep ? 'w-5 bg-indigo-600 dark:bg-indigo-400' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNextStep}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <span>{currentStep === 5 ? 'Finish Tour' : 'Next'}</span>
                {currentStep === 5 ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
