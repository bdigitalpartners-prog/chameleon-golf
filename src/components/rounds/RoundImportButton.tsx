'use client';

import { useState } from 'react';
import { Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ImportResult {
  imported: number;
  skipped: number;
  message: string;
}

interface RoundImportButtonProps {
  /** Callback fired after a successful import */
  onImportComplete?: (result: ImportResult) => void;
}

export default function RoundImportButton({ onImportComplete }: RoundImportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/rounds/import');
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to import rounds');
        return;
      }

      const importResult: ImportResult = {
        imported: data.imported,
        skipped: data.skipped,
        message: data.message,
      };

      setResult(importResult);
      onImportComplete?.(importResult);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleImport}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--cg-accent,#22c55e)] text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Import from GHIN
          </>
        )}
      </button>

      {result && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-green-400 font-medium">{result.message}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
              <span>{result.imported} imported</span>
              <span>{result.skipped} skipped</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}
    </div>
  );
}
