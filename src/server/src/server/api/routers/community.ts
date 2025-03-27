import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { Octokit } from "@octokit/core";
import { env } from "~/env";

const githubEventPayloads = {
  PullRequestEvent: z.object({
    action: z.enum(["opened", "closed"]),
    pull_request: z.object({
      title: z.string(),
      body: z.string().optional(),
      html_url: z.string().url(),
      merged: z.boolean().optional(),
    }),
  }),
  IssuesEvent: z.object({
    action: z.enum(["opened", "closed"]),
    issue: z.object({
      title: z.string(),
      body: z.string().optional(),
      html_url: z.string().url(),
    }),
  }),
  ReleaseEvent: z.object({
    action: z.literal("published"),
    release: z.object({
      name: z.string().optional(),
      tag_name: z.string(),
      body: z.string().optional(),
      html_url: z.string().url(),
    }),
  }),
  ForkEvent: z.object({
    forkee: z.object({
      html_url: z.string().url(),
    }),
  }),
  WatchEvent: z.object({
    action: z.literal("started"),
  }),
  IssueCommentEvent: z.object({
    comment: z.object({
      body: z.string().optional(),
      html_url: z.string().url(),
    }),
  }),
  PushEvent: z.object({
    size: z.number(),
    ref: z.string(),
    before: z.string(),
    head: z.string(),
  }),
};

const communityUpdate = z.object({
  source: z.enum(["discord", "github"]),
  imageUrl: z.string().url().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  dateTime: z.date().optional(),
  link: z.string().url().optional(),
});

type CommunityUpdate = z.infer<typeof communityUpdate>;

export const communityRouter = createTRPCRouter({
  getCommunityUpdates: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/community/updates",
        description: "Retrieve a list of all community updates",
      },
    })
    .input(z.object({}))
    .output(z.array(communityUpdate))
    .query(async () => {
      // Fetch GitHub updates (limited to 10 most recent)
      const octokit = new Octokit({
        auth: env.GITHUB_TOKEN,
      });
      const events = await octokit.request("GET /repos/{owner}/{repo}/events", {
        owner: "meetingbot",
        repo: "meetingbot",
        per_page: 20, // Limit to 20 most recent events
      });

      // Transform events (PR merges, comments, etc)
      const eventUpdates: CommunityUpdate[] = [];
      events.data.forEach((event) => {
        try {
          switch (event.type) {
            case "PullRequestEvent": {
              const result = githubEventPayloads.PullRequestEvent.safeParse(
                event.payload,
              );
              if (!result.success) return;

              const { action, pull_request } = result.data;
              const isMerged = pull_request.merged ?? false;
              const actionText = isMerged ? "merged" : action;

              eventUpdates.push({
                source: "github",
                imageUrl: event.actor.avatar_url,
                title: `PR ${actionText}: ${pull_request.title}`,
                description: pull_request.body,
                dateTime: event.created_at
                  ? new Date(event.created_at)
                  : undefined,
                link: pull_request.html_url,
              });
              break;
            }

            case "IssuesEvent": {
              const result = githubEventPayloads.IssuesEvent.safeParse(
                event.payload,
              );
              if (!result.success) return;

              const { action, issue } = result.data;
              eventUpdates.push({
                source: "github",
                imageUrl: event.actor.avatar_url,
                title: `Issue ${action}: ${issue.title}`,
                description: issue.body,
                dateTime: event.created_at
                  ? new Date(event.created_at)
                  : undefined,
                link: issue.html_url,
              });
              break;
            }

            case "ReleaseEvent": {
              const result = githubEventPayloads.ReleaseEvent.safeParse(
                event.payload,
              );
              if (!result.success) return;

              const { release } = result.data;
              eventUpdates.push({
                source: "github",
                imageUrl: event.actor.avatar_url,
                title: `New Release: ${release.name ?? release.tag_name}`,
                description: release.body,
                dateTime: event.created_at
                  ? new Date(event.created_at)
                  : undefined,
                link: release.html_url,
              });
              break;
            }

            case "ForkEvent": {
              const result = githubEventPayloads.ForkEvent.safeParse(
                event.payload,
              );
              if (!result.success) return;

              const { forkee } = result.data;
              eventUpdates.push({
                source: "github",
                imageUrl: event.actor.avatar_url,
                title: `New Fork Created`,
                description: `${event.actor.login} forked ${event.repo.name}`,
                dateTime: event.created_at
                  ? new Date(event.created_at)
                  : undefined,
                link: forkee.html_url,
              });
              break;
            }

            case "WatchEvent": {
              const result = githubEventPayloads.WatchEvent.safeParse(
                event.payload,
              );
              if (!result.success) return;

              eventUpdates.push({
                source: "github",
                imageUrl: event.actor.avatar_url,
                title: `New Star`,
                description: `${event.actor.login} starred ${event.repo.name}`,
                dateTime: event.created_at
                  ? new Date(event.created_at)
                  : undefined,
                link: `https://github.com/${event.repo.name}`,
              });
              break;
            }

            case "IssueCommentEvent":
            case "PullRequestReviewCommentEvent": {
              const result = githubEventPayloads.IssueCommentEvent.safeParse(
                event.payload,
              );
              if (!result.success) return;

              const { comment } = result.data;
              eventUpdates.push({
                source: "github",
                imageUrl: event.actor.avatar_url,
                title: `New comment by ${event.actor.login}`,
                description: comment.body,
                dateTime: event.created_at
                  ? new Date(event.created_at)
                  : undefined,
                link: comment.html_url,
              });
              break;
            }

            case "PushEvent": {
              const result = githubEventPayloads.PushEvent.safeParse(
                event.payload,
              );
              if (!result.success) return;

              const { size, ref } = result.data;
              const branchName = ref.replace("refs/heads/", "");
              eventUpdates.push({
                source: "github",
                imageUrl: event.actor.avatar_url,
                title: `Code Push to ${branchName}`,
                description: `${event.actor.login} pushed ${size} commit${size === 1 ? "" : "s"}`,
                dateTime: event.created_at
                  ? new Date(event.created_at)
                  : undefined,
                link: `https://github.com/${event.repo.name}/commits/${branchName}`,
              });
              break;
            }
          }
        } catch (error) {
          console.error(`Failed to process ${event.type} event:`, error);
        }
      });

      // Combine all updates and sort by date
      return [...eventUpdates].sort(
        (a, b) => (b?.dateTime?.getTime() ?? 0) - (a?.dateTime?.getTime() ?? 0),
      );
    }),
});
