import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { resetPasswordWithCode } from '../services/authService';

interface ResetPasswordScreenProps {
  oobCode: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function ResetPasswordScreen({ oobCode, onComplete, onCancel }: ResetPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!password || !confirmPassword) {
      setErrorMsg('Please enter and confirm your new password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await resetPasswordWithCode(oobCode, password);
      setSuccessMsg('Password has been reset successfully! You can now login with your new password.');
      setTimeout(() => {
        onComplete();
      }, 2500);
    } catch (error: any) {
      console.error('Reset password error:', error);
      const code = error?.code || '';
      if (code === 'auth/expired-action-code') {
        setErrorMsg('The reset link has expired. Please request a new password reset email.');
      } else if (code === 'auth/invalid-action-code') {
        setErrorMsg('The reset link is invalid or has already been used.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters.');
      } else {
        setErrorMsg(error.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-page flex flex-col px-6 py-12 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-20%] w-64 h-64 bg-brand-green-light rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-[-10%] left-[-20%] w-64 h-64 bg-amber-light rounded-full blur-3xl opacity-60" />

      {/* Header */}
      <div className="flex flex-col items-center mt-8 mb-8 relative z-10">
        <div className="w-16 h-16 bg-brand-green rounded-2xl flex items-center justify-center shadow-lg shadow-brand-green/30 mb-4">
          <KeyRound size={32} className="text-white" />
        </div>
        <h1 className="font-sora font-bold text-[26px] text-text-primary">Reset Password</h1>
        <p className="font-dm text-[14px] text-text-secondary mt-2 text-center">
          Enter your new password below. You must confirm it twice.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10 flex-1">
        {/* Error banner */}
        {errorMsg !== '' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-[12px] px-4 py-3"
          >
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="font-dm text-[13px] text-red-600 leading-snug">{errorMsg}</p>
          </motion.div>
        )}

        {/* Success banner */}
        {successMsg !== '' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-[12px] px-4 py-3"
          >
            <CheckCircle2 size={16} className="text-brand-green mt-0.5 flex-shrink-0" />
            <p className="font-dm text-[13px] text-green-700 leading-snug">{successMsg}</p>
          </motion.div>
        )}

        {/* New Password */}
        <div>
          <label className="block font-dm text-[12px] font-medium text-text-secondary mb-1.5 ml-1">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock size={18} className="text-text-tertiary" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Enter new password (min 6 chars)"
              className="w-full h-[52px] bg-white rounded-input pl-11 pr-11 font-dm text-[14px] text-text-primary placeholder:text-text-tertiary border border-black/5 focus:border-brand-green focus:ring-1 focus:ring-brand-green focus:outline-none transition-all shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-tertiary hover:text-text-primary focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block font-dm text-[12px] font-medium text-text-secondary mb-1.5 ml-1">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock size={18} className="text-text-tertiary" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Re-enter new password"
              className="w-full h-[52px] bg-white rounded-input pl-11 pr-11 font-dm text-[14px] text-text-primary placeholder:text-text-tertiary border border-black/5 focus:border-brand-green focus:ring-1 focus:ring-brand-green focus:outline-none transition-all shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-tertiary hover:text-text-primary focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="text-xs text-red-500 mt-1.5 ml-1">Passwords do not match.</p>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-auto pb-8 space-y-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || successMsg !== ''}
            className="w-full h-[56px] bg-brand-green rounded-[14px] flex items-center justify-center text-white font-sora font-semibold text-[16px] shadow-lg shadow-brand-green/30 disabled:opacity-80"
          >
            {loading ? 'Resetting Password…' : 'Reset Password'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onCancel}
            className="w-full h-[56px] bg-white border border-black/10 rounded-[14px] flex items-center justify-center text-text-primary font-sora font-semibold text-[16px] shadow-sm"
          >
            Back to Login
          </motion.button>
        </div>
      </form>
    </div>
  );
}
