"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard";

export default function DashboardPage() {
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
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session && !firebaseUser) {
    return null;
  }

  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
