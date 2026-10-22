import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getHealthStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

export const Route = createFileRoute("/health")({
  loader: () => getHealthStatus(),
  component: () => null,
});
