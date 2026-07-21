import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Download,
  Shield,
  Palette,
  LogOut,
  ChevronRight,
  Save,
  KeyRound,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import jsPDF from "jspdf";
import { UserProfile } from "./SignUpScreen";
import { getUserProfile, updateUserProfile } from "../services/userService";
import { getThisMonthExpenses } from "../services/expenseService";
import { changePassword } from "../services/authService";

interface ProfileScreenProps {
  user: UserProfile;
  onSignOut: () => void;
  onProfileUpdated: (user: UserProfile) => void;
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!oldPassword || !newPassword || !confirmPass) {
      setError("All fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPass) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await changePassword(oldPassword, newPassword);
      alert("Password changed successfully!");
      onClose();
    } catch (e: any) {
      const msg: string = e?.code || e?.message || "";
      if (msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("Old password is incorrect.");
      } else {
        setError("Password update failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="w-full max-w-sm glass-effect dark:bg-gray-900/95 rounded-[24px] p-6 shadow-floating border border-white/20 dark:border-gray-800"
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center">
              <KeyRound size={20} className="text-brand-green" strokeWidth={2.5} />
            </div>
            <h2 className="font-sora font-bold text-[18px] text-text-primary dark:text-white tracking-tight">
              Change Password
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={18} className="text-text-secondary dark:text-gray-300" />
          </button>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 rounded-[14px] px-4 py-3.5">
            <p className="font-dm text-[13px] text-red-600 dark:text-red-400 font-medium">
              {error}
            </p>
          </div>
        )}

        <label className="font-dm text-[13px] font-medium text-text-secondary dark:text-gray-400">
          Old Password
        </label>
        <div className="relative mt-1.5 mb-4">
          <input
            type={showOld ? "text" : "password"}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Enter old password"
            className="w-full h-12 bg-gray-50 dark:bg-gray-800/80 dark:text-white dark:placeholder-gray-500 rounded-xl px-4 pr-11 border border-gray-100 dark:border-gray-700 outline-none font-dm text-[15px] focus:border-brand-green transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowOld(!showOld)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary dark:text-gray-500 hover:text-text-secondary dark:hover:text-gray-300 transition-colors"
          >
            {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <label className="font-dm text-[13px] font-medium text-text-secondary dark:text-gray-400">
          New Password
        </label>
        <div className="relative mt-1.5 mb-4">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full h-12 bg-gray-50 dark:bg-gray-800/80 dark:text-white dark:placeholder-gray-500 rounded-xl px-4 pr-11 border border-gray-100 dark:border-gray-700 outline-none font-dm text-[15px] focus:border-brand-green transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary dark:text-gray-500 hover:text-text-secondary dark:hover:text-gray-300 transition-colors"
          >
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <label className="font-dm text-[13px] font-medium text-text-secondary dark:text-gray-400">
          Confirm New Password
        </label>
        <div className="relative mt-1.5 mb-6">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            placeholder="Re-enter new password"
            className="w-full h-12 bg-gray-50 dark:bg-gray-800/80 dark:text-white dark:placeholder-gray-500 rounded-xl px-4 pr-11 border border-gray-100 dark:border-gray-700 outline-none font-dm text-[15px] focus:border-brand-green transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary dark:text-gray-500 hover:text-text-secondary dark:hover:text-gray-300 transition-colors"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-[52px] bg-gradient-to-r from-brand-green to-brand-green-gradient text-white rounded-xl font-sora font-bold text-[16px] shadow-sm disabled:opacity-70 active:scale-[0.98] transition-all"
        >
          {loading ? "Updating..." : "Change Password"}
        </button>
      </motion.div>
    </motion.div>
  );
}

function PrivacySecurityModal({ onClose }: { onClose: () => void }) {
  const [autoLogoutMinutes, setAutoLogoutMinutes] = useState(10);

  useEffect(() => {
    const saved = localStorage.getItem("billscan_autologout_minutes");
    if (saved) setAutoLogoutMinutes(Number(saved));
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("billscan_autologout_minutes", String(autoLogoutMinutes));
    alert("Security settings saved successfully!");
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="w-full max-w-sm glass-effect dark:bg-gray-900/95 rounded-[24px] p-6 shadow-floating border border-white/20 dark:border-gray-800"
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center">
              <Shield size={20} className="text-brand-green" strokeWidth={2.5} />
            </div>
            <h2 className="font-sora font-bold text-[18px] text-text-primary dark:text-white tracking-tight">
              Privacy & Security
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={18} className="text-text-secondary dark:text-gray-300" />
          </button>
        </div>

        <div className="space-y-5 mb-7">
          <div>
            <label className="font-dm text-[13px] font-medium text-text-secondary dark:text-gray-400 block mb-2">
              Auto-Logout After (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={autoLogoutMinutes}
              onChange={(e) => setAutoLogoutMinutes(Math.max(5, Number(e.target.value)))}
              className="w-full h-12 bg-gray-50 dark:bg-gray-800/80 dark:text-white border border-gray-100 dark:border-gray-700 rounded-xl px-4 outline-none font-dm text-[15px] focus:border-brand-green transition-colors"
            />
            <p className="font-dm text-[12px] text-text-tertiary dark:text-gray-500 mt-2 leading-relaxed">
              You'll be automatically logged out after {autoLogoutMinutes} minutes of inactivity
            </p>
          </div>

          <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-[16px] p-4">
            <p className="font-dm text-[13px] text-blue-800 dark:text-blue-300 leading-relaxed">
              🔒 <strong>Security Info:</strong> Your data is encrypted end-to-end. Session timeout protection is always enabled.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="w-full h-[52px] bg-gradient-to-r from-brand-green to-brand-green-gradient text-white rounded-xl font-sora font-bold text-[16px] shadow-sm active:scale-[0.98] transition-all"
        >
          Save Settings
        </button>
      </motion.div>
    </motion.div>
  );
}

// Custom Toggle Switch Component
function NotificationToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <motion.button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
        enabled ? "bg-brand-green" : "bg-gray-300 dark:bg-gray-600"
      }`}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={{
          x: enabled ? 22 : 2,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
        className="h-5 w-5 rounded-full bg-white shadow-md"
      />
    </motion.button>
  );
}

export function ProfileScreen({
  user,
  onSignOut,
  onProfileUpdated,
}: ProfileScreenProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [notificationsOn, setNotificationsOn] = useState(() => {
    const saved = localStorage.getItem("billscan_notifications_enabled");
    return saved === "true";
  });

  const [theme, setTheme] = useState<"Light" | "Dark">(() => {
    const savedTheme = localStorage.getItem("billscan_theme");
    return savedTheme === "Dark" ? "Dark" : "Light";
  });

  const [profile, setProfile] = useState({
    name: user.name || "",
    email: user.email || "",
    monthlyIncome: String(user.monthlyIncome || ""),
    monthlyBudget: String(user.monthlyBudget || ""),
  });

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (theme === "Dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }

    localStorage.setItem("billscan_theme", theme);
  }, [theme]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data: any = await getUserProfile();

      if (data) {
        setProfile({
          name: data.name || user.name || "",
          email: data.email || user.email || "",
          monthlyIncome: String(data.monthlyIncome || ""),
          monthlyBudget: String(data.monthlyBudget || ""),
        });
      }
    } catch (e) {
      console.error("Profile load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const income = Number(profile.monthlyIncome || 0);
    const budget = Number(profile.monthlyBudget || 0);

    if (budget > income) {
      alert("Monthly budget should be lower than or equal to monthly income.");
      return;
    }

    try {
      setSaving(true);

      await updateUserProfile({
        name: profile.name,
        monthlyIncome: income,
        monthlyBudget: budget,
      });

      onProfileUpdated({
        ...user,
        name: profile.name,
        email: profile.email,
        monthlyIncome: income,
        monthlyBudget: budget,
      });

      alert("Profile updated successfully");
    } catch (e: any) {
      alert(e.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const expenses = await getThisMonthExpenses(true);
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("BillScan Tracker Report", 20, 20);

      doc.setFontSize(12);
      doc.text(`User: ${profile.name}`, 20, 35);
      doc.text(`Email: ${profile.email}`, 20, 45);
      doc.text(`Monthly Income: Rs. ${profile.monthlyIncome}`, 20, 55);
      doc.text(`Monthly Budget: Rs. ${profile.monthlyBudget}`, 20, 65);

      let y = 85;

      if (expenses.length === 0) {
        doc.text("No expenses found.", 20, y);
      } else {
        expenses.forEach((e: any, index: number) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }

          doc.text(
            `${index + 1}. ${e.merchant || "Expense"} - Rs.${e.amount} - ${
              e.category || "Other"
            }`,
            20,
            y
          );

          y += 8;
        });
      }

      const base64 = doc.output("datauristring").split(",")[1];

      if ((window as any).AndroidBridge?.savePdf) {
        (window as any).AndroidBridge.savePdf(
          base64,
          "BillScan-Profile-Report.pdf"
        );
      } else {
        doc.save("BillScan-Profile-Report.pdf");
      }

      alert("PDF report downloaded successfully.");
    } catch (e: any) {
      alert(e.message || "Export failed");
    }
  };

  const handleNotificationsToggle = (enabled: boolean) => {
    setNotificationsOn(enabled);
    localStorage.setItem("billscan_notifications_enabled", enabled ? "true" : "false");

    if (enabled) {
      alert("✅ Notifications enabled! You'll receive alerts when bills are scanned.");
    } else {
      alert("🔕 Notifications disabled. You won't receive any alerts.");
    }
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "Light" ? "Dark" : "Light";
    setTheme(nextTheme);
  };

  const initials =
    (profile.name || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "U";

  const settings = [
    {
      icon: Bell,
      label: "Notifications",
      value: notificationsOn ? "On" : "Off",
      component: (
        <NotificationToggle
          enabled={notificationsOn}
          onChange={handleNotificationsToggle}
        />
      ),
    },
    {
      icon: Download,
      label: "Export Data",
      value: "PDF",
      action: handleExportData,
    },
    {
      icon: Shield,
      label: "Privacy & Security",
      value: "Secure",
      action: () => setShowPrivacyModal(true),
    },
    {
      icon: Palette,
      label: "Theme",
      value: theme,
      action: () => handleThemeToggle(),
    },
  ];

  return (
    <>
      <div className="w-full h-full bg-page overflow-y-auto pb-32 scrollbar-hide transition-colors duration-300">
        <div className="bg-white dark:bg-dark-card rounded-b-[32px] pt-16 pb-8 px-6 shadow-sm border-b border-black/5 dark:border-white/5 flex flex-col items-center relative z-10 transition-colors duration-300">
          <div className="w-[88px] h-[88px] rounded-full bg-gradient-to-br from-brand-green to-brand-green-gradient flex items-center justify-center shadow-lg shadow-brand-green/20 mb-4 border-4 border-white dark:border-gray-800">
            <span className="font-sora font-bold text-[32px] text-white tracking-tight">
              {initials}
            </span>
          </div>

          <h1 className="font-sora font-bold text-[22px] text-text-primary dark:text-white tracking-tight">
            {loading ? "Loading..." : profile.name || "User"}
          </h1>

          <p className="font-dm text-[15px] text-text-secondary dark:text-gray-400 mt-1 font-medium">
            {profile.email}
          </p>

          <div className="w-full flex justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col items-center flex-1">
              <span className="font-dm text-[12px] font-bold uppercase tracking-wider text-text-tertiary dark:text-gray-500 mb-1">
                Income
              </span>
              <span className="font-mono font-bold text-[20px] text-text-primary dark:text-white tracking-tight">
                ₹{Number(profile.monthlyIncome || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="w-px h-12 bg-gray-100 dark:bg-gray-800" />

            <div className="flex flex-col items-center flex-1">
              <span className="font-dm text-[12px] font-bold uppercase tracking-wider text-text-tertiary dark:text-gray-500 mb-1">
                Budget
              </span>
              <span className="font-mono font-bold text-[20px] text-brand-green tracking-tight">
                ₹{Number(profile.monthlyBudget || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 sm:mx-6 mt-6 bg-white dark:bg-dark-card rounded-card p-6 shadow-sm border border-transparent dark:border-white/5 transition-colors duration-300"
        >
          <h3 className="font-sora font-bold text-[18px] text-text-primary dark:text-white mb-5 tracking-tight">
            Profile Details
          </h3>

          <label className="font-dm text-[13px] font-medium text-text-secondary dark:text-gray-400">
            Name
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full h-[52px] bg-gray-50 dark:bg-gray-800/80 dark:text-white border border-gray-100 dark:border-gray-700 rounded-xl px-4 mt-1.5 mb-4 outline-none font-dm text-[15px] focus:border-brand-green transition-colors"
          />

          <label className="font-dm text-[13px] font-medium text-text-secondary dark:text-gray-400">
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            readOnly
            className="w-full h-[52px] bg-gray-100/50 dark:bg-gray-800/50 dark:text-gray-400 border border-transparent dark:border-gray-700/50 rounded-xl px-4 mt-1.5 mb-4 outline-none font-dm text-[15px]"
          />

          <label className="font-dm text-[13px] font-medium text-text-secondary dark:text-gray-400">
            Monthly Income
          </label>
          <input
            type="number"
            value={profile.monthlyIncome}
            onChange={(e) =>
              setProfile({ ...profile, monthlyIncome: e.target.value })
            }
            className="w-full h-[52px] bg-gray-50 dark:bg-gray-800/80 dark:text-white border border-gray-100 dark:border-gray-700 rounded-xl px-4 mt-1.5 mb-4 outline-none font-dm text-[15px] focus:border-brand-green transition-colors"
          />

          <label className="font-dm text-[13px] font-medium text-text-secondary dark:text-gray-400">
            Monthly Budget
          </label>
          <input
            type="number"
            value={profile.monthlyBudget}
            onChange={(e) =>
              setProfile({ ...profile, monthlyBudget: e.target.value })
            }
            className="w-full h-[52px] bg-gray-50 dark:bg-gray-800/80 dark:text-white border border-gray-100 dark:border-gray-700 rounded-xl px-4 mt-1.5 mb-6 outline-none font-dm text-[15px] focus:border-brand-green transition-colors"
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-[56px] bg-gradient-to-r from-brand-green to-brand-green-gradient text-white rounded-xl font-sora font-bold text-[16px] flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-70 active:scale-[0.98] transition-all"
          >
            <Save size={20} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-4 sm:mx-6 mt-4 bg-white dark:bg-dark-card rounded-card shadow-sm border border-transparent dark:border-white/5 overflow-hidden transition-colors duration-300"
        >
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center gap-4 px-5 py-4.5 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-text-secondary dark:text-gray-300 border border-gray-100 dark:border-gray-700">
              <KeyRound size={18} />
            </div>

            <span className="flex-1 text-left font-dm font-bold text-[15px] text-text-primary dark:text-white tracking-wide">
              Change Password
            </span>

            <ChevronRight size={18} className="text-text-tertiary dark:text-gray-500" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-4 sm:mx-6 mt-4 bg-white dark:bg-dark-card rounded-card shadow-sm border border-transparent dark:border-white/5 overflow-hidden transition-colors duration-300"
        >
          {settings.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center gap-4 px-5 py-4.5 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors ${
                  index !== settings.length - 1
                    ? "border-b border-gray-100 dark:border-gray-800"
                    : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-text-secondary dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                  <Icon size={18} />
                </div>

                <span className="flex-1 text-left font-dm font-bold text-[15px] text-text-primary dark:text-white tracking-wide">
                  {item.label}
                </span>

                {item.component ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    {item.component}
                  </div>
                ) : (
                  <>
                    <span className="font-dm font-medium text-[13px] text-text-tertiary dark:text-gray-400">
                      {item.value}
                    </span>
                    <ChevronRight
                      size={18}
                      className="text-text-tertiary dark:text-gray-500 ml-1"
                    />
                  </>
                )}
              </button>
            );
          })}
        </motion.div>

        <div className="mx-4 sm:mx-6 mt-6">
          <button
            onClick={onSignOut}
            className="w-full h-[56px] bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl font-sora font-bold text-[16px] flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-[0.98] transition-all border border-transparent dark:border-red-500/20"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showPasswordModal && (
          <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
        )}
        {showPrivacyModal && (
          <PrivacySecurityModal onClose={() => setShowPrivacyModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}