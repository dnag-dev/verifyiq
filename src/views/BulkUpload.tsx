import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, X, ChevronDown, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { submitBulkUpload } from "@/lib/api";

const REQUIRED_FIELDS = ["Full Name", "Phone", "PAN Number", "Aadhaar Number", "City"];

const FIELD_MAPPING: Record<string, string> = {
  "Full Name": "subjectName",
  "Phone": "phone",
  "PAN Number": "panNumber",
  "Aadhaar Number": "aadhaarNumber",
  "City": "city",
};

type Mapping = Record<string, string>;

export function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mapping, setMapping] = useState<Mapping>({});
  const [phase, setPhase] = useState<"upload" | "map" | "processing" | "done">("upload");
  const [progress, setProgress] = useState(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [results, setResults] = useState<{ submitted: number; errors: number; errorDetails?: any[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function parseFile(f: File) {
    setFile(f);
    const ext = f.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.data.length > 0) {
            const cols = Object.keys(result.data[0] as object);
            setHeaders(cols);
            setRows(result.data);
            autoMap(cols);
            setPhase("map");
          }
        },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        if (json.length > 0) {
          const cols = Object.keys(json[0] as object);
          setHeaders(cols);
          setRows(json);
          autoMap(cols);
          setPhase("map");
        }
      };
      reader.readAsArrayBuffer(f);
    }
  }

  function autoMap(cols: string[]) {
    const autoMapping: Mapping = {};
    const nameKeywords = ["name", "full name", "employee name", "candidate"];
    const phoneKeywords = ["phone", "mobile", "contact"];
    const panKeywords = ["pan"];
    const aadhaarKeywords = ["aadhaar", "aadhar", "uid"];
    const cityKeywords = ["city", "location", "place"];

    cols.forEach((col) => {
      const lower = col.toLowerCase().trim();
      if (nameKeywords.some((k) => lower.includes(k))) autoMapping["Full Name"] = col;
      else if (phoneKeywords.some((k) => lower.includes(k))) autoMapping["Phone"] = col;
      else if (panKeywords.some((k) => lower.includes(k))) autoMapping["PAN Number"] = col;
      else if (aadhaarKeywords.some((k) => lower.includes(k))) autoMapping["Aadhaar Number"] = col;
      else if (cityKeywords.some((k) => lower.includes(k))) autoMapping["City"] = col;
    });

    setMapping(autoMapping);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) parseFile(f);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) parseFile(f);
  }

  async function processFile() {
    setPhase("processing");
    setProgress(0);

    // Build column mapping for the API
    const columnMapping: Record<string, string> = {};
    for (const [requiredField, fileColumn] of Object.entries(mapping)) {
      const apiField = FIELD_MAPPING[requiredField];
      if (apiField && fileColumn) {
        columnMapping[apiField] = fileColumn;
      }
    }

    // Simulate progress while API processes
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 5, 90));
    }, 200);

    try {
      const result = await submitBulkUpload(rows, columnMapping);
      clearInterval(progressInterval);
      setProgress(100);
      setResults({
        submitted: result.submitted,
        errors: result.errors,
        errorDetails: result.errorDetails,
      });
      setTimeout(() => setPhase("done"), 500);
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(100);
      setResults({ submitted: 0, errors: rows.length, errorDetails: [{ row: 0, error: "Upload failed" }] });
      setTimeout(() => setPhase("done"), 500);
    }
  }

  const previewRows = rows.slice(0, 5);

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Bulk Upload</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Upload an Excel or CSV file to verify multiple candidates at once</p>
      </div>

      {phase === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200 ${isDragging ? "border-primary bg-accent/50 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-accent/20"}`}
          data-testid="dropzone"
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileChange} data-testid="input-file" />
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #667eea20, #f07b6c20)" }}>
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <p className="font-semibold text-foreground text-lg">Drop your file here</p>
          <p className="text-muted-foreground text-sm mt-2">or click to browse — Excel (.xlsx, .xls) or CSV</p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            {["Excel .xlsx", "Excel .xls", "CSV .csv"].map((fmt) => (
              <span key={fmt} className="text-xs bg-muted px-3 py-1.5 rounded-full text-muted-foreground border border-border">{fmt}</span>
            ))}
          </div>
        </div>
      )}

      {(phase === "map" || phase === "processing" || phase === "done") && file && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-card rounded-xl border border-card-border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center border border-green-200">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB &bull; {rows.length} rows detected</p>
              </div>
            </div>
            {phase === "map" && (
              <button onClick={() => { setFile(null); setPhase("upload"); setHeaders([]); setRows([]); setMapping({}); }} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-remove-file">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {phase === "map" && (
            <>
              <div className="bg-card rounded-xl border border-card-border shadow-sm">
                <div className="px-6 py-4 border-b border-card-border">
                  <h2 className="font-semibold text-foreground text-sm">Column Mapping</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Map the columns from your file to the required fields</p>
                </div>
                <div className="p-6 space-y-3" data-testid="column-mapping">
                  {REQUIRED_FIELDS.map((required) => (
                    <div key={required} className="flex items-center gap-4">
                      <div className="w-40 shrink-0">
                        <p className="text-sm font-medium text-foreground">{required}</p>
                        <p className="text-xs text-muted-foreground">Required</p>
                      </div>
                      <div className="w-8 h-px bg-border" />
                      <div className="flex-1 relative">
                        <select
                          value={mapping[required] ?? ""}
                          onChange={(e) => setMapping((m) => ({ ...m, [required]: e.target.value }))}
                          className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-ring"
                          data-testid={`select-mapping-${required.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <option value="">— Select column —</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {previewRows.length > 0 && (
                <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-card-border">
                    <h2 className="font-semibold text-foreground text-sm">Preview (first {previewRows.length} rows)</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs" data-testid="preview-table">
                      <thead>
                        <tr className="bg-muted/40">
                          {headers.map((h) => (
                            <th key={h} className="text-left px-4 py-2.5 font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {previewRows.map((row, i) => (
                          <tr key={i} className="hover:bg-muted/20 transition-colors">
                            {headers.map((h) => (
                              <td key={h} className="px-4 py-2.5 text-foreground whitespace-nowrap">{row[h] || <span className="text-muted-foreground italic">—</span>}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Button
                onClick={processFile}
                disabled={!mapping["Full Name"]}
                className="w-full h-11 font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #667eea 0%, #f07b6c 100%)", border: "none" }}
                data-testid="btn-process"
              >
                Process {rows.length} Candidates
              </Button>
            </>
          )}

          {phase === "processing" && (
            <div className="bg-card rounded-xl border border-card-border shadow-sm p-8 text-center" data-testid="processing-state">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <h2 className="font-semibold text-foreground">Processing Verifications</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-6">Running BGV checks for {rows.length} candidates...</p>
              <div className="max-w-sm mx-auto space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{progress}% complete</p>
              </div>
            </div>
          )}

          {phase === "done" && results && (
            <div className="bg-card rounded-xl border border-card-border shadow-sm p-8 text-center" data-testid="done-state">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-4 border border-green-200">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="font-semibold text-foreground text-lg">Processing Complete</h2>
              <p className="text-sm text-muted-foreground mt-1">{results.submitted} verifications submitted successfully</p>
              <div className="flex gap-3 justify-center mt-6">
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-medium">{results.submitted} Submitted</span>
                {results.errors > 0 && (
                  <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-full font-medium">{results.errors} Errors</span>
                )}
              </div>
              {results.errorDetails && results.errorDetails.length > 0 && (
                <div className="mt-4 text-left bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-medium text-red-700">Error Details</p>
                  </div>
                  {results.errorDetails.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-xs text-red-600">Row {err.row}: {err.error}</p>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => { setFile(null); setPhase("upload"); setHeaders([]); setRows([]); setMapping({}); setResults(null); }}
                className="mt-6"
                data-testid="btn-upload-another"
              >
                Upload Another File
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
