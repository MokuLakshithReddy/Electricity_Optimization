import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface LoginButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function LoginButton({ loading, className = "", children, ...props }: LoginButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full h-14 rounded-full bg-gradient-to-r from-[#0F6B53] to-[#159A72] hover:from-[#11785D] hover:to-[#18AA7E] text-white font-semibold text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#159A72]/40 ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin text-white" />
          <span>Authenticating...</span>
        </>
      ) : (
        <>
          <span>{children || "Enter control centre"}</span>
          <ArrowRight className="w-5 h-5" />
        </>
      )}
    </button>
  );
}
