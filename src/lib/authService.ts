export type UserRole =
  | "Energy Manager"
  | "Plant Manager"
  | "Operations Engineer"
  | "Sustainability Manager"
  | "Administrator";

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  lastLogin: string;
  plantId: string;
  plantName: string;
}

export const AVAILABLE_ROLES: UserRole[] = [
  "Energy Manager",
  "Plant Manager",
  "Operations Engineer",
  "Sustainability Manager",
  "Administrator",
];

const DEFAULT_USER: UserProfile = {
  id: "usr_99812",
  username: "r.kulkarni",
  name: "Ramesh Kulkarni",
  email: "r.kulkarni@intelligrid.plant",
  role: "Energy Manager",
  lastLogin: new Date().toISOString(),
  plantId: "PLANT-IND-04",
  plantName: "Vadodara Industrial Energy Complex",
};

const DEMO_CREDENTIALS = {
  username: "r.kulkarni",
  password: "IntelliGrid@2026",
};

const AUTH_STORAGE_KEY = "intelligrid_auth_session";

export const authService = {
  /**
   * Authenticate user against plant identity provider / demo credentials
   */
  async login(username: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    // Simulate network delay for authenticating with enterprise SSO/plant identity
    await new Promise((resolve) => setTimeout(resolve, 800));

    const cleanUser = username.trim().toLowerCase();

    if (cleanUser === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      const sessionUser: UserProfile = {
        ...DEFAULT_USER,
        lastLogin: new Date().toISOString(),
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
      }

      return { success: true, user: sessionUser };
    }

    return {
      success: false,
      error: "Invalid username or password.",
    };
  },

  /**
   * Retrieve current authenticated user session
   */
  getCurrentUser(): UserProfile {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(AUTH_STORAGE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // Fallback to default user if parse fails
        }
      }
    }
    return DEFAULT_USER;
  },

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(AUTH_STORAGE_KEY);
  },

  /**
   * Update active user role for scenario simulation
   */
  setRole(role: UserRole): UserProfile {
    const current = this.getCurrentUser();
    const updated = { ...current, role };
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    }
    return updated;
  },

  /**
   * Log out active session
   */
  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },

  /**
   * Return list of available system roles
   */
  getRoles(): UserRole[] {
    return AVAILABLE_ROLES;
  },
};
