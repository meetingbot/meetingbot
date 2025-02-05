import Card from "./components/card";
import { Plus, Users, File, Bell } from "lucide-react";
import { Button } from "~/components/ui/button";

export default async function Home() {
  return (
    <main>
      <div className="mb-5 mt-5">
        <h1 className="text-3xl font-bold">Welcome to Meeting Bot, Sarah!</h1>
        <p className="mt-2 text-gray-600">
          Easily create automated applications that leverage recordings across
          popular video meeting platforms.
        </p>
      </div>
      <div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="grid gap-6 md:col-span-2 md:grid-cols-2">
            <div className="md:col-span-2">
              <Card
                title="Get Started"
                description="To start creating bots, create your first API Key!"
                content={
                  <Button>
                    Create API Key <Plus />
                  </Button>
                }
                link={{
                  type: "INTERNAL",
                  url: "/keys",
                  text: "Create API Key",
                }}
              />
            </div>
            <div className="">
              <Card
                title="View our Docs"
                content="To learn more about how to create bots, pull meeting recordings, pull transcriptions and more, view our Documentation!"
                icon={<File className="text-slate-500" />}
                link={{
                  type: "EXTERNAL",
                  url: "/docs",
                  text: "View Documentation",
                }}
              />
            </div>
            <div className="">
              <Card
                title="Join our Community"
                content="To seek support, suggest features, report bugs and contribute yourself, join our Community!"
                icon={<Users className="text-slate-500" />}
                link={{
                  type: "EXTERNAL",
                  url: "/community",
                  text: "Join Community",
                }}
              />
            </div>
          </div>

          <div className="col-span-full md:col-span-1 md:row-span-2">
            <Card
              title="Community Updates"
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
    </main>
  );
}
