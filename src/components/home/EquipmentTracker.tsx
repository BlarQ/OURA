'use client';

import React, { useState } from 'react';
import { useOura } from '../../context/OuraContext';
import {
  ShoppingBag,
  CheckCircle2,
  Sparkles,
  TrendingDown
} from 'lucide-react';
import { ItemStatus } from '../../lib/types';

export const EquipmentTracker: React.FC = () => {
  const {
    householdItems,
    updateItemStatus,
    confirmPurchase,
    currentRole
  } = useOura();

  const [selectedRoomFilter, setSelectedRoomFilter] = useState('All');

  const rooms = ['All', 'Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Workplace Apartment'];

  const filteredItems = selectedRoomFilter === 'All'
    ? householdItems
    : householdItems.filter((i) => i.room.includes(selectedRoomFilter) || i.category.includes(selectedRoomFilter));

  const totalPurchased = filteredItems.filter((i) => i.status === 'purchased' || i.status === 'confirmed').reduce((sum, i) => sum + i.currentPrice, 0);

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'needed':
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">Needed</span>;
      case 'considering':
        return <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">Considering</span>;
      case 'approved':
        return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">Approved</span>;
      case 'purchased':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">Purchased (Awaiting Confirmation)</span>;
      case 'awaiting_confirmation':
        return <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse whitespace-nowrap">Awaiting Confirmation</span>;
      case 'confirmed':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">Confirmed & Recorded</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">{status}</span>;
    }
  };

  return (
    <div className="space-y-4 animate-fadeInScale">
      {/* Compact Header Banner - Equipment Tracker */}
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0 shadow-sm">
            <ShoppingBag className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              HOUSEHOLD EQUIPMENT TRACKER
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              Item status workflow, dual purchase confirmation & price history
            </p>
          </div>
        </div>

        <div className="text-right text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-100 shrink-0">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Confirmed:</span>
          <strong className="text-xs sm:text-sm font-black text-emerald-600">₦{totalPurchased.toLocaleString()} NGN</strong>
        </div>
      </div>

      {/* Room Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {rooms.map((room) => (
          <button
            key={room}
            onClick={() => setSelectedRoomFilter(room)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
              selectedRoomFilter === room
                ? 'bg-[#695be8] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {room}
          </button>
        ))}
      </div>

      {/* Item Cards List */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
          <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-xs font-extrabold text-slate-800">No Household Items Logged Yet</h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Tap the yellow + button to log your first household appliance or equipment item!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-[2rem] p-5 shadow-ios border border-slate-100 space-y-4 flex flex-col justify-between interactive-card">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#695be8] bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {item.room}
                  </span>
                  {getStatusBadge(item.status)}
                </div>

                <h3 className="text-sm font-extrabold text-slate-900">{item.name}</h3>

                <div className="flex items-center justify-between mt-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Current Recorded Price</span>
                    <strong className="text-sm font-black text-slate-900">₦{item.currentPrice.toLocaleString()}</strong>
                  </div>

                  {item.priceHistory.length > 1 && (
                    <div className="text-right text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" /> Price drop logged
                    </div>
                  )}
                </div>

                {/* Price History Preview */}
                <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                  <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">Price Audit History:</span>
                  {item.priceHistory.map((ph, idx) => (
                    <div key={idx} className="flex justify-between text-slate-500 text-[10px]">
                      <span>{ph.date} ({ph.recordedBy}):</span>
                      <strong className="text-slate-800">₦{ph.price.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                {item.status === 'awaiting_confirmation' && item.purchasedBy !== currentRole ? (
                  <button
                    onClick={() => confirmPurchase(item.id, true)}
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl active:scale-95 shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" /> Confirm & Auto-Record Expense
                  </button>
                ) : item.status === 'needed' || item.status === 'considering' || item.status === 'approved' ? (
                  <button
                    onClick={() => updateItemStatus(item.id, 'awaiting_confirmation', currentRole)}
                    className="w-full py-2.5 bg-[#695be8] text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm text-xs"
                  >
                    Mark as Purchased (Requires Partner Confirmation)
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Confirmed & Expense Recorded
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
