import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { AppUser, AccountType } from "@/types/database";
import { Session } from "@supabase/supabase-js";

interface SignUpCredentials {
  email: string;
  password: string;
  name: string;
  accountType: AccountType;
}

interface AuthContextValue {
  user: AppUser | null;
  /** Sync mirror of `user`, updated in signIn before setState so route guards see the session immediately */
  routeUserRef: React.MutableRefObject<AppUser | null>;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AppUser>;
  signUp: (credentials: SignUpCredentials) => Promise<{ emailVerificationSent: boolean }>;
  verifyOTP: (email: string, token: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setNewPassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const routeUserRefFallback: React.MutableRefObject<AppUser | null> = { current: null };

const AuthContext = createContext<AuthContextValue>({
  user: null,
  routeUserRef: routeUserRefFallback,
  session: null,
  isLoading: true,
  signIn: async () => {
    throw new Error("AuthProvider not mounted");
  },
  signUp: async () => ({ emailVerificationSent: false }),
  verifyOTP: async () => {},
  resendOTP: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  setNewPassword: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const routeUserRef = useRef<AppUser | null>(null);

  // Only mirror non-null `user` into the ref. Mirroring `null` would race with signIn:
  // signIn sets routeUserRef synchronously then setUser; before commit, `user` can still
  // be null and would wipe the ref and break post-login redirects.
  useEffect(() => {
    if (user !== null) {
      routeUserRef.current = user;
    }
  }, [user]);

  const buildAppUser = useCallback(async (supabaseUser: { id: string; email?: string; user_metadata?: Record<string, unknown>; created_at: string }): Promise<AppUser | null> => {
    if (!supabaseUser) return null;

    const accountType = supabaseUser.user_metadata?.account_type as AccountType;
    let name = (supabaseUser.user_metadata?.name as string) || "";
    let status: AppUser["status"] = "pending";

    try {
      // Check admin first
      const { data: adminData } = await supabase
        .from("admins")
        .select("name")
        .eq("id", supabaseUser.id)
        .maybeSingle();

      const adminRow = adminData as unknown as { name: string } | null;
      if (adminRow) {
        return {
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          name: adminRow.name || name,
          accountType: "admin",
          created_at: supabaseUser.created_at,
          status: "approved",
        };
      }

      if (accountType === "investor") {
        const { data } = await supabase
          .from("investors")
          .select("name, status")
          .eq("id", supabaseUser.id)
          .maybeSingle();
        const row = data as unknown as { name: string; status: AppUser["status"] } | null;
        if (row) {
          name = row.name || name;
          status = row.status;
        }
      } else if (accountType === "startup") {
        const { data } = await supabase
          .from("startups")
          .select("name, status")
          .eq("id", supabaseUser.id)
          .maybeSingle();
        const row = data as unknown as { name: string; status: AppUser["status"] } | null;
        if (row) {
          name = row.name || name;
          status = row.status;
        }
      }
    } catch {
      // Use auth metadata fallback
    }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name,
      accountType: accountType || "startup",
      created_at: supabaseUser.created_at,
      status,
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const appUser = await buildAppUser(data.user);
      routeUserRef.current = appUser;
      setUser(appUser);
    }
  }, [buildAppUser]);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: import("@supabase/supabase-js").Session | null } }) => {
      setSession(session);
      if (session?.user) {
        const appUser = await buildAppUser(session.user);
        routeUserRef.current = appUser;
        setUser(appUser);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: import("@supabase/supabase-js").Session | null) => {
        // Only clear user on explicit sign-out. Supabase may emit other events where
        // `session` is briefly null; clearing `user` there races with signIn and sends
        // users back to the auth stack until the next cold start reloads from storage.
        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          routeUserRef.current = null;
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          setSession(session);
          const appUser = await buildAppUser(session.user);
          routeUserRef.current = appUser;
          setUser(appUser);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [buildAppUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session ?? data.session;
    const authUser = session?.user ?? data.user;
    if (session) setSession(session);
    if (!authUser) {
      throw new Error("Sign-in succeeded but no user in session");
    }
    const appUser = await buildAppUser(authUser);
    if (!appUser) {
      throw new Error("Could not build user profile");
    }
    routeUserRef.current = appUser;
    setUser(appUser);
    return appUser;
  }, [buildAppUser]);

  const signUp = useCallback(async (credentials: SignUpCredentials) => {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          name: credentials.name,
          account_type: credentials.accountType,
        },
      },
    });
    if (error) throw error;
    return {
      emailVerificationSent: !data.user?.email_confirmed_at,
    };
  }, []);

  const verifyOTP = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) throw error;
  }, []);

  const resendOTP = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    routeUserRef.current = null;
    setUser(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "bathra://auth/callback",
    });
    if (error) throw error;
  }, []);

  const setNewPassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        routeUserRef,
        session,
        isLoading,
        signIn,
        signUp,
        verifyOTP,
        resendOTP,
        signOut,
        resetPassword,
        setNewPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Use for redirects/guards right after login — React context may lag one frame behind SecureStore/session */
export function useRouteUser() {
  const { user, routeUserRef } = useAuth();
  return user ?? routeUserRef.current;
}
