import { prisma } from '../lib/prisma';
import { authenticate, staff, need } from '../lib/portal-http';

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

// ==============================================================
// 5대 분석 축 기반 정성 코멘트 자동 생성 규칙
// 1. 다양성: 어떤 종류의 책을 읽는가? 넓어지고 있는가?
// 2. 난이도: 아이 수준에 맞는가? 올라가고 있는가?
// 3. 습관: 꾸준한가? 리듬이 있는가?
// 4. 몰입: 빠져드는 경험을 하고 있는가?
// 5. 이해도 정합성: 난이도와 이해도가 함께 가는가?
// 규칙: 3~4개 코멘트, 각 40~70자, 2문장 이내, 독서량 감소 지적 금지, 타인 비교 금지
// ==============================================================

interface BookItem {
  title: string;
  author?: string;
  pub?: string;
  category?: string;
  theme?: string;
  grade?: string;
  score?: number | string;
  date?: string;
  comment?: string;
  isSeries?: boolean;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const user = await authenticate(req);
    staff(user);

    const body = req.body || {};
    const studentName = String(body.studentName || '학생').trim();
    const studentGrade = String(body.studentGrade || '').trim();
    const books: BookItem[] = Array.isArray(body.books) ? body.books : [];
    const period = String(body.period || '최근 기간').trim();

    // 1. 시스템 설정에서 Gemini API 설정 조회
    const configRow = await prisma.portalSetting.findUnique({ where: { key: 'gemini_api_config' } });
    const aiConfig = (configRow?.value || {}) as Record<string, any>;
    const apiKey = typeof aiConfig.apiKey === 'string' ? aiConfig.apiKey.trim() : (process.env.GEMINI_API_KEY || '');
    const model = typeof aiConfig.model === 'string' && aiConfig.model ? aiConfig.model : 'gemini-1.5-flash';

    // 2. API 키가 있으면 Gemini API 호출
    if (apiKey) {
      try {
        const comments = await generateStoryWithGemini(apiKey, model, studentName, studentGrade, books, period);
        if (Array.isArray(comments) && comments.length >= 3) {
          return res.json({
            ok: true,
            engine: 'gemini',
            model: model,
            comments: comments.slice(0, 4)
          });
        }
      } catch (err: any) {
        console.warn('[Gemini API 호출 실패, 룰베이스 엔진으로 전환]:', err.message || err);
      }
    }

    // 3. Fallback: 5대 축 & 하드 룰 기반 정밀 알고리즘
    const fallbackComments = generateRuleBasedStory(studentName, studentGrade, books);
    return res.json({
      ok: true,
      engine: 'rule_based',
      comments: fallbackComments
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message || '서버 오류가 발생했습니다.' });
  }
}

