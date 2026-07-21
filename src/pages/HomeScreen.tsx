import { useEffect, useState, useRef } from "react";
import { getThisMonthExpenses } from "../services/expenseService";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ArrowRight, Camera, X } from "lucide-react";
import { ExpenseCard, Expense } from "../components/ExpenseCard";
import { UserProfile } from "./SignUpScreen";

interface HomeScreenProps {
  user: UserProfile;
  onScanClick: () => void;
  onExpenseClick: (expense: Expense) => void;
  onViewDetails: () => void;
  onSeeAllCategories: () => void;
  onProfileClick: () => void;
}

interface NotificationState {
  show: boolean;
  message: string;
  amount: number;
}

function resolveHomeBucket(cat: string): string {
  const c = (cat || "").toLowerCase();

  if (["groceries", "grocery", "supermarket"].some(k => c.includes(k))) return "Groceries";
  if (["food", "restaurant", "dining", "café", "cafe", "pizza", "zomato", "swiggy"].some(k => c.includes(k))) return "Food";
  if (["petrol", "fuel", "transport", "gas", "travel", "bus", "train", "metro", "cab"].some(k => c.includes(k))) return "Transport";
  if (["entertainment", "movies", "cinema", "pvr", "inox"].some(k => c.includes(k))) return "Entertain";

  return "Other";
}

const CAT_DISPLAY: Record<string, { icon: string; color: string }> = {
  Petrol: { icon: "⛽", color: "#EDF4FD" },
  Food: { icon: "🍽️", color: "#FFF8EE" },
  Groceries: { icon: "🛒", color: "#F0FAF5" },
  Transport: { icon: "🚌", color: "#F0FDF4" },
  Movies: { icon: "🎬", color: "#F3F0FD" },
  Hospital: { icon: "🏥", color: "#FEF2F2" },
  Other: { icon: "📄", color: "#F5F5F5" },
};

