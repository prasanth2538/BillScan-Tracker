import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Camera, Sparkles, BarChart2 } from 'lucide-react';
interface SplashScreenProps {
  onGetStarted: () => void;
}
export function SplashScreen({ onGetStarted }: SplashScreenProps) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-brand-green-dark to-brand-green relative overflow-hidden flex flex-col transition-colors duration-300">
      {/* Hero Illustration Area */}
      <div className="flex-1 relative flex items-center justify-center pt-10">
        {/* Soft glow */}
        <div className="absolute w-64 h-64 bg-white/15 rounded-full blur-[80px]" />

        <div className="relative w-full h-full flex items-center justify-center perspective-[1000px]">
          {/* Floating Phone */}
          <motion.div
            initial={{
              y: 20,
              rotateX: 10,
              rotateY: -10
            }}
            animate={{
              y: [20, -10, 20],
              rotateX: [10, 15, 10],
              rotateY: [-10, -5, -10]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="w-48 h-72 bg-gray-900 dark:bg-dark-card rounded-[32px] border-4 border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden z-10">
            
            {/* Viewfinder UI */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-40 border-2 border-brand-green/40 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-[3px] border-l-[3px] border-brand-green rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-[3px] border-r-[3px] border-brand-green rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-[3px] border-l-[3px] border-brand-green rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-[3px] border-r-[3px] border-brand-green rounded-br-sm" />

                {/* Scanning line */}
                <motion.div
                  animate={{
                    y: [-10, 170, -10]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  className="w-full h-[2px] bg-brand-green shadow-[0_0_12px_#1D9E75] relative z-10" />
                
                {/* Scan Area Overlay */}
                <div className="absolute inset-0 bg-brand-green/5" />
              </div>
            </div>
          </motion.div>

          {/* Receipt below phone */}
          <motion.div
            initial={{
              y: 40,
              opacity: 0,
              rotateZ: -5
            }}
            animate={{
              y: 0,
              opacity: 1,
              rotateZ: -5
            }}
            transition={{
              delay: 0.5,
              duration: 0.8
            }}
            className="absolute bottom-12 w-40 h-48 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl z-0 p-3.5 border border-white/20">
            
            <div className="w-full h-2.5 bg-gray-200 mb-3 rounded-full" />
            <div className="w-3/4 h-2.5 bg-gray-200 mb-5 rounded-full" />
            <div className="w-full h-1 bg-gray-100 mb-1.5 rounded-full" />
            <div className="w-full h-1 bg-gray-100 mb-1.5 rounded-full" />
            <div className="w-2/3 h-1 bg-gray-100 mb-5 rounded-full" />
            <div className="w-full h-px bg-gray-200 mb-3" />
            <div className="flex justify-between items-center">
              <div className="w-1/2 h-3 bg-gray-200 rounded-full" />
              <div className="w-1/3 h-3.5 bg-brand-green/20 rounded-full" />
            </div>
          </motion.div>

          {/* Floating Chips */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
              x: -20,
              y: 20
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: -40,
              y: -40
            }}
            transition={{
              delay: 1.2,
              duration: 0.6,
              type: 'spring'
            }}
            className="absolute top-1/4 left-1/4 bg-white/95 backdrop-blur-sm rounded-pill px-3 py-1.5 shadow-lg flex items-center gap-1.5 z-20 border border-white/20">
            
            <div className="w-4 h-4 rounded-full bg-brand-green flex items-center justify-center shadow-sm">
              <Check size={10} className="text-white" strokeWidth={3} />
            </div>
            <span className="font-mono font-bold text-text-primary text-[13px] tracking-tight">
              ₹421
            </span>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
              x: 20,
              y: 20
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 40,
              y: 20
            }}
            transition={{
              delay: 1.5,
              duration: 0.6,
              type: 'spring'
            }}
            className="absolute top-1/2 right-1/4 bg-white/95 backdrop-blur-sm rounded-pill px-3 py-1.5 shadow-lg z-20 border border-white/20">
            
            <span className="font-dm font-bold text-text-primary text-[12px] flex items-center gap-1">
              <span className="text-sm">🛒</span> Groceries
            </span>
          </motion.div>
        </div>
      </div>

      {/* Center Text */}
      <div className="text-center px-6 mb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-pill mb-4 border border-white/20"
        >
          <Sparkles size={14} className="text-brand-green-light" />
          <span className="font-dm font-bold text-[11px] text-white tracking-widest uppercase">
            AI-Powered Tracking
          </span>
        </motion.div>
        <motion.h1
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.2
          }}
          className="font-sora font-bold text-[42px] text-white leading-tight mb-3 tracking-tight">
          
          BillScan
        </motion.h1>
        <motion.p
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.3
          }}
          className="font-dm font-medium text-[16px] text-white/80">
          
          Snap a receipt. Track expenses.
        </motion.p>
      </div>

      {/* Bottom Card */}
      <motion.div
        initial={{
          y: '100%'
        }}
        animate={{
          y: 0
        }}
        transition={{
          delay: 0.5,
          type: 'spring',
          damping: 25,
          stiffness: 200
        }}
        className="glass-effect rounded-t-[32px] p-8 w-full relative z-20 shadow-floating border-t border-white/20 dark:border-white/10">
        
        <motion.button
          whileHover={{
            scale: 1.02
          }}
          whileTap={{
            scale: 0.97
          }}
          onClick={onGetStarted}
          className="w-full h-[60px] bg-gradient-to-r from-brand-green to-brand-green-gradient rounded-[20px] flex items-center justify-center gap-2.5 text-white font-sora font-bold text-[16px] shadow-lg shadow-brand-green/30 mb-8 transition-all">
          
          Get started free
          <ArrowRight size={20} strokeWidth={2.5} />
        </motion.button>

        <div className="flex justify-between gap-3">
          <div className="flex-1 bg-gray-50/50 dark:bg-white/5 rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-2 border border-gray-100 dark:border-white/5 shadow-sm">
            <Camera size={20} className="text-text-tertiary dark:text-gray-400" />
            <span className="font-dm text-[12px] text-text-secondary dark:text-gray-400 font-bold tracking-wide text-center">
              OCR Scan
            </span>
          </div>
          <div className="flex-1 bg-gray-50/50 dark:bg-white/5 rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-2 border border-gray-100 dark:border-white/5 shadow-sm">
            <Sparkles size={20} className="text-text-tertiary dark:text-gray-400" />
            <span className="font-dm text-[12px] text-text-secondary dark:text-gray-400 font-bold tracking-wide text-center">
              AI Sort
            </span>
          </div>
          <div className="flex-1 bg-gray-50/50 dark:bg-white/5 rounded-xl py-3 px-2 flex flex-col items-center justify-center gap-2 border border-gray-100 dark:border-white/5 shadow-sm">
            <BarChart2 size={20} className="text-text-tertiary dark:text-gray-400" />
            <span className="font-dm text-[12px] text-text-secondary dark:text-gray-400 font-bold tracking-wide text-center">
              Reports
            </span>
          </div>
        </div>
      </motion.div>
    </div>);

}