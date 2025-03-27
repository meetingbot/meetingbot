import "~/styles/globals.css";

import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import NavigationBar from "./components/NavigationBar";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "MeetingBot",
  description:
    "A user-friendly interface for managing and scheduling meetings effortlessly.",
  icons: [{ rel: "icon", url: "/logo.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TRPCReactProvider>
          <SessionProvider>
            <div className="flex h-full w-full flex-col items-center justify-center">
              <NavigationBar />
              <div className="container h-full">{children}</div>
            </div>
          </SessionProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
