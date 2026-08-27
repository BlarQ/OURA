'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Role,
  UserProfile,
  SalaryProfile,
  FinancialTransaction,
  Budget,
  SavingsGoal,
  HouseholdItem,
  DutyScheduleSetup,
  DutyDay,
  MenstrualLog,
  Meal,
  WeeklyMealPlan,
  Task,
  Decision,
  Note,
  Reminder,
  AuditLog
} from '../lib/types';
import { calculateDutyDays } from '../lib/dutyEngine';
import { calculateCyclePrediction } from '../lib/cycleEngine';
import {
  isSupabaseConfigured,
  insertTransactionToSupabase,
  insertHouseholdItemToSupabase
} from '../lib/supabaseClient';

interface OuraContextType {
  // Auth & Session
  isAuthenticated: boolean;
  keepMeLoggedIn: boolean;
  loginUser: (role: Role, keepLoggedIn: boolean) => void;
  loginWithProfile: (profile: UserProfile, keepLoggedIn?: boolean) => void;
  logoutUser: () => void;
  isLiveSupabaseConnected: boolean;

  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  toggleRole: () => void;
  wifeProfile: UserProfile;
  husbandProfile: UserProfile;
  activeProfile: UserProfile;
  partnerProfile: UserProfile;
  updateProfileName: (newName: string) => void;
  updateHusbandWfhDays: (days: string[]) => void;
  connectPartnerCode: (code: string) => boolean;

  toggleDiscreetMode: () => void;
  setSalarySharingLevel: (level: number) => void;
  toggleSalarySharing: () => void;
  setMenstrualSharingLevel: (level: 'private' | 'basic' | 'moderate' | 'detailed' | 'full') => void;
  
  // Finance
  wifeSalary: SalaryProfile;
  husbandSalary: SalaryProfile;
  activeSalary: SalaryProfile;
  updateSalaryProfile: (net: number, employer: string, date: number) => void;
  transactions: FinancialTransaction[];
  addTransaction: (tx: Omit<FinancialTransaction, 'id' | 'userId'>) => void;
  reverseTransaction: (txId: string) => void;
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'husbandContribution' | 'wifeContribution'>) => void;
  addSavingsContribution: (goalId: string, amount: number, contributor: Role) => void;
  
  // Household & Dual Confirmation Sync
  householdItems: HouseholdItem[];
  addHouseholdItem: (item: Omit<HouseholdItem, 'id' | 'priceHistory'>) => void;
  updateItemStatus: (itemId: string, status: HouseholdItem['status'], purchasedBy?: Role) => void;
  confirmPurchase: (itemId: string, createExpense: boolean) => void;
  pendingConfirmationItem: HouseholdItem | null;
  
  // Duty Schedule
  dutySetup: DutyScheduleSetup;
  updateDutySetup: (setup: DutyScheduleSetup) => void;
  dutyDays: DutyDay[];
  
  // Menstrual Health
  menstrualLogs: MenstrualLog[];
  addMenstrualLog: (log: Omit<MenstrualLog, 'id'>) => void;
  cyclePrediction: ReturnType<typeof calculateCyclePrediction>;
  
  // Meals & Nutrition
  weeklyMeals: WeeklyMealPlan[];
  addMealToPlan: (dayOfWeek: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', meal: Meal) => void;
  
  // Productivity
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  toggleTaskStatus: (taskId: string) => void;
  decisions: Decision[];
  voteDecision: (decisionId: string, optionId: string, role: Role, status: 'approved' | 'rejected') => void;
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  convertNoteToTask: (noteId: string) => void;
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id' | 'isCompleted'>) => void;
  toggleReminder: (reminderId: string) => void;
  
  // System & Audit
  auditLogs: AuditLog[];
  quickActionOpen: boolean;
  setQuickActionOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  askAiAssistant: (question: string) => string;
}

const OuraContext = createContext<OuraContextType | undefined>(undefined);

