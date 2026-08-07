import { Home, List, TrendingUp, PieChart, User } from 'lucide-react';
import { motion } from 'framer-motion';

export type TabId = 'home' | 'expenses' | 'trend' | 'reports' | 'profile';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: List
    },
    {
      id: 'trend',
      label: 'Trends',
      icon: TrendingUp
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: PieChart
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User
    }
  ] as const;
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-[80px] bg-white dark:bg-[#1C1C1E] border-t border-black/5 dark:border-white/10 flex justify-around items-center px-2 pb-4 z-50">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center justify-center w-16 h-full relative">
            
            <Icon
              size={24}
              className={`mb-1 transition-colors ${isActive ? 'text-brand-green fill-brand-green/20' : 'text-text-tertiary'}`} />
            
            <span
              className={`text-[10px] font-dm font-medium transition-colors ${isActive ? 'text-brand-green' : 'text-text-tertiary'}`}>
              
              {tab.label}
            </span>
            {isActive &&
            <motion.div
              layoutId="nav-indicator"
              className="absolute -bottom-1 w-1 h-1 rounded-full bg-brand-green" />

            }
          </button>);

      })}
    </div>);

}