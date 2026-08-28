'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useOura, getProfileInitials } from '../../context/OuraContext';
import {
  Sparkles,
  Plus,
  CalendarDays,
  HeartPulse,
  UtensilsCrossed
} from 'lucide-react';
import { ProfileModal } from '../profile/ProfileModal';

export const Header: React.FC = () => {
  const {
    activeProfile,
    partnerProfile,
    setQuickActionOpen,
    pendingConfirmationItem,
    confirmPurchase,
    activeTab,
    setActiveTab
  } = useOura();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initials = getProfileInitials(activeProfile.name);

  // Secondary Navigation Icons with vibrant, distinct background colors
  const secondaryNavIcons = [
    {
      id: 'duty',
      name: 'Duty Schedule',
      icon: CalendarDays,
      bgClass: 'bg-emerald-500 hover:bg-emerald-400 text-white border-emerald-300/80 shadow-emerald-500/40'
    },
    {
      id: 'health',
      name: 'Health & Cycle',
      icon: HeartPulse,
      bgClass: 'bg-rose-500 hover:bg-rose-400 text-white border-rose-300/80 shadow-rose-500/40'
    },
    {
      id: 'meals',
      name: 'Meal Planner',
      icon: UtensilsCrossed,
      bgClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300/80 shadow-amber-500/40'
    }
  ];

  const handleSelectNav = (tabId: string) => {
    setActiveTab(tabId);
    setLogoMenuOpen(false);
  };

  return (
    <header className="bg-gradient-to-br from-[#5b4be2] via-[#695be8] to-[#7b6cf6] text-white pt-5 pb-20 px-4 sm:px-6 rounded-b-[2.5rem] shadow-xl relative z-10 transition-all duration-300">
      {/* Background Ambient Blur */}
      <div className="absolute inset-0 rounded-b-[2.5rem] overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-10 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl" />
      </div>

      {/* Main Top Header Navigation Row */}
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 relative z-20 min-w-0">
        {/* BRAND LOGO BUTTON */}
        <div className="relative">
          <button
            onClick={() => setLogoMenuOpen(!logoMenuOpen)}
            className="flex items-center gap-2.5 text-left shrink-0 group focus:outline-none"
            title="Click logo to toggle extra features (Duty, Health, Meals)"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden shadow-lg border border-white/40 bg-white/15 p-1 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-active:scale-95 group-hover:border-amber-300">
              <Image
                src="/logo.png"
                alt="OURA Logo"
                width={40}
                height={40}
                className="object-contain w-full h-full rounded-xl"
                priority
              />
            </div>
            <div className="hidden xs:block min-w-0">
              <h1 className="text-sm font-black tracking-widest text-white leading-none group-hover:text-amber-200 transition-colors">
                OURA
              </h1>
              <p className="text-[10px] text-indigo-100 font-semibold tracking-wide truncate max-w-[150px] mt-0.5">
                Our Life, Our Home, Our Plans.
              </p>
            </div>
          </button>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 relative z-20">
          {/* Universal Quick + Button */}
          <button
            onClick={() => setQuickActionOpen(true)}
            className="flex items-center justify-center p-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl font-black shadow-lg transition-all active:scale-90 shrink-0"
            title="Quick Action (+)"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>

          {/* Profile Initials Avatar Button */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-extrabold px-3 py-2 rounded-2xl backdrop-blur-md border border-white/25 transition-all active:scale-95 shadow-sm shrink-0"
            title="Profile & Account Settings"
          >
            <span className="text-sm shrink-0">{activeProfile.avatar}</span>
            <span className="font-mono tracking-wide font-black text-xs">{initials}</span>
          </button>
        </div>
      </div>

      {/* ANIMATED VERTICAL ICON DROPDOWN - MOUNTED DIRECTLY TO DOCUMENT.BODY VIA REACT PORTAL (z-[999999]) */}
      {mounted && logoMenuOpen && createPortal(
        <>
          {/* Fullscreen Backdrop */}
          <div
            className="fixed inset-0 z-[999998]"
            onClick={() => setLogoMenuOpen(false)}
          />

          {/* Floating Vertical Icon Stack directly under top-left logo */}
          <div className="fixed top-[70px] left-4 sm:left-6 z-[999999] flex flex-col gap-2.5 animate-slideDownNav pointer-events-auto">
            {secondaryNavIcons.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id)}
                  title={item.name}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all duration-300 relative group active:scale-90 shadow-2xl border-2 backdrop-blur-xl ${
                    item.bgClass
                  } ${
                    isActive ? 'ring-4 ring-white/90 scale-110 shadow-2xl z-10' : 'hover:scale-105'
                  }`}
                >
                  <Icon className="w-5 h-5 drop-shadow-md" />

                  {/* Tooltip Label on Hover (Floats to the Right) */}
                  <span className="absolute left-12 sm:left-14 top-1/2 -translate-y-1/2 bg-slate-950 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-2xl border border-slate-700">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}

      {/* Dual Purchase Confirmation Alert Banner */}
      {pendingConfirmationItem && (
        <div className="max-w-4xl mx-auto mt-3.5 z-20 relative animate-slideInRight">
          <div className="bg-amber-400 text-slate-950 p-3 rounded-2xl flex items-center justify-between gap-2 shadow-lg border border-amber-300 text-xs min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-slate-900 shrink-0" />
              <div className="truncate">
                <span className="font-bold">{partnerProfile.name} marked purchased: </span>
                <span className="underline font-extrabold truncate">{pendingConfirmationItem.name}</span> (₦{pendingConfirmationItem.currentPrice.toLocaleString()})
              </div>
            </div>
            <button
              onClick={() => confirmPurchase(pendingConfirmationItem.id, true)}
              className="bg-slate-950 text-white text-[11px] font-bold px-3 py-1 rounded-xl hover:bg-slate-900 transition-all active:scale-95 shadow shrink-0 whitespace-nowrap"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Profile & Account Management Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </header>
  );
};
