import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runVerification } from "@/lib/verification-engine";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = (session.user as any).tenantId;
  const body = await req.json();
  const { records, columnMapping } = body;

  if (!records || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: "No records provided" }, { status: 400 });
  }

  if (!columnMapping) {
    return NextResponse.json({ error: "Column mapping required" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  const verificationIds: string[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const mapped: any = {};

    for (const [targetField, sourceColumn] of Object.entries(columnMapping)) {
      if (sourceColumn && record[sourceColumn as string] !== undefined) {
        mapped[targetField] = String(record[sourceColumn as string]).trim();
      }
    }

    if (!mapped.subjectName) {
      errors.push({ row: i + 1, error: "Missing subject name" });
      continue;
    }

    try {
      const verification = await prisma.verification.create({
        data: {
          tenantId,
          subjectName: mapped.subjectName,
          panNumber: mapped.panNumber || null,
          aadhaarNumber: mapped.aadhaarNumber || null,
          linkedinUrl: mapped.linkedinUrl || null,
          phone: mapped.phone || null,
          city: mapped.city || null,
          callbackUrl: tenant?.webhookUrl,
        },
      });
      verificationIds.push(verification.id);

      // Fire async verification
      runVerification(verification.id).catch(console.error);
    } catch (err: any) {
      errors.push({ row: i + 1, error: err.message });
    }
  }

  return NextResponse.json({
    submitted: verificationIds.length,
    errors: errors.length,
    errorDetails: errors,
    verificationIds,
  });
}
