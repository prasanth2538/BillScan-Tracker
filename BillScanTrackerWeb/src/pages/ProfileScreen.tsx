import { useEffect, useState } from "react";
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
        className="w-full bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <KeyRound size={20} className="text-brand-green" />
            <h2 className="font-sora font-semibold text-[17px] text-text-primary dark:text-white">
              Change Password
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted dark:bg-gray-800 flex items-center justify-center"
          >
            <X size={16} className="text-text-secondary dark:text-gray-300" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="font-dm text-[13px] text-red-600 dark:text-red-300">
              {error}
            </p>
          </div>
        )}

        <label className="font-dm text-[12px] text-text-secondary dark:text-gray-300">
          Old Password
        </label>
        <div className="relative mt-1 mb-3">
          <input
            type={showOld ? "text" : "password"}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Enter old password"
            className="w-full h-12 bg-muted dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-xl px-4 pr-11 outline-none font-dm text-[14px]"
          />
          <button
            type="button"
            onClick={() => setShowOld(!showOld)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary dark:text-gray-400"
          >
            {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <label className="font-dm text-[12px] text-text-secondary dark:text-gray-300">
          New Password
        </label>
        <div className="relative mt-1 mb-3">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full h-12 bg-muted dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-xl px-4 pr-11 outline-none font-dm text-[14px]"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary dark:text-gray-400"
          >
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <label className="font-dm text-[12px] text-text-secondary dark:text-gray-300">
          Confirm New Password
        </label>
        <div className="relative mt-1 mb-5">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            placeholder="Re-enter new password"
            className="w-full h-12 bg-muted dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 rounded-xl px-4 pr-11 outline-none font-dm text-[14px]"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary dark:text-gray-400"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-12 bg-brand-green text-white rounded-xl font-sora font-semibold disabled:opacity-70"
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
        className="w-full bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl max-w-sm"
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-brand-green" />
            <h2 className="font-sora font-semibold text-[17px] text-text-primary dark:text-white">
              Privacy & Security
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted dark:bg-gray-800 flex items-center justify-center"
          >
            <X size={16} className="text-text-secondary dark:text-gray-300" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="font-dm text-[12px] text-text-secondary dark:text-gray-300 block mb-2">
              Auto-Logout After (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={autoLogoutMinutes}
              onChange={(e) => setAutoLogoutMinutes(Math.max(5, Number(e.target.value)))}
              className="w-full h-12 bg-muted dark:bg-gray-800 dark:text-white rounded-xl px-4 outline-none font-dm text-[14px]"
            />
            <p className="font-dm text-[11px] text-text-tertiary dark:text-gray-400 mt-2">
              You'll be automatically logged out after {autoLogoutMinutes} minutes of inactivity
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4">
            <p className="font-dm text-[12px] text-blue-700 dark:text-blue-300">
              🔒 <strong>Security Info:</strong> Your data is encrypted end-to-end. Session timeout protection is always enabled.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="w-full h-12 bg-brand-green text-white rounded-xl font-sora font-semibold"
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

  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});

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
        if (data.categoryBudgets) {
          const cb: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.categoryBudgets)) {
            cb[k] = v ? String(v) : "";
          }
          setCategoryBudgets(cb);
        }
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

      const cbNums: Record<string, number> = {};
      for (const [k, v] of Object.entries(categoryBudgets)) {
        if (v && Number(v) > 0) {
          cbNums[k] = Number(v);
        }
      }

      await updateUserProfile({
        name: profile.name,
        monthlyIncome: income,
        monthlyBudget: budget,
        categoryBudgets: cbNums,
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
      <div className="w-full h-full bg-page dark:bg-gray-950 overflow-y-auto pb-24 scrollbar-hide transition-colors duration-300">
        <div className="bg-white dark:bg-gray-900 rounded-b-[24px] pt-16 pb-6 px-4 shadow-sm flex flex-col items-center relative z-10 transition-colors duration-300">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-green to-brand-green-gradient flex items-center justify-center shadow-lg mb-3">
            <span className="font-sora font-bold text-[28px] text-white">
              {initials}
            </span>
          </div>

          <h1 className="font-sora font-semibold text-[18px] text-text-primary dark:text-white">
            {loading ? "Loading..." : profile.name || "User"}
          </h1>

          <p className="font-dm text-[14px] text-text-secondary dark:text-gray-300 mt-1">
            {profile.email}
          </p>

          <div className="w-full flex justify-between mt-6 pt-6 border-t border-black/5 dark:border-white/10">
            <div className="flex flex-col items-center flex-1">
              <span className="font-dm text-[11px] text-text-tertiary dark:text-gray-400 mb-1">
                Income
              </span>
              <span className="font-mono font-semibold text-[18px] text-text-primary dark:text-white">
                ₹{Number(profile.monthlyIncome || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="w-px h-10 bg-black/5 dark:bg-white/10" />

            <div className="flex flex-col items-center flex-1">
              <span className="font-dm text-[11px] text-text-tertiary dark:text-gray-400 mb-1">
                Budget
              </span>
              <span className="font-mono font-semibold text-[18px] text-brand-green">
                ₹{Number(profile.monthlyBudget || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-card p-5 shadow-card transition-colors duration-300"
        >
          <h3 className="font-sora font-semibold text-[16px] text-text-primary dark:text-white mb-4">
            Profile Details
          </h3>

          <label className="font-dm text-[12px] text-text-secondary dark:text-gray-300">
            Name
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full h-12 bg-muted dark:bg-gray-800 dark:text-white rounded-xl px-4 mt-1 mb-3 outline-none"
          />

          <label className="font-dm text-[12px] text-text-secondary dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            readOnly
            className="w-full h-12 bg-muted dark:bg-gray-800 dark:text-white rounded-xl px-4 mt-1 mb-3 outline-none opacity-70"
          />

          <label className="font-dm text-[12px] text-text-secondary dark:text-gray-300">
            Monthly Income
          </label>
          <input
            type="number"
            value={profile.monthlyIncome}
            onChange={(e) =>
              setProfile({ ...profile, monthlyIncome: e.target.value })
            }
            className="w-full h-12 bg-muted dark:bg-gray-800 dark:text-white rounded-xl px-4 mt-1 mb-3 outline-none"
          />

          <label className="font-dm text-[12px] text-text-secondary dark:text-gray-300">
            Monthly Budget
          </label>
          <input
            type="number"
            value={profile.monthlyBudget}
            onChange={(e) =>
              setProfile({ ...profile, monthlyBudget: e.target.value })
            }
            className="w-full h-12 bg-muted dark:bg-gray-800 dark:text-white rounded-xl px-4 mt-1 mb-4 outline-none"
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 bg-brand-green text-white rounded-xl font-sora font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </motion.div>

        {/* Smart Budget Assistant ⭐⭐⭐⭐⭐ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-card p-5 shadow-card transition-colors duration-300"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-sora font-semibold text-[16px] text-text-primary dark:text-white flex items-center gap-2">
              ⭐ Smart Budget Assistant
            </h3>
          </div>
          <p className="font-dm text-[12px] text-text-secondary dark:text-gray-400 mb-4">
            Set custom budget amounts for each category to get smart usage alerts.
          </p>

          <div className="space-y-3">
            {[
              { label: "Food", emoji: "🍽️" },
              { label: "Grocery", emoji: "🛒" },
              { label: "Petrol", emoji: "⛽" },
              { label: "Travel", emoji: "🚌" },
              { label: "Hotel", emoji: "🏨" },
              { label: "Health", emoji: "🏥" },
              { label: "Shopping", emoji: "🛍️" },
              { label: "Entertainment", emoji: "🎬" },
              { label: "Education", emoji: "🎓" },
              { label: "Bills", emoji: "💡" },
              { label: "Other", emoji: "📄" },
            ].map((cat) => (
              <div key={cat.label} className="flex items-center justify-between gap-3">
                <span className="font-dm text-[14px] text-text-primary dark:text-white flex items-center gap-2 min-w-[130px]">
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </span>
                <div className="relative flex-1 max-w-[180px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-gray-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={categoryBudgets[cat.label] || ""}
                    onChange={(e) =>
                      setCategoryBudgets({
                        ...categoryBudgets,
                        [cat.label]: e.target.value,
                      })
                    }
                    placeholder="Enter amount"
                    className="w-full h-10 bg-muted dark:bg-gray-800 dark:text-white rounded-xl pl-7 pr-3 outline-none font-mono text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-5 h-11 bg-brand-green/10 text-brand-green hover:bg-brand-green/20 rounded-xl font-sora font-semibold text-[14px] transition-colors"
          >
            {saving ? "Saving..." : "Save Category Budgets"}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-card shadow-card overflow-hidden transition-colors duration-300"
        >
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-muted dark:bg-gray-800 flex items-center justify-center text-text-secondary dark:text-gray-300">
              <KeyRound size={18} />
            </div>

            <span className="flex-1 text-left font-dm text-[14px] text-text-primary dark:text-white">
              Change Password
            </span>

            <ChevronRight size={16} className="text-text-tertiary dark:text-gray-400" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-card shadow-card overflow-hidden transition-colors duration-300"
        >
          {settings.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/50 dark:hover:bg-gray-800/50 transition-colors ${
                  index !== settings.length - 1
                    ? "border-b border-black/5 dark:border-white/10"
                    : ""
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-muted dark:bg-gray-800 flex items-center justify-center text-text-secondary dark:text-gray-300">
                  <Icon size={18} />
                </div>

                <span className="flex-1 text-left font-dm text-[14px] text-text-primary dark:text-white">
                  {item.label}
                </span>

                {item.component ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    {item.component}
                  </div>
                ) : (
                  <>
                    <span className="font-dm text-[12px] text-text-tertiary dark:text-gray-400">
                      {item.value}
                    </span>
                    <ChevronRight
                      size={16}
                      className="text-text-tertiary dark:text-gray-400"
                    />
                  </>
                )}
              </button>
            );
          })}
        </motion.div>

        <div className="mx-4 mt-4">
          <button
            onClick={onSignOut}
            className="w-full h-12 bg-danger-light dark:bg-red-950 text-danger dark:text-red-300 rounded-xl font-sora font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <LogOut size={18} />
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