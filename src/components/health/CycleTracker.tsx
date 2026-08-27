'use client';

import React, { useState } from 'react';
import { useOura } from '../../context/OuraContext';
import { Heart, Calendar, Sparkles, Shield, Plus, Lock, Smile, AlertCircle } from 'lucide-react';

export const CycleTracker: React.FC = () => {
  const {
    activeProfile,
    partnerProfile,
    menstrualLogs,
    addMenstrualLog,
    cyclePrediction,
    setMenstrualSharingLevel,
    currentRole
  } = useOura();

  const [showLogModal, setShowLogModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [flow, setFlow] = useState<'light' | 'medium' | 'heavy'>('medium');
  const [painLevel, setPainLevel] = useState(3);
  const [symptoms, setSymptoms] = useState<string[]>(['Cramps']);
  const [notes, setNotes] = useState('');

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) return;
    addMenstrualLog({
      startDate,
      flow,
      painLevel,
      symptoms,
      energy: 'normal',
      mood: 'Restful',
      sleepHours: 7.5,
      stressLevel: 'moderate',
      notes
    });
    setShowLogModal(false);
  };

  const isHusbandViewing = currentRole === 'husband';
  const isPrivateFromHusband = isHusbandViewing && activeProfile.menstrualSharingLevel === 'private';

  if (isPrivateFromHusband) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center space-y-4 max-w-lg mx-auto my-8">
        <div className="p-4 rounded-full bg-rose-50 text-rose-600 w-16 h-16 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-900">Menstrual Health Records Kept Private</h3>
        <p className="text-xs text-slate-500">
          Your partner Aisha has set her cycle information to private mode. Data will only become visible if she chooses to share it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner - Menstrual Tracker */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-rose-100 text-rose-700">
              <Heart className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">MENSTRUAL CYCLE & WELLNESS</h2>
              <p className="text-xs text-slate-500">
                Private period logger, cycle prediction engine & supportive wellness guidance
              </p>
            </div>
          </div>
        </div>

        {currentRole === 'wife' && (
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Log Period Start
          </button>
        )}
      </div>

      {/* Cycle Prediction Spotlight Card */}
      <div className="bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 text-white rounded-3xl p-6 shadow-2xl space-y-4 border border-rose-500 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-100 flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> CYCLE PREDICTION ENGINE
          </span>
          <span className="bg-white/20 backdrop-blur-md text-white font-bold text-xs px-3 py-1 rounded-full border border-white/20">
            Avg Cycle: {cyclePrediction.avgCycleLength} Days
          </span>
        </div>

        <div>
          <span className="text-xs text-rose-200 block font-medium">Estimated Next Period Window:</span>
          <h3 className="text-2xl font-black tracking-tight mt-1">{cyclePrediction.predictionWindowText}</h3>
        </div>

        <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs text-rose-100 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-200 shrink-0 mt-0.5" />
          <span>
            Predictions are calculated deterministically from previous logs for personal wellness planning. For concerning symptoms, please consult a medical professional.
          </span>
        </div>
      </div>

      {/* Partner Sharing Permissions Control (Wife only) */}
      {currentRole === 'wife' && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-800">Menstrual Partner Sharing Setting</h4>
            <p className="text-[11px] text-slate-500">Currently: <strong className="text-rose-600 uppercase">{activeProfile.menstrualSharingLevel}</strong></p>
          </div>

          <select
            value={activeProfile.menstrualSharingLevel}
            onChange={(e) => setMenstrualSharingLevel(e.target.value as any)}
            className="p-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-rose-600"
          >
            <option value="private">Private (Only Me)</option>
            <option value="basic">Basic (Husband sees expected date)</option>
            <option value="moderate">Moderate (Cycle dates & phase)</option>
            <option value="detailed">Detailed (Cycle + symptoms)</option>
            <option value="full">Full Access</option>
          </select>
        </div>
      )}

      {/* Recent Menstrual Logs */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">PERIOD HISTORY LOGS</h3>

        <div className="space-y-3">
          {menstrualLogs.map((log) => (
            <div key={log.id} className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-black text-slate-900">Period Started: {log.startDate}</h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1">
                  <span className="font-semibold text-rose-700">Flow: {log.flow}</span>
                  <span>• Pain scale: {log.painLevel}/10</span>
                </div>
                {log.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {log.symptoms.map((sym, idx) => (
                      <span key={idx} className="bg-white text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                        {sym}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Period Logger Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Log Period Entry</h3>

            <form onSubmit={handleAddLog} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Period Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-rose-600"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Flow Intensity</label>
                <select
                  value={flow}
                  onChange={(e) => setFlow(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-rose-600"
                >
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pain Scale (1-10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={painLevel}
                  onChange={(e) => setPainLevel(parseInt(e.target.value))}
                  className="w-full"
                />
                <span className="font-bold text-slate-800 text-xs">{painLevel} / 10</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700"
                >
                  Save Period Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
