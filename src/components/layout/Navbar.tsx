"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Search, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { SearchOverlay } from "@/components/layout/SearchOverlay";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isAdmin = (session?.user as any)?.role === "admin";

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">CG</div>
            <span className="font-display text-lg font-semibold text-stone-900">Chameleon Golf</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <Link href="/" className="hover:text-brand-700 transition-colors">Explore</Link>
            <Link href="/about" className="hover:text-brand-700 transition-colors">How It Works</Link>
            {session && (
              <>
                <Link href="/journal" className="hover:text-brand-700 transition-colors">Score Journal</Link>
                <Link href="/profile" className="hover:text-brand-700 transition-colors">Profile</Link>
              </>
            )}
            {isAdmin && (
              <Link href="/admin" className="hover:text-brand-700 transition-colors">Admin</Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setSearchOpen(true)} className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 transition-colors">
              <Search className="h-5 w-5" />
            </button>
            {session ? (
              <div className="flex items-center gap-2">
                {session.user?.image ? (
                  <img src={session.user.image} alt="" className="h-8 w-8 rounded-full" />
                ) : (
                  <User className="h-5 w-5 text-stone-500" />
                )}
                <button onClick={() => signOut()} className="hidden md:block text-sm text-stone-500 hover:text-stone-700">
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                Sign In
              </button>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden rounded-lg p-2 text-stone-500 hover:bg-stone-100">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-stone-200 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2 text-sm font-medium text-stone-600">
              <Link href="/" onClick={() => setMenuOpen(false)}>Explore</Link>
              <Link href="/about" onClick={() => setMenuOpen(false)}>How It Works</Link>
              {session && (
                <>
                  <Link href="/journal" onClick={() => setMenuOpen(false)}>Score Journal</Link>
                  <Link href="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
                </>
              )}
              {isAdmin && <Link href="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>}
            </div>
          </div>
        )}
      </nav>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
