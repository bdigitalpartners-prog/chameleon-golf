"use client";

export const dynamic = "force-dynamic";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

interface ParsedRow {
  [key: string]: string;
}

const EXPECTED_COLUMNS = [
  "courseName",
  "facilityName",
  "city",
  "state",
  "zipCode",
  "country",
  "courseType",
  "accessType",
  "numHoles",
  "par",
  "yearOpened",
  "originalArchitect",
  "websiteUrl",
  "phone",
  "greenFeeLow",
  "greenFeeHigh",
];

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  // Simple CSV parser handling quoted fields
  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: ParsedRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }
  return { headers, rows };
}

export default function BulkImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h);
      setRows(r);

      // Auto-map columns where headers match expected columns (case-insensitive)
      const map: Record<string, string> = {};
      for (const expected of EXPECTED_COLUMNS) {
        const match = h.find(
          (col) => col.toLowerCase().replace(/[_\s]/g, "") === expected.toLowerCase().replace(/[_\s]/g, "")
        );
        if (match) map[expected] = match;
      }
      setColumnMap(map);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setError("");
    setResult(null);

    try {
      // Map rows using column mapping
      const mappedCourses = rows.map((row) => {
        const course: Record<string, string> = {};
        for (const [expected, csvCol] of Object.entries(columnMap)) {
          if (csvCol && row[csvCol]) {
            course[expected] = row[csvCol];
          }
        }
        return course;
      });

      const res = await fetch("/api/admin/courses/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": getAdminKey(),
        },
        body: JSON.stringify({ courses: mappedCourses }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Import failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/courses" className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Bulk CSV Import</h1>
      </div>

      {/* Upload */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-6">
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[#333] rounded-xl p-10 text-center cursor-pointer hover:border-[#22c55e] transition-colors"
        >
          <Upload size={32} className="mx-auto text-gray-500 mb-3" />
          <p className="text-gray-300">Click to upload a CSV file</p>
          <p className="text-xs text-gray-600 mt-1">Expected columns: courseName, city, state, accessType, etc.</p>
          {fileName && (
            <div className="mt-3 flex items-center justify-center gap-2 text-[#22c55e]">
              <FileText size={16} />
              <span className="text-sm">{fileName}</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      </div>

      {/* Column Mapping */}
      {headers.length > 0 && (
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Column Mapping</h2>
          <p className="text-sm text-gray-400">Map your CSV columns to course fields. Auto-detected matches are pre-selected.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EXPECTED_COLUMNS.map((field) => (
              <div key={field}>
                <label className="block text-xs text-gray-500 mb-1">{field}</label>
                <select
                  value={columnMap[field] || ""}
                  onChange={(e) => setColumnMap((prev) => ({ ...prev, [field]: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]"
                >
                  <option value="">— skip —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Preview ({rows.length} rows)</h2>
            <button
              onClick={handleImport}
              disabled={importing || !columnMap.courseName}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] disabled:opacity-50 transition-colors"
            >
              {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {importing ? "Importing..." : `Import ${rows.length} Courses`}
            </button>
          </div>

          {!columnMap.courseName && (
            <div className="flex items-center gap-2 text-yellow-500 text-sm">
              <AlertTriangle size={16} />
              Map the &quot;courseName&quot; column before importing
            </div>
          )}

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#222] text-gray-400 text-left">
                  <th className="px-3 py-2">#</th>
                  {headers.slice(0, 8).map((h) => (
                    <th key={h} className="px-3 py-2 font-medium">{h}</th>
                  ))}
                  {headers.length > 8 && <th className="px-3 py-2">...</th>}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-[#1a1a1a]">
                    <td className="px-3 py-1.5 text-gray-600">{i + 1}</td>
                    {headers.slice(0, 8).map((h) => (
                      <td key={h} className="px-3 py-1.5 text-gray-300 max-w-[150px] truncate">{row[h]}</td>
                    ))}
                    {headers.length > 8 && <td className="px-3 py-1.5 text-gray-600">...</td>}
                  </tr>
                ))}
                {rows.length > 10 && (
                  <tr>
                    <td colSpan={Math.min(headers.length, 8) + 2} className="px-3 py-2 text-gray-600 text-center">
                      ...and {rows.length - 10} more rows
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {error && (
        <div className="p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#22c55e]">
            <CheckCircle2 size={20} />
            <span className="font-medium">Import Complete</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-green-900/20 border border-green-900/40">
              <p className="text-green-400 font-medium text-lg">{result.created}</p>
              <p className="text-gray-400">Created</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-900/40">
              <p className="text-yellow-400 font-medium text-lg">{result.skipped}</p>
              <p className="text-gray-400">Skipped (duplicates)</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-400 mb-1">Errors:</p>
              <div className="space-y-1">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-400">{err}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
