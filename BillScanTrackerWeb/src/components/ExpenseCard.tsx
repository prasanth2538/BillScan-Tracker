import { useState } from 'react';
import { motion } from 'framer-motion';
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
  const handleDragEnd = (_event: any, info: any) => {
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
    <div className="relative w-full mb-2 overflow-hidden rounded-card">
      {/* Background Actions (revealed on swipe) */}
      <div className="absolute inset-0 bg-page flex justify-end items-center px-4 gap-2">
        <button className="w-10 h-10 rounded-full bg-amber-light text-amber-dark flex items-center justify-center">
          <Edit2 size={18} />
        </button>
        <button className="w-10 h-10 rounded-full bg-danger-light text-danger flex items-center justify-center">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Foreground Card */}
      <motion.div
        drag={selectable ? false : 'x'}
        dragConstraints={{
          left: -100,
          right: 0
        }}
        onDragEnd={handleDragEnd}
        animate={{
          x: isSwiped ? -100 : 0
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
        onClick={handleClick}
        className={`relative bg-white p-3.5 rounded-card shadow-card flex items-center gap-3 w-full border border-transparent transition-colors ${isSelected ? 'border-brand-green bg-brand-green-light/30' : ''}`}>
        
        {selectable &&
        <div
          className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-brand-green border-brand-green' : 'border-text-tertiary'}`}>
          
            {isSelected && <Check size={12} className="text-white" />}
          </div>
        }

        <div
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{
            backgroundColor: expense.color
          }}>
          
          {expense.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-dm font-medium text-[14px] text-text-primary truncate">
            {expense.merchant}
          </h4>
          <p className="font-dm text-[12px] text-text-secondary truncate">
            {expense.category} · {expense.date}
          </p>
        </div>

        <div className="font-mono font-medium text-[15px] text-text-primary flex-shrink-0">
          ₹{expense.amount.toLocaleString('en-IN')}
        </div>
      </motion.div>
    </div>);

}