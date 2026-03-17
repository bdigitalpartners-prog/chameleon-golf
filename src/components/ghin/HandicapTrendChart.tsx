'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown, TrendingUp, Activity } from 'lucide-react';

interface HistoryEntry {
  id: string;
  handicapIndex: number;
  lowIndex: number | null;
  highIndex: number | null;
  trendDirection: string | null;
  recordedAt: string;
  source: string;
}

interface ChartDataPoint {
  date: string;
  handicapIndex: number;
  lowIndex: number | null;
  highIndex: number | null;
}

export default function HandicapTrendChart() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/ghin/history');
        if (!res.ok) {
          if (res.status === 401) return;
          throw new Error('Failed to fetch history');
        }
        const data = await res.json();
        setHistory(data.history || []);
      } catch (err) {
        setError('Unable to load handicap history');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[var(--cg-bg-card,#1a1a1a)] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-48 bg-gray-800 rounded" />
          <div className="h-48 bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  if (error || history.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-[var(--cg-bg-card,#1a1a1a)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-[var(--cg-accent,#22c55e)]" />
          <h3 className="text-lg font-semibold text-[var(--cg-text-primary,#ffffff)]">
            Handicap Trend
          </h3>
        </div>
        <p className="text-sm text-gray-400">
          {error || 'No handicap history yet. Connect your GHIN number and sync to start tracking.'}
        </p>
      </div>
    );
  }

  // Prepare chart data (oldest first for chronological display)
  const chartData: ChartDataPoint[] = [...history]
    .reverse()
    .map((entry) => ({
      date: new Date(entry.recordedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      handicapIndex: entry.handicapIndex,
      lowIndex: entry.lowIndex,
      highIndex: entry.highIndex,
    }));

  const currentIndex = history[0]?.handicapIndex ?? 0;
  const previousIndex = history[1]?.handicapIndex ?? currentIndex;
  const change = currentIndex - previousIndex;
  const isImproving = change < 0;

  // Calculate min/max for Y axis
  const allValues = chartData.map((d) => d.handicapIndex);
  const yMin = Math.floor(Math.min(...allValues) - 1);
  const yMax = Math.ceil(Math.max(...allValues) + 1);

  return (
    <div className="rounded-xl border border-gray-800 bg-[var(--cg-bg-card,#1a1a1a)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[var(--cg-accent,#22c55e)]" />
          <h3 className="text-lg font-semibold text-[var(--cg-text-primary,#ffffff)]">
            Handicap Trend
          </h3>
        </div>
        {change !== 0 && (
          <div className={`flex items-center gap-1 text-sm ${isImproving ? 'text-green-400' : 'text-red-400'}`}>
            {isImproving ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            <span>{isImproving ? '' : '+'}{change.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={{ stroke: '#444' }}
              tickLine={{ stroke: '#444' }}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={{ stroke: '#444' }}
              tickLine={{ stroke: '#444' }}
              reversed
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
              }}
              labelStyle={{ color: '#9ca3af' }}
              formatter={(value: any) => [Number(value).toFixed(1), 'Handicap Index']}
            />
            <Line
              type="monotone"
              dataKey="handicapIndex"
              stroke="var(--cg-accent, #22c55e)"
              strokeWidth={2}
              dot={{ fill: 'var(--cg-accent, #22c55e)', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-800">
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Current</p>
          <p className="text-lg font-bold text-[var(--cg-text-primary,#ffffff)]">
            {currentIndex.toFixed(1)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Low</p>
          <p className="text-lg font-bold text-green-400">
            {Math.min(...allValues).toFixed(1)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">High</p>
          <p className="text-lg font-bold text-red-400">
            {Math.max(...allValues).toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
}
