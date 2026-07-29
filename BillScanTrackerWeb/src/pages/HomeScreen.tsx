import { useEffect, useState, useRef } from "react";
import { getThisMonthExpenses } from "../services/expenseService";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ArrowRight, Camera, X } from "lucide-react";
import { ExpenseCard, Expense } from "../components/ExpenseCard";
import { getUserProfile } from "../services/userService";
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
  const [, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: "",
    amount: 0,
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem("billscan_notifications_enabled");
    return saved === "true";
  });
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});
  const [pullDistance, setPullDistance] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef(0);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadExpenses = async (force = false) => {
    try {
      setRefreshing(true);
      const data = await getThisMonthExpenses(force);
      setExpenses(data);
      const prof = await getUserProfile();
      if (prof?.categoryBudgets) {
        setCategoryBudgets(prof.categoryBudgets);
      }
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
    .map((n: string) => n[0])
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

      <div className="h-[60px] px-4 flex items-center justify-between">
        <div>
          <p className="font-dm text-[12px] text-text-tertiary">Good morning 👋</p>
          <h1 className="font-sora font-semibold text-[17px] text-text-primary">
            {user.name}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBellClick}
            className="relative w-10 h-10 flex items-center justify-center text-text-primary dark:text-white transition-transform hover:scale-110 active:scale-95"
            title={notificationsEnabled ? "View remaining budget" : "Notifications disabled"}
          >
            <Bell size={24} />
            {amountLeft < 0 && notificationsEnabled && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute top-2 right-2 w-2.5 h-2.5 bg-danger rounded-full border-2 border-page shadow-md"
              />
            )}
            {!notificationsEnabled && (
              <div className="absolute top-1 right-1 w-3 h-3 bg-yellow-500 rounded-full border border-white text-[8px] flex items-center justify-center text-white font-bold">
                ✕
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={onProfileClick}
            className="w-[38px] h-[38px] rounded-full bg-brand-green flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="font-sora font-semibold text-[13px] text-white">
              {initials}
            </span>
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-2 bg-white rounded-card p-5 shadow-card"
      >
        <div className="flex justify-between items-center">
          <span className="font-dm text-[11px] uppercase tracking-[0.06em] text-text-tertiary font-medium">
            {monthLabel}
          </span>

          <button
            onClick={onViewDetails}
            className="font-dm text-[12px] text-brand-green flex items-center gap-1 font-medium hover:gap-2 transition-all"
          >
            View details <ArrowRight size={12} />
          </button>
        </div>

        <div className="mt-1.5">
          <h2 className="font-mono font-bold text-[40px] text-text-primary leading-none">
            ₹{totalSpent.toLocaleString("en-IN")}
          </h2>
          <p className="font-dm text-[13px] text-text-tertiary mt-1">
            spent this month
          </p>
        </div>

        <div className="mt-4 relative">
          <div className="w-full h-[10px] bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-brand-green to-brand-green-gradient rounded-full"
            />
          </div>
        </div>

        <div className="flex justify-between mt-2">
          <span className="font-mono text-[12px] text-text-secondary">
            ₹{totalSpent.toLocaleString("en-IN")} spent
          </span>

          <span
            className={`font-mono text-[12px] font-medium transition-colors ${
              amountLeft >= 0 ? "text-brand-green" : "text-danger"
            }`}
          >
            {amountLeft >= 0
              ? `₹${amountLeft.toLocaleString("en-IN")} left`
              : `₹${Math.abs(amountLeft).toLocaleString("en-IN")} over`}
          </span>
        </div>
      </motion.div>

      {/* Smart Category Budget Warnings */}
      {(() => {
        const categorySpentMap: Record<string, number> = {};
        for (const e of expenses) {
          const cat = e.category || "Other";
          categorySpentMap[cat] = (categorySpentMap[cat] || 0) + Number(e.amount || 0);
        }

        const categoryBudgetWarnings = Object.entries(categoryBudgets)
          .map(([catName, limit]) => {
            const spent = categorySpentMap[catName] || 0;
            const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            const remaining = limit - spent;
            return { catName, limit, spent, pct, remaining };
          })
          .filter((w) => w.limit > 0 && w.pct >= 75);

        if (categoryBudgetWarnings.length === 0) return null;

        return (
          <div className="mx-4 mt-3 flex flex-col gap-2">
            {categoryBudgetWarnings.map((w) => (
              <div
                key={w.catName}
                className={`p-3.5 rounded-[16px] border flex items-center justify-between font-dm text-[13px] ${
                  w.pct >= 90
                    ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                    : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                }`}
              >
                <div>
                  <p className="font-sora font-semibold">
                    ⚠️ {w.catName} budget {w.pct}% used.
                  </p>
                  <p className="text-[12px] opacity-90 mt-0.5">
                    {w.remaining >= 0
                      ? `Only ₹${w.remaining.toLocaleString("en-IN")} remaining.`
                      : `₹${Math.abs(w.remaining).toLocaleString("en-IN")} over budget.`}
                  </p>
                </div>
                <span className="font-mono font-bold text-[14px]">
                  ₹{w.spent.toLocaleString("en-IN")} / ₹{w.limit.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        );
      })()}

      <div className="mx-4 mt-3 flex gap-2.5">
        {[
          { label: "DAILY AVG", value: `₹${dailyAvg.toLocaleString("en-IN")}` },
          { label: "BILLS SCANNED", value: String(expenses.length) },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="flex-1 bg-muted rounded-[14px] p-3.5"
          >
            <p className="font-dm text-[10px] uppercase text-text-tertiary font-medium mb-1">
              {stat.label}
            </p>
            <p className="font-mono font-semibold text-[22px] text-text-primary leading-tight">
              {stat.value}
            </p>
            <p className="font-dm text-[11px] text-text-tertiary mt-1">
              This month
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 px-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-sora font-semibold text-[15px] text-text-primary">
            Spending by category
          </h3>
          <button
            onClick={onSeeAllCategories}
            className="font-dm text-[13px] text-brand-green font-medium hover:text-brand-green/80 transition-colors"
          >
            See all →
          </button>
        </div>

        <div className="flex justify-between gap-4 pb-2">
          {[
            { icon: "🛒", label: "Groceries", bg: "#E1F5EE" },
            { icon: "🍕", label: "Food", bg: "#FAEEDA" },
            { icon: "⛽", label: "Transport", bg: "#E6F1FB" },
            { icon: "🎬", label: "Entertain", bg: "#EAE8F9" },
          ].map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex flex-col items-center flex-shrink-0 hover:scale-105 transition-transform cursor-pointer"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-2 shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: cat.bg }}
              >
                {cat.icon}
              </div>

              <span className="font-dm text-[11px] text-text-secondary">
                {cat.label}
              </span>

              <span className="font-mono text-[11px] text-text-primary font-medium mt-0.5">
                ₹{(catTotals[cat.label] || 0).toLocaleString("en-IN")}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-6 px-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-sora font-semibold text-[15px] text-text-primary">
            Recent expenses
          </h3>
          <button
            onClick={onSeeAllCategories}
            className="font-dm text-[13px] text-brand-green font-medium hover:text-brand-green/80 transition-colors"
          >
            See all →
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {!loading && expenses.length === 0 && (
            <p className="font-dm text-[13px] text-text-tertiary text-center py-6">
              No expenses yet — scan your first bill!
            </p>
          )}

          {expenses.slice(0, 5).map(expense => {
            const meta = CAT_DISPLAY[expense.category] ?? CAT_DISPLAY.Other;

            return (
              <ExpenseCard
                key={expense.id}
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
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-[100px] left-0 right-0 flex justify-center pointer-events-none z-30">
        <div className="flex flex-col items-center pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onScanClick}
            className="w-16 h-16 bg-brand-green rounded-full shadow-fab flex items-center justify-center text-white mb-1.5 hover:shadow-lg transition-shadow"
          >
            <Camera size={28} />
          </motion.button>

          <span className="font-dm text-[11px] text-brand-green font-medium bg-page/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
            Scan bill
          </span>
        </div>
      </div>
    </div>
  );
}