'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Search, Pin, Share2, Copy, Download, Printer,
  Trash2, Save, Calendar, Sparkles, Tag, Check
} from 'lucide-react';
import { Note } from '@/types';
import { noteService } from '@/lib/services/notes';
import { showConfirmModal, showToast } from '@/components/layout/ConfirmModal';

export function NotesView() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Active note editing buffer
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const loadNotes = async () => {
    const list = await noteService.getNotes();
    setNotes(list);

    if (list.length > 0 && !activeNoteId) {
      selectNote(list[0]);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const selectNote = (note: Note) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category || 'General');
    setIsPinned(!!note.is_pinned);
  };

  const handleCreateNewNote = async () => {
    const today = new Date().toISOString().split('T')[0];
    const newNote = await noteService.createNote({
      title: 'New Quick Note',
      content: '',
      category: 'General',
      is_pinned: false,
    });

    await loadNotes();
    selectNote(newNote);
    showToast('New note created!', 'success');
  };

  const handleSaveCurrentNote = async () => {
    if (!activeNoteId) return;

    await noteService.updateNote(activeNoteId, {
      title: title.trim() || 'Untitled Note',
      content,
      category,
      is_pinned: isPinned,
    });

    await loadNotes();
    showToast('Note saved successfully!', 'success');
  };

  const handleDeleteActiveNote = () => {
    if (!activeNoteId) return;

    showConfirmModal({
      title: 'Delete Note?',
      message: 'Are you sure you want to delete this note? This action cannot be undone.',
      isDanger: true,
      confirmText: 'Delete Note',
      onConfirm: async () => {
        await noteService.deleteNote(activeNoteId);
        setActiveNoteId(null);
        setTitle('');
        setContent('');
        await loadNotes();
        showToast('Note deleted.', 'info');
      },
    });
  };

  // Share & Export Handlers
  const handleCopyMessage = () => {
    const textToShare = `${title}\n\n${content}`;
    navigator.clipboard.writeText(textToShare);
    setIsCopied(true);
    showToast('Note copied to clipboard! Ready to paste into WhatsApp, SMS, or Mail.', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleWebShare = async () => {
    const textToShare = `${title}\n\n${content}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'OURA Note',
          text: textToShare,
        });
        showToast('Shared successfully!', 'success');
      } catch (err) {}
    } else {
      handleCopyMessage();
    }
  };

  const handleDownloadTXT = () => {
    const element = document.createElement('a');
    const file = new Blob([`${title}\n\n${content}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${(title || 'note').toLowerCase().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Note downloaded as TXT file!', 'success');
  };

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || 'OURA Note'}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; }
            h1 { font-size: 24px; font-weight: 800; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
            .meta { font-size: 11px; color: #64748b; margin-bottom: 25px; }
            .content { font-size: 14px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>${title || 'Untitled Note'}</h1>
          <div class="meta">Category: ${category} • Date: ${new Date().toLocaleDateString()}</div>
          <div class="content">${content}</div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned);
  const otherNotes = filteredNotes.filter((n) => !n.is_pinned);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Notepad & Personal Notes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Store ideas, meeting notes, draft messages, and export/share across your mobile apps
          </p>
        </div>

        <button
          onClick={handleCreateNewNote}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Main Notepad Application Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
        {/* Left Column: Notes List Sidebar */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          {/* Search & Category Filter */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Tags Horizontal Pill Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {['All', 'General', 'Work', 'Personal', 'Ideas', 'Meetings'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Notes List Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p>No notes found.</p>
              </div>
            ) : (
              <>
                {/* Pinned Notes Section */}
                {pinnedNotes.length > 0 && (
                  <div className="space-y-1 mb-2">
                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider px-3 py-1 flex items-center gap-1">
                      <Pin className="w-3 h-3" /> Pinned Notes
                    </span>
                    {pinnedNotes.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => selectNote(n)}
                        className={`p-3.5 rounded-2xl cursor-pointer transition-all space-y-1 ${
                          activeNoteId === n.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 shadow-sm'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {n.title || 'Untitled Note'}
                          </h4>
                          <Pin className="w-3 h-3 text-indigo-500 fill-current" />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {n.content || 'No text content yet...'}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <span>{n.created_at}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold">{n.category || 'General'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Other Notes Section */}
                {otherNotes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => selectNote(n)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all space-y-1 ${
                      activeNoteId === n.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 shadow-sm'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {n.title || 'Untitled Note'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {n.content || 'No text content yet...'}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>{n.created_at}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold">{n.category || 'General'}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right Column: Note Editor & Reader Panel */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          {activeNoteId ? (
            <>
              {/* Note Action Toolbar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Ideas">Ideas</option>
                    <option value="Meetings">Meetings</option>
                  </select>

                  <button
                    onClick={() => setIsPinned(!isPinned)}
                    className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                      isPinned
                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={isPinned ? 'Unpin Note' : 'Pin Note'}
                  >
                    <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Share & Export Tools Bar */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSaveCurrentNote}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-sm transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>

                  <button
                    onClick={handleCopyMessage}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Copy Note Text (Share to WhatsApp / SMS)"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleWebShare}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Share Note to Mobile Apps"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleDownloadTXT}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Export TXT File"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handlePrintPDF}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Print / Export PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleDeleteActiveNote}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Content Editor Textarea */}
              <div className="p-6 flex-1 flex flex-col space-y-4 overflow-y-auto">
                <input
                  type="text"
                  placeholder="Note Title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-extrabold bg-transparent text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />

                <textarea
                  placeholder="Write your note, thoughts, or draft messages here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 min-h-[400px]"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs space-y-3 p-8">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Note Selected</h3>
              <p className="text-xs text-slate-500 max-w-xs text-center">
                Select a note from the left sidebar or click 'New Note' to create one!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
