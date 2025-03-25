# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

# MeetingBot Backend

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

### Project Initialization

1. Navigate to the backend folder:

   ```
   cd src/backend
   ```

2. Install dependencies using pnpm:

   ```
   pnpm install
   ```

3. Configure environment variables:
   1. Copy `.env.example` to `.env`
   2. Set-up a GitHub App to generate `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`. You can follow Auth.js's guide: [Registering your App](https://authjs.dev/guides/configuring-github?framework=next-js#registering-your-app).
   3. Execute `npx auth` to generate an `AUTH_SECRET`.
   4. Update the rest of the values in `.env` with your configuration

### Running the Server

To start the server, run:

```
pnpm dev
```

The Express app will run at `http://localhost:{env.PORT}`.

### Technology Stack

- **Express**: Web framework for handling HTTP requests and middleware
- **tRPC**: End-to-end typesafe API layer with automatic OpenAPI generation
- **Drizzle ORM**: Typesafe SQL query builder and schema definition
- **PostgreSQL**: Relational database for storing user and bot data
- **Swagger UI**: Interactive API documentation viewer

### API Documentation

After running the server, you can access the API documentation.

### Testing

The test suite has not been implemented yet. This section will be updated once testing is set up.

### Docker

Docker support has not been implemented yet. This section will be updated once Docker configuration is set up.
