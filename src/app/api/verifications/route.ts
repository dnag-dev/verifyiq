import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runVerification } from "@/lib/verification-engine";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = (session.user as any).tenantId;
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");

  const where: any = { tenantId };
  if (status && status !== "all") where.status = status;

  const [verifications, total] = await Promise.all([
    prisma.verification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.verification.count({ where }),
  ]);

  return NextResponse.json({ verifications, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = (session.user as any).tenantId;
  const body = await req.json();
  const { subjectName, panNumber, aadhaarNumber, linkedinUrl, phone, city } = body;

  if (!subjectName) {
    return NextResponse.json({ error: "subjectName is required" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  const verification = await prisma.verification.create({
    data: {
      tenantId,
      subjectName,
      panNumber,
      aadhaarNumber,
      linkedinUrl,
      phone,
      city,
      callbackUrl: tenant?.webhookUrl,
    },
  });

  runVerification(verification.id).catch(console.error);

  return NextResponse.json({ verificationId: verification.id, status: "pending" });
}
