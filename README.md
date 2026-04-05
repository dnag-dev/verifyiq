# VerifyIQ - Background Verification SaaS Platform

Multi-tenant BGV (Background Verification) platform. Companies sign up, get an API key, submit people for verification via API or portal, and get results back via webhook.

## Stack

- **Next.js 14** (App Router)
- **Neon PostgreSQL** with Prisma ORM (uses `verifyiq` schema)
- **NextAuth** for authentication
- **Tailwind CSS** for styling
- **Deployed on Vercel**

## Setup

```bash
# Install dependencies
npm install

# Copy environment file and fill in values
cp .env.example .env

# Push database schema (uses separate verifyiq schema, won't affect existing tables)
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed demo data
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

## Demo Login

After seeding:
- **Email:** demo@acmecorp.com
- **Password:** demo123

The seed script will print the API key to the console.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string (pooled) |
| `DIRECT_DATABASE_URL` | Neon direct connection (for migrations) |
| `NEXTAUTH_URL` | App URL (http://localhost:3000 for dev) |
| `NEXTAUTH_SECRET` | NextAuth secret key |
| `IDFY_API_KEY` | IDfy API key for PAN verification |
| `IDFY_BASE_URL` | IDfy API base URL |
| `SERPAPI_KEY` | SerpAPI key for internet sweep |

## API Usage

### Submit Verification

```bash
curl -X POST https://your-app.vercel.app/api/v1/verify \
  -H "Content-Type: application/json" \
  -H "x-api-key: viq_your_api_key" \
  -d '{
    "subjectName": "John Doe",
    "panNumber": "ABCDE1234F",
    "linkedinUrl": "https://linkedin.com/in/johndoe",
    "phone": "+91-9876543210",
    "city": "Mumbai",
    "callbackUrl": "https://your-server.com/webhook"
  }'
```

### Check Status

```bash
curl https://your-app.vercel.app/api/v1/verify/{id} \
  -H "x-api-key: viq_your_api_key"
```

### Test Webhook

```bash
curl -X POST https://your-app.vercel.app/api/v1/webhook/test \
  -H "Content-Type: application/json" \
  -H "x-api-key: viq_your_api_key" \
  -d '{"webhookUrl": "https://your-server.com/webhook"}'
```

## Verification Checks

Each submission runs these checks:

1. **PAN Verification** - IDfy REST API validation
2. **Internet Sweep** - SerpAPI search for fraud/complaint/arrest records
3. **LinkedIn Check** - URL existence verification
4. **Field Completeness** - Score based on provided fields

## Risk Scoring

Starts at 10, deductions:
- -3 if PAN verification fails
- -4 if internet sweep finds red flags
- -2 if no LinkedIn profile
- -1 if fields are incomplete

| Score | Status |
|-------|--------|
| 7-10 | Clear |
| 4-6 | Review |
| 0-3 | Flagged |

## Webhook Payload

Results are POSTed to the tenant's callback URL:

```json
{
  "verificationId": "uuid",
  "subjectName": "John Doe",
  "status": "clear",
  "riskScore": 9,
  "results": [...],
  "completedAt": "2024-01-01T00:00:00.000Z"
}
```

## Portal Features

- **Dashboard** - Overview of all verifications with status and risk scores
- **Submit Verification** - Single submission form
- **Bulk Upload** - Excel/CSV upload with column mapping
- **Settings** - API key management, webhook configuration
- **Analytics** - Usage stats and verification breakdown
