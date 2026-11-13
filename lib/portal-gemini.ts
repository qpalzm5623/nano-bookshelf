// Gemini API 모델 매핑, 다중 모델 폴백 및 응답 파싱 유틸리티
// 존재하지 않는 내부 버전명(예: gemini-3.8-flash)을 실제 Google Gemini API 모델로 정규화하고,
// 404/미지원 모델 오류 시 지원 모델로 자동 폴백한다.

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const FALLBACK_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
  'gemini-1.5-flash',
];

/**
 * UI/DB에 저장된 모델명을 실제 Gemini v1beta API 모델명으로 정규화한다.
 */
export function normalizeGeminiModel(rawModel?: string | null): string {
  const trimmed = typeof rawModel === 'string' ? rawModel.trim() : '';
  if (!trimmed) return DEFAULT_GEMINI_MODEL;

  const lower = trimmed.toLowerCase();
  if (
    lower.includes('3.8-flash-lite') ||
    lower.includes('3.0-flash-lite') ||
    lower.includes('2.5-flash-lite')
  ) {
    return 'gemini-2.5-flash-lite';
  }
  if (
    lower.includes('3.8-pro') ||
    lower.includes('3.5-pro') ||
    lower === 'gemini-3.5' ||
    lower.includes('2.5-pro')
  ) {
    return 'gemini-2.5-pro';
  }
  if (
    lower.includes('3.8') ||
    lower.includes('3.0') ||
    lower.includes('2.5-flash') ||
    lower === 'gemini-2.5'
  ) {
    return 'gemini-2.5-flash';
  }
  if (lower.includes('2.0-flash-lite')) {
    return 'gemini-2.0-flash-lite';
  }
  if (lower.includes('2.0-flash') || lower.includes('2.0')) {
    return 'gemini-2.0-flash';
  }
  if (lower.includes('1.5-pro')) {
    return 'gemini-1.5-pro';
  }
  if (lower.includes('1.5-flash')) {
    return 'gemini-1.5-flash';
  }
  if (lower.startsWith('gemini-')) {
    return trimmed;
  }
  return DEFAULT_GEMINI_MODEL;
}

/**
 * 기본 모델과 폴백 모델 후보 목록을 중복 없이 순서대로 반환한다.
 */
export function resolveGeminiModelCandidates(rawModel?: string | null): string[] {
  const primary = normalizeGeminiModel(rawModel);
  const candidates: string[] = [primary];
  for (const fallback of FALLBACK_GEMINI_MODELS) {
    if (!candidates.includes(fallback)) {
      candidates.push(fallback);
    }
  }
  return candidates;
}

function isModelNotFoundOrUnsupported(status: number, detail: string): boolean {
  if (status === 404) return true;
  if (status === 400 && /not found|not supported|unknown model|invalid model|deprecated/i.test(detail)) {
    return true;
  }
  return false;
}

/**
 * Gemini 응답에서 thinking 파트(thought === true)를 제외한 실제 텍스트를 추출한다.
 */
export function extractGeminiText(geminiData: any): string {
  const parts = geminiData?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .filter((part: any) => part && part.thought !== true && typeof part.text === 'string')
    .map((part: any) => part.text)
    .join('\n')
    .trim();
}

/**
 * Gemini 텍스트 응답에서 마크다운 코드펜스를 제거하고 JSON 객체를 파싱한다.
 */
export function parseGeminiJson<T = any>(geminiData: any): T {
  const rawText = extractGeminiText(geminiData);
  if (!rawText) {
    throw new Error('Gemini 응답에 텍스트 결과가 포함되지 않았습니다.');
  }

  const stripped = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(stripped) as T;
  } catch {
    const startIdx = stripped.indexOf('{');
    const endIdx = stripped.lastIndexOf('}');
    if (startIdx >= 0 && endIdx > startIdx) {
      return JSON.parse(stripped.slice(startIdx, endIdx + 1)) as T;
    }
    throw new Error('Gemini AI 응답을 JSON 형식으로 해석하지 못했습니다.');
  }
}

export interface GeminiCallOptions {
  apiKey: string;
  rawModel?: string | null;
  body: Record<string, any>;
  timeoutMs?: number;
}

export interface GeminiCallResult {
  data: any;
  model: string;
  triedModels: string[];
}

/**
 * 모델 404/미지원 오류 시 다음 폴백 모델로 재시도하며 Gemini generateContent API를 호출한다.
 */
export async function callGeminiWithFallback(options: GeminiCallOptions): Promise<GeminiCallResult> {
  const { apiKey, rawModel, body, timeoutMs = 55000 } = options;
  const candidates = resolveGeminiModelCandidates(rawModel);
  const triedModels: string[] = [];
  let lastError = 'Gemini API 호출에 실패했습니다.';

  for (let i = 0; i < candidates.length; i++) {
    const model = candidates[i];
    triedModels.push(model);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (resp.ok) {
      const data = await resp.json();
      return { data, model, triedModels };
    }

    const errText = await resp.text().catch(() => '');
    let apiMessage = errText.slice(0, 300);
    try {
      const parsedErr = JSON.parse(errText);
      if (parsedErr?.error?.message) {
        apiMessage = String(parsedErr.error.message).slice(0, 300);
      }
    } catch {
      // 원문 텍스트 일부만 유지한다.
    }

    lastError = `Gemini API (${model}, HTTP ${resp.status}): ${apiMessage || '요청 처리 실패'}`;
    const hasNext = i < candidates.length - 1;
    if (hasNext && isModelNotFoundOrUnsupported(resp.status, apiMessage || errText)) {
      continue;
    }
    throw new Error(lastError);
  }

  throw new Error(lastError);
}
