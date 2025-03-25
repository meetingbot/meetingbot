import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { TRPCProvider } from "~/trpc/trpc-react";
import NavigationBar from "./components/NavigationBar";
import { SessionProvider } from "~/contexts/SessionContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "MeetingBot",
  description: "A user-friendly interface for managing and scheduling meetings effortlessly.",
  icons: [{ rel: "icon", url: "/logo.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <TRPCProvider>
          <SessionProvider>
            <div className="flex h-full w-full flex-col items-center justify-center">
              <NavigationBar />
              <div className="container h-full">{children}</div>
            </div>
          </SessionProvider>
        </TRPCProvider>
        <Toaster />
      </body>
    </html>
  );
}
