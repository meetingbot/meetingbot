"use client";

import { type Session } from "@auth/core/types";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { env } from "~/env";

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function getSession(): Promise<Session | null> {
    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_BACKEND_URL}/api/auth/session`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch session: ${response.statusText}`);
      }

      return response.json() as Promise<Session>;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error("An unknown error occurred while fetching the session");
    }
  }

  useEffect(() => {
    void getSession()
      .then((session) => {
        setSession(session);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setSession(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <SessionContext.Provider value={{ session, isLoading, error }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
