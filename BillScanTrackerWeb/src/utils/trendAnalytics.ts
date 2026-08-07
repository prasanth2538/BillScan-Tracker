import { RawExpense, parseExpenseDate } from "../services/expenseService";

export interface MonthlySummary {
  totalSpending: number;
  transactionCount: number;
  highestSingleExpense: {
    amount: number;
    merchant: string;
  };
}

export interface HighestCategoryInfo {
  category: string;
  amount: number;
  percentage: number;
  emoji: string;
}

export interface TopMerchantInfo {
  merchant: string;
  amount: number;
  transactionCount: number;
}

export interface PreviousMonthComparison {
  prevMonthName: string;
  prevCategoryAmount: number;
  prevTotalSpending: number;
  diffAmount: number;
  diffPercentage: number;
  trend: "increasing" | "decreasing" | "stable";
  trendSymbol: string;
  trendText: string;
}

export interface YearlyMonthRow {
  monthName: string;
  monthIndex: number;
  highestCategory: string;
  highestCategoryEmoji: string;
  amount: number;
  totalSpending: number;
}

const CAT_EMOJIS: Record<string, string> = {
  Food: "🍽️",
  Grocery: "🛒",
  Petrol: "⛽",
  Travel: "🚌",
  Hotel: "🏨",
  Health: "🏥",
  Shopping: "🛍️",
  Entertainment: "🎬",
  Education: "🎓",
  Bills: "💡",
  Other: "📄",
};

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Filters expenses for a given month index (0-11) and year (e.g. 2026)
 */
export const filterExpensesByMonthAndYear = (
  expenses: RawExpense[],
  year: number,
  monthIndex: number
): RawExpense[] => {
  return expenses.filter((e) => {
    const d = parseExpenseDate(e);
    return d.getFullYear() === year && d.getMonth() === monthIndex;
  });
};

/**
 * 1. Calculates Total Monthly Spending, Transaction Count, and Highest Single Purchase
 */
export const calculateMonthlySummary = (
  expenses: RawExpense[]
): MonthlySummary => {
  let totalSpending = 0;
  let highestAmount = 0;
  let highestMerchant = "N/A";

  for (const e of expenses) {
    const amt = Number(e.amount) || 0;
    totalSpending += amt;

    if (amt > highestAmount) {
      highestAmount = amt;
      highestMerchant = e.merchant || "Unknown Merchant";
    }
  }

  return {
    totalSpending,
    transactionCount: expenses.length,
    highestSingleExpense: {
      amount: highestAmount,
      merchant: highestMerchant,
    },
  };
};

/**
 * 2, 3, 4. Calculates Highest Category, Amount, & Percentage of Total
 */
export const calculateHighestCategory = (
  expenses: RawExpense[],
  totalSpending: number
): HighestCategoryInfo => {
  if (expenses.length === 0 || totalSpending === 0) {
    return {
      category: "None",
      amount: 0,
      percentage: 0,
      emoji: "📄",
    };
  }

  const categoryTotals: Record<string, number> = {};
  for (const e of expenses) {
    const cat = e.category || "Other";
    const amt = Number(e.amount) || 0;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
  }

  let topCat = "Other";
  let maxCatAmount = 0;

  for (const [cat, amt] of Object.entries(categoryTotals)) {
    if (amt > maxCatAmount) {
      maxCatAmount = amt;
      topCat = cat;
    }
  }

  const percentage = Math.round((maxCatAmount / totalSpending) * 100);

  return {
    category: topCat,
    amount: maxCatAmount,
    percentage: isNaN(percentage) ? 0 : percentage,
    emoji: CAT_EMOJIS[topCat] || "📄",
  };
};

/**
 * 6. Finds top merchant with highest spending inside the highest spending category
 */
