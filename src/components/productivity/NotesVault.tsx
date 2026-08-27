'use client';

import React from 'react';
import { useOura } from '../../context/OuraContext';
import { FileText, ArrowRight, Pin } from 'lucide-react';

export const NotesVault: React.FC = () => {
  const { notes, convertNoteToTask } = useOura();

  return (
    <div className="space-y-4 animate-fadeInScale">
      {/* Compact Header Banner - Notes Vault */}
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 shrink-0">
            <FileText className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              NOTES & VAULT
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              Personal & shared notes with 1-click task conversion
            </p>
          </div>
        </div>

        <span className="bg-slate-100 text-slate-700 text-[11px] font-extrabold px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap">
          {notes.length} Notes
        </span>
      </div>

      {notes.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-xs font-extrabold text-slate-800">No Notes Logged Yet</h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Tap the yellow + button to create shared notes, shopping checklists, or ideas!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {note.category}
                  </span>
                  {note.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 mt-2">{note.title}</h3>
                <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{note.content}</p>

                <div className="flex flex-wrap gap-1 mt-3">
                  {note.tags.map((tag, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => convertNoteToTask(note.id)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Convert to Task <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
