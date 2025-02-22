"use client";

import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    // Redirect to GitHub OAuth using standard Auth.js endpoint
    router.push(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signout`);
  };

  return (
    <button
      onClick={handleSignOut}
      className="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700"
    >
      Sign Out
    </button>
  );
}
