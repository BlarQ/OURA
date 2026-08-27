'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useOura, getProfileInitials } from '../../context/OuraContext';
import { Sparkles, Plus } from 'lucide-react';
import { ProfileModal } from '../profile/ProfileModal';

export const Header: React.FC = () => {
  const {
    activeProfile,
    partnerProfile,
    setQuickActionOpen,
    pendingConfirmationItem,
    confirmPurchase
  } = useOura();

  const [showProfileModal, setShowProfileModal] = useState(false);

  const initials = getProfileInitials(activeProfile.name);

  return (
    <header className="bg-gradient-to-br from-[#5b4be2] via-[#695be8] to-[#7b6cf6] text-white pt-5 pb-20 px-4 sm:px-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden transition-all duration-300">
      {/* Background Ambient Blur */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-10 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Top Header Navigation Row: Clean, Uncluttered Layout */}
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 relative z-10 min-w-0">
        {/* BRAND LOGO ONLY */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden shadow-lg border border-white/30 bg-white/10 p-1 flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
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
            <h1 className="text-sm font-black tracking-widest text-white leading-none">OURA</h1>
            <p className="text-[10px] text-indigo-100 font-semibold tracking-wide truncate max-w-[150px] mt-0.5">
              Our Life, Our Home, Our Plans.
            </p>
          </div>
        </div>

        {/* Right Header Controls: TWO CLEAN BUTTONS (+ Quick Action and Profile Initials Avatar Button) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Universal Quick + Button */}
          <button
            onClick={() => setQuickActionOpen(true)}
            className="flex items-center justify-center p-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl font-black shadow-lg transition-all active:scale-90 shrink-0"
            title="Quick Action (+)"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>

          {/* Profile Initials Avatar Button (No raw email strings) */}
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

      {/* Dual Purchase Confirmation Alert Banner */}
      {pendingConfirmationItem && (
        <div className="max-w-4xl mx-auto mt-3.5 z-10 relative animate-slideInRight">
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
