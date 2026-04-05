import { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, ChevronRight, Filter } from "lucide-react";
import { type Verification } from "@/data/mock";
import { fetchVerifications } from "@/lib/api";
import { Input } from "@/components/ui/input";

function RiskBadge({ score, level }: { score: number; level: string }) {
  const colors = {
    low: "bg-green-50 text-green-700 border border-green-200",
    medium: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    high: "bg-red-50 text-red-700 border border-red-200",
  }[level] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${level === "low" ? "bg-green-500" : level === "medium" ? "bg-yellow-500" : "bg-red-500"}`} />
      {score}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    verified: { cls: "bg-green-50 text-green-700 border border-green-200", label: "Verified" },
    flagged: { cls: "bg-red-50 text-red-700 border border-red-200", label: "Flagged" },
    pending: { cls: "bg-gray-100 text-gray-600 border border-gray-200", label: "Pending" },
    in_progress: { cls: "bg-blue-50 text-blue-700 border border-blue-200", label: "In Progress" },
  }[status] ?? { cls: "bg-gray-100 text-gray-600 border border-gray-200", label: status };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${config.cls}`}>
      {config.label}
    </span>
  );
}

function CheckStatusDot({ status }: { status: string }) {
  const colors = { pass: "bg-green-500", fail: "bg-red-500", warning: "bg-yellow-500", pending: "bg-gray-400" };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status as keyof typeof colors] ?? "bg-gray-400"}`} />;
}

function DetailRow({ v }: { v: Verification }) {
  return (
    <tr>
      <td colSpan={7} className="px-6 py-0">
        <div className="py-4 border-t border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Contact</p>
              <p className="text-sm text-foreground">{v.email}</p>
              <p className="text-sm text-foreground">{v.phone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Documents</p>
              <p className="text-sm text-foreground">PAN: {v.pan}</p>
              <p className="text-sm text-foreground">Aadhaar: {v.aadhaar}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Check Results</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {v.checks.map((c, i) => (
              <div key={i} className="p-3 bg-muted/30 rounded-lg border border-border" data-testid={`detail-check-${i}`}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckStatusDot status={c.status} />
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <span className={`ml-auto text-xs font-medium ${c.status === "pass" ? "text-green-600" : c.status === "fail" ? "text-red-600" : c.status === "warning" ? "text-yellow-600" : "text-gray-500"}`}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{c.details}</p>
                {c.rawData && Object.keys(c.rawData).length > 0 && (
                  <div className="mt-2 p-2 bg-background rounded border border-border font-mono text-xs text-muted-foreground break-all">
                    {JSON.stringify(c.rawData, null, 1)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
}

export function Results() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskRange, setRiskRange] = useState<[number, number]>([0, 100]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [allVerifications, setAllVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerifications(100)
      .then(data => setAllVerifications(data.verifications))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = allVerifications.filter((v) => {
    const matchSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.company.toLowerCase().includes(search.toLowerCase()) ||
      v.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    const matchRisk = v.riskScore >= riskRange[0] && v.riskScore <= riskRange[1];
    return matchSearch && matchStatus && matchRisk;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Results</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Browse and filter all verification records</p>
      </div>

      <div className="bg-card rounded-xl border border-card-border shadow-sm p-4 flex flex-wrap gap-3 items-center" data-testid="filters-bar">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, ID..."
            className="pl-9"
            data-testid="input-search"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-8"
            data-testid="select-status-filter"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified</option>
            <option value="flagged">Flagged</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Risk: {riskRange[0]}–{riskRange[1]}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={riskRange[1]}
            onChange={(e) => setRiskRange([riskRange[0], Number(e.target.value)])}
            className="w-28 accent-primary"
            data-testid="slider-risk-range"
          />
        </div>

        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="results-table">
            <thead>
              <tr className="bg-muted/40">
                <th className="w-8 px-6 py-3" />
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Company</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Check Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Risk Score</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                    No verifications match your filters
                  </td>
                </tr>
              )}
              {filtered.map((v) => (
                [
                  <tr
                    key={v.id}
                    onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    data-testid={`result-row-${v.id}`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">
                        {expandedId === v.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "linear-gradient(135deg, #667eea, #f07b6c)" }}>
                          {v.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{v.name}</p>
                          <p className="text-xs text-muted-foreground">{v.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{v.company}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-md font-medium">{v.checkType}</span>
                    </td>
                    <td className="px-6 py-4"><RiskBadge score={v.riskScore} level={v.riskLevel} /></td>
                    <td className="px-6 py-4"><StatusBadge status={v.status} /></td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(v.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>,
                  expandedId === v.id && <DetailRow key={`${v.id}-detail`} v={v} />,
                ]
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
