import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Check } from 'lucide-react';
export interface Expense {
  id: string;
  merchant: string;
  category: string;
  date: string;
  amount: number;
  icon: string;
  color: string;
}
interface ExpenseCardProps {
  expense: Expense;
  onClick: () => void;
  selectable?: boolean;
}
export function ExpenseCard({
  expense,
  onClick,
  selectable = false
}: ExpenseCardProps) {
  const [isSwiped, setIsSwiped] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x < -50) {
      setIsSwiped(true);
    } else if (info.offset.x > 50) {
      setIsSwiped(false);
    }
  };
  const handleClick = () => {
    if (selectable) {
      setIsSelected(!isSelected);
    } else if (!isSwiped) {
      onClick();
    } else {
      setIsSwiped(false);
    }
  };
  return (
    <div className="relative w-full mb-3 overflow-hidden rounded-[20px]">
      {/* Background Actions (revealed on swipe) */}
      <div className="absolute inset-0 bg-red-50/50 dark:bg-red-900/10 flex justify-end items-center px-5 gap-3 rounded-[20px]">
        <button className="w-[42px] h-[42px] rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-transform active:scale-95 hover:shadow-md">
          <Edit2 size={18} strokeWidth={2.5} />
        </button>
        <button className="w-[42px] h-[42px] rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center transition-transform active:scale-95 hover:shadow-md">
          <Trash2 size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Foreground Card */}
      <motion.div
        drag={selectable ? false : 'x'}
        dragConstraints={{
          left: -110,
          right: 0
        }}
        onDragEnd={handleDragEnd}
        animate={{
          x: isSwiped ? -110 : 0
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30
        }}
        onClick={handleClick}
        className={`relative bg-white dark:bg-gray-800 p-4 rounded-[20px] shadow-sm hover:shadow-md flex items-center gap-4 w-full border dark:border-gray-700 transition-all cursor-pointer ${
          isSelected 
            ? 'border-brand-green bg-brand-green/5 dark:bg-brand-green/10' 
            : 'border-transparent'
        }`}
      >
        
        {selectable && (
          <div
            className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              isSelected 
                ? 'bg-brand-green border-brand-green' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            {isSelected && <Check size={14} strokeWidth={3} className="text-white" />}
          </div>
        )}

        <div
          className="w-[48px] h-[48px] rounded-[16px] flex items-center justify-center text-[22px] flex-shrink-0 shadow-sm bg-opacity-100 dark:bg-opacity-20"
          style={{
            backgroundColor: document.documentElement.classList.contains('dark') ? expense.color.replace('F', '3') : expense.color
          }}
        >
          {expense.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-sora font-semibold text-[15px] text-text-primary dark:text-white truncate">
            {expense.merchant}
          </h4>
          <p className="font-dm text-[12px] font-medium text-text-secondary dark:text-gray-400 mt-0.5 truncate">
            {expense.category} <span className="opacity-50 mx-1">•</span> {expense.date}
          </p>
        </div>

        <div className="font-mono font-bold text-[16px] text-text-primary dark:text-white flex-shrink-0">
          ₹{expense.amount.toLocaleString('en-IN')}
        </div>
      </motion.div>
    </div>
  );
}