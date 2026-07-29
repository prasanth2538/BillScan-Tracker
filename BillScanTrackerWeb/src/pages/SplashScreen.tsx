import { motion } from 'framer-motion';
import { ArrowRight, Check, Camera, Sparkles, BarChart2 } from 'lucide-react';
interface SplashScreenProps {
  onGetStarted: () => void;
}
export function SplashScreen({ onGetStarted }: SplashScreenProps) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-brand-green-dark to-brand-green relative overflow-hidden flex flex-col">
      {/* Hero Illustration Area */}
      <div className="flex-1 relative flex items-center justify-center pt-10">
        {/* Soft glow */}
        <div className="absolute w-64 h-64 bg-white/15 rounded-full blur-3xl" />

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
            className="w-48 h-72 bg-black rounded-[32px] border-4 border-gray-800 shadow-2xl relative overflow-hidden z-10">
            
            {/* Viewfinder UI */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-40 border-2 border-brand-green/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand-green" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand-green" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand-green" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand-green" />

                {/* Scanning line */}
                <motion.div
                  animate={{
                    y: [0, 160, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  className="w-full h-0.5 bg-brand-green shadow-[0_0_8px_#1D9E75]" />
                
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
            className="absolute bottom-12 w-40 h-48 bg-white rounded-sm shadow-lg z-0 p-3">
            
            <div className="w-full h-2 bg-gray-200 mb-2 rounded-sm" />
            <div className="w-3/4 h-2 bg-gray-200 mb-4 rounded-sm" />
            <div className="w-full h-1 bg-gray-100 mb-1" />
            <div className="w-full h-1 bg-gray-100 mb-1" />
            <div className="w-2/3 h-1 bg-gray-100 mb-4" />
            <div className="w-full h-0.5 bg-gray-300 mb-2" />
            <div className="flex justify-between">
              <div className="w-1/2 h-3 bg-gray-200 rounded-sm" />
              <div className="w-1/3 h-3 bg-brand-green/30 rounded-sm" />
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
            className="absolute top-1/4 left-1/4 bg-white rounded-pill px-3 py-1.5 shadow-lg flex items-center gap-1.5 z-20">
            
            <div className="w-4 h-4 rounded-full bg-brand-green flex items-center justify-center">
              <Check size={10} className="text-white" />
            </div>
            <span className="font-mono font-medium text-text-primary text-sm">
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
            className="absolute top-1/2 right-1/4 bg-brand-green-light rounded-pill px-3 py-1.5 shadow-lg z-20 border border-brand-green/20">
            
            <span className="font-dm font-medium text-brand-green-dark text-xs">
              🛒 Groceries
            </span>
          </motion.div>
        </div>
      </div>

      {/* Center Text */}
      <div className="text-center px-6 mb-8 relative z-10">
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
          className="font-sora font-bold text-[38px] text-white leading-tight mb-2">
          
          SmartSpend
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
          className="font-dm font-light text-[18px] text-white/75">
          
          Scan a bill. Done.
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
        className="bg-white rounded-t-[32px] p-8 w-full relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        
        <motion.button
          whileHover={{
            scale: 1.02
          }}
          whileTap={{
            scale: 0.97
          }}
          onClick={onGetStarted}
          className="w-full h-[56px] bg-brand-green rounded-[14px] flex items-center justify-center gap-2 text-white font-sora font-semibold text-[16px] shadow-lg shadow-brand-green/30 mb-6">
          
          Get started free
          <ArrowRight size={18} />
        </motion.button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-black/5" />
          <span className="font-dm text-[14px] text-text-secondary">or</span>
          <div className="flex-1 h-px bg-black/5" />
        </div>

        <div className="text-center mb-8">
          <p className="font-dm text-[14px] text-text-secondary">
            Already have an account?{' '}
            <button className="text-brand-green font-medium">Sign in</button>
          </p>
        </div>

        <div className="flex justify-between gap-2">
          <div className="flex-1 bg-muted rounded-pill py-2 px-1 flex items-center justify-center gap-1.5">
            <Camera size={14} className="text-text-secondary" />
            <span className="font-dm text-[11px] text-text-secondary font-medium whitespace-nowrap">
              OCR Scan
            </span>
          </div>
          <div className="flex-1 bg-muted rounded-pill py-2 px-1 flex items-center justify-center gap-1.5">
            <Sparkles size={14} className="text-text-secondary" />
            <span className="font-dm text-[11px] text-text-secondary font-medium whitespace-nowrap">
              AI Sort
            </span>
          </div>
          <div className="flex-1 bg-muted rounded-pill py-2 px-1 flex items-center justify-center gap-1.5">
            <BarChart2 size={14} className="text-text-secondary" />
            <span className="font-dm text-[11px] text-text-secondary font-medium whitespace-nowrap">
              Reports
            </span>
          </div>
        </div>
      </motion.div>
    </div>);

}