// Gemini API 직접 호출 함수
async function generateStoryWithGemini(
  apiKey: string,
  model: string,
  studentName: string,
  studentGrade: string,
  books: BookItem[],
  period: string
): Promise<string[]> {
  const booksSummary = books.map((b, idx) => {
    return `${idx + 1}. [${b.title}] / 분야: ${b.category || '일반'} / 주제: ${b.theme || '자유'} / 권장: ${b.grade || '전체'} / 점수: ${b.score || 100}점 / 완독일: ${b.date || '최근'}`;
  }).join('\n');

  const systemInstruction = `
당신은 대한민국 최고 수준의 B2B 독서논술 아카데미 '나노의 책장' 교육 연구원입니다.
학생의 북퀴즈 응시 이력과 완독 도서 메타데이터를 정밀 분석하여, 학부모가 읽었을 때 "우리 아이 독서가 어떻게 달라지고 있는지"를 3~4문장으로 즉시 이해할 수 있는 정성 코멘트 3~4개를 작성해야 합니다.

[2대 분석 축]
1. 다양성: 어떤 종류의 책을 읽는가? 장르/주제 관심사가 넓어지고 있는가?
2. 난이도: 아이 학년 수준에 맞는가? 한 단계 위 책이나 생각할 거리가 있는 책으로 올라가고 있는가?
3. 습관: 꾸준한가? 공백 없이 독서가 생활 리듬으로 자리 잡고 있는가?
4. 몰입: 특정 주제나 시리즈, 동일 작가에 깊이 빠져드는 몰입 경험을 하고 있는가?
5. 이해도 정합성: 난이도가 올라가면서도 퀴즈 점수가 잘 유지되며 제대로 이해하고 읽고 있는가?

[3대 표현 원칙 (Hard Rules)]
- 낙인 금지: 모든 신호를 '강점' 또는 '성장의 기회'로 긍정 프레이밍할 것.
- 비교 금지: 타인, 또래, 반 평균과의 직접 비교 표현 절대 금지.
- 사실 기반: 주어진 도서 목록과 실제 점수/완독일 등의 사실만 기반으로 서술.
- 독서량 감소 언급 금지: 독서량이 줄었다는 지적은 절대 하지 말고, 긍정 신호(몰입, 깊이, 어휘 등)에만 집중할 것.
- 길이 엄수: 각 코멘트는 40자 이상 70자 이하, 2문장 이내로 작성할 것. (총 3~4개)

[금칙어 및 대체 표현]
- "편식이 심합니다" ❌ -> "이야기에 깊이 빠져 있는 시기입니다" ⭕
- "또래보다 늦습니다" ❌ -> "자기 속도로 꾸준히 읽고 있습니다" ⭕
- "쉬운 책만 읽습니다" ❌ -> "익숙한 수준에서 편안하게 즐기고 있습니다" ⭕
- "독서량이 줄었습니다" ❌ -> (절대 노출하지 않음)
- "비문학이 부족합니다" ❌ -> "이야기책에서 쌓은 힘을 다른 분야로 넓혀갈 시점입니다" ⭕

[출력 형식]
반드시 다른 설명 없이 JSON 배열 형식으로만 출력하십시오:
["코멘트 1 (40~70자, 2문장 이내)", "코멘트 2 (40~70자, 2문장 이내)", "코멘트 3 (40~70자, 2문장 이내)"]
`;

  const userPrompt = `
학생 이름: ${studentName}
학생 학년: ${studentGrade || '초등'}
분석 기간: ${period}
완독 및 퀴즈 응시 도서 (${books.length}권):
${booksSummary || '도서 이력 준비 중'}

위 학생의 독서 변화를 3~4개의 따뜻하고 통찰력 있는 학부모용 정성 코멘트(JSON 배열)로 작성해 주세요.
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: systemInstruction + '\n\n' + userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 800
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // JSON 파싱
  const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  if (Array.isArray(parsed) && parsed.length >= 3) {
    return parsed.map(c => String(c).trim()).filter(Boolean);
  }
  throw new Error('Invalid JSON array from Gemini');
}

// 5대 축 정밀 룰 기반 알고리즘 (Fallback)
function generateRuleBasedStory(studentName: string, studentGrade: string, books: BookItem[]): string[] {
  const name = studentName || '학생';
  if (!books || books.length === 0) {
    return [
      `${name}의 첫 독서 기록이 차곡차곡 쌓이기 시작했습니다. 꾸준한 독서 습관의 좋은 출발점입니다.`,
      `다양한 책과의 만남을 통해 스스로 책장을 넘기는 즐거움을 편안하게 알아가고 있습니다.`,
      `다음 분기에는 읽은 도서와 북퀴즈 성취도를 바탕으로 더욱 입체적인 성장을 살펴보겠습니다.`
    ];
  }

  const count = books.length;
  const categories = [...new Set(books.map(b => b.category || '').filter(Boolean))];
  const scores = books.map(b => typeof b.score === 'number' ? b.score : parseFloat(String(b.score || '100').replace(/[^0-9.]/g, ''))).filter(s => !isNaN(s));
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 100;

  const results: string[] = [];

  // 1. 다양성 축
  if (categories.length >= 3) {
    results.push(`문학과 인문, 사회 등 ${categories.length}가지 다양한 분야의 도서를 고루 접했습니다. 관심의 폭이 넓어지는 시기입니다.`);
  } else if (categories.length === 1) {
    results.push(`${categories[0]} 분야의 책에 푹 빠져 재미를 붙이고 있습니다. 좋아하는 세계에 몰입하는 힘이 자라고 있습니다.`);
  } else {
    results.push(`이야기책을 중심으로 새로운 주제의 도서를 함께 탐색하고 있습니다. 폭넓은 배경지식을 쌓아가는 중입니다.`);
  }

  // 2. 난이도 및 이해도 정합성 축
  if (avgScore >= 85) {
    results.push(`권장 도서의 북퀴즈 평균이 ${avgScore}점으로 높게 유지되고 있습니다. 줄거리와 핵심 맥락을 정확히 이해하며 읽고 있습니다.`);
  } else {
    results.push(`다양한 난이도의 책에 능동적으로 도전하고 있습니다. 스스로 부딪히며 사고의 틀을 넓혀가는 소중한 과정입니다.`);
  }

  // 3. 습관 및 리듬 축
  if (count >= 5) {
    results.push(`${count}권의 도서를 공백 없이 꾸준히 완독했습니다. 독서가 일상 속 자연스러운 생활 리듬으로 자리 잡았습니다.`);
  } else {
    results.push(`자기만의 속도로 한 권 한 권 정성껏 완독해 나가고 있습니다. 책 읽는 성취감을 단단히 다져가는 중입니다.`);
  }

  // 4. 몰입 축 (시리즈 또는 작가)
  const authors = books.map(b => b.author).filter(Boolean);
  const authorCounts: Record<string, number> = {};
  authors.forEach(a => { if (a) authorCounts[a] = (authorCounts[a] || 0) + 1; });
  const topAuthor = Object.entries(authorCounts).find(([_, c]) => c >= 2);

  if (topAuthor) {
    results.push(`좋아하는 작가의 작품을 연속으로 탐독하며 깊은 애착을 보였습니다. 독서 몰입의 큰 즐거움을 만끽하고 있습니다.`);
  } else {
    results.push(`책 속 등장인물의 감정에 깊이 공감하며 읽고 있습니다. 상상력과 생각의 힘이 쑥쑥 자라나는 시기입니다.`);
  }

  return results.slice(0, 4);
}

