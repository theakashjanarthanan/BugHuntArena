"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { AppShell } from "@/components/app-shell";
import { Leaderboard } from "@/components/leaderboard";

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading && status === "unauthenticated" && !firebaseUser) {
      router.push("/auth");
    }
  }, [status, firebaseUser, isLoading, router]);

  if (isLoading || status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session && !firebaseUser) return null;

  return (
    <AppShell>
      <Leaderboard />
    </AppShell>
  );
}
