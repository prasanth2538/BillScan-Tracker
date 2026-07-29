import { useEffect, useState, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { HomeScreen } from "./pages/HomeScreen";
import { ScanScreen } from "./pages/ScanScreen";
import { ExpenseListScreen } from "./pages/ExpenseListScreen";
import { ReportsScreen } from "./pages/ReportsScreen";
import { ProfileScreen } from "./pages/ProfileScreen";
import { BillDetailScreen } from "./pages/BillDetailScreen";
import { BottomNav } from "./components/BottomNav";
import { Toast } from "./components/Toast";
import { Expense } from "./components/ExpenseCard";
import { LoginScreen } from "./pages/LoginScreen";
import { SignUpScreen, UserProfile } from "./pages/SignUpScreen";
import { ResetPasswordScreen } from "./pages/ResetPasswordScreen";
import { getUserProfile } from "./services/userService";
import { logoutUser } from "./services/authService";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

type Screen =
  | "login"
  | "signup"
  | "reset-password"
  | "home"
  | "expenses"
  | "reports"
  | "profile"
  | "scan";

const ROOT_SCREENS: Screen[] = ["login", "home"];

const savedTheme = localStorage.getItem("billscan_theme");
if (savedTheme === "Dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

export function App() {
  const [screenStack, setScreenStack] = useState<Screen[]>(["login"]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Expense saved!");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [resetCode, setResetCode] = useState<string | null>(null);

  const activeScreen = screenStack[screenStack.length - 1];
  const logoutTimer = useRef<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oobCode = urlParams.get("oobCode");
    const mode = urlParams.get("mode");

    if (oobCode && (mode === "resetPassword" || !mode)) {
      setResetCode(oobCode);
      setScreenStack(["reset-password"]);
    }
  }, []);

  const clearResetCode = () => {
    setResetCode(null);
    const newUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
    setScreenStack(["login"]);
  };

  const navigateTo = (screen: Screen) => {
    setScreenStack((prev) => {
      if (prev[prev.length - 1] === screen) return prev;
      if (ROOT_SCREENS.includes(screen)) return [screen];
      return [...prev, screen];
    });
  };

  const goBack = () => {
    setScreenStack((prev) => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
  };

  useEffect(() => {
    const handleBack = () => {
      if (selectedExpense) {
        setSelectedExpense(null);
        return true;
      }

      if (activeScreen === "scan") {
        goBack();
        return true;
      }

      if (activeScreen !== "home" && activeScreen !== "login") {
        navigateTo("home");
        return true;
      }

      return false;
    };

    (window as any).androidGoBack = handleBack;
    (window as any).handleAndroidBack = handleBack;

    window.history.pushState(null, "", window.location.href);

    const onPopState = () => {
      const handled = handleBack();

      if (handled) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      delete (window as any).androidGoBack;
      delete (window as any).handleAndroidBack;
    };
  }, [activeScreen, selectedExpense]);

  const handleTabChange = (tab: "home" | "expenses" | "reports" | "profile") =>
    navigateTo(tab);

  const handleSaveScan = (amount?: number) => {
    navigateTo("home");
    setToastMessage(
      amount
        ? `Expense saved — ₹${amount.toLocaleString("en-IN")}`
        : "Expense saved!"
    );
    setShowToast(true);
  };

  const handleLogin = async (email: string) => {
    await new Promise<void>((resolve) => {
      if (auth.currentUser) {
        resolve();
        return;
      }

      const unsub = onAuthStateChanged(auth, (u) => {
        if (u) {
          unsub();
          resolve();
        }
      });

      setTimeout(() => {
        unsub();
        resolve();
      }, 3000);
    });

    try {
      const profile = await getUserProfile();

      if (profile) {
        setUser({
          name: profile.name || email.split("@")[0],
          email: profile.email || email,
          monthlyIncome: Number(profile.monthlyIncome || 0),
          monthlyBudget: Number(profile.monthlyBudget || 0),
        });
      } else {
        setUser({
          name: email.split("@")[0],
          email,
          monthlyIncome: 0,
          monthlyBudget: 0,
        });
      }
    } catch (error) {
      console.error("Profile load error:", error);

      setUser({
        name: email.split("@")[0],
        email,
        monthlyIncome: 0,
        monthlyBudget: 0,
      });
    }

    navigateTo("home");
  };

  const handleSignUpComplete = (userData: UserProfile) => {
    setUser(userData);
    navigateTo("home");
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch {}

    setUser(null);
    navigateTo("login");
  };

  const resetLogoutTimer = () => {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
    }

    logoutTimer.current = setTimeout(() => {
      if (user) {
        alert("Logged out due to inactivity");
        handleSignOut();
      }
    }, 10 * 60 * 1000);
  };

  useEffect(() => {
    if (!user) return;

    resetLogoutTimer();

    const events = ["click", "touchstart", "mousemove", "keydown", "scroll"];

    events.forEach((event) => {
      window.addEventListener(event, resetLogoutTimer);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetLogoutTimer);
      });

      if (logoutTimer.current) {
        clearTimeout(logoutTimer.current);
      }
    };
  }, [user]);
   
  return (
    <div className="w-screen min-h-screen bg-page font-dm overflow-hidden">
      <div className="w-screen min-h-screen relative overflow-hidden">
        {activeScreen === "login" && (
          <LoginScreen
            onLogin={handleLogin}
            onSignUp={() => navigateTo("signup")}
          />
        )}

        {activeScreen === "signup" && (
          <SignUpScreen
            onComplete={handleSignUpComplete}
            onBack={() => goBack()}
          />
        )}

        {activeScreen === "reset-password" && (
          <ResetPasswordScreen
            oobCode={resetCode || ""}
            onComplete={clearResetCode}
            onCancel={clearResetCode}
          />
        )}

        {activeScreen === "home" && user && (
          <HomeScreen
            user={user}
            onProfileClick={() => navigateTo("profile")}
            onScanClick={() => navigateTo("scan")}
            onExpenseClick={setSelectedExpense}
            onViewDetails={() => navigateTo("reports")}
            onSeeAllCategories={() => navigateTo("expenses")}
          />
        )}

        {activeScreen === "expenses" && <ExpenseListScreen />}

        {activeScreen === "reports" && user && <ReportsScreen />}

        {activeScreen === "profile" && user && (
          <ProfileScreen
            user={user}
            onProfileUpdated={(updatedUser) => setUser(updatedUser)}
            onSignOut={handleSignOut}
          />
        )}

        <AnimatePresence>
          {activeScreen === "scan" && (
            <div className="absolute inset-0 z-50">
              <ScanScreen onClose={() => goBack()} onSave={handleSaveScan} />
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedExpense && (
            <BillDetailScreen
              expense={selectedExpense}
              onClose={() => setSelectedExpense(null)}
            />
          )}
        </AnimatePresence>

        {activeScreen !== "login" &&
          activeScreen !== "signup" &&
          activeScreen !== "reset-password" &&
          activeScreen !== "scan" && (
            <BottomNav
              activeTab={activeScreen as any}
              onTabChange={handleTabChange}
            />
          )}

        <Toast
          message={toastMessage}
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />
      </div>
    </div>
  );
}