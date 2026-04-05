import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { companyName, email, password, name } = await req.json();

    if (!companyName || !email || !password) {
      return NextResponse.json(
        { error: "companyName, email, and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const apiKey = `viq_${uuidv4().replace(/-/g, "")}`;
    const hashedPassword = await bcrypt.hash(password, 12);

    const tenant = await prisma.tenant.create({
      data: {
        companyName,
        apiKey,
        plan: "free",
        users: {
          create: {
            email,
            password: hashedPassword,
            name: name || email.split("@")[0],
            role: "admin",
          },
        },
      },
      include: { users: true },
    });

    return NextResponse.json({
      message: "Account created successfully",
      tenantId: tenant.id,
      apiKey: tenant.apiKey,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
