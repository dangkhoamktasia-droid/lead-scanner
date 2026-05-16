import { NextRequest, NextResponse } from 'next/server'
import { LeadPatchSchema } from '@/lib/validators'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const parsed = LeadPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json(lead)
}
