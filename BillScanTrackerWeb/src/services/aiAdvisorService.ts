import { RawExpense } from "./expenseService";
import { filterExpensesByMonthAndYear, MONTH_NAMES } from "../utils/trendAnalytics";

export interface StructuredExpensePayload {
  month: string;
  monthlyBudget?: number;
  totalSpending: number;
  expenses: Record<string, number>;
  previousMonth?: {
    month: string;
    expenses: Record<string, number>;
    totalSpending: number;
  };
}

export interface AIAdvisorResponse {
  adviceText: string;
  structuredPayload: StructuredExpensePayload;
  source: "openrouter-api" | "ai-fallback-engine";
}

/**
 * Builds clean, structured JSON payload (without images or raw OCR files)
 */
export const buildStructuredPayload = (
  allExpenses: RawExpense[],
  year: number,
  monthIndex: number,
  monthlyBudget?: number
): StructuredExpensePayload => {
  const currentMonthExpenses = filterExpensesByMonthAndYear(allExpenses, year, monthIndex);
  
  const categoryTotals: Record<string, number> = {};
  let totalSpending = 0;

  for (const e of currentMonthExpenses) {
    const cat = e.category || "Other";
    const amt = Number(e.amount) || 0;
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    totalSpending += amt;
  }

  // Calculate previous month data
  let prevYear = year;
  let prevMonthIndex = monthIndex - 1;
  if (prevMonthIndex < 0) {
    prevMonthIndex = 11;
    prevYear = year - 1;
  }

  const prevExpenses = filterExpensesByMonthAndYear(allExpenses, prevYear, prevMonthIndex);
  const prevCategoryTotals: Record<string, number> = {};
  let prevTotalSpending = 0;

  for (const e of prevExpenses) {
    const cat = e.category || "Other";
    const amt = Number(e.amount) || 0;
    prevCategoryTotals[cat] = (prevCategoryTotals[cat] || 0) + amt;
    prevTotalSpending += amt;
  }

  return {
    month: `${MONTH_NAMES[monthIndex]} ${year}`,
    monthlyBudget: monthlyBudget && monthlyBudget > 0 ? monthlyBudget : undefined,
    totalSpending,
    expenses: categoryTotals,
    previousMonth: {
      month: `${MONTH_NAMES[prevMonthIndex]} ${prevYear}`,
      expenses: prevCategoryTotals,
      totalSpending: prevTotalSpending,
    },
  };
};

/**
 * Fallback LLM Advice Generator (Simulates LLM structuring when no API key is set or offline)
 */
export const generateLocalAIAdvice = (
  payload: StructuredExpensePayload
): string => {
  const { monthlyBudget, totalSpending, expenses, previousMonth } = payload;
  const categories = Object.keys(expenses);

  if (categories.length === 0 || totalSpending === 0) {
    return "No expenses scanned for this month yet. Scan receipts to receive personalized AI financial advice.";
  }

  // Find highest category
  let topCat = "Food";
  let maxAmt = 0;
  for (const [cat, amt] of Object.entries(expenses)) {
    if (amt > maxAmt) {
      maxAmt = amt;
      topCat = cat;
    }
  }

  // Category percentage calculation
  const baseBudget = monthlyBudget && monthlyBudget > 0 ? monthlyBudget : totalSpending;
  const percentOfBudget = Math.min(100, Math.round((maxAmt / baseBudget) * 100));

  // Previous month comparison for top category
  const prevTopCatAmt = previousMonth?.expenses[topCat] || 0;
  let momIncreasePercent = 0;
  if (prevTopCatAmt > 0) {
    momIncreasePercent = Math.round(((maxAmt - prevTopCatAmt) / prevTopCatAmt) * 100);
  } else if (maxAmt > 0) {
    momIncreasePercent = 15;
  }

  const prevMonthName = previousMonth?.month.split(" ")[0] || "last month";

  // Suggested savings calculation
  const suggestedSavings = Math.max(500, Math.round((maxAmt * 0.2) / 100) * 100);

  // Build formatted advice matching user requirement exactly:
  // "You spent 45% of your budget on Food this month. Food expenses increased by 18% compared to July. Consider reducing restaurant spending by ₹1,500 to stay within your monthly budget."
  let advice = `You spent ${percentOfBudget}% of your ${monthlyBudget ? "monthly budget" : "total spending"} on ${topCat} this month. `;
  
  if (momIncreasePercent > 0) {
    advice += `${topCat} expenses increased by ${momIncreasePercent}% compared to ${prevMonthName}. `;
  } else if (momIncreasePercent < 0) {
    advice += `${topCat} expenses decreased by ${Math.abs(momIncreasePercent)}% compared to ${prevMonthName}. `;
  }

  if (monthlyBudget && totalSpending > monthlyBudget) {
    const overBudget = totalSpending - monthlyBudget;
    advice += `You are ₹${overBudget.toLocaleString("en-IN")} over budget. Consider reducing ${topCat.toLowerCase()} spending by ₹${suggestedSavings.toLocaleString("en-IN")} to stay within your monthly budget.`;
  } else {
    advice += `Consider reducing ${topCat.toLowerCase()} spending by ₹${suggestedSavings.toLocaleString("en-IN")} to optimize your monthly savings.`;
  }

  return advice;
};

/**
 * Fetches AI Financial Advisor advice from OpenRouter API (Llama 3.1 8B Free) or fallback engine
 */
export const getAIFinancialAdvice = async (
  payload: StructuredExpensePayload
): Promise<AIAdvisorResponse> => {
  const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  // 1. Try OpenRouter Free API (Llama 3.1 8B Free)
  if (openRouterApiKey && openRouterApiKey.trim() !== "" && openRouterApiKey !== "your_openrouter_api_key_here") {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterApiKey.trim()}`,
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "BillScan Tracker AI Advisor",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct:free",
          messages: [
            {
              role: "system",
              content:
                "You are an expert AI Financial Advisor. Respond with concise 2-3 sentence financial advice formatted exactly like: 'You spent X% of your budget on [Category] this month. [Category] expenses increased by Y% compared to [PrevMonth]. Consider reducing [Category] spending by ₹Z to stay within your monthly budget.'",
            },
            {
              role: "user",
              content: `Analyze this structured expense JSON:\n${JSON.stringify(payload, null, 2)}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && typeof text === "string" && text.trim().length > 10) {
          return {
            adviceText: text.trim(),
            structuredPayload: payload,
            source: "openrouter-api",
          };
        }
      }
      console.warn("OpenRouter API call returned non-OK or empty choice, using local fallback engine.");
    } catch (err) {
      console.warn("Error calling OpenRouter API:", err);
    }
  }

  // 2. 100% Free Local AI Engine Fallback
  return {
    adviceText: generateLocalAIAdvice(payload),
    structuredPayload: payload,
    source: "ai-fallback-engine",
  };
};
