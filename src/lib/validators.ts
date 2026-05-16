import { z } from 'zod'

export const AiLeadResultSchema = z.object({
  isLead: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string().default(''),
  rejectReason: z.string().default(''),
  hinhThucCast: z.string().default(''),
  sanPhamDichVu: z.string().default(''),
  soLuongCanBook: z.string().default(''),
  sdtLienHe: z.string().default(''),
  message: z.string().default(''),
})

export type AiLeadResult = z.infer<typeof AiLeadResultSchema>

export const ScanRequestSchema = z.object({
  groupIds: z.array(z.string()).min(1, 'Chọn ít nhất 1 group'),
  scanDays: z.union([z.literal(1), z.literal(2), z.literal(7)]).default(2),
  resultLimit: z.union([z.literal(15), z.literal(30), z.literal(50)]).default(30),
})

export type ScanRequest = z.infer<typeof ScanRequestSchema>

export const LeadPatchSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']).optional(),
  message: z.string().optional(),
})

export type LeadPatch = z.infer<typeof LeadPatchSchema>

export const SettingsSchema = z.object({
  apifyToken: z.string().optional(),
  openaiKey: z.string().optional(),
  anthropicKey: z.string().optional(),
  aiProvider: z.enum(['openai', 'anthropic']).optional(),
  googleSheetId: z.string().optional(),
  googleSheetName: z.string().optional(),
  googleCredentialsJson: z.string().optional(),
  defaultScanDays: z.string().optional(),
  defaultResultLimit: z.string().optional(),
  messageTemplate: z.string().optional(),
})

export type Settings = z.infer<typeof SettingsSchema>
