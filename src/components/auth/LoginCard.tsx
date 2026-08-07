import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, ShieldCheck, AlertCircle } from "lucide-react";
import { authService, UserRole, AVAILABLE_ROLES } from "@/lib/authService";
import { InputField } from "./InputField";
import { PasswordField } from "./PasswordField";
import { RememberMe } from "./RememberMe";
import { LoginButton } from "./LoginButton";

interface LoginCardProps {
  onSuccess: () => void;
  className?: string;
}

export function LoginCard({ onSuccess, className = "" }: LoginCardProps) {
  const [username, setUsername] = useState("r.kulkarni");
  const [password, setPassword] = useState("IntelliGrid@2026");
  const [selectedRole, setSelectedRole] = useState<UserRole>("Energy Manager");
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
        // Set active role choice
        authService.setRole(selectedRole);
        onSuccess();
      } else {
        setErrorMsg(res.error || "Invalid username or password.");
      }
    } catch {
      setErrorMsg("Authentication service unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert("Password reset request logged for Plant Security Administrator. Please contact SCADA IT desk.");
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
          Authorised plant operations personnel only.
        </p>
      </div>

      {/* Inline Error Alert */}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 font-medium"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          autoComplete="current-password"
          required
        />

        {/* Role Selector (Demo / Operational Context) */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="role-select" className="block text-xs font-semibold text-slate-700">
            Operating Role
          </label>
          <select
            id="role-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            className="w-full h-11 bg-slate-50 text-slate-800 text-xs font-medium rounded-xl border border-slate-300 px-3.5 focus:outline-none focus:border-[#159A72] focus:ring-2 focus:ring-[#159A72]/20 transition-all"
          >
            {AVAILABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

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
      <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-[#159A72]" />
        <span>Secured by plant SSO · Session logged for audit</span>
      </div>
    </motion.div>
  );
}
