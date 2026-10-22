import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getSessionFn } from "@/lib/serverAuth";
import { durableLedgerStore } from "@/lib/energyLedger";

const getDbHealthStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSessionFn();
  if (!session.valid || !session.user) {
    throw redirect({ to: "/" });
  }

  const health = await durableLedgerStore.checkDatabaseHealth();
  return { status: "ok", db: health };
});

export const Route = createFileRoute("/health/db")({
  loader: () => getDbHealthStatus(),
  component: () => null,
});
