'use client';

import React, { useState } from 'react';
import { useOura } from '../../context/OuraContext';

export const ApartmentSetup: React.FC = () => {
  const { householdItems, activeProfile } = useOura();
  const [activeTab, setActiveTab] = useState<'rental' | 'workplace'>('rental');

  const [locationInput, setLocationInput] = useState('');
  const [rentEstimate, setRentEstimate] = useState<number | ''>('');
  const [agencyFees, setAgencyFees] = useState<number | ''>('');
  const [serviceCharge, setServiceCharge] = useState<number | ''>('');

  const workplaceItems = householdItems.filter((i) => i.isWorkplaceApartment || i.room.includes('Workplace'));
  const workplacePurchased = workplaceItems.filter((i) => i.status === 'purchased' || i.status === 'confirmed').length;
  const workplacePct = workplaceItems.length > 0 ? Math.round((workplacePurchased / workplaceItems.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-sm">
        <button
          onClick={() => setActiveTab('rental')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rental' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          Rental Apartment
        </button>
        <button
          onClick={() => setActiveTab('workplace')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'workplace' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
          }`}
        >
          My Apartment (Workplace)
        </button>
      </div>

      {activeTab === 'rental' ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">RENTAL APARTMENT BREAKDOWN</h3>
              <p className="text-xs text-slate-500">Input your custom rent & estate breakdown</p>
            </div>
            <input
              type="text"
              placeholder="e.g. Lekki Phase 1 or Ikeja GRA"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 focus:outline-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-1">
              <span className="text-indigo-700 block font-bold">Annual Rent Estimate (₦)</span>
              <input
                type="number"
                placeholder="e.g. 2500000"
                value={rentEstimate}
                onChange={(e) => setRentEstimate(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full p-2 rounded-xl border border-slate-300 font-extrabold text-indigo-900 focus:outline-indigo-600"
              />
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 space-y-1">
              <span className="text-purple-700 block font-bold">Legal & Agency Fees (₦)</span>
              <input
                type="number"
                placeholder="e.g. 500000"
                value={agencyFees}
                onChange={(e) => setAgencyFees(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full p-2 rounded-xl border border-slate-300 font-extrabold text-purple-900 focus:outline-purple-600"
              />
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
              <span className="text-emerald-700 block font-bold">Estate Service Charge (₦/mo)</span>
              <input
                type="number"
                placeholder="e.g. 35000"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full p-2 rounded-xl border border-slate-300 font-extrabold text-emerald-900 focus:outline-emerald-600"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">MY WORKPLACE APARTMENT</h3>
              <p className="text-xs text-slate-500">{activeProfile.name}'s workplace residence setup progress</p>
            </div>
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-full">
              {workplacePct}% Setup Completed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${workplacePct}%` }}
            />
          </div>

          {workplaceItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No workplace items logged yet. Add equipment in Household Purchasing!
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {workplaceItems.map((item) => (
                <div key={item.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{item.name}</h4>
                    <span className="text-[10px] text-slate-500">₦{item.currentPrice.toLocaleString()} NGN</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    item.status === 'purchased' || item.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
