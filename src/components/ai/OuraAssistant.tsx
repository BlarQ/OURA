'use client';

import React, { useState } from 'react';
import { useOura } from '../../context/OuraContext';
import { Bot, Send, Sparkles, MessageSquare } from 'lucide-react';

export const OuraAssistant: React.FC = () => {
  const { askAiAssistant, activeProfile } = useOura();
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `Hello ${activeProfile.name}! I am OURA Intelligence, your private companion. Ask me anything about your duty schedule, finances, pending confirmations, meals, or home plans.`
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');

  const quickPills = [
    'What do I have tomorrow?',
    'How much have I spent this month?',
    'Which items are waiting for confirmation?',
    'When is my next off weekend?',
    'What should I eat tonight?'
  ];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim()) return;

    const userMsg = { sender: 'user' as const, text: q };
    const aiResponse = askAiAssistant(q);
    const aiMsg = { sender: 'ai' as const, text: aiResponse };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInputQuery('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
            OURA INTELLIGENCE <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
          </h2>
          <p className="text-xs text-slate-500">
            Context-aware AI companion respecting authorized data permissions
          </p>
        </div>
      </div>

      {/* Quick Pills */}
      <div className="flex flex-wrap gap-1.5">
        {quickPills.map((pill, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(pill)}
            className="text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full transition-all border border-indigo-100 text-left active:scale-95"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="space-y-3 max-h-80 overflow-y-auto p-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 text-xs ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`p-3.5 rounded-2xl max-w-[85%] font-medium leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/80'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2 pt-2"
      >
        <input
          type="text"
          placeholder="Ask OURA anything about your life, home, or plans..."
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          className="flex-1 p-3 rounded-2xl border border-slate-300 text-xs font-semibold focus:outline-indigo-600 shadow-inner"
        />
        <button
          type="submit"
          className="px-4 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-1 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
