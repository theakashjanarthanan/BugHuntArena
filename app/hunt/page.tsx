"use client";

import { BugHunt } from "@/components/bug-hunt";
import { AppShell } from "@/components/app-shell";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function HuntPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state
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
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session && !firebaseUser) {
    return null;
  }

  return (
    <AppShell>
      <BugHunt />
    </AppShell>
  );
}
