'use client';

import React, { useState } from 'react';
import { useOura } from '../../context/OuraContext';
import { CalendarDays, Sun, Moon, Coffee, Sparkles, Home, Settings, Check } from 'lucide-react';
import { getDutySummaryText } from '../../lib/dutyEngine';

export const DutySchedule: React.FC = () => {
  const {
    dutyDays,
    dutySetup,
    updateDutySetup,
    updateHusbandWfhDays,
    husbandProfile,
    wifeProfile,
    currentRole
  } = useOura();

  const [showSetup, setShowSetup] = useState(!dutySetup.isConfigured);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Shift Rotation Setup State
  const [day1Date, setDay1Date] = useState(dutySetup.day1Date || todayStr);
  const [day1Type, setDay1Type] = useState<'Morning' | 'Night' | 'OFF'>(dutySetup.day1Type || 'Morning');
  const [day2Date, setDay2Date] = useState(dutySetup.day2Date || tomorrowStr);
  const [day2Type, setDay2Type] = useState<'Morning' | 'Night' | 'OFF'>(dutySetup.day2Type || 'Morning');

  // Husband WFH Days State
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [selectedWfhDays, setSelectedWfhDays] = useState<string[]>(husbandProfile.husbandWfhDays || ['Tuesday']);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggleWfhDay = (day: string) => {
    if (selectedWfhDays.includes(day)) {
      setSelectedWfhDays(selectedWfhDays.filter((d) => d !== day));
    } else {
      setSelectedWfhDays([...selectedWfhDays, day]);
    }
  };

  const handleSaveSetup = (e: React.FormEvent) => {
    e.preventDefault();
    updateDutySetup({
      isConfigured: true,
      day1Date,
      day1Type,
      day2Date,
      day2Type
    });
    updateHusbandWfhDays(selectedWfhDays);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowSetup(false);
    }, 1200);
  };

  const getDutyBadge = (dutyType: 'Morning' | 'Night' | 'OFF') => {
    switch (dutyType) {
      case 'Morning':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-xs flex items-center gap-1 shrink-0 whitespace-nowrap"><Sun className="w-3.5 h-3.5" /> Morning Shift</span>;
      case 'Night':
        return <span className="bg-indigo-900 text-indigo-100 font-bold px-2.5 py-1 rounded-full text-xs flex items-center gap-1 shrink-0 whitespace-nowrap"><Moon className="w-3.5 h-3.5" /> Night Shift</span>;
      case 'OFF':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-xs flex items-center gap-1 shrink-0 whitespace-nowrap"><Coffee className="w-3.5 h-3.5" /> OFF Duty</span>;
    }
  };

  const wifeDisplayName = wifeProfile.name && wifeProfile.name !== 'User' ? wifeProfile.name : 'Wife';

  return (
    <div className="space-y-5 animate-fadeInScale">
      {/* Top Banner - Duty Schedule */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                WORK DUTY ROTATION ENGINE
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                {currentRole === 'husband'
                  ? `Viewing ${wifeDisplayName}'s shifts & syncing your WFH days`
                  : `6-Day Repeating Shift Schedule (2 Morning ➔ 2 Night ➔ 2 OFF)`}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowSetup(!showSetup)}
          className="flex items-center gap-1.5 bg-[#695be8] hover:bg-indigo-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-2xl transition-all shadow-md active:scale-95 shrink-0 whitespace-nowrap"
        >
          <Settings className="w-4 h-4" /> {showSetup ? 'Hide Setup' : 'Configure Shift Baseline'}
        </button>
      </div>

      {/* TOP CONFIGURATION CARD (2-Day Shift Baseline & Husband WFH Days Entry) */}
      {showSetup && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-5 shadow-sm space-y-3 animate-fadeInScale">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-extrabold text-indigo-950 flex items-center gap-1.5 truncate">
              <Settings className="w-4 h-4 text-indigo-600 shrink-0" />
              CONFIGURE SHIFT BASELINE & WFH DAYS
            </h3>
            {saveSuccess && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap">
                <Check className="w-3.5 h-3.5" /> Saved & Synced!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSetup} className="space-y-3 text-xs">
            {/* Husband WFH Day Selection */}
            {currentRole === 'husband' && (
              <div className="p-3 bg-white rounded-2xl border border-indigo-100 space-y-2">
                <label className="font-extrabold text-slate-800 text-[11px] block">
                  Select Husband's Work From Home (WFH) / Free Days:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {weekDays.map((day) => {
                    const isChecked = selectedWfhDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWfhDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isChecked
                            ? 'bg-[#695be8] text-white border-[#695be8] shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        🏠 {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2-Day Shift Baseline Entry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Day 1 Entry */}
              <div className="p-3 bg-white rounded-2xl border border-indigo-100 space-y-2">
                <span className="font-extrabold text-slate-800 text-[11px] block">
                  Day 1 Baseline ({wifeDisplayName}'s Shift)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Date</label>
                    <input
                      type="date"
                      value={day1Date}
                      onChange={(e) => setDay1Date(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Shift Type</label>
                    <select
                      value={day1Type}
                      onChange={(e) => setDay1Type(e.target.value as any)}
                      className="w-full p-2 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                    >
                      <option value="Morning">Morning Duty</option>
                      <option value="Night">Night Duty</option>
                      <option value="OFF">OFF Duty</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Day 2 Entry */}
              <div className="p-3 bg-white rounded-2xl border border-indigo-100 space-y-2">
                <span className="font-extrabold text-slate-800 text-[11px] block">
                  Day 2 Baseline ({wifeDisplayName}'s Shift)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Date</label>
                    <input
                      type="date"
                      value={day2Date}
                      onChange={(e) => setDay2Date(e.target.value)}
                      className="w-full p-2 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Shift Type</label>
                    <select
                      value={day2Type}
                      onChange={(e) => setDay2Type(e.target.value as any)}
                      className="w-full p-2 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                    >
                      <option value="Morning">Morning Duty</option>
                      <option value="Night">Night Duty</option>
                      <option value="OFF">OFF Duty</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#695be8] text-white font-extrabold rounded-xl hover:bg-indigo-700 transition-all shadow active:scale-95 text-xs"
              >
                Calculate & Sync 30-Day Rotation Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Today & Tomorrow Duty Spotlight Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 border border-indigo-800">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
            TODAY'S SHIFT SUMMARY ({wifeDisplayName.toUpperCase()})
          </span>
          <span className="text-xs text-indigo-200">{dutyDays[0]?.date || todayStr}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-black">
              {dutyDays[0] ? `${dutyDays[0].dutyType} Duty Today` : 'Shift Unconfigured'}
            </h3>
            <p className="text-xs text-indigo-200 mt-1">
              {getDutySummaryText(dutyDays[0], wifeDisplayName)}
            </p>
          </div>
          {dutyDays[0] && getDutyBadge(dutyDays[0].dutyType)}
        </div>

        {/* Special Badges */}
        {dutyDays[0] && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-indigo-800/80">
            {dutyDays[0].isHomeWeekend && (
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> HOME WEEKEND DETECTED
              </span>
            )}
            {dutyDays[0].isHusbandWfh && (
              <span className="bg-indigo-600 text-white font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
                <Home className="w-3.5 h-3.5" /> HUSBAND WORKING FROM HOME TODAY
              </span>
            )}
          </div>
        )}
      </div>

      {/* 30-Day Rotation Schedule List */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
          UPCOMING 30-DAY SCHEDULE ({wifeDisplayName.toUpperCase()})
        </h3>

        {dutyDays.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <CalendarDays className="w-8 h-8 text-indigo-400 mx-auto" />
            <h4 className="text-xs font-extrabold text-slate-800">No Duty Schedule Calculated Yet</h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Please tap <strong>Configure Shift Baseline</strong> above to enter the 2-day shift baseline and calculate your 30-day rotation calendar!
            </p>
            <button
              onClick={() => setShowSetup(true)}
              className="inline-flex items-center gap-1.5 bg-[#695be8] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Settings className="w-4 h-4" /> Configure Shift Baseline Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {dutyDays.slice(0, 18).map((day, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  day.isHomeWeekend
                    ? 'bg-amber-50 border-amber-300 shadow-sm'
                    : day.isHusbandWfh
                    ? 'bg-indigo-50 border-indigo-200'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-800">{day.date}</span>
                  {getDutyBadge(day.dutyType)}
                </div>

                {day.isHomeWeekend && (
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                    🌟 Home Weekend
                  </span>
                )}
                {day.isHusbandWfh && (
                  <span className="text-[10px] font-bold text-indigo-700 block">
                    🏠 Husband WFH
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