// Helper for Initials Computation (e.g. Collin Ogunlala -> CO)
export const getProfileInitials = (name: string): string => {
  if (!name || name.trim() === '') return 'OU';
  const cleanName = name.includes('@') ? name.split('@')[0] : name;
  const parts = cleanName.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

// Clean Fresh Default User Profiles (Blank & Zero-based for New Registrations)
const defaultWifeProfile: UserProfile = {
  id: 'usr-wife-live',
  name: 'User',
  role: 'wife',
  avatar: '👩🏾‍⚕️',
  partnerName: 'Not Connected',
  partnerRole: 'husband',
  coupleId: 'OURA-7782-W',
  isDiscreetMode: false,
  salarySharingLevel: 3,
  isSalaryShared: true,
  menstrualSharingLevel: 'moderate',
  husbandWfhDays: ['Tuesday']
};

const defaultHusbandProfile: UserProfile = {
  id: 'usr-husband-live',
  name: 'User',
  role: 'husband',
  avatar: '👨🏾‍💼',
  partnerName: 'Not Connected',
  partnerRole: 'wife',
  coupleId: 'UNLINKED',
  isDiscreetMode: false,
  salarySharingLevel: 3,
  isSalaryShared: true,
  menstrualSharingLevel: 'private',
  husbandWfhDays: ['Tuesday']
};

const cleanWifeSalary: SalaryProfile = {
  id: 'sal-wife-live',
  userId: 'usr-wife-live',
  salaryName: 'Salary Profile',
  employer: '',
  frequency: 'monthly',
  grossSalary: 0,
  netSalary: 0,
  salaryDate: 25,
  currency: 'NGN',
  otherIncome: 0
};

const cleanHusbandSalary: SalaryProfile = {
  id: 'sal-husband-live',
  userId: 'usr-husband-live',
  salaryName: 'Salary Profile',
  employer: '',
  frequency: 'monthly',
  grossSalary: 0,
  netSalary: 0,
  salaryDate: 25,
  currency: 'NGN',
  otherIncome: 0
};

export const OuraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState<boolean>(true);
  const [isLiveSupabaseConnected, setIsLiveSupabaseConnected] = useState<boolean>(false);

  const [currentRole, setCurrentRole] = useState<Role>('husband');
  const [wifeProfile, setWifeProfile] = useState<UserProfile>(defaultWifeProfile);
  const [husbandProfile, setHusbandProfile] = useState<UserProfile>(defaultHusbandProfile);
  const [wifeSalary, setWifeSalary] = useState<SalaryProfile>(cleanWifeSalary);
  const [husbandSalary, setHusbandSalary] = useState<SalaryProfile>(cleanHusbandSalary);

  // Live Data Repositories (100% disconnected from static mock entries)
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [householdItems, setHouseholdItems] = useState<HouseholdItem[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [menstrualLogs, setMenstrualLogs] = useState<MenstrualLog[]>([]);
  const [weeklyMeals, setWeeklyMeals] = useState<WeeklyMealPlan[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  
  // Unconfigured baseline duty setup for new profiles
  const [dutySetup, setDutySetup] = useState<DutyScheduleSetup>({
    isConfigured: false,
    day1Date: new Date().toISOString().split('T')[0],
    day1Type: 'Morning',
    day2Date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    day2Type: 'Morning'
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check Supabase Connection & Persistent Login on mount
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsLiveSupabaseConnected(configured);

    try {
      const storedAuth = localStorage.getItem('oura_is_authenticated');
      const storedProfile = localStorage.getItem('oura_user_profile');
      if (storedAuth === 'true') {
        setIsAuthenticated(true);
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          if (parsed.role === 'wife') setWifeProfile(parsed);
          else setHusbandProfile(parsed);
          setCurrentRole(parsed.role);
        }
      }
    } catch (e) {}
  }, []);

  const loginUser = (role: Role, keepLoggedIn: boolean) => {
    setCurrentRole(role);
    setIsAuthenticated(true);
    setKeepMeLoggedIn(keepLoggedIn);
    if (keepLoggedIn) {
      try {
        localStorage.setItem('oura_is_authenticated', 'true');
        localStorage.setItem('oura_active_role', role);
      } catch (e) {}
    }
  };

  const loginWithProfile = (profile: UserProfile, keepLoggedIn: boolean = true) => {
    setCurrentRole(profile.role);
    if (profile.role === 'wife') {
      setWifeProfile(profile);
    } else {
      setHusbandProfile(profile);
    }
    setIsAuthenticated(true);
    setKeepMeLoggedIn(keepLoggedIn);
    try {
      localStorage.setItem('oura_is_authenticated', 'true');
      localStorage.setItem('oura_active_role', profile.role);
      localStorage.setItem('oura_user_profile', JSON.stringify(profile));
    } catch (e) {}
  };

  const updateProfileName = (newName: string) => {
    if (!newName || newName.trim() === '') return;
    if (currentRole === 'wife') {
      setWifeProfile((prev) => {
        const updated = { ...prev, name: newName };
        try {
          localStorage.setItem('oura_user_profile', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    } else {
      setHusbandProfile((prev) => {
        const updated = { ...prev, name: newName };
        try {
          localStorage.setItem('oura_user_profile', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }
  };

  const updateHusbandWfhDays = (days: string[]) => {
    setHusbandProfile((prev) => ({ ...prev, husbandWfhDays: days }));
    setWifeProfile((prev) => ({ ...prev, husbandWfhDays: days }));
  };

  const connectPartnerCode = (code: string): boolean => {
    if (!code || code.trim() === '') return false;
    const cleanCode = code.trim().toUpperCase();
    
    // Link husband and wife profiles together
    setHusbandProfile((prev) => ({
      ...prev,
      coupleId: cleanCode,
      partnerName: wifeProfile.name || 'Wife'
    }));

    setWifeProfile((prev) => ({
      ...prev,
      coupleId: cleanCode,
      partnerName: husbandProfile.name || 'Husband'
    }));

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    return true;
  };

  const logoutUser = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('oura_is_authenticated');
      localStorage.removeItem('oura_active_role');
      localStorage.removeItem('oura_user_profile');
    } catch (e) {}
  };

  const activeProfile = currentRole === 'wife' ? wifeProfile : husbandProfile;
  const partnerProfile = currentRole === 'wife' ? husbandProfile : wifeProfile;
  const activeSalary = currentRole === 'wife' ? wifeSalary : husbandSalary;

  const updateSalaryProfile = (net: number, employer: string, date: number) => {
    if (currentRole === 'wife') {
      setWifeSalary((prev) => ({ ...prev, netSalary: net, employer, salaryDate: date }));
    } else {
      setHusbandSalary((prev) => ({ ...prev, netSalary: net, employer, salaryDate: date }));
    }
  };

  const toggleRole = () => {
    setCurrentRole((prev) => {
      const nextRole = prev === 'wife' ? 'husband' : 'wife';
      if (keepMeLoggedIn) {
        try {
          localStorage.setItem('oura_active_role', nextRole);
        } catch (e) {}
      }
      return nextRole;
    });
  };

  const toggleDiscreetMode = () => {
    if (currentRole === 'wife') {
      setWifeProfile((prev) => ({ ...prev, isDiscreetMode: !prev.isDiscreetMode }));
    } else {
      setHusbandProfile((prev) => ({ ...prev, isDiscreetMode: !prev.isDiscreetMode }));
    }
  };

  const setSalarySharingLevel = (level: number) => {
    if (currentRole === 'wife') {
      setWifeProfile((prev) => ({ ...prev, salarySharingLevel: level, isSalaryShared: level > 0 }));
    } else {
      setHusbandProfile((prev) => ({ ...prev, salarySharingLevel: level, isSalaryShared: level > 0 }));
    }
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        actorRole: currentRole,
        action: 'Changed Financial Sharing Level',
        details: `${activeProfile.name} set salary sharing permission to Level ${level}`
      },
      ...prev
    ]);
  };

  const toggleSalarySharing = () => {
    const nextShared = !activeProfile.isSalaryShared;
    setSalarySharingLevel(nextShared ? 3 : 0);
  };

  const setMenstrualSharingLevel = (level: UserProfile['menstrualSharingLevel']) => {
    setWifeProfile((prev) => ({ ...prev, menstrualSharingLevel: level }));
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        actorRole: 'wife',
        action: 'Updated Menstrual Health Sharing',
        details: `${activeProfile.name} set cycle sharing permission to '${level}'`
      },
      ...prev
    ]);
  };

  // Finance Actions (Live)
  const addTransaction = (txData: Omit<FinancialTransaction, 'id' | 'userId'>) => {
    const newTx: FinancialTransaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      userId: activeProfile.id
    };
    setTransactions((prev) => [newTx, ...prev]);
    insertTransactionToSupabase(newTx);
  };

  const reverseTransaction = (txId: string) => {
    const target = transactions.find((t) => t.id === txId);
    if (!target) return;
    const reversal: FinancialTransaction = {
      id: `tx-rev-${Date.now()}`,
      userId: activeProfile.id,
      coupleId: target.coupleId,
      type: target.type === 'debit' ? 'credit' : 'debit',
      amount: target.amount,
      date: new Date().toISOString().split('T')[0],
      category: target.category,
      description: `Reversal / Refund: ${target.description}`,
      paymentMethod: target.paymentMethod,
      isRecurring: false,
      isShared: target.isShared,
      paidBy: currentRole,
      status: 'refunded',
      originalTransactionId: target.id
    };
    setTransactions((prev) => [reversal, ...prev]);
    insertTransactionToSupabase(reversal);
  };

  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'husbandContribution' | 'wifeContribution'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: `gov-${Date.now()}`,
      currentAmount: 0,
      husbandContribution: 0,
      wifeContribution: 0
    };
    setSavingsGoals((prev) => [...prev, newGoal]);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
  };

  const addSavingsContribution = (goalId: string, amount: number, contributor: Role) => {
    setSavingsGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          return {
            ...g,
            currentAmount: g.currentAmount + amount,
            husbandContribution: contributor === 'husband' ? (g.husbandContribution || 0) + amount : g.husbandContribution,
            wifeContribution: contributor === 'wife' ? (g.wifeContribution || 0) + amount : g.wifeContribution
          };
        }
        return g;
      })
    );
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  // Household & Dual Confirmation Workflow (Live)
  const pendingConfirmationItem =
    householdItems.find(
      (item) =>
        item.status === 'awaiting_confirmation' && item.purchasedBy !== currentRole
    ) || null;

  const addHouseholdItem = (itemData: Omit<HouseholdItem, 'id' | 'priceHistory'>) => {
    const newItem: HouseholdItem = {
      ...itemData,
      id: `item-${Date.now()}`,
      priceHistory: [{ date: new Date().toISOString().split('T')[0], price: itemData.currentPrice, recordedBy: activeProfile.name }]
    };
    setHouseholdItems((prev) => [newItem, ...prev]);
    insertHouseholdItemToSupabase(newItem);
  };

  const updateItemStatus = (itemId: string, status: HouseholdItem['status'], purchasedBy?: Role) => {
    setHouseholdItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            status,
            purchasedBy: purchasedBy || item.purchasedBy,
            purchaseDate: status === 'purchased' || status === 'awaiting_confirmation' ? new Date().toISOString().split('T')[0] : item.purchaseDate
          };
        }
        return item;
      })
    );
  };

  const confirmPurchase = (itemId: string, createExpense: boolean) => {
    const item = householdItems.find((i) => i.id === itemId);
    if (!item) return;

    setHouseholdItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: 'confirmed' } : i))
    );

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (createExpense) {
      addTransaction({
        coupleId: activeProfile.coupleId,
        type: 'debit',
        amount: item.currentPrice,
        date: new Date().toISOString().split('T')[0],
        category: 'Household',
        description: `Purchased & Confirmed: ${item.name}`,
        paymentMethod: 'Transfer',
        relatedItemId: item.id,
        isRecurring: false,
        isShared: true,
        paidBy: item.purchasedBy || currentRole,
        status: 'completed'
      });
    }

    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        actorRole: currentRole,
        action: 'Confirmed Dual Purchase',
        details: `${activeProfile.name} confirmed purchase of '${item.name}' (₦${item.currentPrice.toLocaleString()})`
      },
      ...prev
    ]);
  };

  // Duty Calculation
  const dutyDays = calculateDutyDays(dutySetup, new Date().toISOString().split('T')[0], 30, wifeProfile.husbandWfhDays);

  const updateDutySetup = (newSetup: DutyScheduleSetup) => {
    setDutySetup({ ...newSetup, isConfigured: true });
  };

  // Menstrual Engine
  const addMenstrualLog = (logData: Omit<MenstrualLog, 'id'>) => {
    const newLog: MenstrualLog = { ...logData, id: `cyc-${Date.now()}` };
    setMenstrualLogs((prev) => [newLog, ...prev]);
  };

  const cyclePrediction = calculateCyclePrediction(menstrualLogs);

  // Meals Action
  const addMealToPlan = (dayOfWeek: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', meal: Meal) => {
    setWeeklyMeals((prev) =>
      prev.map((p) => {
        if (p.dayOfWeek === dayOfWeek) {
          return { ...p, [mealType]: meal };
        }
        return p;
      })
    );
  };

  // Productivity (Live)
  const addTask = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = { ...taskData, id: `tsk-${Date.now()}` };
    setTasks((prev) => [newTask, ...prev]);
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t))
    );
  };

  const voteDecision = (decisionId: string, optionId: string, role: Role, status: 'approved' | 'rejected') => {
    setDecisions((prev) =>
      prev.map((dec) => {
        if (dec.id === decisionId) {
          const nextWife = role === 'wife' ? status : dec.wifeStatus;
          const nextHusband = role === 'husband' ? status : dec.husbandStatus;
          let overallStatus: Decision['status'] = 'discussing';
          if (nextWife === 'approved' && nextHusband === 'approved') overallStatus = 'both_agreed';
          else if (nextWife === 'approved') overallStatus = 'wife_approved';
          else if (nextHusband === 'approved') overallStatus = 'husband_approved';

          return {
            ...dec,
            wifeStatus: nextWife,
            husbandStatus: nextHusband,
            selectedOptionId: optionId,
            status: overallStatus
          };
        }
        return dec;
      })
    );
  };

  const addNote = (noteData: Omit<Note, 'id' | 'createdAt'>) => {
    const newNote: Note = { ...noteData, id: `not-${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] };
    setNotes((prev) => [newNote, ...prev]);
  };

  const convertNoteToTask = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    addTask({
      title: note.title,
      description: note.content,
      assignedTo: 'both',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      status: 'pending',
      category: 'General'
    });
  };

  const addReminder = (remData: Omit<Reminder, 'id' | 'isCompleted'>) => {
    const newRem: Reminder = { ...remData, id: `rem-${Date.now()}`, isCompleted: false };
    setReminders((prev) => [newRem, ...prev]);
  };

  const toggleReminder = (reminderId: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? { ...r, isCompleted: !r.isCompleted } : r))
    );
  };

  // AI Companion Engine
  const askAiAssistant = (question: string): string => {
    const q = question.toLowerCase();
    if (q.includes('tomorrow') || q.includes('schedule') || q.includes('duty')) {
      if (dutyDays.length > 0) {
        const tomorrowDuty = dutyDays[1];
        return `Tomorrow (${tomorrowDuty.date}), Aisha has **${tomorrowDuty.dutyType} Duty**. ${
          tomorrowDuty.isHomeWeekend ? '🌟 It is a HOME WEEKEND!' : ''
        } ${tomorrowDuty.isHusbandWfh ? '🏠 Tunde is Working From Home!' : ''}`;
      }
      return 'Duty schedule is not configured yet.';
    }
    if (q.includes('spent') || q.includes('spending') || q.includes('money')) {
      const totalSpent = transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      return `Total live spending recorded is **₦${totalSpent.toLocaleString()} NGN**.`;
    }
    if (q.includes('confirm') || q.includes('waiting') || q.includes('purchase')) {
      const awaiting = householdItems.filter((i) => i.status === 'awaiting_confirmation');
      if (awaiting.length > 0) {
        return `There is **${awaiting.length} item(s) awaiting confirmation**: ${awaiting.map((a) => a.name).join(', ')}.`;
      }
      return 'All purchases are fully confirmed!';
    }
    return `OURA Live Intelligence: Database connected and ready to record your real couple data!`;
  };

  return (
    <OuraContext.Provider
      value={{
        isAuthenticated,
        keepMeLoggedIn,
        loginUser,
        loginWithProfile,
        logoutUser,
        isLiveSupabaseConnected,
        currentRole,
        setCurrentRole,
        toggleRole,
        wifeProfile,
        husbandProfile,
        activeProfile,
        partnerProfile,
        updateProfileName,
        updateHusbandWfhDays,
        connectPartnerCode,
        toggleDiscreetMode,
        setSalarySharingLevel,
        toggleSalarySharing,
        setMenstrualSharingLevel,
        wifeSalary,
        husbandSalary,
        activeSalary,
        updateSalaryProfile,
        transactions,
        addTransaction,
        reverseTransaction,
        budgets: [],
        savingsGoals,
        addSavingsGoal,
        addSavingsContribution,
        householdItems,
        addHouseholdItem,
        updateItemStatus,
        confirmPurchase,
        pendingConfirmationItem,
        dutySetup,
        updateDutySetup,
        dutyDays,
        menstrualLogs,
        addMenstrualLog,
        cyclePrediction,
        weeklyMeals,
        addMealToPlan,
        tasks,
        addTask,
        toggleTaskStatus,
        decisions,
        voteDecision,
        notes,
        addNote,
        convertNoteToTask,
        reminders,
        addReminder,
        toggleReminder,
        auditLogs,
        quickActionOpen,
        setQuickActionOpen,
        activeTab,
        setActiveTab,
        askAiAssistant
      }}
    >
      {children}
    </OuraContext.Provider>
  );
};

export const useOura = () => {
  const context = useContext(OuraContext);
  if (!context) throw new Error('useOura must be used within an OuraProvider');
  return context;
};
