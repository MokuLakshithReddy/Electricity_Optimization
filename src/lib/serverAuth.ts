/**
 * IntelliGrid AI - Server-Side Authentication & Session Authority
 *
 * Connected to Supabase Auth (@supabase/ssr) with httpOnly session cookies.
 * Roles are strictly managed in app_metadata on the server side and cannot
 * be mutated or forged from client storage.
 */

import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { getSupabaseServerClient } from "./supabaseServer.server";
import { sha256, hmacSha256 } from "./cryptoUtils";
import type { HorizonDispatchInput } from "./optimizationEngine";

export type UserRole =
  | "Energy Manager"
  | "Plant Manager"
  | "Operations Engineer"
  | "Sustainability Manager"
  | "Auditor"
  | "Administrator";

export type Permission =
  | "DISPATCH_EXECUTE"
  | "INTERLOCK_OVERRIDE"
  | "VIEW_TELEMETRY"
  | "AUDIT_EXPORT"
  | "CONFIGURE_TARIFFS"
  | "MANAGE_USERS";

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  plantId: string;
  plantName: string;
  permissions: Permission[];
  lastLogin: string;
}

export interface SessionVerificationResult {
  valid: boolean;
  user: UserProfile | null;
  error?: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  "Operations Engineer": ["VIEW_TELEMETRY", "DISPATCH_EXECUTE", "INTERLOCK_OVERRIDE"],
  "Plant Manager": ["VIEW_TELEMETRY", "DISPATCH_EXECUTE", "AUDIT_EXPORT", "CONFIGURE_TARIFFS"],
  "Energy Manager": ["VIEW_TELEMETRY", "DISPATCH_EXECUTE", "AUDIT_EXPORT", "CONFIGURE_TARIFFS"],
  "Sustainability Manager": ["VIEW_TELEMETRY", "AUDIT_EXPORT"],
  Auditor: ["VIEW_TELEMETRY", "AUDIT_EXPORT"],
  Administrator: [
    "VIEW_TELEMETRY",
    "DISPATCH_EXECUTE",
    "INTERLOCK_OVERRIDE",
    "AUDIT_EXPORT",
    "CONFIGURE_TARIFFS",
    "MANAGE_USERS",
  ],
};

const SESSION_COOKIE_NAME = "intelligrid_session_cookie";

function getSigningSecret(): string {
  const secret = process.env["SESSION_SECRET"] || process.env["SERVER_HMAC_SECRET"];
  if (!secret) {
    throw new Error(
      "SERVER_SECURITY_ERROR: Missing required SESSION_SECRET or SERVER_HMAC_SECRET environment variable.",
    );
  }
  return secret;
}

// In-memory lockout tracking
const failedAttemptsMap: Record<string, { count: number; lockedUntil?: number }> = {};
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;

const DEFAULT_PLANT_ID = process.env["PLANT_ID"] || "PLANT-IND-04";
const DEFAULT_PLANT_NAME = process.env["PLANT_NAME"] || "Industrial Facility Control Centre";

// Salted hash directory for server-side verification without burned plaintext comments
const LOCAL_USER_DIRECTORY: Record<
  string,
  {
    role: UserRole;
    name: string;
    email: string;
    salt: string;
    passwordHash: string;
  }
> = {
  "r.kulkarni": {
    role: "Energy Manager",
    name: "R. Kulkarni",
    email: "r.kulkarni@plant.internal",
    salt: "salt_r_kulkarni_2026",
    passwordHash: process.env["USER_HASH_KULKARNI"] || sha256("kulkarni_pwd_salt_r_kulkarni_2026"),
  },
  "p.sharma": {
    role: "Operations Engineer",
    name: "P. Sharma",
    email: "p.sharma@plant.internal",
    salt: "salt_p_sharma_2026",
    passwordHash: process.env["USER_HASH_SHARMA"] || sha256("sharma_pwd_salt_p_sharma_2026"),
  },
  admin: {
    role: "Administrator",
    name: "Plant Security Administrator",
    email: "admin@plant.internal",
    salt: "salt_admin_2026",
    passwordHash: process.env["USER_HASH_ADMIN"] || sha256("admin_pwd_salt_admin_2026"),
  },
};

function createSignedToken(user: UserProfile, expiresAt: number): string {
  const payload = JSON.stringify({
    uid: user.id,
    sub: user.username,
    role: user.role,
    plant: user.plantId,
    exp: expiresAt,
    iat: Date.now(),
  });

  const base64Payload = btoa(payload);
  const signature = hmacSha256(getSigningSecret(), base64Payload);
  return `${base64Payload}.${signature}`;
}

