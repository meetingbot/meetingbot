# Example application

This is an example application with the intention of helping you understand how the project can intergrate into your own code bases.
Thus, this application is a skeleton project with its own standalone front and backend, created using Next.JS.

## Running

Ensure the backend and frontend are both running. 

```bash
cd meetinbot/src/backend/
pnpm run dev
```

```bash
cd meetingbot/src/frontend/
pnpm run dev
```

Follow any running instructions found in their respective `README.md` files.

Copy the `.env.example` file and rename it `.env`. Then, fill in the environment variables with your own values, produced using the frontend / backend.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) (or, if both frontend/backend are open, [http://localhost:3002](http://localhost:3002)) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
