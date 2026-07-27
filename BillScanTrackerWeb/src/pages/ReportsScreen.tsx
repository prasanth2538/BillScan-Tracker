import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, ArrowUpRight, ArrowDownRight, Sparkles, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getExpenses } from "../services/expenseService";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CATEGORY_META: Record<string, { color: string; icon: string }> = {
  Groceries: { color: "#1D9E75", icon: "🛒" },
  Grocery: { color: "#1D9E75", icon: "🛒" },
  Food: { color: "#EF9F27", icon: "🍕" },
  Petrol: { color: "#378ADD", icon: "⛽" },
  Transport: { color: "#378ADD", icon: "⛽" },
  Travel: { color: "#378ADD", icon: "✈️" },
  Health: { color: "#E24B4A", icon: "💊" },
  Hospital: { color: "#E24B4A", icon: "🏥" },
  Movies: { color: "#7F77DD", icon: "🎬" },
  Hotels: { color: "#A855F7", icon: "🏨" },
  Other: { color: "#888780", icon: "▪" },
};

function getExpenseDate(expense: any) {
  if (expense.createdAt?.seconds) {
    return new Date(expense.createdAt.seconds * 1000);
  }

  if (expense.date) {
    const d = new Date(expense.date);
    if (!isNaN(d.getTime())) return d;
  }

  return new Date();
}

function getCategoryMeta(category: string) {
  return CATEGORY_META[category] || CATEGORY_META.Other;
}

