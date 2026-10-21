import React, { ReactNode } from "react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, icon, id, className = "", ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className="space-y-1.5 text-left">
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 pointer-events-none text-slate-400">{icon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full h-12 bg-white text-slate-900 text-sm font-medium rounded-xl border border-slate-300 ${
              icon ? "pl-11" : "pl-4"
            } pr-4 placeholder:text-slate-400 focus:outline-none focus:border-[#159A72] focus:ring-2 focus:ring-[#159A72]/20 transition-all duration-150 ${className}`}
            {...props}
          />
        </div>
      </div>
    );
  },
);

InputField.displayName = "InputField";
