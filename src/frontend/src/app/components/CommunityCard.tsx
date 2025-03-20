import { ExternalLink, User, Users } from "lucide-react";
import DashboardCard from "./DashboardCard";
import { trpcReact } from "~/trpc/trpc-react";
import { Skeleton } from "~/components/ui/skeleton";
import ErrorAlert from "~/components/custom/ErrorAlert";
import { Separator } from "~/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { Button } from "~/components/ui/button";

interface CommunityUpdate {
  className?: string;
}

export default function CommunityCard({ className }: CommunityUpdate) {
  const {
    data: communityUpdates,
    isLoading,
    error,
  } = trpcReact.community.getCommunityUpdates.useQuery({});
  return (
    <DashboardCard
      title="Community Updates"
      className={`flex flex-col ${className}`}
      icon={<Users className="text-slate-500" />}
      link={{
        type: "CUSTOM",
        component: (
          <div className="flex items-center gap-4">
            <Link
              href="https://discord.gg/hPdjJW9xzT"
              className="flex items-center"
            >
              Join Our Community
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="https://github.com/meetingbot/meetingbot"
              className="flex items-center"
            >
              Contribute
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </div>
        ),
      }}
      content={
        <div className="h-full min-h-0 flex-1">
          <div className="h-full overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold">
                    <Skeleton className="h-4 w-20" />
                  </h3>
                  <div className="flex flex-col gap-2 text-sm text-gray-500">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Separator />
                </div>
              ))
            ) : error ? (
              <ErrorAlert errorMessage={error.message} />
            ) : (
              <div className="flex flex-col gap-4">
                {communityUpdates.map((update, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={update.imageUrl} />
                        <AvatarFallback>
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-lg font-semibold">{update.title}</h3>
                      {update.link && (
                        <Link href={update.link} className="flex items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex items-center justify-center rounded-full"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                    <div className="prose line-clamp-5 text-sm text-gray-500">
                      <ReactMarkdown>{update.description}</ReactMarkdown>
                    </div>

                    <Separator />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}
