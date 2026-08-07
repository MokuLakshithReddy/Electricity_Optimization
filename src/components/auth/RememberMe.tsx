import React from "react";

interface RememberMeProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onForgotPassword?: () => void;
}

export function RememberMe({ checked, onChange, onForgotPassword }: RememberMeProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <label className="flex items-center gap-2 font-medium text-slate-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="w-4 h-4 rounded border-slate-300 text-[#159A72] focus:ring-[#159A72]/20 accent-[#159A72] cursor-pointer"
        />
        <span>Remember me</span>
      </label>

      <button
        type="button"
        onClick={onForgotPassword}
        className="font-medium text-[#159A72] hover:text-[#0F6B53] hover:underline focus:outline-none transition-colors"
      >
        Forgot password?
      </button>
    </div>
  );
}