export function HomeScreen({
  user,
  onScanClick,
  onExpenseClick,
  onViewDetails,
  onSeeAllCategories,
  onProfileClick,
}: HomeScreenProps) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: "",
    amount: 0,
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem("billscan_notifications_enabled");
    return saved === "true";
  });
  const [pullDistance, setPullDistance] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef(0);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadExpenses = async (force = false) => {
    try {
      setRefreshing(true);
      const data = await getThisMonthExpenses(force);
      setExpenses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull to refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      touchStartRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0 && touchStartRef.current > 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - touchStartRef.current);
      setPullDistance(distance);

      if (distance > 0) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      loadExpenses(true);
    }
    setPullDistance(0);
    touchStartRef.current = 0;
  };

  // Check for notification setting changes
  useEffect(() => {
    const handleStorageChange = () => {
      const enabled = localStorage.getItem("billscan_notifications_enabled") === "true";
      setNotificationsEnabled(enabled);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Show notification - respects user preferences
  const showBudgetNotification = (leftAmount: number, isAutomatic: boolean = false) => {
    // Check current notification setting
    const isEnabled = localStorage.getItem("billscan_notifications_enabled") === "true";

    // If automatic (from bill scan) and notifications disabled, don't show
    if (isAutomatic && !isEnabled) {
      return;
    }

    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    setNotification({
      show: true,
      message: isAutomatic ? "✅ Bill scanned! Remaining budget:" : "Remaining Budget:",
      amount: leftAmount,
    });

    // Auto-hide notification after 5 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Listen for scan completion
  useEffect(() => {
    const handleScanComplete = () => {
      loadExpenses(true);
      const monthlyBudget = Number(user.monthlyBudget || 0);
      const totalSpent = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      const leftAmount = monthlyBudget - totalSpent;

      // Show notification only if enabled (automatic scan notification)
      showBudgetNotification(leftAmount, true);
    };

    window.addEventListener("billScanned", handleScanComplete);
    return () => window.removeEventListener("billScanned", handleScanComplete);
  }, [expenses, user.monthlyBudget]);

  useEffect(() => {
    loadExpenses(true);

    // Cleanup on unmount
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const monthlyBudget = Number(user.monthlyBudget || 0);
  const amountLeft = monthlyBudget - totalSpent;
  const progressPct = monthlyBudget > 0 ? Math.min(100, (totalSpent / monthlyBudget) * 100) : 0;

  const daysElapsed = Math.max(1, new Date().getDate());
  const dailyAvg = totalSpent > 0 ? Math.round(totalSpent / daysElapsed) : 0;

  const catTotals: Record<string, number> = {
    Groceries: 0,
    Food: 0,
    Transport: 0,
    Entertain: 0,
  };

  for (const e of expenses) {
    const bucket = resolveHomeBucket(e.category || "");
    if (bucket in catTotals) catTotals[bucket] += Number(e.amount || 0);
  }

  const initials = (user.name || "U")
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const monthLabel = new Date()
    .toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    .toUpperCase();

  const handleBellClick = () => {
    const isEnabled = localStorage.getItem("billscan_notifications_enabled") === "true";

    if (!isEnabled) {
      // Show disabled notification
      setNotification({
        show: true,
        message: "🔕 Notifications Disabled",
        amount: amountLeft,
      });

      notificationTimeoutRef.current = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);

      return;
    }

    // Show remaining budget notification
    showBudgetNotification(amountLeft, false);
  };

  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-full bg-page overflow-y-auto pb-32 scrollbar-hide relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <AnimatePresence>
        {pullDistance > 0 && (
          <motion.div
            className="fixed top-2 left-0 right-0 flex justify-center z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: pullDistance > 80 ? 180 : 0 }}
                className="inline-block text-brand-green text-2xl"
              >
                ↓
              </motion.div>
              <p className="font-dm text-[11px] text-text-tertiary mt-1">
                {pullDistance > 80 ? "Release to refresh" : "Pull to refresh"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-0 left-0 right-0 mx-4 mt-4 z-50 max-w-md mx-auto"
          >
            <div
              className={`rounded-2xl shadow-lg border overflow-hidden ${
                notification.message.includes("Disabled")
                  ? "bg-white border-yellow-200"
                  : "bg-white border-brand-green/20"
              }`}
            >
              <div
                className={`p-4 ${
                  notification.message.includes("Disabled")
                    ? "bg-yellow-50"
                    : "bg-gradient-to-r from-brand-green to-brand-green-gradient"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p
                      className={`font-dm text-[12px] mb-1 ${
                        notification.message.includes("Disabled")
                          ? "text-yellow-700"
                          : "text-white/80"
                      }`}
                    >
                      {notification.message}
                    </p>
                    {!notification.message.includes("Disabled") && (
                      <motion.h3
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="font-mono font-bold text-[28px] text-white leading-none"
                      >
                        ₹{notification.amount.toLocaleString("en-IN")}
                      </motion.h3>
                    )}
                    {notification.message.includes("Disabled") && (
                      <p className="font-dm text-[13px] text-yellow-800">
                        Enable notifications in settings to receive budget alerts
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                    className={`flex-shrink-0 ml-3 transition-colors ${
                      notification.message.includes("Disabled")
                        ? "text-yellow-400 hover:text-yellow-600"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              {!notification.message.includes("Disabled") && (
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 5, ease: "linear" }}
                  className="h-1 bg-brand-green origin-left"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-5 w-full" />

      <div className="h-[60px] px-6 flex items-center justify-between">
        <div>
          <p className="font-dm text-[13px] text-text-tertiary">Good morning 👋</p>
          <h1 className="font-sora font-bold text-[20px] text-gradient mt-0.5">
            {user.name}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleBellClick}
            className="relative w-11 h-11 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-sm text-text-primary dark:text-white transition-all hover:shadow-md hover:scale-105 active:scale-95"
            title={notificationsEnabled ? "View remaining budget" : "Notifications disabled"}
          >
            <Bell size={22} />
            {amountLeft < 0 && notificationsEnabled && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
              />
            )}
            {!notificationsEnabled && (
              <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-yellow-500 rounded-full border-2 border-white dark:border-gray-800 text-[8px] flex items-center justify-center text-white font-bold">
                ✕
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={onProfileClick}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-green to-brand-green-gradient flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 transition-all"
          >
            <span className="font-sora font-semibold text-[14px] text-white">
              {initials}
            </span>
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-6 mt-4 glass-effect rounded-card p-6 shadow-floating relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex justify-between items-center relative z-10">
          <span className="font-dm text-[12px] uppercase tracking-wider text-text-tertiary font-bold">
            {monthLabel}
          </span>

          <button
            onClick={onViewDetails}
            className="font-dm text-[13px] text-brand-green flex items-center gap-1.5 font-semibold hover:gap-2.5 transition-all bg-brand-green/10 px-3 py-1.5 rounded-pill"
          >
            Details <ArrowRight size={14} />
          </button>
        </div>

        <div className="mt-3 relative z-10">
          <h2 className="font-mono font-bold text-[44px] text-gradient tracking-tight leading-none">
            ₹{totalSpent.toLocaleString("en-IN")}
          </h2>
          <p className="font-dm text-[14px] text-text-secondary mt-1.5 font-medium">
            spent this month
          </p>
        </div>

        <div className="mt-6 relative z-10">
          <div className="w-full h-3 bg-muted dark:bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
              className={`h-full rounded-full ${
                amountLeft < 0 
                  ? 'bg-gradient-to-r from-red-400 to-red-500' 
                  : 'bg-gradient-to-r from-brand-green to-brand-green-gradient'
              }`}
            />
          </div>
        </div>

        <div className="flex justify-between mt-3 relative z-10">
          <span className="font-mono text-[13px] text-text-secondary font-medium">
            ₹{monthlyBudget.toLocaleString("en-IN")} budget
          </span>

          <span
            className={`font-mono text-[13px] font-bold transition-colors ${
              amountLeft >= 0 ? "text-brand-green" : "text-danger"
            }`}
          >
            {amountLeft >= 0
              ? `₹${amountLeft.toLocaleString("en-IN")} left`
              : `₹${Math.abs(amountLeft).toLocaleString("en-IN")} over`}
          </span>
        </div>
      </motion.div>

      <div className="mx-6 mt-4 flex gap-3">
        {[
          { label: "DAILY AVG", value: `₹${dailyAvg.toLocaleString("en-IN")}` },
          { label: "BILLS SCANNED", value: String(expenses.length) },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="flex-1 bg-white dark:bg-dark-card rounded-card p-4 shadow-sm border border-transparent dark:border-white/5 hover:shadow-md transition-shadow"
          >
            <p className="font-dm text-[11px] uppercase tracking-wider text-text-tertiary font-bold mb-1">
              {stat.label}
            </p>
            <p className="font-mono font-bold text-[24px] text-text-primary leading-tight">
              {stat.value}
            </p>
            <p className="font-dm text-[12px] text-text-tertiary mt-1 font-medium">
              This month
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 px-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-sora font-bold text-[18px] text-text-primary">
            Categories
          </h3>
          <button
            onClick={onSeeAllCategories}
            className="font-dm text-[14px] text-brand-green font-semibold hover:text-brand-dark transition-colors"
          >
            See all
          </button>
        </div>

        <div className="flex justify-between gap-4 pb-2">
          {[
            { icon: "🛒", label: "Groceries", bg: "#E1F5EE", darkBg: "#064E3B" },
            { icon: "🍕", label: "Food", bg: "#FAEEDA", darkBg: "#78350F" },
            { icon: "⛽", label: "Transport", bg: "#E6F1FB", darkBg: "#1E3A8A" },
            { icon: "🎬", label: "Entertain", bg: "#EAE8F9", darkBg: "#4C1D95" },
          ].map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex flex-col items-center flex-1 hover:scale-105 transition-transform cursor-pointer group"
            >
              <div
                className="w-[60px] h-[60px] rounded-[20px] flex items-center justify-center text-[28px] mb-2 shadow-sm group-hover:shadow-md transition-shadow bg-opacity-100 dark:bg-opacity-20"
                style={{ backgroundColor: document.documentElement.classList.contains('dark') ? cat.darkBg : cat.bg }}
              >
                {cat.icon}
              </div>

              <span className="font-dm text-[12px] text-text-secondary font-medium">
                {cat.label}
              </span>

              <span className="font-mono text-[12px] text-text-primary font-bold mt-0.5">
                ₹{(catTotals[cat.label] || 0).toLocaleString("en-IN")}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-8 px-6 pb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-sora font-bold text-[18px] text-text-primary">
            Recent Expenses
          </h3>
          <button
            onClick={onSeeAllCategories}
            className="font-dm text-[14px] text-brand-green font-semibold hover:text-brand-dark transition-colors"
          >
            See all
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {!loading && expenses.length === 0 && (
            <div className="bg-white dark:bg-dark-card rounded-card p-8 text-center shadow-sm border border-transparent dark:border-white/5">
              <div className="text-4xl mb-3 opacity-50">🧾</div>
              <p className="font-dm text-[14px] text-text-secondary font-medium">
                No expenses yet
              </p>
              <p className="font-dm text-[12px] text-text-tertiary mt-1">
                Scan your first bill to get started!
              </p>
            </div>
          )}

          {expenses.slice(0, 5).map((expense, i) => {
            const meta = CAT_DISPLAY[expense.category] ?? CAT_DISPLAY.Other;

            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <ExpenseCard
                  expense={{
                    id: expense.id,
                    merchant: expense.merchant || "Unknown",
                    category: expense.category || "Other",
                    amount: Number(expense.amount || 0),
                    date: expense.date || "",
                    icon: expense.icon || meta.icon,
                    color: expense.color || meta.color,
                  }}
                  onClick={() => onExpenseClick(expense)}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-[110px] left-0 right-0 flex justify-center pointer-events-none z-30">
        <div className="flex flex-col items-center pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onScanClick}
            className="w-[72px] h-[72px] bg-gradient-to-r from-brand-green to-brand-green-gradient rounded-full shadow-fab flex items-center justify-center text-white mb-2 relative group"
          >
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
            <Camera size={32} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}