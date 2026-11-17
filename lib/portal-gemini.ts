// Gemini API 모델 정규화, Google AI Studio 실시간 모델 조회 및 호출 유틸리티
// 관리자가 지정한 모델 버전을 임의로 변경·폴백하지 않고 그대로 사용한다.

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export interface GoogleAiStudioModel {
  id: string;
  displayName: string;
  description: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

/**
 * UI/DB에 저장된 모델명을 정제한다. 사용자가 지정한 버전은 임의로 바꾸지 않는다.
 */
export function normalizeGeminiModel(rawModel?: string | null): string {
  const trimmed = typeof rawModel === 'string' ? rawModel.trim().replace(/^models\//i, '') : '';
  if (!trimmed) return DEFAULT_GEMINI_MODEL;
  if (/^[a-zA-Z0-9._-]+$/.test(trimmed)) return trimmed;
  return DEFAULT_GEMINI_MODEL;
}

/**
 * 모델 목록을 반환한다 (임의 버전 폴백 없이 지정된 모델만 사용).
 */
export function resolveGeminiModelCandidates(rawModel?: string | null): string[] {
  return [normalizeGeminiModel(rawModel)];
}

const EXCLUDED_GEMINI_MODEL_PATTERN = /(embedding|aqa|imagen|veo|-tts\b|native-audio|robotics|computer-use|deep-research)/i;

function compareGeminiModelVersion(aId: string, bId: string): number {
  const parseNums = (id: string) => {
    const m = id.match(/^gemini-(\d+)(?:\.(\d+))?/i);
    if (!m) return [0, 0];
    return [parseInt(m[1], 10) || 0, parseInt(m[2] || '0', 10) || 0];
  };
  const [aMaj, aMin] = parseNums(aId);
  const [bMaj, bMin] = parseNums(bId);
  if (bMaj !== aMaj) return bMaj - aMaj;
  if (bMin !== aMin) return bMin - aMin;
  const rankVariant = (id: string) => {
    const lower = id.toLowerCase();
    if (lower.endsWith('-flash')) return 0;
    if (lower.includes('-flash') && !lower.includes('lite')) return 1;
    if (lower.endsWith('-pro')) return 2;
    if (lower.includes('-pro')) return 3;
    if (lower.includes('flash-lite')) return 4;
    return 5;
  };
  const vr = rankVariant(aId) - rankVariant(bId);
  if (vr !== 0) return vr;
  return aId.localeCompare(bId);
}

/**
 * Google AI Studio (generativelanguage.googleapis.com/v1beta/models)에서
 * 현재 API 키로 사용 가능한 generateContent 지원 Gemini 모델 목록을 실시간 조회한다.
 */
export async function fetchGoogleAiStudioModels(apiKey: string, timeoutMs = 8000): Promise<GoogleAiStudioModel[]> {
  const cleanKey = String(apiKey || '').trim();
  if (!cleanKey) return [];

  const collected: GoogleAiStudioModel[] = [];
  const seen = new Set<string>();
  let pageToken = '';

  for (let page = 0; page < 5; page++) {
    const queryStr = pageToken ? `pageSize=100&pageToken=${encodeURIComponent(pageToken)}` : 'pageSize=100';
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?${queryStr}`, {
      method: 'GET',
      headers: { 'x-goog-api-key': cleanKey },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`Google AI Studio 모델 조회 실패 (HTTP ${resp.status}): ${errText.slice(0, 200)}`);
    }
    const payload: any = await resp.json();
    const rows = Array.isArray(payload?.models) ? payload.models : [];
    for (const m of rows) {
      const rawName = String(m?.name || '').trim();
      const id = rawName.replace(/^models\//i, '');
      if (!/^gemini-/i.test(id)) continue;
      if (EXCLUDED_GEMINI_MODEL_PATTERN.test(id)) continue;
      const methods = Array.isArray(m?.supportedGenerationMethods) ? m.supportedGenerationMethods : [];
      if (!methods.includes('generateContent')) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      collected.push({
        id,
        displayName: String(m?.displayName || id).trim(),
        description: String(m?.description || '').trim(),
        inputTokenLimit: typeof m?.inputTokenLimit === 'number' ? m.inputTokenLimit : undefined,
        outputTokenLimit: typeof m?.outputTokenLimit === 'number' ? m.outputTokenLimit : undefined,
      });
    }
    pageToken = typeof payload?.nextPageToken === 'string' ? payload.nextPageToken.trim() : '';
    if (!pageToken) break;
  }

  return collected.sort((a, b) => compareGeminiModelVersion(a.id, b.id));
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
 * 관리자가 설정한 정확한 Gemini 모델로 generateContent API를 호출한다 (임의 버전 변경 없음).
 */
export async function callGeminiWithFallback(options: GeminiCallOptions): Promise<GeminiCallResult> {
  const { apiKey, rawModel, body, timeoutMs = 55000 } = options;
  const model = normalizeGeminiModel(rawModel);
  const triedModels: string[] = [model];
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

  if (resp.status === 404) {
    throw new Error(`Gemini API (${model}, HTTP 404): ${apiMessage || '해당 모델을 찾을 수 없습니다.'} — 본사 [AI 엔진 설정]에서 Google AI Studio 최신 모델 목록을 동기화해 확인해 주세요.`);
  }
  throw new Error(`Gemini API (${model}, HTTP ${resp.status}): ${apiMessage || '요청 처리 실패'}`);
}
