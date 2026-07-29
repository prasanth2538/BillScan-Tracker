import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Mail, Lock, Calendar, IndianRupee, Eye, EyeOff, AlertCircle } from "lucide-react";
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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out. Check your internet connection.')), ms)
    ),
  ]);
}

export function SignUpScreen({ onComplete, onBack }: SignUpScreenProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  const canClickNext = () => {
    if (step === 1) return formData.name.trim().length > 0;
    if (step === 2) return formData.email.trim().length > 0 && formData.password.length > 0 && formData.confirmPassword.length > 0;
    return formData.age.length > 0 && formData.monthlyIncome.length > 0 && formData.monthlyBudget.length > 0;
  };

  const handleNext = async () => {
    setErrorMsg("");

    if (step === 1) {
      if (!formData.name.trim()) {
        setErrorMsg("Please enter your name.");
        return;
      }
    } else if (step === 2) {
      if (!formData.email.includes("@")) {
        setErrorMsg("Please enter a valid email address.");
        return;
      }
      if (formData.password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
    } else if (step === 3) {
      const ageNum = Number(formData.age);
      const income = Number(formData.monthlyIncome.replace(/,/g, ""));
      const budget = Number(formData.monthlyBudget.replace(/,/g, ""));

      if (!formData.age || ageNum < 18 || ageNum > 100) {
        setErrorMsg("Please enter a valid age between 18 and 100.");
        return;
      }
      if (income <= 0) {
        setErrorMsg("Please enter a valid monthly income.");
        return;
      }
      if (budget <= 0) {
        setErrorMsg("Please enter a valid monthly budget.");
        return;
      }
      if (budget > income) {
        setErrorMsg("Monthly budget cannot be greater than monthly income.");
        return;
      }
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
        age: Number(formData.age),
        monthlyIncome: cleanIncome,
        monthlyBudget: cleanBudget,
      };

      await withTimeout(registerUser(formData.email.trim(), formData.password, userData), 15000);
      onComplete(userData);
    } catch (error: any) {
      console.error("Signup error:", error);
      const code = error?.code || "";
      if (code === "auth/email-already-in-use") {
        setErrorMsg("This email is already registered. Please log in.");
      } else if (code === "auth/invalid-email") {
        setErrorMsg("Please enter a valid email address.");
      } else if (code === "auth/weak-password") {
        setErrorMsg("Password should be at least 6 characters.");
      } else if (code === "auth/network-request-failed" || error.message?.includes("timed out")) {
        setErrorMsg("Network error. Please check your internet connection.");
      } else {
        setErrorMsg(error.message || "Account creation failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setErrorMsg("");
    if (step > 1) setStep(step - 1);
    else onBack();
  };

  const variants = {
    enter: { x: 80, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -80, opacity: 0 },
  };

  const incomeVal = Number(formData.monthlyIncome.replace(/,/g, "")) || 0;
  const budgetVal = Number(formData.monthlyBudget.replace(/,/g, "")) || 0;

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="w-full min-h-screen bg-page flex flex-col px-6 pt-10 pb-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <button type="button" onClick={handleBack} className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-black/5 text-text-primary">
          <ArrowLeft size={22} />
        </button>

        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-brand-green" : "w-2 bg-black/10"}`} />
          ))}
        </div>

        <div className="w-11" />
      </div>

      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={variants} initial="enter" animate="center" exit="exit" className="absolute inset-0">
              <h2 className="font-sora font-semibold text-[26px] text-text-primary mb-2">What's your name?</h2>
              <p className="font-dm text-[15px] text-text-secondary mb-6">Let's get to know you better.</p>

              <div className="relative">
                <User size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNext(); } }}
                  placeholder="Full Name"
                  className="w-full h-[60px] bg-white rounded-[16px] pl-12 pr-4 text-[18px] text-text-primary border border-black/10 focus:border-brand-green focus:outline-none"
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={variants} initial="enter" animate="center" exit="exit" className="absolute inset-0">
              <h2 className="font-sora font-semibold text-[26px] text-text-primary mb-2">Create account</h2>
              <p className="font-dm text-[15px] text-text-secondary mb-6">Enter email and password.</p>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[12px] flex items-center gap-2 text-red-600 font-dm text-[13px]">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="relative mb-4">
                <Mail size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrorMsg("");
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNext(); } }}
                  placeholder="Email address"
                  className="w-full h-[60px] bg-white rounded-[16px] pl-12 pr-4 text-[18px] text-text-primary border border-black/10 focus:border-brand-green focus:outline-none"
                />
              </div>

              <div className="relative mb-4">
                <Lock size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setErrorMsg("");
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNext(); } }}
                  placeholder="Password (min 6 chars)"
                  className="w-full h-[60px] bg-white rounded-[16px] pl-12 pr-12 text-[18px] text-text-primary border border-black/10 focus:border-brand-green focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary focus:outline-none"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>

              <div className="relative">
                <Lock size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    setErrorMsg("");
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNext(); } }}
                  placeholder="Re-enter password"
                  className="w-full h-[60px] bg-white rounded-[16px] pl-12 pr-12 text-[18px] text-text-primary border border-black/10 focus:border-brand-green focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>

              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500 mt-2 ml-1">Passwords do not match.</p>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={variants} initial="enter" animate="center" exit="exit" className="absolute inset-0">
              <h2 className="font-sora font-semibold text-[26px] text-text-primary mb-2">Your details</h2>
              <p className="font-dm text-[15px] text-text-secondary mb-6">Help us personalize your budget.</p>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[12px] flex items-center gap-2 text-red-600 font-dm text-[13px]">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="relative mb-4">
                <Calendar size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="number"
                  min={18}
                  max={100}
                  value={formData.age}
                  onChange={(e) => {
                    setFormData({ ...formData, age: e.target.value });
                    setErrorMsg("");
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNext(); } }}
                  placeholder="Age (18 - 100)"
                  className="w-full h-[60px] bg-white rounded-[16px] pl-12 pr-4 text-[18px] text-text-primary border border-black/10 focus:border-brand-green focus:outline-none"
                />
              </div>
              {formData.age && (Number(formData.age) < 18 || Number(formData.age) > 100) && (
                <p className="text-xs text-red-500 mt-[-8px] mb-3 ml-1">Age must be between 18 and 100.</p>
              )}

              <div className="relative mb-4">
                <IndianRupee size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  value={formData.monthlyIncome}
                  onChange={(e) => {
                    handleIncomeChange(e);
                    setErrorMsg("");
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNext(); } }}
                  placeholder="Monthly Income"
                  className="w-full h-[60px] bg-white rounded-[16px] pl-12 pr-4 text-[18px] text-text-primary border border-black/10 focus:border-brand-green focus:outline-none"
                />
              </div>

              <div className="relative">
                <IndianRupee size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  value={formData.monthlyBudget}
                  onChange={(e) => {
                    handleBudgetChange(e);
                    setErrorMsg("");
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleNext(); } }}
                  placeholder="Monthly Budget"
                  className="w-full h-[60px] bg-white rounded-[16px] pl-12 pr-4 text-[18px] text-text-primary border border-black/10 focus:border-brand-green focus:outline-none"
                />
              </div>
              {budgetVal > 0 && incomeVal > 0 && budgetVal > incomeVal && (
                <p className="text-xs text-red-500 mt-2 ml-1">Monthly budget cannot be greater than monthly income.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 pt-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!canClickNext() || loading}
          className={`w-full h-[58px] rounded-[16px] flex items-center justify-center font-sora font-semibold text-[17px] ${
            canClickNext() && !loading ? "bg-brand-green text-white shadow-lg shadow-brand-green/30" : "bg-muted text-text-tertiary cursor-not-allowed opacity-60"
          }`}
        >
          {loading ? "Creating..." : step === 3 ? "Create Account" : "Next"}
        </motion.button>
      </div>
    </form>
  );
}