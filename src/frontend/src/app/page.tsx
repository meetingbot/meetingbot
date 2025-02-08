import Link from "next/link";

import { trpcVanilla } from "~/trpc/trpc-vanilla";

export default async function Home() {
  const bots = await trpcVanilla.bots.getBots.query({});

  return (
    <main>
      <h1>Content</h1>
    </main>
  );
}
