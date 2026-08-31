'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, ChevronRight, CheckSquare, Activity, Compass, DollarSign, Flag, FileText, Sparkles } from 'lucide-react';
import { GlobalSearchResult } from '@/types';
import { searchService } from '@/lib/services/search';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  useEffect(() => {
    async function doSearch() {
      if (query.trim().length > 0) {
        const res = await searchService.searchAll(query);
        setResults(res);
      } else {
        setResults([]);
      }
    }
    doSearch();
  }, [query]);

  // Global Ctrl + K Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          const btn = document.querySelector('header button[aria-label="Search"]') as HTMLButtonElement;
          if (btn) btn.click();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filterTabs = [
    { label: 'All', value: 'ALL' },
    { label: 'Tasks', value: 'TASK' },
    { label: 'Activities', value: 'ACTIVITY' },
    { label: 'Plans', value: 'PLAN' },
    { label: 'Money', value: 'MONEY' },
    { label: 'Notes', value: 'NOTE' },
  ];

  const filteredResults = results.filter((r) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'MONEY') return ['EXPENSE', 'INCOME', 'TRANSACTION', 'BILL', 'SALARY'].includes(r.type);
    return r.type === selectedFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TASK': return <CheckSquare className="w-4 h-4 text-indigo-500" />;
      case 'ACTIVITY': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'PLAN': return <Compass className="w-4 h-4 text-amber-500" />;
      case 'EXPENSE': case 'INCOME': case 'TRANSACTION': case 'BILL': return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'GOAL': return <Flag className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-scaleUp relative overflow-hidden">
        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Search className="w-5 h-5 animate-pulse" />
          </div>
          <input
            type="text"
            autoFocus
            placeholder="Search tasks, activities, plans, expenses, notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm sm:text-base font-extrabold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedFilter(tab.value)}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                selectedFilter === tab.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {query.trim().length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
              <p className="text-xs font-bold text-slate-400">Type anything to instant search your entire workspace</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-10 text-center text-xs font-bold text-slate-400">
              No matching items found for "{query}"
            </div>
          ) : (
            filteredResults.map((res) => (
              <a
                key={`${res.type}_${res.id}`}
                href={res.url}
                onClick={onClose}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all border border-slate-200/50 dark:border-slate-700/50 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-2xs">
                    {getTypeIcon(res.type)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {res.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{res.subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
