"use client";

import { useState, useEffect } from "react";
import {
  Coins,
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Crown,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface TokenTransaction {
  id: string;
  amount: number;
  type: string;
  source: string;
  description: string | null;
  createdAt: string;
}

interface TokenBalanceProps {
  compact?: boolean;
}

const SOURCE_LABELS: Record<string, string> = {
  REVIEW: "Course Review",
  CHECK_IN: "Check-in",
  REFERRAL: "Referral",
  ACHIEVEMENT: "Achievement",
  PURCHASE: "Purchase",
  ADMIN: "Admin",
  PROFILE: "Profile",
  CHALLENGE: "Challenge",
  TRIP: "Trip",
  PREDICTION: "Prediction",
};

const SOURCE_COLORS: Record<string, string> = {
  REVIEW: "text-blue-400",
  CHECK_IN: "text-green-400",
  REFERRAL: "text-purple-400",
  ACHIEVEMENT: "text-amber-400",
  PURCHASE: "text-red-400",
  ADMIN: "text-gray-400",
  PROFILE: "text-cyan-400",
  CHALLENGE: "text-orange-400",
  TRIP: "text-emerald-400",
  PREDICTION: "text-indigo-400",
};

export default function TokenBalance({ compact = false }: TokenBalanceProps) {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [isFounder, setIsFounder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  async function fetchBalance() {
    try {
      setLoading(true);
      // Fetch balance and recent transactions
      const res = await fetch("/api/badges"); // This also checks auth
      if (!res.ok) throw new Error("Failed to load");

      // We need a dedicated token endpoint; for now, use predictions stats as proxy
      // In a real implementation, you would have /api/tokens endpoint
      // For now, calculate from what we can get
      const badgeRes = await res.json();

      // Fetch predictions to get token info
      const predRes = await fetch("/api/predictions?limit=5");
      if (predRes.ok) {
        const predData = await predRes.json();
        // Sum up tokens from predictions
        const tokenSum = predData.predictions?.reduce(
          (sum: number, p: any) => sum + (p.tokensEarned || 0),
          0
        ) ?? 0;
        setBalance(tokenSum);
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        className={`bg-[#1a1a1a] border border-gray-800 rounded-xl ${
          compact ? "p-3" : "p-5"
        } flex items-center justify-center`}
      >
        <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
      </div>
    );
  }

  // Compact view — just balance number
  if (compact) {
    return (
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <Coins className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className="text-lg font-bold text-white">{balance.toLocaleString()}</p>
          <p className="text-xs text-gray-500">EQ Tokens</p>
        </div>
        {isFounder && (
          <div className="ml-auto flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded-full px-2.5 py-1">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">2x</span>
          </div>
        )}
      </div>
    );
  }

  // Full view — balance + history
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
      {/* Balance Header */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm text-gray-400 font-medium">EQ Token Balance</h3>
          {isFounder && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400 font-semibold">
                Founders 2x Rate
              </span>
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <Coins className="w-7 h-7 text-amber-400" />
          <span className="text-4xl font-bold text-white">
            {balance.toLocaleString()}
          </span>
          <span className="text-lg text-gray-500">EQ</span>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111111] rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              Earned
            </div>
            <p className="text-sm font-semibold text-green-400">
              +{transactions.filter((t) => t.type === "EARNED").reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-[#111111] rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              Spent
            </div>
            <p className="text-sm font-semibold text-red-400">
              -{transactions.filter((t) => t.type === "SPENT").reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Toggle */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-gray-800 hover:bg-[#222222] transition text-sm"
      >
        <span className="flex items-center gap-2 text-gray-400">
          <History className="w-4 h-4" />
          Recent Activity
        </span>
        {showHistory ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Transaction List */}
      {showHistory && (
        <div className="border-t border-gray-800">
          {transactions.length === 0 ? (
            <div className="p-5 text-center text-gray-500 text-sm">
              No recent transactions. Start earning tokens by rating courses,
              making predictions, and completing challenges.
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {tx.description || SOURCE_LABELS[tx.source] || tx.source}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={SOURCE_COLORS[tx.source] || "text-gray-400"}>
                        {SOURCE_LABELS[tx.source] || tx.source}
                      </span>
                      <span>
                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ml-3 ${
                      tx.type === "EARNED"
                        ? "text-green-400"
                        : tx.type === "SPENT"
                          ? "text-red-400"
                          : "text-gray-500"
                    }`}
                  >
                    {tx.type === "EARNED" ? "+" : "-"}
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="px-5 py-3 border-t border-gray-800">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
