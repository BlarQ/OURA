'use client';

import React, { useState } from 'react';
import { useOura, getProfileInitials } from '../../context/OuraContext';
import {
  X,
  User,
  LogOut,
  Copy,
  Check,
  CreditCard,
  Building,
  Calendar,
  Save,
  Link as LinkIcon
} from 'lucide-react';

export const ProfileModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const {
    currentRole,
    activeProfile,
    activeSalary,
    updateProfileName,
    updateSalaryProfile,
    connectPartnerCode,
    logoutUser
  } = useOura();

  const [copied, setCopied] = useState(false);
  const [nameInput, setNameInput] = useState(activeProfile.name);
  const [paydayInput, setPaydayInput] = useState<number | ''>(activeSalary.salaryDate || '');
  const [netSalaryInput, setNetSalaryInput] = useState<number | ''>(activeSalary.netSalary || '');
  const [employerInput, setEmployerInput] = useState(activeSalary.employer || '');
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [connectMsg, setConnectMsg] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const initials = getProfileInitials(activeProfile.name);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeProfile.coupleId || 'OURA-7782-W');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnectPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerCodeInput) return;
    const ok = connectPartnerCode(partnerCodeInput);
    if (ok) {
      setConnectMsg('✨ Partner successfully connected!');
      setTimeout(() => setConnectMsg(null), 3000);
    } else {
      setConnectMsg('⚠️ Invalid partner code');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput && nameInput.trim()) {
      updateProfileName(nameInput.trim());
    }
    updateSalaryProfile(
      typeof netSalaryInput === 'number' ? netSalaryInput : 0,
      employerInput,
      typeof paydayInput === 'number' ? paydayInput : 25
    );
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 rounded-[2.25rem] p-6 sm:p-7 max-w-md w-full shadow-2xl relative animate-fadeInScale space-y-5 max-h-[90vh] overflow-y-auto border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Profile Badge */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shrink-0 shadow-sm">
            {activeProfile.avatar}
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{activeProfile.name} ({initials})</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {activeProfile.coupleId !== 'UNLINKED' && activeProfile.coupleId !== 'OURA-LIVE'
                ? `Connected (${activeProfile.coupleId})`
                : 'Not Linked to Partner'}
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeInScale">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile & Salary settings saved!</span>
          </div>
        )}

        {/* Form Settings */}
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          {/* Section 1: Personal & Payday Settings */}
          <div className="space-y-3 pt-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Personal & Payday Settings
            </span>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Adedamola Ogunlala"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payday Date (Day)</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={paydayInput}
                    onChange={(e) => setPaydayInput(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                    placeholder="e.g. 25"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Net Salary (₦)</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    value={netSalaryInput}
                    onChange={(e) => setNetSalaryInput(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                    placeholder="e.g. 550000"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Employer / Company Name</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Lagos Hospital or Tech Firm"
                  value={employerInput}
                  onChange={(e) => setEmployerInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Partner Invitation & Connection (Wife generates code, Husband inputs code) */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Partner Connection Status
            </span>

            {connectMsg && (
              <div className="p-2.5 bg-indigo-50 text-[#695be8] rounded-xl font-bold text-xs animate-fadeInScale">
                {connectMsg}
              </div>
            )}

            {currentRole === 'wife' ? (
              /* Wife's Profile displays her Partner Code for the Husband to input */
              <div className="p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Your Partner Code</span>
                  <span className="text-base font-mono font-extrabold text-[#695be8]">
                    {activeProfile.coupleId && activeProfile.coupleId !== 'UNLINKED' ? activeProfile.coupleId : 'OURA-7782-W'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-[#695be8] text-white font-bold rounded-xl text-[11px] hover:bg-indigo-700 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Share Code'}</span>
                </button>
              </div>
            ) : (
              /* Husband's Profile inputs Wife's Partner Code to connect */
              <div className="space-y-2">
                {activeProfile.coupleId && activeProfile.coupleId !== 'UNLINKED' && activeProfile.coupleId !== 'OURA-LIVE' ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] block font-bold text-emerald-700">Connected Partner</span>
                      <span className="font-mono font-extrabold text-xs">{activeProfile.coupleId}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      ✓ Linked
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Connect to Wife's Partner Code
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. OURA-7782-W"
                        value={partnerCodeInput}
                        onChange={(e) => setPartnerCodeInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold uppercase focus:outline-[#695be8]"
                      />
                      <button
                        type="button"
                        onClick={handleConnectPartner}
                        className="px-3 py-2 bg-[#695be8] text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-1 shrink-0"
                      >
                        <LinkIcon className="w-3.5 h-3.5" /> Connect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                logoutUser();
              }}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#695be8] hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-all shadow active:scale-95 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
