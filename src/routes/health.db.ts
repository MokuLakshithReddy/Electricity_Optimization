import { createFileRoute } from "@tanstack/react-router";
import { getSessionFn } from "@/lib/serverAuth";
import { durableLedgerStore } from "@/lib/energyLedger";

export const Route = createFileRoute("/health/db")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const session = await getSessionFn();
          if (!session.valid || !session.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "content-type": "application/json" },
            });
          }

          const health = await durableLedgerStore.checkDatabaseHealth();
          return new Response(JSON.stringify({ status: "ok", db: health }), {
            status: health.isHealthy ? 200 : 503,
            headers: { "content-type": "application/json" },
          });
        } catch {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
