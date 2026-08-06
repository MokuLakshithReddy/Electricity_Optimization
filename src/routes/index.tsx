import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Lock, User, ArrowRight } from "lucide-react";
import { AiBrain } from "@/components/AiBrain";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IntelliGrid AI — Predict. Optimize. Save." },
      {
        name: "description",
        content:
          "AI energy copilot for industrial plants: predict demand, optimise solar, wind, battery, grid and captive power, and cut cost and carbon.",
      },
      { property: "og:title", content: "IntelliGrid AI — Predict. Optimize. Save." },
      {
        property: "og:description",
        content: "Enterprise energy intelligence for industrial control rooms.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate({ to: "/app/dashboard" }), 900);
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" />

      <div className="relative hidden flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-gradient">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold">IntelliGrid AI</span>
        </div>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-md text-5xl font-semibold leading-[1.05]"
          >
            <span className="text-gradient">Predict.</span>
            <br />
            <span className="text-gradient">Optimize.</span>
            <br />
            <span className="text-gradient">Save.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground"
          >
            An AI energy copilot orchestrating solar, wind, battery, grid, captive power and diesel
            across the plant — continuously forecasting demand, cutting electricity cost and carbon
            while guaranteeing uninterrupted supply.
          </motion.p>
          <AiBrain className="mt-10 h-44 w-44 animate-float" />
        </div>

        <div className="flex gap-8 text-xs text-muted-foreground">
          <div>
            <p className="font-display text-xl text-foreground">18.6%</p>
            energy cost reduction
          </div>
          <div>
            <p className="font-display text-xl text-foreground">2,148 t</p>
            CO₂ avoided MTD
          </div>
          <div>
            <p className="font-display text-xl text-foreground">99.98%</p>
            supply availability
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center p-6">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass w-full max-w-md rounded-3xl p-8"
        >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">IntelliGrid AI</span>
          </div>

          <h2 className="text-2xl font-semibold">Control centre sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Authorised plant operations personnel only.
          </p>

          <div className="mt-7 space-y-4">
            <label className="block">
              <span className="text-xs text-muted-foreground">Username</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-input bg-muted/40 px-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <input
                  defaultValue="r.kulkarni"
                  className="h-11 flex-1 bg-transparent text-sm outline-none"
                  autoComplete="username"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Password</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-input bg-muted/40 px-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  defaultValue="intelligrid"
                  className="h-11 flex-1 bg-transparent text-sm outline-none"
                  autoComplete="current-password"
                />
              </div>
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" defaultChecked className="accent-[var(--cyan)]" />
              Remember me
            </label>
            <button type="button" className="text-cyan hover:underline">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-primary-foreground disabled:opacity-70"
          >
            {loading ? "Authenticating…" : "Enter control centre"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>

          <p className="mt-5 text-center text-[11px] text-muted-foreground">
            Secured by plant SSO · Session logged for audit
          </p>
        </motion.form>
      </div>
    </div>
  );
}
