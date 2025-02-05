import DashboardCard from "./DashboardCard";
import { File, Users, Bell, Plus, LogIn } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useSession } from "~/contexts/SessionContext";
import Link from "next/link";

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
        <div className="grid h-full gap-6 lg:grid-cols-3">
          <div className="grid h-full gap-6 md:col-span-2 md:grid-cols-2">
            <div className="md:col-span-2">
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
                      href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signin?provider=github`}
                    >
                      <Button>
                        Sign In <LogIn />
                      </Button>
                    </Link>
                  )
                }
              />
            </div>
            <div className="">
              <DashboardCard
                title="View our Docs"
                className="h-full"
                content="To learn more about how to create bots, pull meeting recordings, pull transcriptions and more, view our Documentation!"
                icon={<File className="text-slate-500" />}
                link={{
                  type: "EXTERNAL",
                  url: `${process.env.NEXT_PUBLIC_BACKEND_URL}`,
                  text: "View Documentation",
                }}
              />
            </div>
            <div className="">
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

          <div className="col-span-full h-full md:col-span-1 md:row-span-2">
            <DashboardCard
              title="Community Updates"
              className="h-full"
              content={
                <div>
                  <p>
                    We&apos;re currently working on a new feature that will
                    allow you to create bots from your own recordings.
                  </p>
                  <p>Stay tuned!</p>
                </div>
              }
              icon={<Bell className="text-slate-500" />}
            />
          </div>
        </div>
      </div>
    </>
  );
}
