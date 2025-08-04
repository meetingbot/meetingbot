import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    AUTH_GITHUB_ID:
      process.env.NODE_ENV === "test"
        ? z.preprocess(() => "fake_github_id", z.string())
        : z.string(),
    AUTH_GITHUB_SECRET:
      process.env.NODE_ENV === "test"
        ? z.preprocess(() => "fake_github_secret", z.string())
        : z.string(),
    DATABASE_URL:
      process.env.NODE_ENV === "test"
        ? z.preprocess(
            () => "postgresql://fake_user:fake_password@localhost:5432/fake_db",
            z.string(),
          )
        : z.string().url().startsWith("postgresql://"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    GITHUB_TOKEN:
      process.env.NODE_ENV === "test"
        ? z.preprocess(() => "fake_github_token", z.string())
        : z.string(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_BUCKET_NAME:
      process.env.NODE_ENV === "test"
        ? z.preprocess(() => "fake_aws_bucket_name", z.string())
        : z.string(),
    AWS_REGION:
      process.env.NODE_ENV === "test"
        ? z.preprocess(() => "fake_aws_region", z.string())
        : z.string(),
    ECS_TASK_DEFINITION_MEET:
      process.env.DEPLOYMENT_MODE === "aws"
        ? z.string()
        : z.string().default(""),
    ECS_TASK_DEFINITION_TEAMS:
      process.env.DEPLOYMENT_MODE === "aws"
        ? z.string()
        : z.string().default(""),
    ECS_TASK_DEFINITION_ZOOM:
      process.env.DEPLOYMENT_MODE === "aws"
        ? z.string()
        : z.string().default(""),
    ECS_CLUSTER_NAME:
      process.env.DEPLOYMENT_MODE === "aws"
        ? z.string()
        : z.string().default(""),
    ECS_SUBNETS:
      process.env.DEPLOYMENT_MODE === "aws"
        ? z.preprocess(
            (val) => (typeof val === "string" ? val.split(",") : []),
            z.array(z.string()),
          )
        : z.array(z.string()).default([]),
    ECS_SECURITY_GROUPS:
      process.env.DEPLOYMENT_MODE === "aws"
        ? z.preprocess(
            (val) => (typeof val === "string" ? val.split(",") : []),
            z.array(z.string()),
          )
        : z.array(z.string()).default([]),
    // Docker Compose deployment settings
    DEPLOYMENT_MODE: z.enum(["aws", "docker-compose"]).default("aws"),
    DOCKER_HOST: z.string().optional(),
    BOT_NETWORK: z.string().default("meetingbot_network"),
    S3_ENDPOINT: z.string().optional(),
    S3_FORCE_PATH_STYLE: z.string().optional(),
    NEXTAUTH_URL: z.string().url().optional(),
    AUTH_TRUST_HOST: z.string().optional(),
    NEXTAUTH_TRUST_HOST: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    AWS_REGION: process.env.AWS_REGION,
    ECS_TASK_DEFINITION_MEET: process.env.ECS_TASK_DEFINITION_MEET,
    ECS_TASK_DEFINITION_TEAMS: process.env.ECS_TASK_DEFINITION_TEAMS,
    ECS_TASK_DEFINITION_ZOOM: process.env.ECS_TASK_DEFINITION_ZOOM,
    ECS_CLUSTER_NAME: process.env.ECS_CLUSTER_NAME,
    ECS_SUBNETS: process.env.ECS_SUBNETS,
    ECS_SECURITY_GROUPS: process.env.ECS_SECURITY_GROUPS,
    DEPLOYMENT_MODE: process.env.DEPLOYMENT_MODE,
    DOCKER_HOST: process.env.DOCKER_HOST,
    BOT_NETWORK: process.env.BOT_NETWORK,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    NEXTAUTH_TRUST_HOST: process.env.NEXTAUTH_TRUST_HOST,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
