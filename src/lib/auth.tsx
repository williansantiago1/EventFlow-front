import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "./api";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type OrganizerMembership = {
  organizerId: string;
  name: string;
  slug: string;
  role: "OWNER" | "MANAGER" | "CHECKIN";
};

type AuthContextValue = {
  user: AuthUser | null;
  memberships: OrganizerMembership[];
  loading: boolean;
  isOrganizer: boolean;
  canManageEvents: boolean;
  canCheckIn: boolean;
  login: (email: string, password: string) => Promise<OrganizerMembership[]>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<OrganizerMembership[]>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type SessionPayload = {
  user: AuthUser;
  memberships?: OrganizerMembership[];
};

function applySession(
  data: SessionPayload,
  setUser: (user: AuthUser | null) => void,
  setMemberships: (items: OrganizerMembership[]) => void,
): OrganizerMembership[] {
  const memberships = data.memberships ?? [];
  setUser(data.user);
  setMemberships(memberships);
  return memberships;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [memberships, setMemberships] = useState<OrganizerMembership[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const data = await apiFetch<SessionPayload>("/api/v1/auth/me");
      applySession(data, setUser, setMemberships);
    } catch {
      setUser(null);
      setMemberships([]);
      localStorage.removeItem("ef_access");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshMe();
      setLoading(false);
    })();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<SessionPayload & { accessToken?: string }>(
      "/api/v1/auth/login",
      {
        method: "POST",
        json: { email, password },
      },
    );
    return applySession(data, setUser, setMemberships);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await apiFetch<SessionPayload & { accessToken?: string }>(
        "/api/v1/auth/register",
        {
          method: "POST",
          json: { name, email, password },
        },
      );
      return applySession(data, setUser, setMemberships);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("ef_access");
      setUser(null);
      setMemberships([]);
    }
  }, []);

  const canManageEvents = memberships.some(
    (item) => item.role === "OWNER" || item.role === "MANAGER",
  );
  const canCheckIn = memberships.some(
    (item) =>
      item.role === "OWNER" || item.role === "MANAGER" || item.role === "CHECKIN",
  );

  const value = useMemo(
    () => ({
      user,
      memberships,
      loading,
      isOrganizer: memberships.length > 0,
      canManageEvents,
      canCheckIn,
      login,
      register,
      logout,
      refreshMe,
    }),
    [
      user,
      memberships,
      loading,
      canManageEvents,
      canCheckIn,
      login,
      register,
      logout,
      refreshMe,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
