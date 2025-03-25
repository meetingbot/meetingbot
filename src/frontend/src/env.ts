import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().startsWith("postgres://"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    AUTH_GITHUB_ID: z.string().min(1),
    AUTH_GITHUB_SECRET: z.string().min(1),
    AUTH_SECRET: z
      .string()
      .min(1, "AUTH_SECRET is required. Run `npx auth` to generate one."),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    AWS_BUCKET_NAME: z.string().min(1),
    AWS_REGION: z.string().min(1),
    GITHUB_TOKEN: z.string().min(1),
    ECS_TASK_DEFINITION_MEET: z.string().default(""),
    ECS_TASK_DEFINITION_TEAMS: z.string().default(""),
    ECS_TASK_DEFINITION_ZOOM: z.string().default(""),
    ECS_SUBNETS: z
      .preprocess(
        (val) => (typeof val === "string" ? val.split(",") : []),
        z.array(z.string()),
      )
      .default([]),
    ECS_SECURITY_GROUPS: z
      .preprocess(
        (val) => (typeof val === "string" ? val.split(",") : []),
        z.array(z.string()),
      )
      .default([]),
    ECS_CLUSTER_NAME: z.string().default(""),
    BASE_URL: z.string().url().default("http://localhost:3000"),
  },
  client: {},
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    AWS_REGION: process.env.AWS_REGION,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    ECS_TASK_DEFINITION_MEET: process.env.ECS_TASK_DEFINITION_MEET,
    ECS_TASK_DEFINITION_TEAMS: process.env.ECS_TASK_DEFINITION_TEAMS,
    ECS_TASK_DEFINITION_ZOOM: process.env.ECS_TASK_DEFINITION_ZOOM,
    ECS_SUBNETS: process.env.ECS_SUBNETS,
    ECS_SECURITY_GROUPS: process.env.ECS_SECURITY_GROUPS,
    ECS_CLUSTER_NAME: process.env.ECS_CLUSTER_NAME,
    BASE_URL: process.env.BASE_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: false,
});
