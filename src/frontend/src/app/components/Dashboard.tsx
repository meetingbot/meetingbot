import DashboardCard from "./DashboardCard";

import { useSession } from "~/contexts/SessionContext";
import CommunityCard from "./CommunityCard";
import { Bot, ChartLine, Key } from "lucide-react";

export default function Dashboard() {
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
        <div className="grid h-full grid-cols-3 gap-6">
          <div className="h-full">
            <DashboardCard
              title="Active Bots"
              content={<div>32</div>}
              icon={<Bot />}
              link={{
                type: "INTERNAL",
                url: "/bots",
                text: "View Bots",
              }}
            />
          </div>
          <div className="h-full">
            <DashboardCard
              title="Active Keys"
              content={<div>32</div>}
              icon={<Key />}
              link={{
                type: "INTERNAL",
                url: "/keys",
                text: "View Keys",
              }}
            />
          </div>
          <div className="h-full">
            <DashboardCard
              title="Usage This Week"
              content={<div>32</div>}
              icon={<ChartLine />}
              link={{
                type: "INTERNAL",
                url: "/usage",
                text: "View Usage",
              }}
            />
          </div>
          <div className="row-span-2">
            <CommunityCard className="max-h-72 overflow-hidden overflow-y-auto" />
          </div>
          <div className="col-span-2 row-span-2">
            <DashboardCard
              title="Your Recent Usage"
              content={<div></div>}
              link={{
                type: "INTERNAL",
                url: "/usage",
                text: "View Usage",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
