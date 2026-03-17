'use client';

import { useState, useEffect, useCallback } from 'react';
import { LinkIcon, RefreshCw, CheckCircle, AlertCircle, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface GhinProfile {
  id: string;
  ghinNumber: string;
  handicapIndex: number;
  clubName: string | null;
  association: string | null;
  isVerified: boolean;
  lastSyncedAt: string | null;
}

export default function GhinConnectionCard() {
  const [ghinNumber, setGhinNumber] = useState('');
  const [profile, setProfile] = useState<GhinProfile | null>(null);
  const [trend, setTrend] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/ghin/sync');
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setTrend(data.trend || null);
        }
      }
    } catch {
      // Profile may not exist yet
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleConnect = async () => {
    if (!ghinNumber || ghinNumber.length < 5) {
      setError('Please enter a valid GHIN number (minimum 5 characters)');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/ghin/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ghinNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to connect GHIN account');
        return;
      }

      setProfile(data.profile);
      setSuccess(`Connected! Welcome, ${data.golferName || 'Golfer'}.`);
      setGhinNumber('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);

    try {
      const res = await fetch('/api/ghin/sync');
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to sync handicap');
        return;
      }

      setProfile(data.profile);
      setTrend(data.trend);
      setSuccess('Handicap synced successfully!');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const getTrendIcon = () => {
    if (trend === 'improving') return <TrendingDown className="w-4 h-4 text-green-400" />;
    if (trend === 'rising') return <TrendingUp className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendLabel = () => {
    if (trend === 'improving') return 'Improving';
    if (trend === 'rising') return 'Rising';
    return 'Stable';
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-[var(--cg-bg-card,#1a1a1a)] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--cg-accent,#22c55e)]/10">
          <LinkIcon className="w-5 h-5 text-[var(--cg-accent,#22c55e)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--cg-text-primary,#ffffff)]">
            GHIN Connection
          </h3>
          <p className="text-sm text-gray-400">
            Link your GHIN number for automatic handicap tracking
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="text-sm text-green-400">{success}</span>
        </div>
      )}

      {profile ? (
        <div className="space-y-4">
          {/* Connected Status */}
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>Connected</span>
          </div>

          {/* Handicap Display */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--cg-bg-primary,#111111)] border border-gray-800">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Handicap Index</p>
              <p className="text-3xl font-bold text-[var(--cg-text-primary,#ffffff)]">
                {profile.handicapIndex.toFixed(1)}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                {getTrendIcon()}
                <span className="text-sm text-gray-400">{getTrendLabel()}</span>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400">GHIN #</p>
              <p className="text-[var(--cg-text-primary,#ffffff)] font-medium">{profile.ghinNumber}</p>
            </div>
            <div>
              <p className="text-gray-400">Club</p>
              <p className="text-[var(--cg-text-primary,#ffffff)] font-medium">{profile.clubName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400">Association</p>
              <p className="text-[var(--cg-text-primary,#ffffff)] font-medium">{profile.association || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400">Last Synced</p>
              <p className="text-[var(--cg-text-primary,#ffffff)] font-medium">
                {profile.lastSyncedAt
                  ? new Date(profile.lastSyncedAt).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-700 bg-[var(--cg-bg-primary,#111111)] text-[var(--cg-text-primary,#ffffff)] text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Handicap'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connect Form */}
          <div>
            <label htmlFor="ghin-number" className="block text-sm text-gray-400 mb-1.5">
              GHIN Number
            </label>
            <input
              id="ghin-number"
              type="text"
              value={ghinNumber}
              onChange={(e) => setGhinNumber(e.target.value)}
              placeholder="Enter your GHIN number"
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--cg-bg-primary,#111111)] border border-gray-700 text-[var(--cg-text-primary,#ffffff)] text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--cg-accent,#22c55e)]/50 focus:border-[var(--cg-accent,#22c55e)]"
            />
          </div>

          <button
            onClick={handleConnect}
            disabled={loading || !ghinNumber}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--cg-accent,#22c55e)] text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LinkIcon className="w-4 h-4" />
            {loading ? 'Connecting...' : 'Connect GHIN'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Your GHIN number can be found on the GHIN mobile app or your club&apos;s website.
          </p>
        </div>
      )}
    </div>
  );
}
