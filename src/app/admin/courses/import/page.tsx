"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";

interface ParsedRow {
  [key: string]: string;
}

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

export default function ImportCoursesPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const COURSE_FIELDS = [
    { value: "", label: "— Skip —" },
    { value: "courseName", label: "Course Name" },
    { value: "facilityName", label: "Facility Name" },
    { value: "streetAddress", label: "Street Address" },
    { value: "city", label: "City" },
    { value: "state", label: "State" },
    { value: "zipCode", label: "Zip Code" },
    { value: "country", label: "Country" },
    { value: "latitude", label: "Latitude" },
    { value: "longitude", label: "Longitude" },
    { value: "courseType", label: "Course Type" },
    { value: "accessType", label: "Access Type" },
    { value: "numHoles", label: "Number of Holes" },
    { value: "par", label: "Par" },
    { value: "yearOpened", label: "Year Opened" },
    { value: "originalArchitect", label: "Original Architect" },
    { value: "websiteUrl", label: "Website URL" },
    { value: "phone", label: "Phone" },
    { value: "greenFeeLow", label: "Green Fee Low" },
    { value: "greenFeeHigh", label: "Green Fee High" },
    { value: "walkingPolicy", label: "Walking Policy" },
    { value: "description", label: "Description" },
  ];

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      setError("CSV must have at least a header row and one data row");
      return;
    }

    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headerRow = parseRow(lines[0]);
    setHeaders(headerRow);

    // Auto-map headers to fields
    const autoMap: Record<string, string> = {};
    headerRow.forEach((h) => {
      const normalized = h.toLowerCase().replace(/[^a-z]/g, "");
      const match = COURSE_FIELDS.find(
        (f) =>
          f.value &&
          (f.value.toLowerCase() === normalized ||
            f.label.toLowerCase().replace(/[^a-z]/g, "") === normalized)
      );
      if (match) autoMap[h] = match.value;
    });
    setMapping(autoMap);

    const parsed: ParsedRow[] = [];
    for (let i = 1; i < Math.min(lines.length, 101); i++) {
      const vals = parseRow(lines[i]);
      const row: ParsedRow = {};
      headerRow.forEach((h, j) => {
        row[h] = vals[j] || "";
      });
      parsed.push(row);
    }
    setRows(parsed);
    setError("");
    setResult(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      parseCSV(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const mappedFields = Object.entries(mapping).filter(([, v]) => v);
    if (!mappedFields.some(([, v]) => v === "courseName")) {
      setError("You must map at least the Course Name field");
      return;
    }

    setImporting(true);
    setError("");

    try {
      // Transform rows using mapping
      const courses = rows.map((row) => {
        const course: Record<string, string> = {};
        for (const [csvHeader, field] of mappedFields) {
          if (row[csvHeader]) course[field] = row[csvHeader];
        }
        return course;
      });

      const res = await fetch("/api/admin/courses/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": localStorage.getItem("golfEQ_admin_key") || "",
        },
        body: JSON.stringify({ courses, mapping: Object.fromEntries(mappedFields) }),
      });

      if (!res.ok) throw new Error("Import failed");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Import failed. Check the console for details.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/admin/courses")}
          className="rounded-lg p-2 text-gray-400 hover:text-white hover:bg-white/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">Import Courses</h1>
      </div>

      {/* Upload area */}
      {rows.length === 0 && (
        <div
          className="rounded-xl p-12 text-center cursor-pointer hover:bg-white/[0.02] transition-colors"
          style={{ backgroundColor: "#111111", border: "2px dashed #1f1f1f" }}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-10 w-10 mx-auto mb-4 text-gray-500" />
          <p className="text-sm text-gray-400 mb-1">Click to upload a CSV file</p>
          <p className="text-xs text-gray-600">Supports .csv files with header rows</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm mt-4"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className="rounded-xl p-6 mt-4"
          style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5" style={{ color: "#22c55e" }} />
            <span className="text-sm font-medium text-white">Import Complete</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold" style={{ color: "#22c55e" }}>{result.created}</div>
              <div className="text-xs text-gray-500">Created</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">{result.skipped}</div>
              <div className="text-xs text-gray-500">Skipped</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">{result.errors.length}</div>
              <div className="text-xs text-gray-500">Errors</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 max-h-40 overflow-y-auto">
              {result.errors.map((e, i) => (
                <div key={i} className="text-xs text-red-400 py-0.5">{e}</div>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push("/admin/courses")}
            className="mt-4 rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "#22c55e", color: "#000" }}
          >
            Back to Courses
          </button>
        </div>
      )}

      {/* Column Mapping & Preview */}
      {rows.length > 0 && !result && (
        <>
          <div className="flex items-center justify-between mt-6 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-400">
                {fileName} — {rows.length} rows
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setRows([]);
                  setHeaders([]);
                  setMapping({});
                  setResult(null);
                  setFileName("");
                }}
                className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:bg-white/5"
                style={{ border: "1px solid #252525" }}
              >
                Reset
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium"
                style={{ backgroundColor: "#22c55e", color: "#000" }}
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Import {rows.length} Courses
              </button>
            </div>
          </div>

          {/* Column mapping */}
          <div
            className="rounded-xl p-5 mb-4"
            style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
          >
            <h3 className="text-sm font-semibold text-white mb-3">Column Mapping</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {headers.map((h) => (
                <div key={h} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-32 truncate flex-shrink-0" title={h}>{h}</span>
                  <span className="text-gray-600">→</span>
                  <select
                    value={mapping[h] || ""}
                    onChange={(e) => setMapping({ ...mapping, [h]: e.target.value })}
                    className="flex-1 rounded px-2 py-1.5 text-xs text-white outline-none"
                    style={{ backgroundColor: "#0a0a0a", border: "1px solid #1f1f1f" }}
                  >
                    {COURSE_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview table */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "#111111", border: "1px solid #1f1f1f" }}
          >
            <div className="px-5 py-3" style={{ borderBottom: "1px solid #1f1f1f" }}>
              <span className="text-sm font-semibold text-white">Preview (first 10 rows)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid #1f1f1f" }}>
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">
                        {mapping[h] ? (
                          <span style={{ color: "#22c55e" }}>{mapping[h]}</span>
                        ) : (
                          <span className="line-through">{h}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #1a1a1a" }}>
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-2 text-gray-400 whitespace-nowrap max-w-[200px] truncate">
                          {row[h] || ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
