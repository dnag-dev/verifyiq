import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Clock, BarChart3, Eye, TrendingUp } from "lucide-react";
import { type Verification } from "@/data/mock";
import { fetchVerifications, fetchStats } from "@/lib/api";

function RiskBadge({ score, level }: { score: number; level: string }) {
  const colors = {
    low: "bg-green-50 text-green-700 border border-green-200",
    medium: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    high: "bg-red-50 text-red-700 border border-red-200",
  }[level] ?? "bg-gray-100 text-gray-600";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors}`} data-testid={`risk-badge-${level}`}>
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
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${config.cls}`} data-testid={`status-badge-${status}`}>
      {config.label}
    </span>
  );
}

export function Dashboard() {
  const [, setSelectedRow] = useState<Verification | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, flagged: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchVerifications(6),
      fetchStats(),
    ]).then(([verData, statsData]) => {
      setVerifications(verData.verifications);
      setStats(statsData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Verifications",
      value: stats.total,
      icon: BarChart3,
      color: "from-[#667eea] to-[#764ba2]",
      trend: "+12% this month",
    },
    {
      label: "Verified",
      value: stats.verified,
      icon: CheckCircle2,
      color: "from-green-400 to-emerald-500",
      trend: `${stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}% pass rate`,
    },
    {
      label: "Flagged",
      value: stats.flagged,
      icon: AlertTriangle,
      color: "from-red-400 to-rose-500",
      trend: `${stats.total > 0 ? Math.round((stats.flagged / stats.total) * 100) : 0}% flag rate`,
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "from-[#f07b6c] to-orange-400",
      trend: "Avg 2.4h turnaround",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of all verification activity</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
          <TrendingUp className="w-4 h-4" />
          Last 30 days
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-card-border p-5 shadow-sm hover:shadow-md transition-shadow" data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-bold mt-1 text-foreground">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-2">{stat.trend}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-sm`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-card-border shadow-sm">
        <div className="px-6 py-4 border-b border-card-border">
          <h2 className="font-semibold text-foreground">Recent Verifications</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Latest BGV requests processed</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="recent-verifications-table">
            <thead>
              <tr className="bg-muted/40">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Company</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Check Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Risk Score</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Date</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {verifications.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-verification-${v.id}`}>
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
                  <td className="px-6 py-4">
                    <RiskBadge score={v.riskScore} level={v.riskLevel} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(v.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedRow(v)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      data-testid={`btn-view-${v.id}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
