import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}
export function Toast({ message, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{
            opacity: 0,
            y: 50,
            scale: 0.95
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1
          }}
          exit={{
            opacity: 0,
            y: 20,
            scale: 0.95
          }}
          className="fixed bottom-28 left-4 right-4 max-w-sm mx-auto glass-effect dark:bg-gray-800/90 rounded-[20px] shadow-floating p-3.5 flex items-center gap-3 z-[60] border border-white/20 dark:border-gray-700"
        >
          <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green flex-shrink-0">
            <CheckCircle2 size={22} strokeWidth={2.5} />
          </div>
          <span className="font-dm font-semibold text-[15px] text-text-primary dark:text-white">
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}