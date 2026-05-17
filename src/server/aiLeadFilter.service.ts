import { AiLeadResultSchema, type AiLeadResult } from '@/lib/validators'
import { buildLeadFilterPrompt } from '@/prompts/leadFilterPrompt'
import { logger } from '@/lib/logger'

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI error ${res.status}: ${text}`)
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0].message.content
}

async function callAnthropic(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Anthropic error ${res.status}: ${text}`)
  }

  const data = await res.json() as { content: Array<{ text: string }> }
  return data.content[0].text
}

export async function filterLeadWithAI(params: {
  postText: string
  postUrl: string
  provider: 'openai' | 'anthropic'
  openaiKey: string
  anthropicKey: string
}): Promise<AiLeadResult> {
  const { postText, postUrl, provider, openaiKey, anthropicKey } = params
  const prompt = buildLeadFilterPrompt(postText, postUrl)

  let rawJson: string
  try {
    if (provider === 'anthropic') {
      rawJson = await callAnthropic(prompt, anthropicKey)
    } else {
      rawJson = await callOpenAI(prompt, openaiKey)
    }
  } catch (err) {
    logger.error('AI API call failed', err)
    return {
      isLead: false,
      confidence: 0,
      reason: '',
      rejectReason: `AI error: ${String(err)}`,
      hinhThucCast: '',
      sanPhamDichVu: '',
      soLuongCanBook: '',
      sdtLienHe: '',
      message: '',
    }
  }

  try {
    const jsonMatch = rawJson.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : rawJson
    const parsed = JSON.parse(jsonStr)
    return AiLeadResultSchema.parse(parsed)
  } catch (err) {
    logger.error('AI output parse failed', { rawJson, err })
    return {
      isLead: false,
      confidence: 0,
      reason: '',
      rejectReason: `Parse error: ${String(err)}`,
      hinhThucCast: '',
      sanPhamDichVu: '',
      soLuongCanBook: '',
      sdtLienHe: '',
      message: '',
    }
  }
}

export function classifyByConfidence(result: AiLeadResult): string {
  if (!result.isLead) return 'REJECTED'
  if (result.confidence >= 0.85) return 'AI_FILTERED'
  if (result.confidence >= 0.6) return 'NEED_REVIEW'
  return 'REJECTED'
}
