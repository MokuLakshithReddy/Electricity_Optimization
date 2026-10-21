import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, ShieldCheck, AlertCircle, KeyRound, Check } from "lucide-react";
import { authService } from "@/lib/authService";
import { InputField } from "./InputField";
import { PasswordField } from "./PasswordField";
import { RememberMe } from "./RememberMe";
import { LoginButton } from "./LoginButton";

interface LoginCardProps {
  onSuccess: () => void;
  className?: string;
}

// Certified enterprise demo accounts configured on the server
const DEMO_ACCOUNTS = [
  {
    label: "R. Kulkarni (Energy Manager)",
    username: "r.kulkarni",
    pass: "SteelGrid#2026!Secure",
    role: "Energy Manager",
  },
  {
    label: "P. Sharma (Operations Engineer)",
    username: "p.sharma",
    pass: "ControlOps#2026!Grid",
    role: "Operations Engineer",
  },
  {
    label: "Security Admin (Full Audit/Root)",
    username: "admin",
    pass: "PlantAdmin#2026!Root",
    role: "Administrator",
  },
];

export function LoginCard({ onSuccess, className = "" }: LoginCardProps) {
  const [username, setUsername] = useState(DEMO_ACCOUNTS[0].username);
  const [password, setPassword] = useState(DEMO_ACCOUNTS[0].pass);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await authService.login(username, password);
      if (res.success && res.user) {
        onSuccess();
      } else {
        setErrorMsg(res.error || "Invalid username or passphrase.");
      }
    } catch {
      setErrorMsg("Authentication service unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = (acc: (typeof DEMO_ACCOUNTS)[0]) => {
    setUsername(acc.username);
    setPassword(acc.pass);
    setErrorMsg(null);
  };

  const handleForgotPassword = () => {
    alert(
      "Password reset request logged for Plant Security Administrator. Please contact SCADA IT desk.",
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`w-full max-w-[460px] bg-white rounded-[28px] border border-slate-200 p-8 lg:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] text-slate-900 ${className}`}
    >
      {/* Header */}
      <div className="space-y-1 text-left">
        <h2 className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-[#031019]">
          Control centre sign in
        </h2>
        <p className="text-sm text-slate-500 font-normal">
          Server-verified authentication for authorized plant personnel.
        </p>
      </div>

      {/* Authorized Account Presets */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Select Authorized Personnel Profile
        </label>
        <div className="space-y-1.5">
          {DEMO_ACCOUNTS.map((acc) => {
            const isSelected = username === acc.username;
            return (
              <button
                type="button"
                key={acc.username}
                onClick={() => handleSelectAccount(acc)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#159A72]/10 border-[#159A72] text-[#0F6B53] font-semibold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{acc.label}</span>
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-[#159A72]" />
                ) : (
                  <KeyRound className="w-3 h-3 text-slate-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inline Error Alert */}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 font-medium"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Username */}
        <InputField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter plant username"
          icon={<User className="w-4 h-4" />}
          autoComplete="username"
          required
        />

        {/* Password */}
        <PasswordField
          label="Passphrase"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          autoComplete="current-password"
          required
        />

        {/* Remember me & Forgot password */}
        <div className="pt-1">
          <RememberMe
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            onForgotPassword={handleForgotPassword}
          />
        </div>

        {/* Submit CTA */}
        <div className="pt-2">
          <LoginButton loading={loading}>Enter control centre</LoginButton>
        </div>
      </form>

      {/* Security Context Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-[#159A72]" />
        <span>Server HMAC-SHA256 tokens · Salted PBKDF2 hashes</span>
      </div>
    </motion.div>
  );
}
