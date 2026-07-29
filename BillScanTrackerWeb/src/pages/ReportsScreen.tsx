import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
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
import { getThisMonthExpenses } from "../services/expenseService";

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
  const [, setLoading] = useState(true);

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const data = await getThisMonthExpenses();
        setExpenses(data);
      } catch (error) {
        console.error("Reports load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadExpenses();
  }, []);

  const filteredExpenses = expenses.filter((expense) => {
    const month = getExpenseDate(expense).toLocaleDateString("en-IN", { month: "short" });
    return month === activeMonth;
  });

  const totalSpent = filteredExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const daysElapsed = Math.max(1, new Date().getDate());
  const dailyAverage = totalSpent > 0 ? Math.round(totalSpent / daysElapsed) : 0;
  const predictedMonthEnd = dailyAverage * 30;

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
          desc: `You are spending around ₹${dailyAverage.toLocaleString("en-IN")} per day.`,
          badge: "Average",
          badgeColor: "text-brand-green-dark",
          badgeBg: "bg-brand-green-light",
          accent: "bg-brand-green",
        },
        {
          title: "Predicted month-end total",
          desc: "Based on your current daily spending speed.",
          badge: `₹${predictedMonthEnd.toLocaleString("en-IN")}`,
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
      addLine(`Month: ${activeMonth} 2026`, 13, "bold", [50, 50, 50]);
      addGap(2);
      addLine(`Total Spent:       Rs.${totalSpent.toLocaleString("en-IN")}`, 12, "normal", [0, 0, 0]);
      addLine(`Total Bills:       ${filteredExpenses.length}`, 12);
      addLine(`Daily Average:     Rs.${dailyAverage.toLocaleString("en-IN")}`, 12);
      addLine(`Predicted Month-End: Rs.${predictedMonthEnd.toLocaleString("en-IN")}`, 12);
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

      const fileName = `BillScan-${activeMonth}-2026.pdf`;
      const bridge = (window as any).AndroidBridge;

      if (bridge?.savePdf) {
        const base64 = doc.output("datauristring").split(",")[1];
        bridge.savePdf(base64, fileName);
      } else {
        doc.save(fileName);
      }

    } catch (e: any) {
      console.error("PDF error:", e);
    }
  };
  return (
    <div className="w-full h-full bg-page overflow-y-auto pb-24 scrollbar-hide">
      <div className="pt-12 px-4 pb-2 flex justify-between items-center sticky top-0 bg-page/90 backdrop-blur-md z-20">
        <h1 className="font-sora font-semibold text-[20px] text-text-primary">
          Reports
        </h1>

        <button
          onClick={handleDownload}
          className="w-10 h-10 flex items-center justify-center text-text-primary bg-white rounded-full shadow-sm"
        >
          <Download size={20} />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3 px-4">
        {MONTHS.map((month) => (
          <button
            key={month}
            onClick={() => setActiveMonth(month)}
            className={`px-4 py-1.5 rounded-pill font-dm text-[13px] font-medium whitespace-nowrap transition-colors ${
              activeMonth === month
                ? "bg-brand-green text-white shadow-sm"
                : "bg-transparent text-text-secondary"
            }`}
          >
            {month}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-2 bg-white rounded-[20px] p-5 shadow-card"
      >
        <p className="font-dm text-[12px] uppercase tracking-wider text-text-secondary font-medium mb-4">
          {activeMonth} 2026 Summary
        </p>

        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="font-dm text-[11px] text-text-tertiary mb-1">
              Total Spent
            </p>
            <h2 className="font-mono font-bold text-[24px] text-text-primary leading-none">
              ₹{totalSpent.toLocaleString("en-IN")}
            </h2>
          </div>

          <div className="text-right">
            <p className="font-dm text-[11px] text-text-tertiary mb-1">
              Bills
            </p>
            <p className="font-dm text-[13px] text-danger font-medium flex items-center justify-end gap-0.5">
              <ArrowUpRight size={14} /> {filteredExpenses.length}
            </p>
          </div>

          <div className="text-right">
            <p className="font-dm text-[11px] text-text-tertiary mb-1">
              Daily Avg
            </p>
            <p className="font-mono text-[13px] text-brand-green font-medium flex items-center justify-end gap-0.5">
              <ArrowDownRight size={14} /> ₹{dailyAverage.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="relative h-[200px] flex items-center justify-center mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-mono font-bold text-[18px] text-text-primary">
              ₹{totalSpent.toLocaleString("en-IN")}
            </span>
            <span className="font-dm text-[11px] text-text-secondary">
              total
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
          {donutData.length === 0 && (
            <p className="font-dm text-[13px] text-text-tertiary col-span-2 text-center">
              No category data yet
            </p>
          )}

          {donutData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: item.color }}
              />

              <span className="font-dm text-[12px] text-text-secondary flex-1">
                {item.name}
              </span>

              <span className="font-mono text-[12px] text-text-primary font-medium">
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
        className="mx-4 mt-4 bg-white rounded-card p-5 shadow-card"
      >
        <h3 className="font-sora font-semibold text-[15px] text-text-primary mb-4">
          Category breakdown
        </h3>

        <div className="space-y-4">
          {donutData.length === 0 && (
            <p className="font-dm text-[13px] text-text-tertiary text-center">
              No expenses found for this month
            </p>
          )}

          {donutData.map((item, i) => (
            <div key={item.name} className="flex items-center gap-3">
              <div className="w-[90px] flex items-center gap-1.5">
                <span className="text-sm">{item.icon}</span>
                <span className="font-dm text-[12px] text-text-secondary truncate">
                  {item.name}
                </span>
              </div>

              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>

              <div className="w-[65px] text-right font-mono text-[12px] text-text-primary font-medium">
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
        className="mx-4 mt-4 bg-white rounded-card p-5 shadow-card"
      >
        <h3 className="font-sora font-semibold text-[15px] text-text-primary mb-4">
          Daily spending — {activeMonth}
        </h3>

        <div className="h-[160px] w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={lineData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 11,
                  fontFamily: "DM Sans",
                  fill: "#9E9D99",
                }}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 11,
                  fontFamily: "JetBrains Mono",
                  fill: "#9E9D99",
                }}
                tickFormatter={(val) => `₹${val}`}
                dx={-10}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                  fontFamily: "JetBrains Mono",
                }}
                labelStyle={{ display: "none" }}
                formatter={(value: number) => [`₹${value}`, "Spent"]}
              />

              <Area
                type="monotone"
                dataKey="amount"
                stroke="#1D9E75"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAmount)"
                activeDot={{
                  r: 4,
                  fill: "#fff",
                  stroke: "#1D9E75",
                  strokeWidth: 2,
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
        className="mx-4 mt-4 bg-white rounded-card p-5 shadow-card mb-4"
      >
        <h3 className="font-sora font-semibold text-[15px] text-text-primary mb-4 flex items-center gap-1.5">
          <Sparkles size={16} className="text-brand-green" /> AI insights
        </h3>

        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              className="flex items-stretch gap-3 p-3 bg-page/50 rounded-lg relative overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${insight.accent}`} />

              <div className="flex-1 pl-1">
                <p className="font-dm text-[13px] font-medium text-text-primary">
                  {insight.title}
                </p>
                <p className="font-dm text-[11px] text-text-secondary mt-0.5">
                  {insight.desc}
                </p>
              </div>

              <div className="flex items-start">
                <span
                  className={`px-2 py-1 rounded text-[10px] font-dm font-medium ${insight.badgeBg} ${insight.badgeColor}`}
                >
                  {insight.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}