export function ReportsScreen() {
  const currentMonth = new Date().toLocaleDateString("en-IN", { month: "short" });
  const [activeMonth, setActiveMonth] = useState(currentMonth);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const data = await getExpenses();
        setExpenses(data);
      } catch (error) {
        console.error("Reports load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadExpenses();

    window.addEventListener("billScanned", loadExpenses);
    return () => window.removeEventListener("billScanned", loadExpenses);
  }, []);

  const currentYear = new Date().getFullYear();

  const filteredExpenses = expenses.filter((expense) => {
    const d = getExpenseDate(expense);
    const month = d.toLocaleDateString("en-IN", { month: "short" });
    const year = d.getFullYear();
    return month === activeMonth && year === currentYear;
  });

  const totalSpent = filteredExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const now = new Date();
  const currentMonthName = now.toLocaleDateString("en-IN", { month: "short" });
  const activeMonthIndex = MONTHS.indexOf(activeMonth);
  const currentMonthIndex = now.getMonth();

  let daysElapsed = 1;
  if (activeMonth === currentMonthName) {
    daysElapsed = Math.max(1, now.getDate());
  } else {
    // Past or future month - use number of days in that month
    daysElapsed = new Date(currentYear, activeMonthIndex + 1, 0).getDate();
  }

  const dailyAverage = totalSpent > 0 ? Math.round(totalSpent / daysElapsed) : 0;
  const daysInMonth = new Date(currentYear, activeMonthIndex + 1, 0).getDate();
  const predictedMonthEnd = activeMonthIndex < currentMonthIndex ? totalSpent : dailyAverage * daysInMonth;

  const categoryTotals: Record<string, number> = {};

  filteredExpenses.forEach((expense) => {
    const category = expense.category || "Other";
    categoryTotals[category] = (categoryTotals[category] || 0) + Number(expense.amount || 0);
  });

  const donutData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
    percentage: totalSpent > 0 ? Math.round((value / totalSpent) * 100) : 0,
    color: getCategoryMeta(name).color,
    icon: getCategoryMeta(name).icon,
  }));

  const dailyMap: Record<string, number> = {};

  filteredExpenses.forEach((expense) => {
    const day = String(getExpenseDate(expense).getDate());
    dailyMap[day] = (dailyMap[day] || 0) + Number(expense.amount || 0);
  });

  const lineData = Object.entries(dailyMap)
    .map(([date, amount]) => ({
      date,
      amount,
    }))
    .sort((a, b) => Number(a.date) - Number(b.date));

  const topCategory = donutData.length
    ? [...donutData].sort((a, b) => b.value - a.value)[0]
    : null;

  const highestExpense = filteredExpenses.length
    ? [...filteredExpenses].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0]
    : null;

  const insights = filteredExpenses.length
    ? [
        {
          title: topCategory ? `${topCategory.name} is your top spending area` : "No category data",
          desc: topCategory
            ? `You spent ₹${topCategory.value.toLocaleString("en-IN")} on ${topCategory.name}.`
            : "Scan more bills to get category insights.",
          badge: topCategory ? `${topCategory.percentage}%` : "No data",
          badgeColor: "text-brand-green-dark",
          badgeBg: "bg-brand-green-light",
          accent: "bg-brand-green",
        },
        {
          title: "Highest expense",
          desc: highestExpense
            ? `${highestExpense.merchant || "Unknown"} — ₹${Number(highestExpense.amount || 0).toLocaleString("en-IN")}`
            : "No expense found.",
          badge: highestExpense?.category || "None",
          badgeColor: "text-amber-dark",
          badgeBg: "bg-amber-light",
          accent: "bg-amber",
        },
        {
          title: "Daily average spending",
          desc: activeMonthIndex < currentMonthIndex
            ? `You spent around ₹${dailyAverage.toLocaleString("en-IN")} per day on average.`
            : `You are spending around ₹${dailyAverage.toLocaleString("en-IN")} per day.`,
          badge: "Average",
          badgeColor: "text-brand-green-dark",
          badgeBg: "bg-brand-green-light",
          accent: "bg-brand-green",
        },
        {
          title: activeMonthIndex < currentMonthIndex ? "Final month total" : "Predicted month-end total",
          desc: activeMonthIndex < currentMonthIndex
            ? "Final total spending for this completed month."
            : "Based on your current daily spending speed.",
          badge: `₹${(activeMonthIndex < currentMonthIndex ? totalSpent : predictedMonthEnd).toLocaleString("en-IN")}`,
          badgeColor: "text-amber-dark",
          badgeBg: "bg-amber-light",
          accent: "bg-amber",
        },
      ]
    : [
        {
          title: "No spending data yet",
          desc: "Scan and save bills to generate AI insights.",
          badge: "Start",
          badgeColor: "text-brand-green-dark",
          badgeBg: "bg-brand-green-light",
          accent: "bg-brand-green",
        },
      ];
        const handleDownload = () => {
  try {
    const bridge = (window as any).AndroidBridge;
    if (!bridge?.savePdf) return;

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    const addLine = (text: string, size = 11, style = "normal", color = [0, 0, 0]) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", style);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(text, 20, y);
      y += size * 0.6;
    };

    const addGap = (gap = 6) => { y += gap; };

    const checkPage = () => {
      if (y > 270) { doc.addPage(); y = 20; }
    };

    // Header
    doc.setFillColor(29, 158, 117);
    doc.rect(0, 0, pageW, 30, "F");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("BillScan Expense Report", 20, 20);
    y = 40;

    // Summary section
    addLine(`Month: ${activeMonth} ${currentYear}`, 13, "bold", [50, 50, 50]);
    addGap(2);
    addLine(`Total Spent:       Rs.${totalSpent.toLocaleString("en-IN")}`, 12, "normal", [0, 0, 0]);
    addLine(`Total Bills:       ${filteredExpenses.length}`, 12);
    addLine(`Daily Average:     Rs.${dailyAverage.toLocaleString("en-IN")}`, 12);
    addLine(
      activeMonthIndex < currentMonthIndex
        ? `Final Month Total: Rs.${totalSpent.toLocaleString("en-IN")}`
        : `Predicted Month-End: Rs.${predictedMonthEnd.toLocaleString("en-IN")}`,
      12
    );
    addGap(8);

    // Category breakdown
    doc.setFillColor(240, 240, 240);
    doc.rect(16, y, pageW - 32, 8, "F");
    addLine("Category Breakdown", 13, "bold", [29, 158, 117]);
    addGap(4);

    donutData.forEach((item) => {
      checkPage();
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`${item.icon}  ${item.name}`, 22, y);
      doc.text(`Rs.${item.value.toLocaleString("en-IN")}`, 120, y);
      doc.text(`${item.percentage}%`, 170, y);
      y += 8;
    });

    addGap(8);

    // AI Insights
    doc.setFillColor(240, 240, 240);
    doc.rect(16, y, pageW - 32, 8, "F");
    addLine("AI Insights", 13, "bold", [29, 158, 117]);
    addGap(4);

    insights.forEach((insight) => {
      checkPage();
      addLine(`• ${insight.title}`, 11, "bold", [0, 0, 0]);
      addLine(`  ${insight.desc}`, 10, "normal", [80, 80, 80]);
      addGap(3);
    });

    addGap(6);

    // Expense list
    doc.setFillColor(240, 240, 240);
    doc.rect(16, y, pageW - 32, 8, "F");
    addLine("All Expenses", 13, "bold", [29, 158, 117]);
    addGap(4);

    // Table header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("Date", 22, y);
    doc.text("Merchant", 55, y);
    doc.text("Category", 120, y);
    doc.text("Amount", 168, y);
    y += 6;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageW - 20, y);
    y += 4;

    filteredExpenses.forEach((expense, i) => {
      checkPage();
      const date = getExpenseDate(expense).toLocaleDateString("en-IN");
      const merchant = (expense.merchant || "Unknown").slice(0, 28);
      const category = (expense.category || "Other").slice(0, 14);
      const amount = `Rs.${Number(expense.amount || 0).toLocaleString("en-IN")}`;

      if (i % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(16, y - 4, pageW - 32, 9, "F");
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(date, 22, y);
      doc.text(merchant, 55, y);
      doc.text(category, 120, y);
      doc.text(amount, 168, y);
      y += 9;
    });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated by BillScan • ${new Date().toLocaleDateString("en-IN")}`,
      20,
      doc.internal.pageSize.getHeight() - 10
    );

    const base64 = doc.output("datauristring").split(",")[1];
    bridge.savePdf(base64, `BillScan-${activeMonth}-${currentYear}.pdf`);

  } catch (e: any) {
    console.error("PDF error:", e);
  }
};
  return (
    <div className="w-full h-full bg-page overflow-y-auto pb-24 scrollbar-hide">
      <div className="pt-14 px-6 pb-4 flex justify-between items-center sticky top-0 glass-effect z-20 border-b border-transparent dark:border-white/10">
        <h1 className="font-sora font-bold text-[24px] text-text-primary dark:text-white tracking-tight">
          Reports
        </h1>

        <button
          onClick={handleDownload}
          className="w-11 h-11 flex items-center justify-center text-text-primary dark:text-white bg-white dark:bg-gray-800 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 border border-transparent dark:border-gray-700"
        >
          <Download size={22} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center mt-24 gap-3">
          <Loader2 size={26} className="text-brand-green animate-spin" />
          <p className="font-dm text-[13px] text-gray-400">Loading reports…</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-4 px-6">
        {MONTHS.map((month) => (
          <button
            key={month}
            onClick={() => setActiveMonth(month)}
            className={`px-5 py-2.5 rounded-pill font-dm text-[14px] font-semibold whitespace-nowrap transition-all flex items-center justify-center ${
              activeMonth === month
                ? "bg-brand-green text-white shadow-md shadow-brand-green/20"
                : "bg-white dark:bg-gray-800 text-text-secondary dark:text-gray-400 border border-transparent dark:border-gray-700"
            }`}
          >
            {month}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 sm:mx-6 mt-2 bg-white dark:bg-dark-card rounded-[24px] p-6 shadow-sm border border-transparent dark:border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 dark:bg-brand-green/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <p className="font-dm text-[12px] uppercase tracking-[0.1em] text-text-tertiary dark:text-gray-500 font-bold mb-5">
          {activeMonth} {currentYear} Summary
        </p>

        <div className="flex justify-between items-end mb-8 relative z-10">
          <div>
            <p className="font-dm text-[12px] text-text-tertiary dark:text-gray-400 font-medium mb-1">
              Total Spent
            </p>
            <h2 className="font-mono font-bold text-[32px] text-text-primary dark:text-white leading-none tracking-tight">
              ₹{totalSpent.toLocaleString("en-IN")}
            </h2>
          </div>

          <div className="flex gap-4">
            <div className="text-right">
              <p className="font-dm text-[12px] text-text-tertiary dark:text-gray-400 font-medium mb-1">
                Bills
              </p>
              <p className="font-dm text-[14px] text-danger font-bold flex items-center justify-end gap-0.5">
                <ArrowUpRight size={16} strokeWidth={2.5} /> {filteredExpenses.length}
              </p>
            </div>

            <div className="text-right">
              <p className="font-dm text-[12px] text-text-tertiary dark:text-gray-400 font-medium mb-1">
                Daily Avg
              </p>
              <p className="font-mono text-[14px] text-brand-green font-bold flex items-center justify-end gap-0.5">
                <ArrowDownRight size={16} strokeWidth={2.5} /> ₹{dailyAverage.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        <div className="relative h-[220px] flex items-center justify-center mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                cornerRadius={4}
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-mono font-bold text-[22px] text-text-primary dark:text-white">
              ₹{totalSpent.toLocaleString("en-IN")}
            </span>
            <span className="font-dm text-[12px] text-text-secondary dark:text-gray-400 font-medium">
              total
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-4 gap-x-5">
          {donutData.length === 0 && (
            <p className="font-dm text-[14px] text-text-tertiary dark:text-gray-500 col-span-2 text-center py-4">
              No category data yet
            </p>
          )}

          {donutData.map((item) => (
            <div key={item.name} className="flex items-center gap-2.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />

              <span className="font-dm text-[13px] font-medium text-text-secondary dark:text-gray-300 flex-1 truncate">
                {item.name}
              </span>

              <span className="font-mono text-[13px] text-text-primary dark:text-white font-bold">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-4 sm:mx-6 mt-4 bg-white dark:bg-dark-card rounded-card p-6 shadow-sm border border-transparent dark:border-white/5"
      >
        <h3 className="font-sora font-bold text-[17px] text-text-primary dark:text-white mb-5 tracking-tight">
          Category breakdown
        </h3>

        <div className="space-y-5">
          {donutData.length === 0 && (
            <p className="font-dm text-[14px] text-text-tertiary dark:text-gray-500 text-center py-4">
              No expenses found for this month
            </p>
          )}

          {donutData.map((item, i) => (
            <div key={item.name} className="flex items-center gap-4">
              <div className="w-[100px] flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-sm">
                  {item.icon}
                </div>
                <span className="font-dm text-[13px] font-medium text-text-secondary dark:text-gray-300 truncate">
                  {item.name}
                </span>
              </div>

              <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>

              <div className="w-[75px] text-right font-mono text-[13px] text-text-primary dark:text-white font-bold">
                ₹{item.value.toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-4 sm:mx-6 mt-4 bg-white dark:bg-dark-card rounded-card p-6 shadow-sm border border-transparent dark:border-white/5"
      >
        <h3 className="font-sora font-bold text-[17px] text-text-primary dark:text-white mb-6 tracking-tight">
          Daily spending — {activeMonth}
        </h3>

        <div className="h-[180px] w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={lineData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fontFamily: "DM Sans",
                  fill: document.documentElement.classList.contains("dark") ? "#9CA3AF" : "#6B7280",
                  fontWeight: 500,
                }}
                dy={12}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 12,
                  fontFamily: "JetBrains Mono",
                  fill: document.documentElement.classList.contains("dark") ? "#9CA3AF" : "#6B7280",
                  fontWeight: 500,
                }}
                tickFormatter={(val) => `₹${val}`}
                dx={-10}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: document.documentElement.classList.contains("dark") ? "1px solid #374151" : "none",
                  backgroundColor: document.documentElement.classList.contains("dark") ? "#1F2937" : "#FFFFFF",
                  color: document.documentElement.classList.contains("dark") ? "#F3F4F6" : "#111827",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  fontSize: "13px",
                  fontFamily: "JetBrains Mono",
                  fontWeight: "bold",
                }}
                labelStyle={{ display: "none" }}
                formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Spent"]}
              />

              <Area
                type="monotone"
                dataKey="amount"
                stroke="#1D9E75"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorAmount)"
                activeDot={{
                  r: 5,
                  fill: "#fff",
                  stroke: "#1D9E75",
                  strokeWidth: 2.5,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mx-4 sm:mx-6 mt-4 bg-white dark:bg-dark-card rounded-card p-6 shadow-sm border border-transparent dark:border-white/5 mb-6"
      >
        <h3 className="font-sora font-bold text-[17px] text-text-primary dark:text-white mb-5 flex items-center gap-2 tracking-tight">
          <Sparkles size={18} className="text-brand-green" /> AI Insights
        </h3>

        <div className="space-y-4">
          {insights.map((insight, i) => (
            <div
              key={i}
              className="flex items-stretch gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl relative overflow-hidden border border-gray-100 dark:border-gray-800"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${insight.accent}`} />

              <div className="flex-1 pl-2">
                <p className="font-dm text-[14px] font-bold text-text-primary dark:text-white">
                  {insight.title}
                </p>
                <p className="font-dm text-[12px] font-medium text-text-secondary dark:text-gray-400 mt-1">
                  {insight.desc}
                </p>
              </div>

              <div className="flex items-start">
                <span
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-dm font-bold tracking-wide ${
                    document.documentElement.classList.contains("dark") && insight.badgeBg === "bg-brand-green-light"
                      ? "bg-brand-green/20 text-brand-green"
                      : document.documentElement.classList.contains("dark") && insight.badgeBg === "bg-amber-light"
                      ? "bg-amber-500/20 text-amber-500"
                      : `${insight.badgeBg} ${insight.badgeColor}`
                  }`}
                >
                  {insight.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
        </>
      )}
    </div>
  );
}