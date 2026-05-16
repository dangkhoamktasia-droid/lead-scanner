export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? 'file:./dev.db',
  APIFY_API_TOKEN: process.env.APIFY_API_TOKEN ?? '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
  AI_PROVIDER: (process.env.AI_PROVIDER ?? 'openai') as 'openai' | 'anthropic',
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID ?? '',
  GOOGLE_SHEET_NAME: process.env.GOOGLE_SHEET_NAME ?? 'Sheet1',
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ?? '',
}