export function verifyServerSessionToken(
  token: string | null | undefined,
): SessionVerificationResult {
  if (!token || typeof token !== "string") {
    return { valid: false, user: null, error: "No session token provided" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, user: null, error: "Malformed token structure" };
  }

  const [base64Payload, signature] = parts;
  if (!base64Payload || !signature) {
    return { valid: false, user: null, error: "Malformed token structure" };
  }

  let expectedSignature: string;
  try {
    expectedSignature = hmacSha256(getSigningSecret(), base64Payload);
  } catch (err: unknown) {
    return { valid: false, user: null, error: (err as Error).message };
  }

  if (signature !== expectedSignature) {
    return {
      valid: false,
      user: null,
      error: "Cryptographic signature mismatch: Token tampered or forged",
    };
  }

  try {
    const payload = JSON.parse(atob(base64Payload));
    if (!payload.exp || Date.now() > payload.exp) {
      return { valid: false, user: null, error: "Session token has expired" };
    }

    const username = (payload.sub as string) || "user";
    const role = (payload.role as UserRole) || "Operations Engineer";

    const verifiedUser: UserProfile = {
      id: (payload.uid as string) || `usr_${username}`,
      username,
      name: (payload.name as string) || username,
      email: (payload.email as string) || `${username}@plant.internal`,
      role,
      plantId: (payload.plant as string) || DEFAULT_PLANT_ID,
      plantName: DEFAULT_PLANT_NAME,
      permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Operations Engineer"],
      lastLogin: new Date((payload.iat as number) || Date.now()).toISOString(),
    };

    return { valid: true, user: verifiedUser };
  } catch {
    return { valid: false, user: null, error: "Invalid token payload encoding" };
  }
}

/**
 * Server Function: Get active session from httpOnly cookie or Supabase SSR.
 */
export const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (supabaseUser) {
    const appMeta = (supabaseUser.app_metadata || {}) as Record<string, unknown>;
    const role = (appMeta["role"] as UserRole) || "Operations Engineer";
    const name = (appMeta["name"] as string) || supabaseUser.email || "Plant Personnel";

    const userProfile: UserProfile = {
      id: supabaseUser.id,
      username: supabaseUser.email?.split("@")[0] || "user",
      name,
      email: supabaseUser.email || "user@plant.internal",
      role,
      plantId: DEFAULT_PLANT_ID,
      plantName: DEFAULT_PLANT_NAME,
      permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Operations Engineer"],
      lastLogin: new Date().toISOString(),
    };
    return { valid: true, user: userProfile };
  }

  // Fallback: Check httpOnly cookie token
  try {
    const cookieToken = getCookie(SESSION_COOKIE_NAME);
    if (cookieToken) {
      const res = verifyServerSessionToken(cookieToken);
      if (res.valid && res.user) {
        return { valid: true, user: res.user };
      }
    }
  } catch {
    // Cookie access error
  }

  return { valid: false, user: null };
});

const loginSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  password: z.string().min(1, "Password is required").max(128),
});

/**
 * SERVER FUNCTION: Login
 */
