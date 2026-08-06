import { useState } from 'react';
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
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [infoMsg, setInfoMsg]         = useState('');

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

    if (!email || !email.trim()) {
      setErrorMsg('enter mail to reset password');
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email.trim());
      setErrorMsg('');
      setInfoMsg('the reset link is sent to mail');
    } catch (error: any) {
      console.error('Forgot password error:', error);

      if (error.code === 'auth/user-not-found') {
        setErrorMsg('No account found with this email.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMsg('Invalid email address.');
      } else {
        setErrorMsg(error.message || 'Failed to send reset email.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-page flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-20%] w-64 h-64 bg-brand-green-light rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-20%] w-64 h-64 bg-amber-light rounded-full blur-3xl opacity-60 pointer-events-none" />

      {/* Centered Card Container */}
      <div className="w-full max-w-[420px] bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-[28px] p-6 sm:p-8 shadow-xl dark:shadow-2xl/40 flex flex-col relative z-10 my-auto">
        {/* Logo */}
        <div className="flex flex-col items-center mt-2 mb-6">
          <div className="w-14 h-14 bg-brand-green rounded-2xl flex items-center justify-center shadow-lg shadow-brand-green/30 mb-3">
            <CheckCircle2 size={28} className="text-white" />
          </div>
          <h1 className="font-sora font-bold text-[24px] text-text-primary dark:text-white">BillScan Tracker</h1>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="flex flex-col gap-4">

          {/* Error banner */}
          {errorMsg !== '' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[14px] px-4 py-3"
            >
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="font-dm text-[13px] text-red-600 dark:text-red-300 leading-snug">{errorMsg}</p>
            </motion.div>
          )}

          {/* Info banner */}
          {infoMsg !== '' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 bg-green-50 dark:bg-emerald-950/40 border border-green-200 dark:border-emerald-800 rounded-[14px] px-4 py-3"
            >
              <CheckCircle2 size={16} className="text-brand-green mt-0.5 flex-shrink-0" />
              <p className="font-dm text-[13px] text-green-700 dark:text-emerald-300 leading-snug">{infoMsg}</p>
            </motion.div>
          )}

          {/* Email */}
          <div>
            <label className="block font-dm text-[12px] font-medium text-text-secondary dark:text-gray-300 mb-1.5 ml-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail size={18} className="text-text-tertiary dark:text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                placeholder="Enter your email"
                className="w-full h-[48px] bg-gray-50 dark:bg-white/10 rounded-[14px] pl-11 pr-4 font-dm text-[14px] text-text-primary dark:text-white placeholder:text-text-tertiary dark:placeholder:text-gray-500 border border-black/5 dark:border-white/10 focus:border-brand-green focus:ring-1 focus:ring-brand-green focus:outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block font-dm text-[12px] font-medium text-text-secondary dark:text-gray-300 mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock size={18} className="text-text-tertiary dark:text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
                placeholder="Enter your password"
                className="w-full h-[48px] bg-gray-50 dark:bg-white/10 rounded-[14px] pl-11 pr-11 font-dm text-[14px] text-text-primary dark:text-white placeholder:text-text-tertiary dark:placeholder:text-gray-500 border border-black/5 dark:border-white/10 focus:border-brand-green focus:ring-1 focus:ring-brand-green focus:outline-none transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-tertiary dark:text-gray-400 hover:text-text-primary dark:hover:text-white focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-dm text-[12px] text-brand-green font-medium hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-3 space-y-2.5">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-brand-green rounded-[14px] flex items-center justify-center text-white font-sora font-semibold text-[15px] shadow-lg shadow-brand-green/30 disabled:opacity-80 transition-all hover:bg-emerald-600"
            >
              {loading ? (
                <span className="flex items-center gap-2">
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
              className="w-full h-[48px] bg-gray-100 dark:bg-white/10 border border-black/5 dark:border-white/10 rounded-[14px] flex items-center justify-center text-text-primary dark:text-white font-sora font-semibold text-[15px] hover:bg-gray-200 dark:hover:bg-white/15 transition-all shadow-sm"
            >
              Sign Up
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}