import React, { useState } from "react";
import { motion } from "framer-motion";
import { Edit2, Trash2, Save, X } from "lucide-react";
import { Expense } from "../components/ExpenseCard";
import { updateExpense, deleteExpense } from "../services/expenseService";

interface BillDetailScreenProps {
  expense: Expense;
  onClose: () => void;
  onChanged?: () => void;
}

const categories = [
  "Food",
  "Petrol",
  "Groceries",
  "Movies",
  "Travel",
  "Health",
  "Hotels",
  "Transport",
  "Other",
];

export function BillDetailScreen({
  expense,
  onClose,
  onChanged,
}: BillDetailScreenProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [merchant, setMerchant] = useState(expense.merchant || "");
  const [amount, setAmount] = useState(String(expense.amount || ""));
  const [category, setCategory] = useState(expense.category || "Other");

  const handleUpdate = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("Please enter valid amount");
      return;
    }

    try {
      setSaving(true);

      await updateExpense(expense.id, {
        merchant,
        amount: Number(amount),
        category,
        date: expense.date || new Date().toISOString(),
      });

      alert("Expense updated successfully");
      setEditing(false);
      onChanged?.();
      onClose();
    } catch (error: any) {
      alert(error.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
  const ok = confirm("Are you sure you want to delete this expense?");
  if (!ok) return;

  try {
    setSaving(true);

    console.log("Deleting expense id:", expense.id);

    await deleteExpense(expense.id);

    alert("Expense deleted successfully");
    onChanged?.();
    onClose();
  } catch (error: any) {
    console.error("Delete failed:", error);
    alert(error.message || "Delete failed");
  } finally {
    setSaving(false);
  }
};
  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 pointer-events-auto"
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full h-[82%] glass-effect dark:bg-dark-card rounded-t-[32px] shadow-floating relative pointer-events-auto flex flex-col overflow-hidden border-t border-white/20 dark:border-white/5"
      >
        <div className="w-full flex justify-center pt-4 pb-5 sticky top-0 z-10">
          <div className="w-12 h-1.5 bg-gray-300/50 dark:bg-gray-700 rounded-full" />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-10 scrollbar-hide">
          <div className="flex items-center gap-5 mt-2">
            <div
              className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-3xl shadow-sm"
              style={{ backgroundColor: expense.color || "#F5F5F5" }}
            >
              {expense.icon || "📄"}
            </div>

            <div className="flex-1">
              {editing ? (
                <input
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full h-11 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl px-4 font-sora font-semibold text-[16px] outline-none border border-gray-100 dark:border-gray-700 focus:border-brand-green transition-colors"
                  placeholder="Merchant"
                />
              ) : (
                <h2 className="font-sora font-bold text-[20px] text-text-primary dark:text-white tracking-tight">
                  {merchant || "Unknown"}
                </h2>
              )}

              <p className="font-dm text-[13px] font-medium text-text-secondary dark:text-gray-400 mt-1">
                {expense.date || new Date().toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>

          <div className="text-center mt-8 mb-8">
            {editing ? (
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-[72px] bg-gray-50 dark:bg-gray-800 dark:text-white rounded-[20px] text-center font-mono font-bold text-[40px] outline-none border border-gray-100 dark:border-gray-700 focus:border-brand-green transition-colors"
                placeholder="Amount"
              />
            ) : (
              <h1 className="font-mono font-bold text-[56px] text-text-primary dark:text-white leading-none tracking-tight">
                ₹{Number(amount || 0).toLocaleString("en-IN")}
              </h1>
            )}

            {editing ? (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-5 h-12 bg-brand-green/10 dark:bg-brand-green/20 text-brand-green-dark dark:text-brand-green rounded-pill px-5 font-dm text-[14px] font-bold outline-none border border-brand-green/20"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-green/10 dark:bg-brand-green/20 text-brand-green-dark dark:text-brand-green rounded-pill mt-4 border border-brand-green/20">
                <span className="text-[15px]">{expense.icon || "📄"}</span>
                <span className="font-dm text-[14px] font-bold tracking-wide">
                  {category}
                </span>
              </div>
            )}
          </div>

          <div className="h-px w-full bg-black/5 dark:bg-white/10 my-8" />

          <div className="bg-white dark:bg-dark-card rounded-[24px] p-5 shadow-sm border border-transparent dark:border-white/5 mb-8">
            <h3 className="font-sora font-bold text-[17px] text-text-primary dark:text-white mb-5">
              Expense Details
            </h3>

            <div className="flex justify-between mb-3.5">
              <span className="font-dm text-[14px] font-medium text-text-secondary dark:text-gray-400">
                Date
              </span>
              <span className="font-dm text-[14px] text-text-primary dark:text-white font-semibold">
                {expense.date || new Date().toLocaleDateString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between mb-3.5">
              <span className="font-dm text-[14px] font-medium text-text-secondary dark:text-gray-400">
                Amount
              </span>
              <span className="font-mono text-[14px] text-text-primary dark:text-white font-bold">
                ₹{Number(amount || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between mb-3.5">
              <span className="font-dm text-[14px] font-medium text-text-secondary dark:text-gray-400">
                Category
              </span>
              <span className="font-dm text-[14px] text-text-primary dark:text-white font-semibold">
                {category}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-dm text-[14px] font-medium text-text-secondary dark:text-gray-400">
                Merchant
              </span>
              <span className="font-dm text-[14px] text-text-primary dark:text-white font-semibold">
                {merchant || "Unknown"}
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="flex-1 h-[52px] rounded-xl border-2 border-gray-200 dark:border-gray-700 text-text-primary dark:text-white font-sora text-[15px] font-bold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={18} strokeWidth={2.5} /> Cancel
                </button>

                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="flex-1 h-[52px] rounded-xl bg-gradient-to-r from-brand-green to-brand-green-gradient text-white font-sora text-[15px] font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 active:scale-[0.98] transition-all"
                >
                  <Save size={18} strokeWidth={2.5} /> {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 h-[52px] rounded-xl border-2 border-amber-500/30 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-sora text-[15px] font-bold flex items-center justify-center gap-2 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                >
                  <Edit2 size={18} strokeWidth={2.5} /> Edit
                </button>

                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 h-[52px] rounded-xl border-2 border-red-500/30 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-sora text-[15px] font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={18} strokeWidth={2.5} /> {saving ? "Deleting..." : "Delete"}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}