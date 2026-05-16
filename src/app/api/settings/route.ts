import { NextRequest, NextResponse } from 'next/server'
import { SettingsSchema } from '@/lib/validators'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const rows = await prisma.appSetting.findMany()
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  const masked = { ...settings }
  if (masked.apifyToken) masked.apifyToken = masked.apifyToken.slice(0, 8) + '...'
  if (masked.openaiKey) masked.openaiKey = masked.openaiKey.slice(0, 8) + '...'
  if (masked.anthropicKey) masked.anthropicKey = masked.anthropicKey.slice(0, 8) + '...'
  return NextResponse.json(masked)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = SettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const entries = Object.entries(parsed.data).filter(([, v]) => v !== undefined) as [string, string][]

  for (const [key, value] of entries) {
    await prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  return NextResponse.json({ ok: true })
}
