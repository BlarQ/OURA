'use client';

import React from 'react';
import { useOura } from '../../context/OuraContext';
import { Box } from 'lucide-react';

export const Inventory: React.FC = () => {
  const { householdItems } = useOura();

  const inventoryItems = householdItems.filter((i) => i.status === 'confirmed' || i.status === 'purchased');

  return (
    <div className="space-y-5 animate-fadeInScale">
      {/* Compact Top Banner - Home Inventory */}
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 shrink-0">
            <Box className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              OUR HOME INVENTORY & WARRANTIES
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              Purchased assets, location, owner, condition & warranty alerts
            </p>
          </div>
        </div>

        <span className="bg-slate-100 text-slate-700 text-[11px] font-extrabold px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap">
          {inventoryItems.length} Verified Assets
        </span>
      </div>

      {inventoryItems.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
          <Box className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-xs font-extrabold text-slate-800">No Verified Assets Logged Yet</h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Once you log and confirm purchased household items, they will automatically appear here with warranty tracking!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inventoryItems.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {item.room}
                </span>
                <span className="text-xs font-bold text-slate-500">Purchased: {item.purchaseDate || '2026-08-26'}</span>
              </div>

              <h3 className="text-sm font-extrabold text-slate-900">{item.name}</h3>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Original Cost:</span>
                  <strong className="text-slate-900">₦{item.currentPrice.toLocaleString()} NGN</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Warranty Period:</span>
                  <strong className="text-indigo-700">{item.warrantyMonths || 12} Months Active</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Purchased By:</span>
                  <strong className="text-slate-800 uppercase">{item.purchasedBy || 'Husband'}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
