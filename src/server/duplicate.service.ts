import { prisma } from '@/lib/prisma'
import { buildFingerprint } from '@/lib/normalize'

export async function isDuplicate(params: {
  hinhThucCast: string
  sanPhamDichVu: string
  userName: string
}): Promise<boolean> {
  const fingerprint = buildFingerprint({
    hinhThucCast: params.hinhThucCast,
    sanPhamDichVu: params.sanPhamDichVu,
    userName: params.userName,
  })

  if (!fingerprint || fingerprint === '||') return false

  const existing = await prisma.lead.findFirst({
    where: {
      fingerprint,
      status: { notIn: ['REJECTED', 'DUPLICATED'] },
    },
  })

  return !!existing
}

export function getFingerprint(params: {
  hinhThucCast: string
  sanPhamDichVu: string
  userName: string
}): string {
  return buildFingerprint(params)
}
