"use client";

import { SessionProvider } from "next-auth/react";
import { api } from "~/utils/trpc";
import { TRPCProvider } from "@trpc/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider client={api}>
      <SessionProvider>{children}</SessionProvider>
    </TRPCProvider>
  );
}
