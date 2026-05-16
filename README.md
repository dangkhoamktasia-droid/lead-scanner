# Lead Scanner — KOL/KOC Booking

Internal tool to scan Facebook Groups for booking leads, filter with AI, preview, approve, and sync to Google Sheets.

## Requirements

- Node.js 18+
- Apify account with `apify/facebook-groups-scraper` access
- OpenAI or Anthropic API key
- Google Cloud service account with Sheets API enabled

## Installation

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Open http://localhost:3000

## Configuration

Copy `.env.example` to `.env.local` and fill in your keys, OR configure everything in the Settings page at http://localhost:3000/settings.

## Running a Scan

1. Go to Settings and configure Apify token + AI API key
2. Go to Dashboard
3. Select groups, time range, and post limit
4. Click "Chạy Scan"
5. Wait for completion (may take several minutes)
6. Go to Leads Preview to review AI-filtered leads
7. Approve or reject each lead
8. Click "Sync Google Sheet" to write approved leads

## Google Sheet Column Format

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| STT | Ngày | Link người đăng | FB Profile | Link bài post | Hình thức cast | Sản phẩm | Số lượng | SĐT | Tin nhắn |
