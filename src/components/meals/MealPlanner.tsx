'use client';

import React, { useState } from 'react';
import { useOura } from '../../context/OuraContext';
import { Utensils, Moon } from 'lucide-react';

export const MealPlanner: React.FC = () => {
  const { weeklyMeals } = useOura();
  const [selectedDay, setSelectedDay] = useState('Monday');

  const activeDayPlan = weeklyMeals.find((m) => m.dayOfWeek === selectedDay) || weeklyMeals[0];

  return (
    <div className="space-y-5 animate-fadeInScale">
      {/* Compact Top Banner - Meal Planner */}
      <div className="bg-white rounded-3xl p-5 shadow-xl border border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 shrink-0">
            <Utensils className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              MY MEALS & NUTRITION PLANNER
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              Weekly Nigerian/African cuisine planner with plain-language nutrient breakdowns
            </p>
          </div>
        </div>

        <span className="bg-emerald-50 text-emerald-800 font-extrabold text-[11px] px-3 py-1.5 rounded-full border border-emerald-100 shrink-0 whitespace-nowrap">
          Iron & Folate Rich
        </span>
      </div>

      {/* Day Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedDay === day
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Meals Grid for Selected Day */}
      {!activeDayPlan ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
          <Utensils className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-xs font-extrabold text-slate-800">No Meals Logged for {selectedDay}</h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Meal plans are customized per week with iron & folate rich African recipes!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Breakfast */}
          {activeDayPlan.breakfast && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                BREAKFAST
              </span>
              <h3 className="text-sm font-extrabold text-slate-900">{activeDayPlan.breakfast.name}</h3>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Calories:</span>
                  <span>{activeDayPlan.breakfast.calories} kcal</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Protein:</span>
                  <strong className="text-emerald-700">{activeDayPlan.breakfast.proteinGrams}g</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Iron:</span>
                  <strong className="text-indigo-700">{activeDayPlan.breakfast.ironMg}mg</strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                "{activeDayPlan.breakfast.description}"
              </p>
            </div>
          )}

          {/* Lunch */}
          {activeDayPlan.lunch && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                LUNCH
              </span>
              <h3 className="text-sm font-extrabold text-slate-900">{activeDayPlan.lunch.name}</h3>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Calories:</span>
                  <span>{activeDayPlan.lunch.calories} kcal</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Protein:</span>
                  <strong className="text-emerald-700">{activeDayPlan.lunch.proteinGrams}g</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Folate:</span>
                  <strong className="text-indigo-700">{activeDayPlan.lunch.folateMcg}mcg</strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                "{activeDayPlan.lunch.description}"
              </p>
            </div>
          )}

          {/* Dinner */}
          {activeDayPlan.dinner && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                  DINNER
                </span>
                {activeDayPlan.dinner.isLightForNightDuty && (
                  <span className="bg-indigo-900 text-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Moon className="w-3 h-3" /> Night Duty Friendly
                  </span>
                )}
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">{activeDayPlan.dinner.name}</h3>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Calories:</span>
                  <span>{activeDayPlan.dinner.calories} kcal</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Protein:</span>
                  <strong className="text-emerald-700">{activeDayPlan.dinner.proteinGrams}g</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Potassium:</span>
                  <strong className="text-indigo-700">{activeDayPlan.dinner.potassiumMg}mg</strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                "{activeDayPlan.dinner.description}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
