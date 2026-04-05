import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runVerification } from "@/lib/verification-engine";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { apiKey } });
    if (!tenant) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const body = await req.json();
    const { subjectName, panNumber, aadhaarNumber, linkedinUrl, phone, city, callbackUrl } = body;

    if (!subjectName) {
      return NextResponse.json({ error: "subjectName is required" }, { status: 400 });
    }

    const verification = await prisma.verification.create({
      data: {
        tenantId: tenant.id,
        subjectName,
        panNumber,
        aadhaarNumber,
        linkedinUrl,
        phone,
        city,
        callbackUrl: callbackUrl || tenant.webhookUrl,
        status: "pending",
      },
    });

    // Run verification async (fire and forget)
    runVerification(verification.id).catch((err) =>
      console.error("Verification failed:", err)
    );

    return NextResponse.json({
      verificationId: verification.id,
      status: "pending",
      message: "Verification submitted. Results will be sent to the callback URL.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
