import React from 'react';
import { Home, List, PieChart, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  activeTab: 'home' | 'expenses' | 'reports' | 'profile';
  onTabChange: (tab: 'home' | 'expenses' | 'reports' | 'profile') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'expenses', label: 'Expenses', icon: List },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'profile', label: 'Profile', icon: User }
  ] as const;

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center px-6 z-40 pointer-events-none">
      <div className="glass-effect shadow-floating rounded-[32px] w-full max-w-sm h-[72px] flex justify-around items-center px-2 pointer-events-auto transition-colors">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center w-16 h-full group"
            >
              <motion.div
                animate={{ 
                  y: isActive ? -4 : 0,
                  scale: isActive ? 1.1 : 1
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  isActive ? 'bg-brand-green/10 dark:bg-brand-green/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon
                  size={22}
                  className={`transition-colors duration-300 ${
                    isActive ? 'text-brand-green' : 'text-text-tertiary group-hover:text-text-secondary'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </motion.div>
              
              <span
                className={`absolute bottom-2 text-[10px] font-dm font-semibold transition-all duration-300 ${
                  isActive 
                    ? 'text-brand-green opacity-100 transform translate-y-0' 
                    : 'text-text-tertiary opacity-0 transform translate-y-2 group-hover:opacity-50'
                }`}
              >
                {tab.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-brand-green shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}