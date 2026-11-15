import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getSessionFn } from "@/lib/serverAuth";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    try {
      const session = await getSessionFn();
      if (session && session.valid && session.user) {
        return { user: session.user };
      }
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) {
        throw err; // Re-throw TanStack Router redirect
      }
    }

    // In browser client navigation, verify client-side stored session
    if (typeof window !== "undefined") {
      try {
        const { authService } = await import("@/lib/authService");
        const clientUser = authService.getCurrentUser();
        if (clientUser) {
          return { user: clientUser };
        }
      } catch {
        // Fall through to redirect
      }
    }

    throw redirect({ to: "/" });
  },
  component: AppShell,
});
