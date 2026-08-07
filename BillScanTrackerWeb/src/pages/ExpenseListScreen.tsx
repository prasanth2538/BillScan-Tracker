import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, Loader2, ShoppingCart, UtensilsCrossed, Fuel, Heart, Clapperboard, Bus, Plus, Edit2, Trash2 } from 'lucide-react';
import { getThisMonthExpenses, RawExpense, deleteExpense } from '../services/expenseService';
import { saveExpense } from "../services/saveExpense";
import { getUserProfile } from '../services/userService';
import { BillDetailScreen } from './BillDetailScreen';

// ─── Category config ──────────────────────────────────────────────────────────

interface CategoryConfig {
  label: string;
  icon: React.ReactNode;
  emoji: string;
  bg: string;
  darkBg: string;
  iconBg: string;
  iconColor: string;
  keywords: string[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    label: 'Food', emoji: '🍽️',
    icon: <UtensilsCrossed size={18} />,
    bg: '#FFF8EE', darkBg: '#2B1E00',
    iconBg: '#FFE5B4', iconColor: '#C97A00',
    keywords: ['food', 'restaurant', 'dining', 'café', 'cafe', 'pizza', 'zomato', 'swiggy'],
  },
  {
    label: 'Grocery', emoji: '🛒',
    icon: <ShoppingCart size={18} />,
    bg: '#F0FAF5', darkBg: '#0D2E1E',
    iconBg: '#C8EFE0', iconColor: '#2E7D58',
    keywords: ['groceries', 'grocery', 'supermarket', 'mart'],
  },
  {
    label: 'Petrol', emoji: '⛽',
    icon: <Fuel size={18} />,
    bg: '#EDF4FD', darkBg: '#0A1A2E',
    iconBg: '#BFDBFE', iconColor: '#1D4ED8',
    keywords: ['petrol', 'fuel', 'gas', 'diesel'],
  },
  {
    label: 'Travel', emoji: '🚌',
    icon: <Bus size={18} />,
    bg: '#F0FDF4', darkBg: '#062010',
    iconBg: '#BBF7D0', iconColor: '#15803D',
    keywords: ['travel', 'bus', 'train', 'metro', 'ticket', 'cab', 'uber', 'ola', 'auto', 'flight'],
  },
  {
    label: 'Hotel', emoji: '🏨',
    icon: <span className="text-base">🏨</span>,
    bg: '#FFF7ED', darkBg: '#2A1800',
    iconBg: '#FFEDD5', iconColor: '#EA580C',
    keywords: ['hotel', 'resort', 'stay', 'lodge', 'booking'],
  },
  {
    label: 'Health', emoji: '🏥',
    icon: <Heart size={18} />,
    bg: '#FEF2F2', darkBg: '#2E0A0A',
    iconBg: '#FECACA', iconColor: '#DC2626',
    keywords: ['health', 'hospital', 'medical', 'pharmacy', 'medicine', 'doctor', 'clinic'],
  },
  {
    label: 'Shopping', emoji: '🛍️',
    icon: <span className="text-base">🛍️</span>,
    bg: '#FDF2F8', darkBg: '#2E0A20',
    iconBg: '#FBCFE8', iconColor: '#DB2777',
    keywords: ['shopping', 'clothes', 'fashion', 'amazon', 'flipkart', 'myntra', 'apparel'],
  },
  {
    label: 'Entertainment', emoji: '🎬',
    icon: <Clapperboard size={18} />,
    bg: '#F3F0FD', darkBg: '#1A0E2E',
    iconBg: '#DDD6FE', iconColor: '#7C3AED',
    keywords: ['entertainment', 'movies', 'cinema', 'pvr', 'inox', 'netflix', 'show'],
  },
  {
    label: 'Education', emoji: '🎓',
    icon: <span className="text-base">🎓</span>,
    bg: '#EFF6FF', darkBg: '#0A1E3F',
    iconBg: '#DBEAFE', iconColor: '#2563EB',
    keywords: ['education', 'school', 'college', 'tuition', 'books', 'course', 'fees'],
  },
  {
    label: 'Bills', emoji: '💡',
    icon: <span className="text-base">💡</span>,
    bg: '#FEFCE8', darkBg: '#2A2800',
    iconBg: '#FEF08A', iconColor: '#CA8A04',
    keywords: ['bills', 'electricity', 'water', 'recharge', 'wifi', 'internet', 'utility'],
  },
  {
    label: 'Other', emoji: '📄',
    icon: <span className="text-base">📄</span>,
    bg: '#F5F5F5', darkBg: '#1C1C1E',
    iconBg: '#E5E7EB', iconColor: '#6B7280',
    keywords: ['other', 'misc', 'miscellaneous', 'unknown'],
  },
];