export const getTopMerchant = (
  expenses: RawExpense[],
  targetCategory?: string
): TopMerchantInfo => {
  const filtered = targetCategory
    ? expenses.filter((e) => (e.category || "Other") === targetCategory)
    : expenses;

  if (filtered.length === 0) {
    return {
      merchant: "N/A",
      amount: 0,
      transactionCount: 0,
    };
  }

  const merchantStats: Record<string, { amount: number; count: number }> = {};
  for (const e of filtered) {
    const m = e.merchant || "Unknown Merchant";
    const amt = Number(e.amount) || 0;
    if (!merchantStats[m]) {
      merchantStats[m] = { amount: 0, count: 0 };
    }
    merchantStats[m].amount += amt;
    merchantStats[m].count += 1;
  }

  let topM = "N/A";
  let maxAmount = 0;
  let maxCount = 0;

  for (const [m, stat] of Object.entries(merchantStats)) {
    if (stat.amount > maxAmount) {
      maxAmount = stat.amount;
      topM = m;
      maxCount = stat.count;
    }
  }

  return {
    merchant: topM,
    amount: maxAmount,
    transactionCount: maxCount,
  };
};

/**
 * 8, 9. Calculates Previous Month Comparison and Trend Indicator
 */
export const comparePreviousMonth = (
  allExpenses: RawExpense[],
  year: number,
  monthIndex: number,
  currentHighestCategory: string,
  currentHighestAmount: number
): PreviousMonthComparison => {
  let prevYear = year;
  let prevMonthIndex = monthIndex - 1;
  if (prevMonthIndex < 0) {
    prevMonthIndex = 11;
    prevYear = year - 1;
  }

  const prevMonthName = SHORT_MONTH_NAMES[prevMonthIndex];
  const prevExpenses = filterExpensesByMonthAndYear(
    allExpenses,
    prevYear,
    prevMonthIndex
  );

  let prevTotalSpending = 0;
  let prevCategoryAmount = 0;

  for (const e of prevExpenses) {
    const amt = Number(e.amount) || 0;
    prevTotalSpending += amt;
    if ((e.category || "Other") === currentHighestCategory) {
      prevCategoryAmount += amt;
    }
  }

  const diffAmount = currentHighestAmount - prevCategoryAmount;
  let diffPercentage = 0;
  if (prevCategoryAmount > 0) {
    diffPercentage = Math.round(
      ((currentHighestAmount - prevCategoryAmount) / prevCategoryAmount) * 100
    );
  } else if (currentHighestAmount > 0) {
    diffPercentage = 100;
  }

  let trend: "increasing" | "decreasing" | "stable" = "stable";
  let trendSymbol = "➖";
  let trendText = "Stable";

  if (diffAmount > 0) {
    trend = "increasing";
    trendSymbol = "📈";
    trendText = `Increased by ${Math.abs(diffPercentage)}% (+₹${diffAmount.toLocaleString("en-IN")})`;
  } else if (diffAmount < 0) {
    trend = "decreasing";
    trendSymbol = "📉";
    trendText = `Decreased by ${Math.abs(diffPercentage)}% (-₹${Math.abs(diffAmount).toLocaleString("en-IN")})`;
  } else {
    trend = "stable";
    trendSymbol = "➖";
    trendText = "Stable compared to last month";
  }

  return {
    prevMonthName,
    prevCategoryAmount,
    prevTotalSpending,
    diffAmount,
    diffPercentage,
    trend,
    trendSymbol,
    trendText,
  };
};

/**
 * Dynamic AI Insights Bullet Points Generator
 */
