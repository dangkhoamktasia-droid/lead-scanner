import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { syncLeadsToSheet } from '@/server/googleSheet.service'

const SyncBodySchema = z.object({
  leadIds: z.array(z.string()).min(1),
  dryRun: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = SyncBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    if (parsed.data.dryRun) {
      return NextResponse.json({ message: 'Dry run — no data written', leadIds: parsed.data.leadIds })
    }

    const result = await syncLeadsToSheet(parsed.data.leadIds)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
