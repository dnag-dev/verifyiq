import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const webhookUrl = body.webhookUrl || tenant.webhookUrl;

    if (!webhookUrl) {
      return NextResponse.json({ error: "No webhook URL configured" }, { status: 400 });
    }

    const testPayload = {
      verificationId: "test-" + Date.now(),
      subjectName: "Test Subject",
      status: "clear",
      riskScore: 10,
      results: [
        { type: "pan_verification", status: "passed", details: { demo: true } },
        { type: "internet_sweep", status: "passed", details: { demo: true } },
        { type: "linkedin_check", status: "passed", details: { demo: true } },
        { type: "field_completeness", status: "passed", details: { demo: true } },
      ],
      completedAt: new Date().toISOString(),
      isTest: true,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload),
    });

    return NextResponse.json({
      success: response.ok,
      statusCode: response.status,
      webhookUrl,
      message: response.ok
        ? "Test webhook sent successfully"
        : `Webhook returned status ${response.status}`,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: "Failed to reach webhook URL",
    }, { status: 500 });
  }
}
