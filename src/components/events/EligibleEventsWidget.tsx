'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, Loader2 } from 'lucide-react';

export default function EligibleEventsWidget() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/events/eligible-count');
        if (res.ok) {
          const data = await res.json();
          setCount(data.eligibleCount);
        }
      } catch (e) {
        console.error('Failed to fetch eligible events count:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchCount();
  }, []);

  if (loading) {
    return (
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: 'var(--cg-bg-card)',
          border: '1px solid var(--cg-border)',
        }}
      >
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--cg-text-muted)' }} />
        </div>
      </div>
    );
  }

  if (count === null) return null;

  return (
    <Link href="/events?eligibleOnly=true">
      <div
        className="rounded-xl p-4 transition-all hover:scale-[1.02] cursor-pointer"
        style={{
          backgroundColor: 'var(--cg-bg-card)',
          border: '1px solid var(--cg-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.1) 100%)',
            }}
          >
            <Calendar className="h-5 w-5" style={{ color: 'var(--cg-accent)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--cg-text-primary)' }}>
              You qualify for{' '}
              <span style={{ color: 'var(--cg-accent)' }}>{count} event{count !== 1 ? 's' : ''}</span>{' '}
              this month
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--cg-text-muted)' }}>
              Based on your handicap index
            </p>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--cg-text-muted)' }} />
        </div>
      </div>
    </Link>
  );
}
