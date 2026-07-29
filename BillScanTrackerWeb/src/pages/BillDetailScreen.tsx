import { useState } from "react";
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
        className="w-full h-[82%] bg-white rounded-t-modal shadow-modal relative pointer-events-auto flex flex-col overflow-hidden"
      >
        <div className="w-full flex justify-center pt-3 pb-4 bg-white sticky top-0 z-10">
          <div className="w-10 h-1 bg-[#D3D1C7] rounded-full" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8 scrollbar-hide">
          <div className="flex items-center gap-4 mt-2">
            <div
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-2xl shadow-sm"
              style={{ backgroundColor: expense.color || "#F5F5F5" }}
            >
              {expense.icon || "📄"}
            </div>

            <div className="flex-1">
              {editing ? (
                <input
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleUpdate(); } }}
                  className="w-full h-10 bg-muted rounded-lg px-3 font-sora font-semibold text-[16px] outline-none"
                  placeholder="Merchant"
                />
              ) : (
                <h2 className="font-sora font-semibold text-[18px] text-text-primary">
                  {merchant || "Unknown"}
                </h2>
              )}

              <p className="font-dm text-[13px] text-text-secondary mt-0.5">
                {expense.date || new Date().toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>

          <div className="text-center mt-6 mb-6">
            {editing ? (
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleUpdate(); } }}
                className="w-full h-16 bg-muted rounded-xl text-center font-mono font-bold text-[36px] outline-none"
                placeholder="Amount"
              />
            ) : (
              <h1 className="font-mono font-bold text-[52px] text-text-primary leading-none">
                ₹{Number(amount || 0).toLocaleString("en-IN")}
              </h1>
            )}

            {editing ? (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-4 h-10 bg-brand-green-light text-brand-green-dark rounded-pill px-4 font-dm text-[13px] font-medium outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-green-light text-brand-green-dark rounded-pill mt-3">
                <span className="text-sm">{expense.icon || "📄"}</span>
                <span className="font-dm text-[13px] font-medium">
                  {category}
                </span>
              </div>
            )}
          </div>

          <div className="h-[0.5px] w-full bg-black/10 my-6" />

          <div className="bg-white rounded-card p-4 shadow-card border border-black/5 mb-6">
            <h3 className="font-sora font-semibold text-[16px] text-text-primary mb-4">
              Expense Details
            </h3>

            <div className="flex justify-between mb-3">
              <span className="font-dm text-[13px] text-text-secondary">
                Date
              </span>
              <span className="font-dm text-[13px] text-text-primary font-medium">
                {expense.date || new Date().toLocaleDateString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between mb-3">
              <span className="font-dm text-[13px] text-text-secondary">
                Amount
              </span>
              <span className="font-dm text-[13px] text-text-primary font-medium">
                ₹{Number(amount || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between mb-3">
              <span className="font-dm text-[13px] text-text-secondary">
                Category
              </span>
              <span className="font-dm text-[13px] text-text-primary font-medium">
                {category}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-dm text-[13px] text-text-secondary">
                Merchant
              </span>
              <span className="font-dm text-[13px] text-text-primary font-medium">
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
                  className="flex-1 h-[44px] rounded-[10px] border border-black/10 text-text-primary font-dm text-[12px] font-medium flex items-center justify-center gap-1.5"
                >
                  <X size={14} /> Cancel
                </button>

                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="flex-1 h-[44px] rounded-[10px] bg-brand-green text-white font-dm text-[12px] font-medium flex items-center justify-center gap-1.5"
                >
                  <Save size={14} /> {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 h-[44px] rounded-[10px] border border-amber text-amber-dark font-dm text-[12px] font-medium flex items-center justify-center gap-1.5"
                >
                  <Edit2 size={14} /> Edit
                </button>

                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 h-[44px] rounded-[10px] border border-danger text-danger font-dm text-[12px] font-medium flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> {saving ? "Deleting..." : "Delete"}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}