import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Calendar,
  Sparkles,
  ShoppingBag,
  Store,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import {
  getExpenses,
  RawExpense,
} from "../services/expenseService";
import {
  filterExpensesByMonthAndYear,
  calculateMonthlySummary,
  calculateHighestCategory,
  getTopMerchant,
  comparePreviousMonth,
  calculateYearlySummary,
  MONTH_NAMES,
} from "../utils/trendAnalytics";
import {
  buildStructuredPayload,
  getAIFinancialAdvice,
} from "../services/aiAdvisorService";
import { getUserProfile } from "../services/userService";

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028];

interface MonthlyTrendScreenProps {
  user?: {
    monthlyIncome?: number;
    monthlyBudget?: number;
  } | null;
}

export function MonthlyTrendScreen({ user: userProp }: MonthlyTrendScreenProps = {}) {
  const [expenses, setExpenses] = useState<RawExpense[]>([]);
  const [userProfile, setUserProfile] = useState<{ monthlyIncome?: number; monthlyBudget?: number } | null>(userProp || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [yearlyTableYear, setYearlyTableYear] = useState(currentDate.getFullYear());

  // AI Financial Advisor State
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  useEffect(() => {
    loadExpenses();
    if (!userProp) {
      getUserProfile()
        .then((p) => {
          if (p) setUserProfile(p);
        })
        .catch((err) => console.warn("Failed to load user profile in TrendScreen:", err));
    } else {
      setUserProfile(userProp);
    }
  }, [userProp]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getExpenses();
      setExpenses(data);
    } catch (err: any) {
      console.error("Error loading expenses for analytics:", err);
      setError(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  // Filter expenses for selected month & year
  const monthlyExpenses = useMemo(() => {
    return filterExpensesByMonthAndYear(expenses, selectedYear, selectedMonth);
  }, [expenses, selectedYear, selectedMonth]);

  // Calculated Metrics
  const summary = useMemo(() => {
    return calculateMonthlySummary(monthlyExpenses);
  }, [monthlyExpenses]);

  // Monthly Savings Calculation for selected month
  const userBudget = userProfile?.monthlyBudget || userProfile?.monthlyIncome || 0;
  const amountSaved = userBudget > 0 ? userBudget - summary.totalSpending : 0;
  const savingsPercent = userBudget > 0 ? Math.round((amountSaved / userBudget) * 100) : 0;

  const highestCategory = useMemo(() => {
    return calculateHighestCategory(monthlyExpenses, summary.totalSpending);
  }, [monthlyExpenses, summary.totalSpending]);

  const topMerchant = useMemo(() => {
    return getTopMerchant(monthlyExpenses, highestCategory.category !== "None" ? highestCategory.category : undefined);
  }, [monthlyExpenses, highestCategory.category]);

  const prevMonthComparison = useMemo(() => {
    return comparePreviousMonth(
      expenses,
      selectedYear,
      selectedMonth,
      highestCategory.category,
      highestCategory.amount
    );
  }, [expenses, selectedYear, selectedMonth, highestCategory]);

  useEffect(() => {
    if (expenses.length >= 0) {
      fetchAIAdvice();
    }
  }, [expenses, selectedYear, selectedMonth]);

  const fetchAIAdvice = async () => {
    setAiLoading(true);
    const payload = buildStructuredPayload(expenses, selectedYear, selectedMonth, userBudget);

    try {
      const res = await getAIFinancialAdvice(payload);
      setAiAdvice(res.adviceText);
    } catch (err) {
      console.warn("AI advice error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const yearlySummaryTable = useMemo(() => {
    return calculateYearlySummary(expenses, yearlyTableYear);
  }, [expenses, yearlyTableYear]);

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white pb-28 pt-6 px-4 max-w-md mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <TrendingUp className="text-green-500" size={26} />
            Trend Analysis
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Monthly Expense Trends & AI Insights
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Month & Year Selectors */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Calendar size={14} className="text-green-500" /> Select Month & Year
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Month Selector Dropdown */}
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium focus:outline-none focus:border-green-500 text-gray-900 dark:text-white"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector Dropdown */}
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium focus:outline-none focus:border-green-500 text-gray-900 dark:text-white"
            >
              {AVAILABLE_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Calculating monthly trends...</p>
        </div>
      ) : (
        <>
          {/* Active Period Label */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {MONTH_NAMES[selectedMonth]} {selectedYear} Overview
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-semibold">
              {summary.transactionCount} Transactions
            </span>
          </div>

          {/* Metrics Cards Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Card 1: Total Monthly Spending */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl text-white shadow-lg relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <CreditCard size={70} />
              </div>
              <p className="text-[11px] text-green-100 uppercase tracking-wider font-semibold mb-1">
                Total Spending
              </p>
              <h3 className="text-2xl font-extrabold mb-1 truncate">
                ₹{summary.totalSpending.toLocaleString("en-IN")}
              </h3>
              <p className="text-[11px] text-green-100/90 truncate">
                {summary.transactionCount} bills scanned
              </p>
            </motion.div>

            {/* Card 2: Amount Saved */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 }}
              className={`p-4 rounded-2xl border shadow-sm relative overflow-hidden flex flex-col justify-between ${
                userBudget === 0
                  ? "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/60"
                  : amountSaved >= 0
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50"
                  : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Amount Saved
                </span>
                <PiggyBank
                  size={20}
                  className={
                    amountSaved >= 0 ? "text-emerald-500" : "text-red-500"
                  }
                />
              </div>

              <div>
                {userBudget > 0 ? (
                  <>
                    <h3
                      className={`text-2xl font-extrabold truncate ${
                        amountSaved >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {amountSaved >= 0
                        ? `₹${amountSaved.toLocaleString("en-IN")}`
                        : `-₹${Math.abs(amountSaved).toLocaleString("en-IN")}`}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {amountSaved >= 0
                        ? `${savingsPercent}% of budget saved`
                        : `Over budget by ₹${Math.abs(amountSaved).toLocaleString("en-IN")}`}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">
                      No Budget Set
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Set budget in profile to track savings
                    </p>
                  </>
                )}
              </div>
            </motion.div>

            {/* Card 2: Highest Category */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{highestCategory.emoji}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  {highestCategory.percentage}% of Total
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Highest Category</p>
              <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                {highestCategory.category}
              </h4>
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">
                ₹{highestCategory.amount.toLocaleString("en-IN")}
              </p>
            </motion.div>

            {/* Card 3: Top Merchant */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <Store size={22} className="text-blue-500" />
                <span className="text-xs text-gray-400">Top Payee</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Top Merchant</p>
              <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                {topMerchant.merchant}
              </h4>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                ₹{topMerchant.amount.toLocaleString("en-IN")}
              </p>
            </motion.div>

            {/* Card 4: Highest Single Purchase */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <ShoppingBag size={22} className="text-purple-500" />
                <span className="text-xs text-gray-400">Max Bill</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Highest Expense</p>
              <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                ₹{summary.highestSingleExpense.amount.toLocaleString("en-IN")}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                {summary.highestSingleExpense.merchant}
              </p>
            </motion.div>

            {/* Card 5: Month-over-Month Trend */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{prevMonthComparison.trendSymbol}</span>
                <span
                  className={`text-xs font-semibold flex items-center ${
                    prevMonthComparison.trend === "increasing"
                      ? "text-red-500"
                      : prevMonthComparison.trend === "decreasing"
                      ? "text-green-500"
                      : "text-gray-400"
                  }`}
                >
                  {prevMonthComparison.trend === "increasing" ? (
                    <ArrowUpRight size={14} />
                  ) : prevMonthComparison.trend === "decreasing" ? (
                    <ArrowDownRight size={14} />
                  ) : (
                    <Minus size={14} />
                  )}
                  {prevMonthComparison.trendText.split(" ")[0]}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">vs {prevMonthComparison.prevMonthName}</p>
              <h4
                className={`text-base font-bold truncate ${
                  prevMonthComparison.diffAmount > 0
                    ? "text-red-500"
                    : prevMonthComparison.diffAmount < 0
                    ? "text-green-500"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {prevMonthComparison.diffAmount >= 0
                  ? `+₹${Math.round(prevMonthComparison.diffAmount).toLocaleString("en-IN")}`
                  : `-₹${Math.abs(Math.round(prevMonthComparison.diffAmount)).toLocaleString("en-IN")}`}
              </h4>
              <p className="text-xs text-gray-400 mt-1">Month Comparison</p>
            </motion.div>
          </div>

          {/* AI Financial Advisor ⭐⭐⭐⭐⭐ Card */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white p-5 rounded-2xl shadow-lg border border-gray-700/60 mb-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Sparkles size={18} className="animate-pulse" />
                <span>AI Financial Advisor ⭐⭐⭐⭐⭐</span>
              </div>
              <button
                onClick={fetchAIAdvice}
                disabled={aiLoading}
                className="text-[11px] px-2.5 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-gray-300 font-medium transition-colors disabled:opacity-50"
              >
                {aiLoading ? "Thinking..." : "Refresh Advice"}
              </button>
            </div>

            {/* Main LLM Generated Financial Advice Response */}
            <div className="p-3.5 bg-gray-800/90 border border-gray-700 rounded-xl text-xs text-gray-100 font-medium leading-relaxed shadow-inner">
              {aiLoading ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing structured expense data...</span>
                </div>
              ) : (
                <p className="text-gray-100">{aiAdvice || "No expense data to analyze yet."}</p>
              )}
            </div>
          </div>

          {/* Yearly Summary Table Section */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Yearly Summary ({yearlyTableYear})
              </h3>
              <select
                value={yearlyTableYear}
                onChange={(e) => setYearlyTableYear(Number(e.target.value))}
                className="p-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-semibold focus:outline-none text-gray-900 dark:text-white"
              >
                {AVAILABLE_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-2">Month</th>
                    <th className="pb-2">Highest Category</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {yearlySummaryTable.map((row) => (
                    <tr
                      key={row.monthName}
                      className={
                        row.monthIndex === selectedMonth && yearlyTableYear === selectedYear
                          ? "bg-green-500/10 font-semibold"
                          : ""
                      }
                    >
                      <td className="py-2.5 text-gray-900 dark:text-white">{row.monthName}</td>
                      <td className="py-2.5 text-gray-700 dark:text-gray-300">
                        {row.highestCategoryEmoji} {row.highestCategory}
                      </td>
                      <td className="py-2.5 text-right font-medium text-gray-900 dark:text-white">
                        ₹{row.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
