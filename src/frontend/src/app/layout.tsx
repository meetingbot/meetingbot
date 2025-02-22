import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { TRPCProvider } from "~/trpc/trpc-react";
import Navbar from "./components/navbar";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Open Source Meeting Bot",
  description: "Open Source Meeting Bot",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <SessionProvider session={session}>
          <TRPCProvider>
            <div className="flex h-full w-full flex-col items-center justify-center">
              <Navbar />
              <div className="container h-full">{children}</div>
            </div>
          </TRPCProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
