import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = (session.user as any).tenantId;

  const [total, pending, processing, clear, review, flagged, recentVerifications] =
    await Promise.all([
      prisma.verification.count({ where: { tenantId } }),
      prisma.verification.count({ where: { tenantId, status: "pending" } }),
      prisma.verification.count({ where: { tenantId, status: "processing" } }),
      prisma.verification.count({ where: { tenantId, status: "clear" } }),
      prisma.verification.count({ where: { tenantId, status: "review" } }),
      prisma.verification.count({ where: { tenantId, status: "flagged" } }),
      prisma.verification.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { createdAt: true, status: true, riskScore: true },
      }),
    ]);

  const avgRiskScore = await prisma.verification.aggregate({
    where: { tenantId, riskScore: { not: null } },
    _avg: { riskScore: true },
  });

  // Group by day for chart
  const dailyCounts: Record<string, number> = {};
  recentVerifications.forEach((v) => {
    const day = v.createdAt.toISOString().split("T")[0];
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });

  return NextResponse.json({
    total,
    pending,
    processing,
    clear,
    review,
    flagged,
    avgRiskScore: Math.round((avgRiskScore._avg.riskScore || 0) * 10) / 10,
    dailyCounts,
  });
}
