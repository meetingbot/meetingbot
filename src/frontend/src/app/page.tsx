"use client";
import { Skeleton } from "~/components/ui/skeleton";
import WelcomeDashboard from "./components/WelcomeDashboard";
import { trpcReact } from "~/trpc/trpc-react";
import ErrorAlert from "../components/custom/ErrorAlert";
import Dashboard from "./components/Dashboard";
import { useSession } from "~/contexts/SessionContext";

export default function Home() {
  const {
    session,
    isLoading: isSessionLoading,
    error: sessionError,
  } = useSession();
  const { data, isLoading, error } = trpcReact.apiKeys.getApiKeyCount.useQuery(
    {},
    {
      enabled: !!session?.user?.id,
    },
  );

  return (
    <main>
      {isSessionLoading || (!!session?.user?.id && isLoading) ? ( // if loading, show skeleton
        <div>
          <div className="mb-5 mt-5">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="mt-2 h-5 w-96" />
          </div>
          <div>
            <div className="grid h-full gap-6 lg:grid-cols-3">
              <div className="grid h-full gap-6 md:col-span-2 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Skeleton className="h-40 w-full" />
                </div>
                <div>
                  <Skeleton className="h-48 w-full" />
                </div>
                <div>
                  <Skeleton className="h-48 w-full" />
                </div>
              </div>
              <div className="col-span-full h-full md:col-span-1 md:row-span-2">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          </div>
        </div>
      ) : error || sessionError ? ( // if error, show error alert
        <ErrorAlert
          errorMessage={
            error?.message ??
            sessionError?.message ??
            "An unknown error occurred"
          }
        />
      ) : !session?.user?.id || data?.count === 0 ? ( // if user is not logged in or has no api keys, show welcome dashboard
        <WelcomeDashboard />
      ) : (
        // if user has api keys, show dashboard
        <Dashboard />
      )}
    </main>
  );
}
