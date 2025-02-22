import { auth } from "@/auth";

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    return <div>Not authenticated</div>;
  }

  return <div>{JSON.stringify(session, null, 2)}</div>;
}
