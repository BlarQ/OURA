'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useOura } from '../../context/OuraContext';
import { X, ArrowLeft } from 'lucide-react';

export const QuickActionModal: React.FC = () => {
  const {
    quickActionOpen,
    setQuickActionOpen,
    addTransaction,
    addHouseholdItem,
    addTask,
    addNote,
    currentRole
  } = useOura();

  const [activeForm, setActiveForm] = useState<string | null>(null);

  // Form states
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Food');
  const [txDesc, setTxDesc] = useState('');
  const [txType, setTxType] = useState<'debit' | 'credit'>('debit');

  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemRoom, setItemRoom] = useState('Living Room');

  const [taskTitle, setTaskTitle] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  if (!quickActionOpen) return null;

  const handleClose = () => {
    setQuickActionOpen(false);
    setActiveForm(null);
  };

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount) return;
    addTransaction({
      type: txType,
      amount: parseFloat(txAmount),
      date: new Date().toISOString().split('T')[0],
      category: txCategory,
      description: txDesc || `${txType === 'debit' ? 'Expense' : 'Income'} entry`,
      paymentMethod: 'Transfer',
      isRecurring: false,
      isShared: true,
      paidBy: currentRole,
      status: 'completed'
    });
    handleClose();
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice) return;
    addHouseholdItem({
      name: itemName,
      category: itemRoom === 'Workplace Kitchenette' ? 'Workplace Apartment' : 'Living Room',
      room: itemRoom,
      estimatedPrice: parseFloat(itemPrice),
      currentPrice: parseFloat(itemPrice),
      quantity: 1,
      status: 'needed'
    });
    handleClose();
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    addTask({
      title: taskTitle,
      assignedTo: 'both',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      status: 'pending',
      category: 'General'
    });
    handleClose();
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle) return;
    addNote({
      title: noteTitle,
      content: noteContent,
      category: 'Home',
      tags: ['QuickNote'],
      isPinned: false,
      isArchived: false,
      isShared: true
    });
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 rounded-[2.25rem] p-6 sm:p-7 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto animate-fadeInScale">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1 mb-5">
          <h3 className="text-lg font-black tracking-tight text-slate-900">UNIVERSAL QUICK ACTION</h3>
          <p className="text-xs text-slate-500">Select what you would like to log or schedule</p>
        </div>

        {!activeForm ? (
          /* Grid of Perfectly Balanced Cards with Realistic 3D Icons */
          <div className="grid grid-cols-2 gap-3.5">
            {/* Card 1: Add Transaction */}
            <button
              onClick={() => setActiveForm('expense')}
              className="p-4 rounded-[1.75rem] bg-indigo-50/80 hover:bg-indigo-100 text-indigo-950 border border-indigo-100 text-center flex flex-col items-center justify-center space-y-2 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md h-36 sm:h-40"
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                <Image
                  src="/quick_tx.png"
                  alt="Transaction Icon"
                  width={48}
                  height={48}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-tight text-indigo-950">Add Transaction</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Log debit or credit</p>
              </div>
            </button>

            {/* Card 2: Household Item */}
            <button
              onClick={() => setActiveForm('item')}
              className="p-4 rounded-[1.75rem] bg-purple-50/80 hover:bg-purple-100 text-purple-950 border border-purple-100 text-center flex flex-col items-center justify-center space-y-2 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md h-36 sm:h-40"
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                <Image
                  src="/quick_appliance.png"
                  alt="Household Appliance Icon"
                  width={48}
                  height={48}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-tight text-purple-950">Add Equipment</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Track item purchase</p>
              </div>
            </button>

            {/* Card 3: Add Task */}
            <button
              onClick={() => setActiveForm('task')}
              className="p-4 rounded-[1.75rem] bg-amber-50/80 hover:bg-amber-100 text-amber-950 border border-amber-100 text-center flex flex-col items-center justify-center space-y-2 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md h-36 sm:h-40"
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                <Image
                  src="/quick_task.png"
                  alt="Task Icon"
                  width={48}
                  height={48}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-tight text-amber-950">Assign Task</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Couple responsibility</p>
              </div>
            </button>

            {/* Card 4: Create Note */}
            <button
              onClick={() => setActiveForm('note')}
              className="p-4 rounded-[1.75rem] bg-emerald-50/80 hover:bg-emerald-100 text-emerald-950 border border-emerald-100 text-center flex flex-col items-center justify-center space-y-2 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md h-36 sm:h-40"
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                <Image
                  src="/quick_note.png"
                  alt="Note Icon"
                  width={48}
                  height={48}
                  className="object-contain w-full h-full"
                />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-tight text-emerald-950">Create Note</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Personal or shared</p>
              </div>
            </button>
          </div>
        ) : activeForm === 'expense' ? (
          <form onSubmit={handleCreateTx} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Transaction Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('debit')}
                  className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                    txType === 'debit' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Debit (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('credit')}
                  className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
                    txType === 'credit' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Credit (Income)
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Amount (NGN ₦)</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Category</label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
              >
                <option value="Food">Food & Groceries</option>
                <option value="Household">Household & Appliances</option>
                <option value="Transport">Transport & Fuel</option>
                <option value="Utilities">Utilities & Electricity</option>
                <option value="Housing">Housing & Rent</option>
                <option value="Personal">Personal Spending</option>
                <option value="Salary">Salary / Income</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g. Market shopping or Inverter deposit"
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-[#695be8]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveForm(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#695be8] text-white font-extrabold text-xs rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow"
              >
                Save Transaction
              </button>
            </div>
          </form>
        ) : activeForm === 'item' ? (
          <form onSubmit={handleCreateItem} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Item Name</label>
              <input
                type="text"
                placeholder="e.g. Air Conditioner (1.5HP Inverter)"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Estimated Price (NGN ₦)</label>
              <input
                type="number"
                placeholder="e.g. 350000"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Target Room / Location</label>
              <select
                value={itemRoom}
                onChange={(e) => setItemRoom(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
              >
                <option value="Living Room">Living Room</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Master Bedroom">Master Bedroom</option>
                <option value="Bathroom">Bathroom</option>
                <option value="Workplace Kitchenette">Wife's Workplace Apartment</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveForm(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-purple-600 text-white font-extrabold text-xs rounded-xl hover:bg-purple-700 active:scale-95 transition-all shadow"
              >
                Add Household Item
              </button>
            </div>
          </form>
        ) : activeForm === 'task' ? (
          <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Task Title</label>
              <input
                type="text"
                placeholder="e.g. Call electrician to check wiring"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveForm(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-amber-600 text-white font-extrabold text-xs rounded-xl hover:bg-amber-700 active:scale-95 transition-all shadow"
              >
                Create Task
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateNote} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Note Title</label>
              <input
                type="text"
                placeholder="e.g. Wedding Catering Ideas"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-[#695be8]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Note Details</label>
              <textarea
                rows={3}
                placeholder="Write your note details here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-[#695be8]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveForm(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 text-white font-extrabold text-xs rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow"
              >
                Save Note
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
