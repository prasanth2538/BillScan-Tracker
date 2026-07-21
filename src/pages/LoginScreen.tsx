import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { loginUser, forgotPassword } from "../services/authService";

interface LoginScreenProps {
  onLogin: (email: string) => void;
  onSignUp: () => void;
}

// Wraps a promise with a timeout — if Firebase hangs, we reject after N ms
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out. Check your internet connection.')), ms)
    ),
  ]);
}

export function LoginScreen({ onLogin, onSignUp }: LoginScreenProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg]   = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setErrorMsg('');
    setInfoMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);

      // 15-second timeout in case Firebase hangs inside WebView
      await withTimeout(loginUser(email.trim(), password), 15000);

      onLogin(email.trim());

    } catch (error: any) {
      console.error('Login error:', error);

      const code = error?.code || '';
      if (code === 'auth/user-not-found') {
        setErrorMsg('No account found. Please sign up.');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMsg('Incorrect email or password. Please try again.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Too many failed attempts. Please try again later.');
      } else if (code === 'auth/network-request-failed' || error.message?.includes('timed out')) {
        setErrorMsg('Network error. Please check your internet connection.');
      } else {
        setErrorMsg(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg('');
    setInfoMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address first.');
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email.trim());
      setInfoMsg('✉️ Password reset email sent! Please check your Inbox or Spam folder.');
    } catch (error: any) {
      console.error('Forgot password error:', error);

      if (error.code === 'auth/user-not-found') {
        setErrorMsg('No account found with this email address.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else {
        setErrorMsg(error.message || 'Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-page flex flex-col px-6 py-12 relative overflow-hidden transition-colors duration-300">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-20%] w-64 h-64 bg-brand-green/30 dark:bg-brand-green/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-20%] w-64 h-64 bg-amber-500/20 dark:bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Logo */}
      <div className="flex flex-col items-center mt-12 mb-10 relative z-10">
        <div className="w-20 h-20 bg-gradient-to-br from-brand-green to-brand-green-gradient rounded-[24px] flex items-center justify-center shadow-lg shadow-brand-green/30 mb-6 border-4 border-white/50 dark:border-gray-800/50">
          <CheckCircle2 size={40} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="font-sora font-bold text-[32px] text-text-primary dark:text-white tracking-tight">
          BillScan
        </h1>
        <p className="font-dm text-[15px] text-text-secondary dark:text-gray-400 mt-2 text-center font-medium">
          Your AI-powered financial assistant
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4 relative z-10 flex-1">

        {/* Error banner */}
        {errorMsg !== '' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/50 rounded-2xl px-4 py-3.5 shadow-sm"
          >
            <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="font-dm text-[14px] text-red-700 dark:text-red-400 font-medium leading-snug">{errorMsg}</p>
          </motion.div>
        )}

        {/* Info banner */}
        {infoMsg !== '' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 bg-brand-green/10 dark:bg-brand-green/5 border border-brand-green/20 dark:border-brand-green/10 rounded-2xl px-4 py-3.5 shadow-sm"
          >
            <CheckCircle2 size={18} className="text-brand-green mt-0.5 flex-shrink-0" />
            <p className="font-dm text-[14px] text-brand-green-dark dark:text-brand-green font-medium leading-snug">{infoMsg}</p>
          </motion.div>
        )}

        {/* Email */}
        <div>
          <label className="block font-dm text-[13px] font-bold text-text-secondary dark:text-gray-400 mb-2 ml-1 tracking-wide">
            EMAIL ADDRESS
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail size={20} className="text-text-tertiary dark:text-gray-500" />
            </div>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
              placeholder="Enter your email"
              className="w-full h-[56px] glass-effect rounded-2xl pl-12 pr-4 font-dm text-[15px] text-text-primary dark:text-white placeholder:text-text-tertiary dark:placeholder:text-gray-500 border border-gray-200 dark:border-white/10 focus:border-brand-green focus:ring-1 focus:ring-brand-green focus:outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block font-dm text-[13px] font-bold text-text-secondary dark:text-gray-400 mb-2 ml-1 tracking-wide">
            PASSWORD
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={20} className="text-text-tertiary dark:text-gray-500" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
              placeholder="Enter your password"
              className="w-full h-[56px] glass-effect rounded-2xl pl-12 pr-12 font-dm text-[15px] text-text-primary dark:text-white placeholder:text-text-tertiary dark:placeholder:text-gray-500 border border-gray-200 dark:border-white/10 focus:border-brand-green focus:ring-1 focus:ring-brand-green focus:outline-none transition-all shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-tertiary dark:text-gray-500 hover:text-text-secondary dark:hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="font-dm text-[13px] text-brand-green font-bold tracking-wide hover:opacity-80 transition-opacity"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-auto pb-8 space-y-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-[60px] bg-gradient-to-r from-brand-green to-brand-green-gradient rounded-[20px] flex items-center justify-center text-white font-sora font-bold text-[16px] shadow-lg shadow-brand-green/30 disabled:opacity-80 transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2.5">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Logging in…
              </span>
            ) : 'Login'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onSignUp}
            className="w-full h-[60px] glass-effect rounded-[20px] flex items-center justify-center text-text-primary dark:text-white font-sora font-bold text-[16px] shadow-sm hover:bg-white dark:hover:bg-dark-card transition-colors"
          >
            Create an Account
          </motion.button>
        </div>
      </div>
    </div>
  );
}