function resolveCategory(raw: string): CategoryConfig {
  const lower = (raw || '').toLowerCase();
  return CATEGORIES.find(c => c.keywords.some(k => lower.includes(k))) ?? CATEGORIES[0];
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return 'Unknown Date';
  if (/^[A-Z]/.test(dateStr) && dateStr.length < 15) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'TODAY';
    if (d.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  } catch { return dateStr; }
}

// ─── Category Detail Bottom Sheet (slides up from bottom) ────────────────────

interface CategorySheetProps {
  config: CategoryConfig;
  expenses: RawExpense[];
  total: number;
  isDark: boolean;
  categoryBudget?: number;
  onClose: () => void;
  onEditExpense: (expense: RawExpense) => void;
  onDeleteExpense: (expense: RawExpense) => void;
}

function CategorySheet({
  config,
  expenses,
  total,
  isDark,
  categoryBudget = 0,
  onClose,
  onEditExpense,
  onDeleteExpense,
}: CategorySheetProps) {
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, RawExpense[]> = {};
    for (const e of expenses) {
      const label = formatDateLabel(e.date || '');
      if (!map[label]) map[label] = [];
      map[label].push(e);
    }
    return map;
  }, [expenses]);

  const percentUsed = categoryBudget > 0 ? Math.round((total / categoryBudget) * 100) : 0;
  const remaining = categoryBudget - total;

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Dim backdrop — tap to close */}
      <motion.div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Sheet slides up from bottom */}
      <motion.div
        className="relative w-full rounded-t-[28px] max-h-[88vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: isDark ? '#1C1C1E' : '#ffffff' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-black/10 dark:bg-white/20 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

        {/* Header row */}
        <div className="px-5 pt-3 pb-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: config.iconBg, color: config.iconColor }}
            >
              {config.icon}
            </div>
            <div>
              <p className="font-sora font-semibold text-[15px] text-gray-900 dark:text-white">
                {config.label}
              </p>
              <p className="font-dm text-[12px] text-gray-500 dark:text-gray-400">
                {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center"
          >
            <X size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Smart Category Budget Assistant Banner */}
        {categoryBudget > 0 && (
          <div
            className={`mx-5 mb-3 p-3.5 rounded-[14px] flex items-center justify-between font-dm text-[13px] border ${percentUsed >= 90
                ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                : percentUsed >= 75
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                  : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
              }`}
          >
            <div>
              <p className="font-semibold">
                ⚠️ {config.label} budget {percentUsed}% used.
              </p>
              <p className="text-[12px] opacity-90 mt-0.5">
                {remaining >= 0
                  ? `Only ₹${remaining.toLocaleString("en-IN")} remaining.`
                  : `₹${Math.abs(remaining).toLocaleString("en-IN")} over budget.`}
              </p>
            </div>
            <span className="font-mono font-bold text-[14px]">
              ₹{categoryBudget.toLocaleString("en-IN")}
            </span>
          </div>
        )}

        {/* Total banner */}
        <div
          className="mx-5 mb-4 rounded-[14px] p-4 flex justify-between items-center flex-shrink-0"
          style={{ backgroundColor: isDark ? config.darkBg : config.bg }}
        >
          <span className="font-dm text-[13px] text-gray-600 dark:text-gray-300">Total spent</span>
          <span className="font-mono font-bold text-[22px]" style={{ color: config.iconColor }}>
            ₹{total.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto px-5 pb-10 scrollbar-hide">
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span className="text-5xl">{config.emoji}</span>
              <p className="font-dm text-[13px] text-gray-400 dark:text-gray-500 mt-1">
                No {config.label.toLowerCase()} expenses yet
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([dateLabel, txns]) => (
              <div key={dateLabel} className="mb-5">
                <p className="font-dm text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium mb-2">
                  {dateLabel}
                </p>
                <div className="flex flex-col gap-2">
                  {txns.map((txn, i) => (
                    <motion.div
                      key={txn.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => onEditExpense(txn)}
                      className="rounded-[14px] p-3.5 flex flex-col gap-2 cursor-pointer hover:opacity-95 transition-all group"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                        border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                          style={{ backgroundColor: config.iconBg }}
                        >
                          {config.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-dm font-medium text-[14px] text-gray-900 dark:text-white truncate">
                            {txn.merchant || 'Unknown'}
                          </p>
                          <p className="font-dm text-[12px] text-gray-400 dark:text-gray-500">{dateLabel}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono font-semibold text-[15px] text-gray-900 dark:text-white">
                            ₹{Number(txn.amount).toLocaleString('en-IN')}
                          </span>

                          {/* Quick action buttons: Edit & Delete */}
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditExpense(txn);
                              }}
                              title="Edit Bill"
                              className="w-8 h-8 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteExpense(txn);
                              }}
                              title="Delete Bill"
                              className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {txn.imageUrl && (
                        <div className="pt-1 border-t border-black/5 dark:border-white/5 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingImage(txn.imageUrl!);
                            }}
                            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            📷 View Bill Image
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                {/* Day subtotal */}
                <div className="flex justify-end mt-1.5 pr-1">
                  <span className="font-dm text-[11px] text-gray-400 dark:text-gray-500">
                    Day total:{' '}
                    <span className="font-mono font-semibold" style={{ color: config.iconColor }}>
                      ₹{txns.reduce((s, e) => s + Number(e.amount || 0), 0).toLocaleString('en-IN')}
                    </span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal lightbox for bill image preview */}
        <AnimatePresence>
          {viewingImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
              onClick={() => setViewingImage(null)}
            >
              <div className="relative max-w-full max-h-full">
                <button
                  onClick={() => setViewingImage(null)}
                  className="absolute -top-10 right-0 text-white font-bold bg-black/50 p-2 rounded-full"
                >
                  <X size={20} />
                </button>
                <img
                  src={viewingImage}
                  alt="Bill receipt"
                  className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl border border-white/20"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Expense List Screen ─────────────────────────────────────────────────

export function ExpenseListScreen() {
  const [allExpenses, setAllExpenses] = useState<RawExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<CategoryConfig | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<RawExpense | null>(null);
  const [manualAmount, setManualAmount] = useState('');
  const [manualCategory, setManualCategory] = useState('Food');
  const [manualMerchant, setManualMerchant] = useState('');
  const [savingManual, setSavingManual] = useState(false);
  const [expandedManual, setExpandedManual] = useState(false);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});

  // Reactive dark mode tracking
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await getThisMonthExpenses(true);
      setAllExpenses(data);
      const prof = await getUserProfile();
      if (prof?.categoryBudgets) {
        setCategoryBudgets(prof.categoryBudgets);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleDeleteExpense = async (txn: RawExpense) => {
    const ok = confirm(`Delete expense from "${txn.merchant || 'Expense'}" (₹${Number(txn.amount).toLocaleString('en-IN')})?`);
    if (!ok) return;

    try {
      await deleteExpense(txn.id);
      setAllExpenses(prev => prev.filter(e => e.id !== txn.id));
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert(err.message || 'Failed to delete expense');
    }
  };

  const bucketed = useMemo(() => {
    const map = new Map<string, RawExpense[]>();
    CATEGORIES.forEach(c => map.set(c.label, []));
    for (const e of allExpenses) {
      const cfg = resolveCategory(e.category || '');
      map.get(cfg.label)!.push(e);
    }
    return map;
  }, [allExpenses]);

  const grandTotal = allExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const openCategoryExpenses = openCategory ? (bucketed.get(openCategory.label) ?? []) : [];
  const openCategoryTotal = openCategoryExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const handleManualSave = async () => {
    if (!manualAmount || Number(manualAmount) <= 0) { alert('Please enter a valid amount'); return; }
    try {
      setSavingManual(true);
      await saveExpense({
        amount: Number(manualAmount), category: manualCategory,
        merchant: manualMerchant || 'Manual Expense',
        date: new Date().toISOString(), source: 'manual',
      });
      alert('Expense added successfully');
      loadExpenses();
      setManualAmount(''); setManualMerchant(''); setManualCategory('Food');
      setExpandedManual(false);
    } catch (err: any) {
      console.error(err); alert(err.message || 'Failed to save');
    } finally { setSavingManual(false); }
  };

  return (
    <div className="w-full h-full bg-page flex flex-col relative overflow-hidden">


      {/* Top bar */}
      <div className="pt-12 px-4 pb-3 bg-page flex-shrink-0">
        <h1 className="font-sora font-semibold text-[20px] text-gray-900 dark:text-white">Expenses</h1>
        <p className="font-dm text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
          Tap a category to see all transactions
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 scrollbar-hide">

        {loading && (
          <div className="flex flex-col items-center justify-center mt-24 gap-3">
            <Loader2 size={26} className="text-brand-green animate-spin" />
            <p className="font-dm text-[13px] text-gray-400">Loading expenses…</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-10 p-4 bg-red-50 dark:bg-red-900/20 rounded-[12px] text-center">
            <p className="font-dm text-[13px] text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && allExpenses.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-24 gap-2">
            <span className="text-5xl">🧾</span>
            <p className="font-dm text-[14px] text-gray-600 dark:text-gray-300 mt-2">No expenses yet</p>
            <p className="font-dm text-[12px] text-gray-400 dark:text-gray-500">Scan a bill to get started</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── Category cards (compact size unchanged) ── */}
            <div className="flex flex-col gap-2 mt-1">
              {CATEGORIES.map((category) => {
                const categoryExpenses = bucketed.get(category.label) ?? [];
                const total = categoryExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
                const hasData = categoryExpenses.length > 0;

                return (
                  <motion.button
                    key={category.label}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setOpenCategory(category)}
                    className="w-full rounded-[16px] px-3 py-3 flex items-center gap-3 transition-all"
                    style={{ backgroundColor: isDark ? category.darkBg : category.bg }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: category.iconBg, color: category.iconColor }}
                    >
                      {category.icon}
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <p className="font-sora font-semibold text-[15px] text-gray-900 dark:text-white leading-tight">
                        {category.label}
                      </p>
                      <p className="font-dm text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {hasData
                          ? `${categoryExpenses.length} transaction${categoryExpenses.length > 1 ? 's' : ''}`
                          : 'No expenses yet'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span
                        className="font-mono font-bold text-[14px]"
                        style={{ color: hasData ? category.iconColor : '#9CA3AF' }}
                      >
                        {hasData ? `₹${total.toLocaleString('en-IN')}` : '—'}
                      </span>
                      {hasData && (
                        <ChevronRight size={16} style={{ color: category.iconColor }} />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* ── Manual Expense Entry Accordion ── */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-[16px] shadow-sm mt-3 mb-2 overflow-hidden transition-colors">
              <button
                type="button"
                onClick={() => setExpandedManual(!expandedManual)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="font-sora font-semibold text-[15px] text-gray-900 dark:text-white">
                      Add Manual Expense
                    </h3>
                    <p className="font-dm text-[12px] text-gray-500 dark:text-gray-400">
                      {expandedManual ? "Tap to collapse" : "Tap to add cash or manual expense"}
                    </p>
                  </div>
                </div>

                <motion.div
                  animate={{ rotate: expandedManual ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-400 dark:text-gray-500 shrink-0 ml-2"
                >
                  <ChevronRight size={18} className="rotate-90" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {expandedManual && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="px-4 pb-4 pt-1 border-t border-black/5 dark:border-white/10"
                  >
                    <label className="font-dm text-[12px] text-gray-500 dark:text-gray-400 block mt-2 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full h-11 bg-gray-50 dark:bg-white/10 border border-black/5 dark:border-white/10 rounded-xl px-4 mb-2.5 outline-none font-dm text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400"
                    />

                    <label className="font-dm text-[12px] text-gray-500 dark:text-gray-400 block mb-1">
                      Category
                    </label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full h-11 bg-gray-50 dark:bg-white/10 border border-black/5 dark:border-white/10 rounded-xl px-4 mb-2.5 outline-none font-dm text-[14px] text-gray-900 dark:text-white"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.label} value={c.label}>
                          {c.label}
                        </option>
                      ))}
                    </select>

                    <label className="font-dm text-[12px] text-gray-500 dark:text-gray-400 block mb-1">
                      Merchant / Note
                    </label>
                    <input
                      type="text"
                      value={manualMerchant}
                      onChange={(e) => setManualMerchant(e.target.value)}
                      placeholder="Merchant / Note"
                      className="w-full h-11 bg-gray-50 dark:bg-white/10 border border-black/5 dark:border-white/10 rounded-xl px-4 mb-3 outline-none font-dm text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400"
                    />

                    <button
                      onClick={handleManualSave}
                      disabled={savingManual}
                      className="w-full h-11 bg-brand-green text-white rounded-xl font-sora font-semibold text-[14px] disabled:opacity-60 active:scale-[0.98] transition-all"
                    >
                      {savingManual ? 'Saving…' : 'Add Expense'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Sticky bottom total */}
      {!loading && allExpenses.length > 0 && (
        <div className="absolute bottom-[80px] left-0 right-0 bg-white dark:bg-[#1C1C1E] border-t border-black/5 dark:border-white/5 px-4 py-3 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
          <span className="font-dm text-[12px] text-gray-500 dark:text-gray-400">
            {allExpenses.length} transaction{allExpenses.length !== 1 ? 's' : ''}
          </span>
          <span className="font-mono font-medium text-[14px] text-gray-900 dark:text-white">
            ₹{grandTotal.toLocaleString('en-IN')} total
          </span>
        </div>
      )}

      {/* ── Category Detail Bottom Sheet ── */}
      <AnimatePresence>
        {openCategory && (
          <CategorySheet
            config={openCategory}
            expenses={openCategoryExpenses}
            total={openCategoryTotal}
            isDark={isDark}
            categoryBudget={categoryBudgets[openCategory.label] || 0}
            onClose={() => setOpenCategory(null)}
            onEditExpense={(expense) => setSelectedExpense(expense)}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
      </AnimatePresence>

      {/* ── Bill Detail / Edit Sheet ── */}
      <AnimatePresence>
        {selectedExpense && (
          <BillDetailScreen
            expense={{
              id: selectedExpense.id,
              merchant: selectedExpense.merchant,
              amount: selectedExpense.amount,
              category: selectedExpense.category,
              date: selectedExpense.date,
              icon: resolveCategory(selectedExpense.category).emoji,
              color: resolveCategory(selectedExpense.category).iconBg,
              imageUrl: selectedExpense.imageUrl,
            }}
            onClose={() => setSelectedExpense(null)}
            onChanged={loadExpenses}
          />
        )}
      </AnimatePresence>
    </div>
  );
}