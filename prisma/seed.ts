import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not set");

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Seeding VerifyIQ database...");

  // Delete existing demo data
  await prisma.verificationCheck.deleteMany({});
  await prisma.verification.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  // Create demo tenant
  const apiKey = `viq_demo_${uuidv4().replace(/-/g, "").slice(0, 24)}`;
  const hashedPassword = await bcrypt.hash("demo123", 12);

  const tenant = await prisma.tenant.create({
    data: {
      companyName: "Acme Corp",
      apiKey,
      webhookUrl: "https://webhook.site/test",
      plan: "professional",
      users: {
        create: {
          email: "demo@acmecorp.com",
          password: hashedPassword,
          name: "Demo User",
          role: "admin",
        },
      },
    },
    include: { users: true },
  });

  console.log(`\nDemo tenant created:`);
  console.log(`  Company: ${tenant.companyName}`);
  console.log(`  API Key: ${apiKey}`);
  console.log(`  Login:   demo@acmecorp.com / demo123`);

  // Create sample verifications
  const subjects = [
    {
      subjectName: "Rahul Sharma",
      panNumber: "ABCDE1234F",
      linkedinUrl: "https://linkedin.com/in/rahulsharma",
      phone: "+91-9876543210",
      city: "Mumbai",
      status: "clear",
      riskScore: 9,
    },
    {
      subjectName: "Priya Patel",
      panNumber: "FGHIJ5678K",
      aadhaarNumber: "1234-5678-9012",
      linkedinUrl: "https://linkedin.com/in/priyapatel",
      phone: "+91-9876543211",
      city: "Bangalore",
      status: "clear",
      riskScore: 10,
    },
    {
      subjectName: "Amit Kumar",
      panNumber: "LMNOP9012Q",
      phone: "+91-9876543212",
      city: "Delhi",
      status: "review",
      riskScore: 5,
    },
    {
      subjectName: "Sunita Verma",
      panNumber: "INVALID",
      city: "Chennai",
      status: "flagged",
      riskScore: 2,
    },
    {
      subjectName: "Vikram Singh",
      panNumber: "RSTUV3456W",
      linkedinUrl: "https://linkedin.com/in/vikramsingh",
      phone: "+91-9876543214",
      city: "Pune",
      status: "pending",
      riskScore: null,
    },
  ];

  for (const subject of subjects) {
    const verification = await prisma.verification.create({
      data: {
        tenantId: tenant.id,
        subjectName: subject.subjectName,
        panNumber: subject.panNumber || null,
        aadhaarNumber: subject.aadhaarNumber || null,
        linkedinUrl: subject.linkedinUrl || null,
        phone: subject.phone || null,
        city: subject.city || null,
        status: subject.status,
        riskScore: subject.riskScore,
        completedAt: subject.status !== "pending" ? new Date() : null,
        results:
          subject.status !== "pending"
            ? {
                riskScore: subject.riskScore,
                status: subject.status,
                checks: [],
              }
            : undefined,
      },
    });

    if (subject.status !== "pending") {
      await prisma.verificationCheck.createMany({
        data: [
          {
            verificationId: verification.id,
            checkType: "pan_verification",
            status: subject.panNumber === "INVALID" ? "failed" : "passed",
            rawResponse: { demo: true },
          },
          {
            verificationId: verification.id,
            checkType: "internet_sweep",
            status: subject.riskScore && subject.riskScore < 6 ? "flagged" : "passed",
            rawResponse: { demo: true },
          },
          {
            verificationId: verification.id,
            checkType: "linkedin_check",
            status: subject.linkedinUrl ? "passed" : "not_found",
            rawResponse: { demo: true },
          },
          {
            verificationId: verification.id,
            checkType: "field_completeness",
            status: "passed",
            rawResponse: { demo: true },
          },
        ],
      });
    }
  }

  console.log(`  Created ${subjects.length} sample verifications`);
  console.log("\nSeed completed!");

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
