import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { apiKey } });
    if (!tenant) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const verification = await prisma.verification.findFirst({
      where: { id: params.id, tenantId: tenant.id },
      include: {
        checks: {
          select: {
            checkType: true,
            status: true,
            rawResponse: true,
            createdAt: true,
          },
        },
      },
    });

    if (!verification) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: verification.id,
      subjectName: verification.subjectName,
      status: verification.status,
      riskScore: verification.riskScore,
      results: verification.results,
      checks: verification.checks,
      createdAt: verification.createdAt,
      completedAt: verification.completedAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
