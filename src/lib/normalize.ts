export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildFingerprint(params: {
  hinhThucCast: string
  sanPhamDichVu: string
  userName: string
}): string {
  const parts = [
    normalizeText(params.hinhThucCast ?? ''),
    normalizeText(params.sanPhamDichVu ?? ''),
    normalizeText(params.userName ?? ''),
  ]
  return parts.join('|')
}
