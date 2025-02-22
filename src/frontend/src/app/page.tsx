"use client";

import { SignInButton } from "@/components/auth/SignInButton";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { type Session } from "@auth/core/types";
import Image from "next/image";
import { useEffect, useState } from "react";

async function getSession(): Promise<Session | null> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/session`,
    {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<Session>;
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    void getSession().then(setSession);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        Session: {String(session)}
        {session?.user ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User avatar"}
                  className="h-12 w-12 rounded-full"
                  width={48}
                  height={48}
                />
              )}
              <div>
                <p className="text-xl font-bold">{session.user.name}</p>
                <p className="text-gray-500">{session.user.email}</p>
              </div>
            </div>
            <SignOutButton />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-bold">Welcome to MeetingBot</h1>
            <p className="text-gray-500">Please sign in to continue</p>
            <SignInButton />
          </div>
        )}
      </div>
    </main>
  );
}
