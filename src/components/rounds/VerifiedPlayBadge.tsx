'use client';

import { CheckCircle } from 'lucide-react';

interface VerifiedPlayBadgeProps {
  /** Badge display style: inline for use within text/lists, standalone for card-level display */
  variant?: 'inline' | 'standalone';
  /** Override the verification source label */
  source?: string;
}

export default function VerifiedPlayBadge({
  variant = 'inline',
  source = 'GHIN',
}: VerifiedPlayBadgeProps) {
  if (variant === 'standalone') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
        <CheckCircle className="w-4 h-4 text-green-400" />
        <span className="text-sm font-medium text-green-400">
          Verified via {source}
        </span>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-green-400">
      <CheckCircle className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">Verified</span>
    </span>
  );
}