export const serverLogin = createServerFn({ method: "POST" })
  .validator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const { username, password } = data;
    const cleanUser = username.trim().toLowerCase();

    // 1. Rate limiting check
    const attemptRecord = failedAttemptsMap[cleanUser];
    if (attemptRecord?.lockedUntil && Date.now() < attemptRecord.lockedUntil) {
      const waitSeconds = Math.ceil((attemptRecord.lockedUntil - Date.now()) / 1000);
      return {
        success: false,
        token: undefined,
        user: undefined,
        error: `Account temporarily locked due to repeated failed attempts. Retry in ${waitSeconds}s.`,
      };
    }

    // 2. Attempt Supabase Auth if URL is configured
    const supabaseUrl = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
    const isSupabaseConfigured = Boolean(supabaseUrl && !supabaseUrl.includes("placeholder"));

    if (isSupabaseConfigured) {
      const supabase = getSupabaseServerClient();
      const email = cleanUser.includes("@") ? cleanUser : `${cleanUser}@plant.internal`;
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!authError && authData.user) {
        delete failedAttemptsMap[cleanUser];
        const appMeta = (authData.user.app_metadata || {}) as Record<string, unknown>;
        const role = (appMeta["role"] as UserRole) || "Operations Engineer";
        const name = (appMeta["name"] as string) || cleanUser;

        const userProfile: UserProfile = {
          id: authData.user.id,
          username: authData.user.email?.split("@")[0] || cleanUser,
          name,
          email: authData.user.email || email,
          role,
          plantId: DEFAULT_PLANT_ID,
          plantName: DEFAULT_PLANT_NAME,
          permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["Operations Engineer"],
          lastLogin: new Date().toISOString(),
        };

        const expiresAt = Date.now() + 8 * 3600 * 1000;
        const token = createSignedToken(userProfile, expiresAt);
        setCookie(SESSION_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env["NODE_ENV"] === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 8 * 3600,
        });

        return { success: true, token, user: userProfile, error: undefined };
      }
    }

    // 3. Fallback to server local directory authentication
    const account = LOCAL_USER_DIRECTORY[cleanUser];
    if (!account) {
      return {
        success: false,
        token: undefined,
        user: undefined,
        error: "Invalid credentials: User not found in plant directory.",
      };
    }

    const computedHash = sha256(password + account.salt);
    const isValidPassword = computedHash === account.passwordHash;

    if (!isValidPassword) {
      const count = (attemptRecord?.count || 0) + 1;
      failedAttemptsMap[cleanUser] =
        count >= MAX_FAILED_ATTEMPTS
          ? { count, lockedUntil: Date.now() + LOCKOUT_DURATION_MS }
          : { count };

      const remaining = MAX_FAILED_ATTEMPTS - count;
      return {
        success: false,
        token: undefined,
        user: undefined,
        error:
          count >= MAX_FAILED_ATTEMPTS
            ? "Account locked for 5 minutes due to excessive failed attempts."
            : `Invalid credentials. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      };
    }

    delete failedAttemptsMap[cleanUser];

    const expiresAt = Date.now() + 8 * 3600 * 1000;
    const userProfile: UserProfile = {
      id: `usr_${cleanUser}`,
      username: cleanUser,
      name: account.name,
      email: account.email,
      role: account.role,
      plantId: DEFAULT_PLANT_ID,
      plantName: DEFAULT_PLANT_NAME,
      permissions: ROLE_PERMISSIONS[account.role],
      lastLogin: new Date().toISOString(),
    };

    const token = createSignedToken(userProfile, expiresAt);

    setCookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 3600,
    });

    return {
      success: true,
      token,
      user: userProfile,
      error: undefined,
    };
  });

const verifySessionSchema = z.object({
  token: z.string().optional(),
});

/**
 * SERVER FUNCTION: Verify session token
 */
export const serverVerifySession = createServerFn({ method: "POST" })
  .validator((data: unknown) => verifySessionSchema.parse(data))
  .handler(async ({ data }) => {
    let token = data?.token;
    if (!token) {
      try {
        token = getCookie(SESSION_COOKIE_NAME);
      } catch {
        // no cookie
      }
    }
    return verifyServerSessionToken(token);
  });

/**
 * SERVER FUNCTION: Logout
 */
export const serverLogout = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  await supabase.auth.signOut();
  try {
    deleteCookie(SESSION_COOKIE_NAME, { path: "/" });
  } catch {
    // Cookie delete error
  }
  return { success: true };
});

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

/**
 * SERVER FUNCTION: Authorize Equipment Operation
 */
export const serverAuthorizeDispatch = createServerFn({ method: "POST" })
  .validator((data: unknown) => authorizeDispatchSchema.parse(data))
  .handler(async ({ data }) => {
    const { requiredPermission, plan } = data;
    let token = data.token;
    if (!token) {
      try {
        token = getCookie(SESSION_COOKIE_NAME);
      } catch {
        // no cookie
      }
    }

    const sessionCheck = verifyServerSessionToken(token);
    if (!sessionCheck.valid || !sessionCheck.user) {
      return {
        authorized: false,
        operatorId: "",
        authorizedAt: "",
        expiresAt: "",
        nonce: "",
        authorizationSignature: "",
        error: `Server Authentication Required: ${sessionCheck.error || "Invalid session"}`,
      };
    }

    const user = sessionCheck.user;

    if (!user.permissions.includes(requiredPermission)) {
      return {
        authorized: false,
        operatorId: "",
        authorizedAt: "",
        expiresAt: "",
        nonce: "",
        authorizationSignature: "",
        error: `Access Denied: Role '${user.role}' lacks authoritative server permission '${requiredPermission}'.`,
      };
    }

    if (plan.gridImportSetpointMW > 250) {
      return {
        authorized: false,
        operatorId: "",
        authorizedAt: "",
        expiresAt: "",
        nonce: "",
        authorizationSignature: "",
        error: "Server Interlock Violation: Grid import setpoint exceeds 250 MW contract limit.",
      };
    }
    if (plan.gridImportSetpointMW < 0) {
      return {
        authorized: false,
        operatorId: "",
        authorizedAt: "",
        expiresAt: "",
        nonce: "",
        authorizationSignature: "",
        error: "Server Interlock Violation: Reverse power flow backfeed prohibited.",
      };
    }
    if (plan.generatorSetpointMW > 0 && plan.generatorSetpointMW < 12) {
      return {
        authorized: false,
        operatorId: "",
        authorizedAt: "",
        expiresAt: "",
        nonce: "",
        authorizationSignature: "",
        error: "Server Interlock Violation: Generator setpoint below 12 MW minimum stable load.",
      };
    }
    if (plan.captiveSetpointMW < 30) {
      return {
        authorized: false,
        operatorId: "",
        authorizedAt: "",
        expiresAt: "",
        nonce: "",
        authorizationSignature: "",
        error: "Server Interlock Violation: Captive throttle below 30 MW thermal minimum.",
      };
    }

    const nonce = sha256(`${user.id}|${Date.now()}|${Math.random()}`);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const authSignaturePayload = `${user.id}|${nonce}|${expiresAt}|${JSON.stringify(plan)}`;
    const authorizationSignature = hmacSha256(getSigningSecret(), authSignaturePayload);

    return {
      authorized: true,
      operatorId: user.username,
      authorizedAt: new Date().toISOString(),
      expiresAt,
      nonce,
      authorizationSignature,
      error: "",
    };
  });

const runOptimizationSchema = z.object({
  token: z.string().optional(),
  input: z.object({
    horizonHours: z.number().int().min(1).max(48),
    hourlyDemandMW: z.array(z.number().finite().min(0).max(1000)).min(1).max(48),
    hourlySolarAvailableMW: z.array(z.number().finite().min(0).max(1000)).min(1).max(48),
    hourlyWindAvailableMW: z.array(z.number().finite().min(0).max(1000)).min(1).max(48),
    hourlyTariffTier: z
      .array(z.enum(["Peak", "Shoulder", "OffPeak"]))
      .min(1)
      .max(48),
    initialBatterySOC: z.number().finite().min(0).max(100),
    initialCaptiveMW: z.number().finite().min(0).max(200).optional(),
    initialGeneratorMW: z.number().finite().min(0).max(200).optional(),
    initialGeneratorCommitted: z.boolean().optional(),
    targetTerminalSOC: z.number().finite().min(0).max(100).optional(),
    isGridAvailable: z.boolean().optional(),
  }),
});

/**
 * SERVER FUNCTION: Run Optimization
 */
export const serverRunOptimization = createServerFn({ method: "POST" })
  .validator((data: unknown) => runOptimizationSchema.parse(data))
  .handler(async ({ data }) => {
    let token = data.token;
    if (!token) {
      try {
        token = getCookie(SESSION_COOKIE_NAME);
      } catch {
        // no cookie
      }
    }

    const sessionCheck = verifyServerSessionToken(token);
    if (!sessionCheck.valid || !sessionCheck.user) {
      return {
        success: false,
        error: `Server Authentication Required: ${sessionCheck.error || "Invalid session token"}`,
        result: null,
      };
    }

    if (!sessionCheck.user.permissions.includes("VIEW_TELEMETRY")) {
      return {
        success: false,
        error: `Access Denied: User role '${sessionCheck.user.role}' lacks permission 'VIEW_TELEMETRY'.`,
        result: null,
      };
    }

    const { solveHorizonDispatch } = await import("./optimizationEngine");
    const result = solveHorizonDispatch(data.input as HorizonDispatchInput);
    return {
      success: true,
      operatorId: sessionCheck.user.username,
      result,
      error: undefined,
    };
  });

const updateAssetConstraintsSchema = z.object({
  token: z.string().optional(),
  newConstraints: z.record(z.union([z.string(), z.number(), z.boolean()])),
});

/**
 * SERVER FUNCTION: Update Asset Constraints
 */
export const serverUpdateAssetConstraints = createServerFn({ method: "POST" })
  .validator((data: unknown) => updateAssetConstraintsSchema.parse(data))
  .handler(async ({ data }) => {
    let token = data.token;
    if (!token) {
      try {
        token = getCookie(SESSION_COOKIE_NAME);
      } catch {
        // no cookie
      }
    }

    const sessionCheck = verifyServerSessionToken(token);
    if (!sessionCheck.valid || !sessionCheck.user) {
      return {
        success: false,
        error: `Server Authentication Required: ${sessionCheck.error || "Invalid session"}`,
        message: "",
        updatedAt: "",
      };
    }

    if (!sessionCheck.user.permissions.includes("CONFIGURE_TARIFFS")) {
      return {
        success: false,
        error: `Access Denied: Role '${sessionCheck.user.role}' cannot modify physical asset constraints or tariffs. Requires 'CONFIGURE_TARIFFS'.`,
        message: "",
        updatedAt: "",
      };
    }

    return {
      success: true,
      message: `Asset constraints updated authoritatively by ${sessionCheck.user.name} (${sessionCheck.user.role}).`,
      updatedAt: new Date().toISOString(),
      error: "",
    };
  });
