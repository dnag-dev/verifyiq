import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = (session.user as any).tenantId;
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  return NextResponse.json({
    companyName: tenant?.companyName,
    apiKey: tenant?.apiKey,
    webhookUrl: tenant?.webhookUrl,
    plan: tenant?.plan,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = (session.user as any).tenantId;
  const body = await req.json();

  const updateData: any = {};
  if (body.webhookUrl !== undefined) updateData.webhookUrl = body.webhookUrl;
  if (body.companyName) updateData.companyName = body.companyName;

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: updateData,
  });

  return NextResponse.json({ success: true, webhookUrl: tenant.webhookUrl });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = (session.user as any).tenantId;
  const body = await req.json();

  if (body.action === "regenerate_api_key") {
    const newApiKey = `viq_${uuidv4().replace(/-/g, "")}`;
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { apiKey: newApiKey },
    });
    return NextResponse.json({ apiKey: newApiKey });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
