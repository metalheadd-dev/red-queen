"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authIdentifier: string;
  loginWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  logout: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  authIdentifier: "",
  loginWithEmail: async () => ({ error: "Auth client not initialized" }),
  signUpWithEmail: async () => ({ user: null, error: "Auth client not initialized" }),
  logout: async () => ({ error: "Auth client not initialized" }),
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Computed virtual address identifier used to query databases
  const authIdentifier = user ? `email-auth:${user.id}` : "";

  useEffect(() => {
    if (!supabaseClient) {
      setLoading(false);
      return;
    }

    // Get current session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen to changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    if (!supabaseClient) return { error: new Error("Supabase client is not configured. Add NEXT_PUBLIC_SUPABASE_ANON_KEY.") };
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error };
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabaseClient) return { user: null, error: new Error("Supabase client is not configured. Add NEXT_PUBLIC_SUPABASE_ANON_KEY.") };
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        }
      });
      if (error) return { user: null, error };
      return { user: data.user, error: null };
    } catch (err: any) {
      return { user: null, error: err };
    }
  };

  const logout = async () => {
    if (!supabaseClient) return { error: new Error("Supabase client is not configured.") };
    try {
      const { error } = await supabaseClient.auth.signOut();
      setUser(null);
      setSession(null);
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        authIdentifier,
        loginWithEmail,
        signUpWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
