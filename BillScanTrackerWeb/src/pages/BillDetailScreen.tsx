import { useState } from "react";
import { motion } from "framer-motion";
import { Edit2, Trash2, Save, X, Calendar } from "lucide-react";
import { Expense } from "../components/ExpenseCard";
import { updateExpense, deleteExpense } from "../services/expenseService";

interface BillDetailScreenProps {
  expense: Expense;
  onClose: () => void;
  onChanged?: () => void;
}

const categories = [
  "Food",
  "Grocery",
  "Petrol",
  "Travel",
  "Hotel",
  "Health",
  "Shopping",
  "Entertainment",
  "Education",
  "Bills",
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
  const [date, setDate] = useState(expense.date || new Date().toISOString().split("T")[0]);

  const handleUpdate = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      setSaving(true);

      await updateExpense(expense.id, {
        merchant: merchant || "Expense",
        amount: Number(amount),
        category,
        date,
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
    const ok = confirm(`Are you sure you want to delete this expense from "${merchant || "Expense"}" (₹${Number(amount || 0).toLocaleString("en-IN")})?`);
    if (!ok) return;

    try {
      setSaving(true);
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
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-lg rounded-t-[28px] max-h-[88vh] bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white flex flex-col overflow-hidden shadow-2xl z-10"
      >
        <div className="w-full flex justify-between items-center px-5 pt-3 pb-2 sticky top-0 bg-white dark:bg-[#1C1C1E] z-10">
          <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full mx-auto" />
          <button
            onClick={onClose}
            className="absolute right-4 top-3 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8 scrollbar-hide">
          <div className="flex items-center gap-4 mt-2">
            <div
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-2xl shadow-sm flex-shrink-0"
              style={{ backgroundColor: expense.color || "#F5F5F5" }}
            >
              {expense.icon || "📄"}
            </div>

            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full h-10 bg-gray-100 dark:bg-white/10 rounded-lg px-3 font-sora font-semibold text-[15px] outline-none text-gray-900 dark:text-white"
                  placeholder="Merchant / Store Name"
                />
              ) : (
                <h2 className="font-sora font-semibold text-[18px] text-gray-900 dark:text-white truncate">
                  {merchant || "Unknown Merchant"}
                </h2>
              )}

              <p className="font-dm text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                {date}
              </p>
            </div>
          </div>

          <div className="text-center mt-6 mb-6">
            {editing ? (
              <div className="space-y-3">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-14 bg-gray-100 dark:bg-white/10 rounded-xl text-center font-mono font-bold text-[32px] outline-none text-gray-900 dark:text-white"
                  placeholder="Amount ₹"
                />
                <div className="flex gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 h-10 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-lg px-3 font-dm text-[13px] font-medium outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-10 bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 rounded-lg px-3 font-dm text-[13px] outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h1 className="font-mono font-bold text-[46px] text-gray-900 dark:text-white leading-none">
                  ₹{Number(amount || 0).toLocaleString("en-IN")}
                </h1>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full mt-3">
                  <span className="text-sm">{expense.icon || "📄"}</span>
                  <span className="font-dm text-[13px] font-medium">
                    {category}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="h-[1px] w-full bg-gray-200 dark:bg-white/10 my-5" />

          <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/10 mb-6">
            <h3 className="font-sora font-semibold text-[15px] text-gray-900 dark:text-white mb-3">
              Expense Details
            </h3>

            <div className="flex justify-between mb-2.5 font-dm text-[13px]">
              <span className="text-gray-500 dark:text-gray-400">Date</span>
              <span className="text-gray-900 dark:text-white font-medium">{date}</span>
            </div>

            <div className="flex justify-between mb-2.5 font-dm text-[13px]">
              <span className="text-gray-500 dark:text-gray-400">Amount</span>
              <span className="text-gray-900 dark:text-white font-medium font-mono">
                ₹{Number(amount || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between mb-2.5 font-dm text-[13px]">
              <span className="text-gray-500 dark:text-gray-400">Category</span>
              <span className="text-gray-900 dark:text-white font-medium">{category}</span>
            </div>

            <div className="flex justify-between font-dm text-[13px]">
              <span className="text-gray-500 dark:text-gray-400">Merchant</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {merchant || "Unknown"}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="flex-1 h-[44px] rounded-xl border border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 font-dm text-[13px] font-medium flex items-center justify-center gap-1.5 hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <X size={15} /> Cancel
                </button>

                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="flex-1 h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-dm text-[13px] font-medium flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Save size={15} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 h-[44px] rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 font-dm text-[13px] font-medium flex items-center justify-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                >
                  <Edit2 size={15} /> Edit Bill
                </button>

                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 h-[44px] rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-dm text-[13px] font-medium flex items-center justify-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-900/50"
                >
                  <Trash2 size={15} /> {saving ? "Deleting..." : "Delete Bill"}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}