export const generateInsights = (
  summary: MonthlySummary,
  highestCat: HighestCategoryInfo,
  topMerchant: TopMerchantInfo,
  prevComparison: PreviousMonthComparison
): string[] => {
  if (summary.totalSpending === 0) {
    return [
      "No expenses recorded for this month.",
      "Add or scan your bills to view dynamic AI insights and trend analysis.",
    ];
  }

  const insights: string[] = [];

  // Insight 1: Highest category
  if (highestCat.category !== "None") {
    insights.push(
      `You spent the most on ${highestCat.category} this month (${highestCat.emoji} ₹${highestCat.amount.toLocaleString("en-IN")}).`
    );

    // Insight 2: Category percentage
    if (highestCat.percentage > 0) {
      insights.push(
        `${highestCat.category} accounts for ${highestCat.percentage}% of your total monthly expenses.`
      );
    }
  }

  // Insight 3: Month-over-month comparison
  if (prevComparison.diffAmount !== 0 && highestCat.category !== "None") {
    if (prevComparison.diffAmount > 0) {
      insights.push(
        `${highestCat.category} spending increased by ${Math.abs(prevComparison.diffPercentage)}% (+₹${prevComparison.diffAmount.toLocaleString("en-IN")}) compared to ${prevComparison.prevMonthName}.`
      );
    } else {
      insights.push(
        `${highestCat.category} spending decreased by ${Math.abs(prevComparison.diffPercentage)}% (-₹${Math.abs(prevComparison.diffAmount).toLocaleString("en-IN")}) compared to ${prevComparison.prevMonthName}.`
      );
    }
  }

  // Insight 4: Top merchant
  if (topMerchant.merchant !== "N/A") {
    insights.push(
      `${topMerchant.merchant} is your top merchant with ₹${topMerchant.amount.toLocaleString("en-IN")} spent across ${topMerchant.transactionCount} transactions.`
    );
  }

  // Insight 5: Highest single purchase
  if (summary.highestSingleExpense.amount > 0) {
    insights.push(
      `Your largest single purchase was ₹${summary.highestSingleExpense.amount.toLocaleString("en-IN")} at ${summary.highestSingleExpense.merchant}.`
    );
  }

  return insights;
};

/**
 * Calculates 12-month summary breakdown for a selected year
 */
export const calculateYearlySummary = (
  allExpenses: RawExpense[],
  year: number
): YearlyMonthRow[] => {
  const result: YearlyMonthRow[] = [];

  for (let m = 0; m < 12; m++) {
    const monthExpenses = filterExpensesByMonthAndYear(allExpenses, year, m);
    const summary = calculateMonthlySummary(monthExpenses);
    const highestCat = calculateHighestCategory(
      monthExpenses,
      summary.totalSpending
    );

    result.push({
      monthName: SHORT_MONTH_NAMES[m],
      monthIndex: m,
      highestCategory: summary.totalSpending > 0 ? highestCat.category : "-",
      highestCategoryEmoji:
        summary.totalSpending > 0 ? highestCat.emoji : "📄",
      amount: highestCat.amount,
      totalSpending: summary.totalSpending,
    });
  }

  return result;
};

/**
 * Chart Dataset Generators (Pie, Bar, Line)
 */
export const getCategoryPieChartData = (expenses: RawExpense[]) => {
  const categoryTotals: Record<string, number> = {};
  for (const e of expenses) {
    const cat = e.category || "Other";
    const amt = Number(e.amount) || 0;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
  }

  return Object.entries(categoryTotals)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value,
    }));
};

export const getCategoryBarChartData = (expenses: RawExpense[]) => {
  const categoryTotals: Record<string, number> = {};
  for (const e of expenses) {
    const cat = e.category || "Other";
    const amt = Number(e.amount) || 0;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
  }

  return Object.entries(categoryTotals)
    .filter(([_, amount]) => amount > 0)
    .map(([category, amount]) => ({
      category,
      amount,
    }));
};

export const getDailySpendingTrendData = (
  expenses: RawExpense[],
  year: number,
  monthIndex: number
) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const dailyTotals: Record<number, number> = {};

  for (let d = 1; d <= daysInMonth; d++) {
    dailyTotals[d] = 0;
  }

  for (const e of expenses) {
    const dateObj = parseExpenseDate(e);
    const day = dateObj.getDate();
    const amt = Number(e.amount) || 0;
    if (day >= 1 && day <= daysInMonth) {
      dailyTotals[day] += amt;
    }
  }

  return Object.entries(dailyTotals).map(([day, amount]) => ({
    day: `Day ${day}`,
    amount,
  }));
};
