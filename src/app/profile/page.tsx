"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, User } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = (session?.user as any)?.id;

  useEffect(() => {
    if (userId) {
      router.replace(`/profile/${userId}`);
    }
  }, [userId, router]);

  if (status === "loading" || userId) {
    return (
      <div className="flex justify-center py-20">
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: "var(--cg-accent)" }}
        />
      </div>
    );
  }

  return (
    <div
      className="mx-auto max-w-2xl px-4 py-20 text-center"
      style={{ color: "var(--cg-text-primary)" }}
    >
      <User className="mx-auto h-16 w-16" style={{ color: "var(--cg-text-muted)" }} />
      <h1 className="mt-4 font-display text-2xl font-bold">Profile</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--cg-text-muted)" }}>
        Sign in to manage your profile and GHIN settings.
      </p>
    </div>
  );
}
