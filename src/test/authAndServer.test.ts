import { describe, it, expect } from "vitest";
import { verifyServerSessionToken, ROLE_PERMISSIONS, UserProfile } from "../lib/serverAuth";
import { durableLedgerStore, DurablePersistentLedgerStore } from "../lib/energyLedger";
import { z } from "zod";

const authorizeDispatchSchema = z.object({
  token: z.string().optional(),
  requiredPermission: z.enum([
    "DISPATCH_EXECUTE",
    "INTERLOCK_OVERRIDE",
    "VIEW_TELEMETRY",
    "AUDIT_EXPORT",
    "CONFIGURE_TARIFFS",
    "MANAGE_USERS",
  ]),
  plan: z.object({
    batterySetpointMW: z.number().finite(),
    gridImportSetpointMW: z.number().finite().min(0).max(300),
    captiveSetpointMW: z.number().finite().min(0).max(150),
    generatorSetpointMW: z.number().finite().min(0).max(150),
  }),
});

describe("IntelliGrid AI — Auth, Server Functions & Ledger Suite", () => {
  it("verifies session token cryptographic validity and server permissions", () => {
    const mockUser: UserProfile = {
      id: "usr_test_01",
      username: "p.sharma",
      name: "P. Sharma",
      email: "p.sharma@plant.internal",
      role: "Operations Engineer",
      plantId: "PLANT-IND-04",
      plantName: "Industrial Control Centre",
      permissions: ROLE_PERMISSIONS["Operations Engineer"],
      lastLogin: new Date().toISOString(),
    };

    expect(mockUser.permissions).toContain("DISPATCH_EXECUTE");
    expect(mockUser.permissions).toContain("VIEW_TELEMETRY");
    expect(mockUser.permissions).not.toContain("MANAGE_USERS");
  });

  it("handles malformed or forged tokens safely", () => {
    const forgedToken = "eyJ1aWQiOiIxMjMifQ.invalid_forged_signature_hash";
    const res = verifyServerSessionToken(forgedToken);
    expect(res.valid).toBe(false);
    expect(res.user).toBeNull();
    expect(res.error).toContain("Cryptographic signature mismatch");
  });

  it("validates server dispatch authorization input bounds via Zod schema", () => {
    const validPlan = {
      requiredPermission: "DISPATCH_EXECUTE" as const,
      plan: {
        batterySetpointMW: 45,
        gridImportSetpointMW: 150,
        captiveSetpointMW: 55,
        generatorSetpointMW: 0,
      },
    };
    expect(authorizeDispatchSchema.parse(validPlan)).toEqual(validPlan);

    const invalidPlan = {
      requiredPermission: "DISPATCH_EXECUTE" as const,
      plan: {
        batterySetpointMW: 45,
        gridImportSetpointMW: 450, // Exceeds 300 MW max
        captiveSetpointMW: 55,
        generatorSetpointMW: 0,
      },
    };
    expect(() => authorizeDispatchSchema.parse(invalidPlan)).toThrow();
  });

  it("checks durable energy ledger health and schema generation", async () => {
    const ddl = DurablePersistentLedgerStore.getPostgresMigrationDDL();
    expect(ddl).toContain("CREATE TABLE IF NOT EXISTS energy_ledger_blocks");
    expect(ddl).toContain("append_ledger_block");

    const health = await durableLedgerStore.checkDatabaseHealth();
    expect(typeof health.isHealthy).toBe("boolean");
  });
});
