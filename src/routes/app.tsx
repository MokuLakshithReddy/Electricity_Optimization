import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getSessionFn } from "@/lib/serverAuth";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    try {
      const session = await getSessionFn();
      if (!session || !session.valid || !session.user) {
        throw redirect({ to: "/" });
      }
      return { user: session.user };
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) {
        throw err; // Re-throw TanStack Router redirect
      }
      throw redirect({ to: "/" });
    }
  },
  component: AppShell,
});
