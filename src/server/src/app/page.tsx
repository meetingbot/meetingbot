import { auth } from "~/server/auth";
import Dashboard from "./components/Dashboard";
import WelcomeDashboard from "./components/WelcomeDashboard";
import { api } from "~/trpc/server";

export default async function Home() {
  const session = await auth();

  // Prefetch API key count for client components
  await api.apiKeys.getApiKeyCount.prefetch({});

  const showWelcome = !session;

  return <main>{showWelcome ? <WelcomeDashboard /> : <Dashboard />}</main>;
}
