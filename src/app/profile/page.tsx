"use client";

import { useSession } from "next-auth/react";
import { User, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <User className="mx-auto h-16 w-16 text-stone-300" />
        <h1 className="mt-4 font-display text-2xl font-bold text-stone-900">Profile</h1>
        <p className="mt-2 text-stone-500">Sign in to manage your profile and GHIN settings.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-stone-900 mb-8">Profile</h1>

      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-4">
          {session.user?.image ? (
            <img src={session.user.image} alt="" className="h-16 w-16 rounded-full" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
              <User className="h-8 w-8 text-stone-400" />
            </div>
          )}
          <div>
            <div className="text-xl font-semibold text-stone-900">{session.user?.name}</div>
            <div className="text-sm text-stone-500">{session.user?.email}</div>
            <div className="mt-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-800 inline-block">
              {(session.user as any)?.role ?? "user"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-stone-900 mb-4">GHIN Integration</h2>
        <p className="text-sm text-stone-500">
          GHIN integration coming soon. You&apos;ll be able to link your GHIN number for automated score verification.
        </p>
      </div>
    </div>
  );
}
