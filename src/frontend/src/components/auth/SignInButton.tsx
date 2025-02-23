"use client";

import { useRouter } from "next/navigation";

export function SignInButton() {
  const router = useRouter();

  const handleSignIn = async () => {
    // Redirect to GitHub OAuth using standard Auth.js endpoint
    router.push(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signin?provider=github`,
    );
  };

  return (
    <button
      onClick={handleSignIn}
      className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
    >
      Sign in with GitHub
    </button>
  );
}
