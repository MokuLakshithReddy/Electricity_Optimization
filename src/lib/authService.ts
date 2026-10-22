/**
 * IntelliGrid AI - Client Authentication & Authorization Service
 *
 * Production-grade client gateway connected to server-authoritative authentication:
 * - Server-side credential verification via Supabase Auth & httpOnly cookies
 * - Strictly NO hardcoded default user fallback when unauthenticated
 * - Server-enforced Role-Based Access Control (RBAC)
 * - Equipment dispatch operations must be authorized by server-side gatekeepers
 */

import {
  serverLogin,
  serverLogout,
  serverVerifySession,
  serverAuthorizeDispatch,
  getSessionFn,
  UserProfile,
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
} from "./serverAuth";
import { getSupabaseBrowserClient } from "./supabaseBrowser";

export type { UserProfile, UserRole, Permission };
export { ROLE_PERMISSIONS };

const AUTH_STORAGE_KEY = "intelligrid_session_token_v4";

export interface StoredSession {
  token: string;
  cachedUser: UserProfile;
  expiresAt: number;
}

export const AVAILABLE_ROLES: UserRole[] = [
  "Energy Manager",
  "Plant Manager",
  "Operations Engineer",
  "Sustainability Manager",
  "Auditor",
  "Administrator",
];

export const authService = {
  /**
   * Log in user via server authentication function.
   */
  async login(
    usernameInput: string,
    passwordInput: string,
  ): Promise<{ success: boolean; user?: UserProfile; token?: string; error?: string }> {
    try {
      const result = await serverLogin({
        data: {
          username: usernameInput.trim(),
          password: passwordInput,
        },
      });

      if (result.success && result.user) {
        if (typeof window !== "undefined") {
          const sessionData: StoredSession = {
            token: result.token || "cookie-authenticated",
            cachedUser: result.user,
            expiresAt: Date.now() + 8 * 3600 * 1000,
          };
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
        }

        return {
          success: true,
          user: result.user,
          token: result.token,
        };
      }

      return {
        success: false,
        error: result.error || "Authentication failed. Invalid credentials.",
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Authentication service error. Contact plant IT administration.";
      return {
        success: false,
        error: message,
      };
    }
  },

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      const stored =
        sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;
      const session: StoredSession = JSON.parse(stored);
      if (session.expiresAt && Date.now() > session.expiresAt) {
        this.logout();
        return null;
      }
      return session.token;
    } catch {
      return null;
    }
  },

  getCurrentUser(): UserProfile | null {
    if (typeof window === "undefined") return null;
    try {
      const stored =
        sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;
      const session: StoredSession = JSON.parse(stored);
      if (session.expiresAt && Date.now() > session.expiresAt) {
        this.logout();
        return null;
      }
      return session.cachedUser;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },

  async verifySessionWithServer(): Promise<{ valid: boolean; user: UserProfile | null }> {
    try {
      const session = await getSessionFn();
      if (session.valid && session.user) {
        if (typeof window !== "undefined") {
          const sessionData: StoredSession = {
            token: "cookie-authenticated",
            cachedUser: session.user,
            expiresAt: Date.now() + 8 * 3600 * 1000,
          };
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
        }
        return { valid: true, user: session.user };
      }

      const token = this.getToken();
      if (!token) return { valid: false, user: null };

      const res = await serverVerifySession({ data: { token } });
      if (!res.valid || !res.user) {
        this.logout();
        return { valid: false, user: null };
      }
      return { valid: true, user: res.user };
    } catch {
      return { valid: false, user: null };
    }
  },

  hasPermission(permission: Permission): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.permissions?.includes(permission) ?? false;
  },

  async authorizeDispatchWithServer(plan: {
    batterySetpointMW: number;
    gridImportSetpointMW: number;
    captiveSetpointMW: number;
    generatorSetpointMW: number;
  }): Promise<{
    authorized: boolean;
    operatorId?: string;
    authorizationSignature?: string;
    expiresAt?: string;
    nonce?: string;
    error?: string;
  }> {
    const token = this.getToken() || undefined;

    try {
      return await serverAuthorizeDispatch({
        data: {
          token,
          requiredPermission: "DISPATCH_EXECUTE",
          plan,
        },
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Server authorization communication error.";
      return {
        authorized: false,
        error: message,
      };
    }
  },

  async logout(): Promise<void> {
    try {
      await serverLogout();
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // Safe logout catch
    }
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        // Safe storage access
      }
    }
  },

  getRoles(): UserRole[] {
    return AVAILABLE_ROLES;
  },
};
