import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label = "Password", id, className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || "input-password";

    return (
      <div className="space-y-1.5 text-left">
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3.5 pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>

          <input
            ref={ref}
            id={inputId}
            type={showPassword ? "text" : "password"}
            className={`w-full h-12 bg-white text-slate-900 text-sm font-medium rounded-xl border border-slate-300 pl-11 pr-11 placeholder:text-slate-400 focus:outline-none focus:border-[#159A72] focus:ring-2 focus:ring-[#159A72]/20 transition-all duration-150 ${className}`}
            {...props}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-slate-400 hover:text-slate-700 focus:outline-none transition-colors p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  },
);

PasswordField.displayName = "PasswordField";
