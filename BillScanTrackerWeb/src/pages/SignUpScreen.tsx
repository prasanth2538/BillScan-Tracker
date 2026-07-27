import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Mail, Lock, Calendar, IndianRupee } from "lucide-react";
import { registerUser } from "../services/authService";

export interface UserProfile {
  name: string;
  email: string;
  age?: number;
  monthlyIncome?: number;
  monthlyBudget?: number;
}

interface SignUpScreenProps {
  onComplete: (userData: UserProfile) => void;
  onBack: () => void;
}

export function SignUpScreen({ onComplete, onBack }: SignUpScreenProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    monthlyIncome: "",
    monthlyBudget: "",
  });

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "";
    return parseInt(numericValue).toLocaleString("en-IN");
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, monthlyIncome: formatCurrency(e.target.value) });
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, monthlyBudget: formatCurrency(e.target.value) });
  };

  const isStepValid = () => {
    if (step === 1) return formData.name.trim().length > 0;
    if (step === 2) return formData.email.includes("@") && formData.password.length >= 6 && formData.password === formData.confirmPassword;

    const income = Number(formData.monthlyIncome.replace(/,/g, ""));
    const budget = Number(formData.monthlyBudget.replace(/,/g, ""));

    return Number(formData.age) > 0 && income > 0 && budget > 0 && budget <= income;
  };

  const handleNext = async () => {
    if (!isStepValid()) {
      if (step === 3) {
        const income = Number(formData.monthlyIncome.replace(/,/g, ""));
        const budget = Number(formData.monthlyBudget.replace(/,/g, ""));
        if (budget > income) alert("Monthly budget cannot be greater than monthly income.");
      }
      return;
    }

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    try {
      setLoading(true);

      const cleanIncome = Number(formData.monthlyIncome.replace(/,/g, "")) || 0;
      const cleanBudget = Number(formData.monthlyBudget.replace(/,/g, "")) || 0;

      const userData: UserProfile = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        age: Number(formData.age) || 25,
        monthlyIncome: cleanIncome,
        monthlyBudget: cleanBudget,
      };

      await registerUser(formData.email.trim(), formData.password, userData);
      onComplete(userData);
    } catch (error: any) {
      console.error("Signup error:", error);
      alert(error.message || "Account creation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
  };

  const variants = {
    enter: { x: 80, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -80, opacity: 0 },
  };

  return (
    <div className="w-full min-h-screen bg-page flex flex-col px-6 pt-10 pb-6 overflow-hidden transition-colors duration-300 relative">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-20%] w-64 h-64 bg-brand-green/30 dark:bg-brand-green/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-20%] w-64 h-64 bg-amber-500/20 dark:bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <button onClick={handleBack} className="w-12 h-12 glass-effect rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-white/10 text-text-primary dark:text-white hover:bg-white dark:hover:bg-dark-card transition-colors">
          <ArrowLeft size={22} />
        </button>

        <div className="flex gap-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-2.5 rounded-full transition-all duration-500 ${i === step ? "w-10 bg-brand-green shadow-sm shadow-brand-green/30" : "w-3 bg-gray-200 dark:bg-gray-800"}`} />
          ))}
        </div>

        <div className="w-12" />
      </div>

      <div className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={variants} initial="enter" animate="center" exit="exit" className="absolute inset-0 pt-4">
              <h2 className="font-sora font-bold text-[32px] text-text-primary dark:text-white mb-3 tracking-tight">What's your name?</h2>
              <p className="font-dm text-[16px] font-medium text-text-secondary dark:text-gray-400 mb-10">Let's get to know you better.</p>

              <label className="block font-dm text-[13px] font-bold text-text-secondary dark:text-gray-400 mb-2 ml-1 tracking-wide">
                FULL NAME
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={20} className="text-text-tertiary dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full h-[60px] glass-effect rounded-2xl pl-12 pr-4 font-dm text-[15px] text-text-primary dark:text-white placeholder:text-text-tertiary dark:placeholder:text-gray-500 border border-gray-200 dark:border-white/10 focus:border-brand-green focus:ring-1 focus:ring-brand-green focus:outline-none transition-all shadow-sm"
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={variants} initial="enter" animate="center" exit="exit" className="absolute inset-0 pt-4">
              <h2 className="font-sora font-bold text-[32px] text-text-primary dark:text-white mb-3 tracking-tight">Create account</h2>
              <p className="font-dm text-[16px] font-medium text-text-secondary dark:text-gray-400 mb-10">Enter email and password.</p>

              <div className="mb-5">
                <label className="block font-dm text-[13px] font-bold text-text-secondary dark:text-gray-400 mb-2 ml-1 tracking-wide">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={20} className="text-text-tertiary dark:text-gray-500" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                    className="w-full h-[60px] glass-effect rounded-2xl pl-12 pr-4 font-dm text-[15px] text-text-primary dark:text-white placeholder:text-text-tertiary dark:placeholder:text-gray-500 border border-gray-200 dark:border-white/10 focus:border-brand-green focus:ring-1 focus:ring-brand-green focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block font-dm text-[13px] font-bold text-text-secondary dark:text-gray-400 mb-2 ml-1 tracking-wide">
                  PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={20} className="text-text-tertiary dark:text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Password min 6 characters"
                    className="w-full h-[60px] glass-effect rounded-2xl pl-12 pr-4 font-dm text-[15px] text-text-primary dark:text-white placeholder:text-text-tertiary dark:placeholder:text-gray-500 border border-gray-200 dark:border-white/10 focus:border-brand-green focus:ring-1 focus:ring-brand-green focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-dm text-[13px] font-bold text-text-secondary dark:text-gray-400 mb-2 ml-1 tracking-wide">
                  CONFIRM PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={20} className="text-text-tertiary dark:text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter your password"
                    className="w-full h-[60px] glass-effect rounded-2xl pl-12 pr-4 font-dm text-[15px] text-text-primary dark:text-white placeholder:text-text-tertiary dark:placeholder:text-gray-500 border border-gray-200 dark:border-white/10 focus:border-brand-green focus:ring-1 focus:ring-brand-green focus:outline-none transition-all shadow-sm"
                  />
                </div>
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-red-500 text-xs mt-2 ml-1 font-dm">Passwords do not match</p>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={variants} initial="enter" animate="center" exit="exit" className="absolute inset-0 pt-4">
              <h2 className="font-sora font-bold text-[32px] text-text-primary dark:text-white mb-3 tracking-tight">Your details</h2>
              <p className="font-dm text-[16px] font-medium text-text-secondary dark:text-gray-400 mb-10">Help us personalize your budget.</p>

              <div className="mb-5">
                <label className="block font-dm text-[13px] font-bold text-text-secondary dark:text-gray-400 mb-2 ml-1 tracking-wide">
                  AGE
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar size={20} className="text-text-tertiary dark:text-gray-500" />
                  </div>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Your age"
                    className="w-full h-[60px] glass-effect rounded-2xl pl-12 pr-4 font-dm text-[15px] text-text-primary dark:text-white placeholder:text-text-tertiary dark:placeholder:text-gray-500 border border-gray-200 dark:border-white/10 focus:border-brand-green focus:ring-1 focus:ring-brand-green focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block font-dm text-[13px] font-bold text-text-secondary dark:text-gray-400 mb-2 ml-1 tracking-wide">
                  MONTHLY INCOME
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IndianRupee size={20} className="text-text-tertiary dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={formData.monthlyIncome}
                    onChange={handleIncomeChange}
                    placeholder="0"
                    className="w-full h-[60px] glass-effect rounded-2xl pl-12 pr-4 font-dm text-[15px] text-text-primary dark:text-white placeholder:text-text-tertiary dark:placeholder:text-gray-500 border border-gray-200 dark:border-white/10 focus:border-brand-green focus:ring-1 focus:ring-brand-green focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-dm text-[13px] font-bold text-text-secondary dark:text-gray-400 mb-2 ml-1 tracking-wide">
                  MONTHLY BUDGET
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IndianRupee size={20} className="text-text-tertiary dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={formData.monthlyBudget}
                    onChange={handleBudgetChange}
                    placeholder="0"
                    className="w-full h-[60px] glass-effect rounded-2xl pl-12 pr-4 font-dm text-[15px] text-text-primary dark:text-white placeholder:text-text-tertiary dark:placeholder:text-gray-500 border border-gray-200 dark:border-white/10 focus:border-brand-green focus:ring-1 focus:ring-brand-green focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 pt-6 relative z-10">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          disabled={!isStepValid() || loading}
          className={`w-full h-[60px] rounded-[20px] flex items-center justify-center font-sora font-bold text-[17px] transition-all duration-300 ${
            isStepValid() && !loading ? "bg-gradient-to-r from-brand-green to-brand-green-gradient text-white shadow-lg shadow-brand-green/30" : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2.5">
              <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Creating...
            </span>
          ) : step === 3 ? "Create Account" : "Continue"}
        </motion.button>
      </div>
    </div>
  );
}