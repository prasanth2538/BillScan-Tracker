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
      {isVisible &&
      <motion.div
        initial={{
          opacity: 0,
          y: 50,
          scale: 0.9
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1
        }}
        exit={{
          opacity: 0,
          y: 20,
          scale: 0.9
        }}
        className="absolute bottom-24 left-4 right-4 bg-white rounded-pill shadow-modal p-3 flex items-center gap-3 z-50 border border-black/5">
        
          <div className="w-8 h-8 rounded-full bg-brand-green-light flex items-center justify-center text-brand-green flex-shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <span className="font-dm font-medium text-[14px] text-text-primary">
            {message}
          </span>
        </motion.div>
      }
    </AnimatePresence>);

}