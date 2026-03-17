"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export interface BucketListEntry {
  id: number | string;
  courseId: number;
  priority: string;
  notes: string | null;
  targetDate: string | null;
  status: string;
  playedAt: string | null;
  rating: number | null;
  addedAt: string;
  course?: {
    courseId: number;
    courseName: string;
    facilityName?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string;
    accessType?: string | null;
    courseStyle?: string | null;
    primaryImageUrl?: string | null;
    chameleonScore?: number | null;
    bestRank?: number | null;
    bestSource?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    greenFeeLow?: number | null;
    greenFeeHigh?: number | null;
  };
}

interface BucketListContextValue {
  items: BucketListEntry[];
  loading: boolean;
  isOnBucketList: (courseId: number) => boolean;
  addToBucketList: (courseId: number, priority?: string) => Promise<void>;
  removeFromBucketList: (courseId: number) => Promise<void>;
  toggleBucketList: (courseId: number, priority?: string) => Promise<void>;
  updateItem: (id: number | string, data: Partial<BucketListEntry>) => Promise<void>;
  refresh: () => void;
  count: number;
}

const BucketListContext = createContext<BucketListContextValue>({
  items: [],
  loading: false,
  isOnBucketList: () => false,
  addToBucketList: async () => {},
  removeFromBucketList: async () => {},
  toggleBucketList: async () => {},
  updateItem: async () => {},
  refresh: () => {},
  count: 0,
});

const LS_KEY = "golfEQ_bucketList";

function getLocalItems(): BucketListEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalItems(items: BucketListEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {}
}

export function BucketListProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: authStatus } = useSession();
  const [items, setItems] = useState<BucketListEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const isAuthenticated = authStatus === "authenticated" && !!session?.user;
  const fetchedRef = useRef(false);

  const fetchItems = useCallback(async () => {
    if (!isAuthenticated) {
      setItems(getLocalItems());
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bucket-list");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("[BucketList] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authStatus === "loading") return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchItems();
  }, [authStatus, fetchItems]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const localItems = getLocalItems();
    if (localItems.length === 0) return;
    (async () => {
      for (const item of localItems) {
        try {
          await fetch("/api/bucket-list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courseId: item.courseId,
              priority: item.priority,
              notes: item.notes,
              status: item.status,
            }),
          });
        } catch {}
      }
      localStorage.removeItem(LS_KEY);
      fetchItems();
    })();
  }, [isAuthenticated, fetchItems]);

  const isOnBucketList = useCallback(
    (courseId: number) => items.some((i) => i.courseId === courseId),
    [items]
  );

  const addToBucketList = useCallback(
    async (courseId: number, priority = "Medium") => {
      if (items.some((i) => i.courseId === courseId)) return;
      if (isAuthenticated) {
        try {
          const res = await fetch("/api/bucket-list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId, priority }),
          });
          if (res.ok) {
            const data = await res.json();
            setItems((prev) => [
              ...prev,
              { ...data, notes: null, targetDate: null, playedAt: null, rating: null },
            ]);
          }
        } catch (err) {
          console.error("[BucketList] add error:", err);
        }
      } else {
        const newItem: BucketListEntry = {
          id: `local_${Date.now()}`,
          courseId,
          priority,
          notes: null,
          targetDate: null,
          status: "Want to Play",
          playedAt: null,
          rating: null,
          addedAt: new Date().toISOString(),
        };
        setItems((prev) => {
          const updated = [...prev, newItem];
          setLocalItems(updated);
          return updated;
        });
      }
    },
    [isAuthenticated, items]
  );

  const removeFromBucketList = useCallback(
    async (courseId: number) => {
      const item = items.find((i) => i.courseId === courseId);
      if (!item) return;
      if (isAuthenticated) {
        try {
          await fetch(`/api/bucket-list/${item.id}`, { method: "DELETE" });
        } catch (err) {
          console.error("[BucketList] remove error:", err);
        }
      }
      setItems((prev) => {
        const updated = prev.filter((i) => i.courseId !== courseId);
        if (!isAuthenticated) setLocalItems(updated);
        return updated;
      });
    },
    [isAuthenticated, items]
  );

  const toggleBucketList = useCallback(
    async (courseId: number, priority = "Medium") => {
      if (isOnBucketList(courseId)) {
        await removeFromBucketList(courseId);
      } else {
        await addToBucketList(courseId, priority);
      }
    },
    [isOnBucketList, removeFromBucketList, addToBucketList]
  );

  const updateItem = useCallback(
    async (id: number | string, data: Partial<BucketListEntry>) => {
      if (isAuthenticated) {
        try {
          const res = await fetch(`/api/bucket-list/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (res.ok) {
            const updated = await res.json();
            setItems((prev) =>
              prev.map((i) => (i.id === id ? { ...i, ...updated } : i))
            );
          }
        } catch (err) {
          console.error("[BucketList] update error:", err);
        }
      } else {
        setItems((prev) => {
          const updated = prev.map((i) =>
            i.id === id ? { ...i, ...data } : i
          );
          setLocalItems(updated);
          return updated;
        });
      }
    },
    [isAuthenticated]
  );

  return (
    <BucketListContext.Provider
      value={{
        items, loading, isOnBucketList, addToBucketList,
        removeFromBucketList, toggleBucketList, updateItem,
        refresh: fetchItems, count: items.length,
      }}
    >
      {children}
    </BucketListContext.Provider>
  );
}

export function useBucketList() {
  return useContext(BucketListContext);
}
