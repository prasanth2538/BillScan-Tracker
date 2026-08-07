import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, TrendingUp, X } from "lucide-react";

interface AIFinancialAdvisorModalProps {
  isVisible: boolean;
  amount: number;
  category: string;
  merchant: string;
  adviceText: string;
  loading: boolean;
  onClose: () => void;
  onViewTrends: () => void;
}

export function AIFinancialAdvisorModal({
  isVisible,
  amount,
  category,
  merchant,
  adviceText,
  loading,
  onClose,
  onViewTrends,
}: AIFinancialAdvisorModalProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white rounded-3xl p-6 shadow-2xl border border-gray-700/70 relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full bg-gray-800/60 hover:bg-gray-700 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Saved Success Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-green-400 uppercase tracking-wider block">
              Expense Saved Successfully
            </span>
            <h3 className="text-base font-bold text-white">
              ₹{amount.toLocaleString("en-IN")}{" "}
              <span className="text-xs font-normal text-gray-300">
                in {category} ({merchant || "Payee"})
              </span>
            </h3>
          </div>
        </div>

        {/* AI Financial Advisor Header */}
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-3">
          <Sparkles size={18} className="animate-pulse" />
          <span>AI Financial Advisor ⭐⭐⭐⭐⭐</span>
        </div>

        {/* LLM Financial Advice Content */}
        <div className="p-4 bg-gray-800/90 border border-gray-700 rounded-2xl mb-6 text-xs text-gray-100 font-medium leading-relaxed shadow-inner">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-2">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing {category} category trends & budget...</span>
            </div>
          ) : (
            <p className="text-gray-100">{adviceText || "Analyzing your updated monthly spending..."}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onViewTrends}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <TrendingUp size={16} /> View Trend Analysis
          </button>
          <button
            onClick={onClose}
            className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-semibold rounded-xl border border-gray-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
}
