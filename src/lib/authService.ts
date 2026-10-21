/**
 * IntelliGrid AI - Client Authentication & Authorization Service
 * 
 * Production-grade client gateway connected to server-authoritative authentication:
 * - Server-side credential verification with salted SHA-256 hashes (no client passwords)
 * - Server-verified HMAC-SHA256 session tokens
 * - Strictly NO hardcoded default user fallback when unauthenticated
 * - Server-enforced Role-Based Access Control (RBAC)
 * - Equipment dispatch operations must be authorized by server-side gatekeepers
 */

import {
  serverLogin,
  serverVerifySession,
  serverAuthorizeDispatch,
  UserProfile,
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
} from "./serverAuth";

export type { UserProfile, UserRole, Permission };
export { ROLE_PERMISSIONS };

const AUTH_STORAGE_KEY = "intelligrid_session_token_v3";

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
   * Log in user via secure server authentication function.
   * Credentials are verified against server-held salted hashes.
   */
  async login(
    usernameInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; user?: UserProfile; token?: string; error?: string }> {
    try {
      const result = await serverLogin({
        data: {
          username: usernameInput.trim(),
          password: passwordInput,
        },
      });

      if (result.success && result.token && result.user) {
        if (typeof window !== "undefined") {
          const sessionData: StoredSession = {
            token: result.token,
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
        error: result.error || "Authentication failed. Invalid username or passphrase.",
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Authentication service error. Contact plant IT administration.",
      };
    }
  },

  /**
   * Retrieve active session token string from secure storage.
   */
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
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

  /**
   * Retrieve current authenticated user profile.
   * Returns null if unauthenticated. (NO DEFAULT MOCK USER FALLBACK).
   */
  getCurrentUser(): UserProfile | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
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

  /**
   * Check whether an active session exists and is unexpired.
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },

  /**
   * Re-verify session validity directly with the server.
   */
  async verifySessionWithServer(): Promise<{ valid: boolean; user: UserProfile | null }> {
    const token = this.getToken();
    if (!token) return { valid: false, user: null };

    try {
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

  /**
   * Verify if current authenticated user holds a specific permission.
   */
  hasPermission(permission: Permission): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.permissions?.includes(permission) ?? false;
  },

  /**
   * Request server authorization for equipment dispatch.
   * Equipment operations MUST pass server-verified cryptographic token validation.
   */
  async authorizeDispatchWithServer(plan: {
    batterySetpointMW: number;
    gridImportSetpointMW: number;
    captiveSetpointMW: number;
    generatorSetpointMW: number;
  }): Promise<{ authorized: boolean; operatorId?: string; authorizationSignature?: string; error?: string }> {
    const token = this.getToken();
    if (!token) {
      return { authorized: false, error: "Authentication required: No active session token found." };
    }

    try {
      return await serverAuthorizeDispatch({
        data: {
          token,
          requiredPermission: "DISPATCH_EXECUTE",
          plan,
        },
      });
    } catch (err: any) {
      return { authorized: false, error: err?.message || "Server authorization communication error." };
    }
  },

  /**
   * Log out and purge all session credentials from local storage.
   */
  logout(): void {
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
