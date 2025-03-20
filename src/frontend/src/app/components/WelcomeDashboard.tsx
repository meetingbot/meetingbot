import DashboardCard from "./DashboardCard";
import { File, Plus, LogIn, Users } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useSession } from "~/contexts/SessionContext";
import Link from "next/link";
import { env } from "~/env";
import CommunityCard from "./CommunityCard";

export default function WelcomeDashboard() {
  const { session } = useSession();
  return (
    <>
      <div className="mb-5 mt-5">
        <h1 className="text-3xl font-bold">
          Welcome to Meeting Bot
          {session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-2 text-gray-600">
          Easily create automated applications that leverage recordings across
          popular video meeting platforms.
        </p>
      </div>
      <div>
        <div className="grid h-[30rem] gap-6 lg:grid-cols-3">
          <div className="grid h-full min-h-0 gap-6 lg:col-span-2">
            <div className="grid h-full min-h-0 grid-rows-[auto_1fr] gap-6">
              <div className="min-h-0">
                <DashboardCard
                  title="Get Started"
                  description={
                    session?.user
                      ? "To start creating bots, create your first API Key!"
                      : "To get started, log-in or sign-up!"
                  }
                  content={
                    session?.user ? (
                      <Link href="/keys">
                        <Button>
                          Create API Key <Plus />
                        </Button>
                      </Link>
                    ) : (
                      <Link
                        href={`${env.NEXT_PUBLIC_BACKEND_URL}/api/auth/signin?provider=github`}
                      >
                        <Button>
                          Sign In <LogIn />
                        </Button>
                      </Link>
                    )
                  }
                />
              </div>
              <div className="grid min-h-0 gap-6 md:grid-cols-2">
                <div className="min-h-0">
                  <DashboardCard
                    title="View our Docs"
                    className="h-full"
                    content="To learn more about how to create bots, pull meeting recordings, pull transcriptions and more, view our Documentation!"
                    icon={<File className="text-slate-500" />}
                    link={{
                      type: "EXTERNAL",
                      url: `${env.NEXT_PUBLIC_BACKEND_URL}/docs`,
                      text: "View Documentation",
                    }}
                  />
                </div>
                <div className="min-h-0">
                  <DashboardCard
                    title="Join our Community"
                    className="h-full"
                    content="To seek support, suggest features, report bugs and contribute yourself, join our Community!"
                    icon={<Users className="text-slate-500" />}
                    link={{
                      type: "EXTERNAL",
                      url: "https://discord.gg/hPdjJW9xzT",
                      text: "Join Community",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="h-full min-h-0 lg:col-span-1">
            <CommunityCard className="h-full" />
          </div>
        </div>
      </div>
    </>
  );
}
