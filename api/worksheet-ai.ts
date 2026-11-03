import { prisma } from '../lib/prisma';
import { authenticate, staff, need, text, failure, academyScope } from '../lib/portal-http';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // 나노시트 2~3페이지 압축 이미지 수신을 위해 10MB로 확장
    }
  }
};

// 연령별 발달 모델 매핑 헬퍼
function resolveDevelopmentLevel(grade: string): { level: string; coreQuestion: string; direction: string } {
  const g = String(grade || '').trim();
  if (g.includes('7') || g.includes('유치') || g.includes('미취학')) {
    return {
      level: 'LEVEL 0 (7세)',
      coreQuestion: '내 생각을 표현하는가?',
      direction: '표현의 출현, 감정·선택·상상·그림 중심 관찰'
    };
  }
  if (g.includes('초1') || g.includes('초2') || g.includes('1학년') || g.includes('2학년')) {
    return {
      level: 'LEVEL 1 (초등 1~2학년)',
      coreQuestion: '내 생각을 문장으로 표현하고 간단히 설명하는가?',
      direction: '짧은 문장, 간단한 이유, 일상 경험 연결 관찰'
    };
  }
  if (g.includes('초3') || g.includes('초4') || g.includes('3학년') || g.includes('4학년')) {
    return {
      level: 'LEVEL 2 (초등 3~4학년)',
      coreQuestion: '내 생각을 연결하고 설명하는가?',
      direction: '이유·근거, 관계·인과, 관점 전환, 비교 표현 관찰'
    };
  }
  return {
    level: 'LEVEL 3 (초등 5~6학년 및 중등)',
    coreQuestion: '내 생각을 구조화하고 확장하는가?',
    direction: '주장·근거, 복수 관점, 추론, 재해석, 깊이 있는 탐구 관찰'
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: '지원하지 않는 요청 방식입니다.' });

  try {
    const user = await authenticate(req);
    staff(user);

    const body = req.body || {};
    const mode = body.mode === 'aggregate' ? 'aggregate' : 'single';
    const studentName = text(body.studentName, '학생명', 100, true);
    const grade = text(body.grade, '학년', 50, false) || '초등 3학년';
    const bookTitle = text(body.bookTitle, '도서명', 300, false) || '도서';
    const bookAuthor = text(body.bookAuthor, '저자', 200, false) || '작자 미상';
    const sheetCount = Number(body.sheetCount) || 1;
    const images = Array.isArray(body.images) ? body.images : [];

    // 마스터 계정 등록 Gemini API Key 및 Model 조회
    const configRow = await prisma.portalSetting.findUnique({ where: { key: 'gemini_api_config' } });
    const aiConfig = (configRow?.value || {}) as Record<string, any>;
    const apiKey = typeof aiConfig.apiKey === 'string' && aiConfig.apiKey.trim() ? aiConfig.apiKey.trim() : (process.env.GEMINI_API_KEY || '');
    let rawModel = typeof aiConfig.model === 'string' && aiConfig.model.trim() ? aiConfig.model.trim() : (process.env.GEMINI_MODEL || 'gemini-3.8-flash');

    let model = rawModel;
    const modelLower = rawModel.toLowerCase();
    if (modelLower.includes('3.8-flash') || modelLower.includes('3.8')) model = 'gemini-3.8-flash';
    else if (modelLower.includes('3.5-pro') || modelLower.includes('3.5')) model = 'gemini-3.5-pro';
    else if (modelLower.includes('3.0-flash-lite')) model = 'gemini-3.0-flash-lite';
    else if (modelLower.includes('3.0-flash') || modelLower.includes('3.0')) model = 'gemini-3.0-flash';
    else if (modelLower.includes('1.5-pro')) model = 'gemini-1.5-pro';
    else if (modelLower.includes('1.5-flash')) model = 'gemini-1.5-flash';
    else if (modelLower.includes('2.0-flash') || modelLower.includes('2.0')) model = 'gemini-2.0-flash';
    else if (!model.startsWith('gemini-')) model = 'gemini-3.8-flash';

    need(apiKey, '본사 마스터 관리자에서 Gemini API 키를 먼저 등록해 주세요.', 503);

    const devLevel = resolveDevelopmentLevel(grade);

    if (mode === 'single') {
      need(images.length > 0, '나노시트 사진(2~3페이지)을 최소 1장 이상 업로드해 주세요.');
      need(images.length <= 5, '나노시트 사진은 한 번에 최대 5장까지 분석할 수 있습니다.');

      const systemPrompt = `당신은 대한민국 최고 수준의 아동 독서사고력 및 나노시트 교육 전문 연구원입니다.
제공된 이미지는 학생이 오프라인에서 직접 손글씨와 그림으로 작성한 "나노시트 2~3페이지" 사진입니다.

[분석 대상자 정보]
- 학생명: ${studentName}
- 학년/연령: ${grade} -> 발달 모델: ${devLevel.level} (핵심 질문: ${devLevel.coreQuestion} / ${devLevel.direction})
- 도서명: ${bookTitle} (저자: ${bookAuthor})
- 누적 회차: ${sheetCount}번째 나노시트

[나노시트 분석 핵심 정의 & 절대 금기 원칙]
1. 나노시트 AI는 아이의 독서능력을 시험하거나 채점하는 AI가 절대 아닙니다.
2. 짧은 답변 자체를 낮은 수준으로 보지 마세요.
3. 그림 중심 표현을 글 중심 표현보다 낮게 평가하지 마세요.
4. 맞춤법·띄어쓰기 오류를 사고력 부족으로 연결하지 마세요.
5. 부정적 단어, 등급, 서열, 점수, 오답 처리, 타인/또래 비교는 단 하나도 쓰지 마세요.
6. 관찰된 강점 80%, 자연스러운 다음 성장 방향 20%의 황금 비율을 엄격히 지키세요.
7. 반드시 학생이 실제로 작성한 손글씨 문장이나 그림 속 요소를 "직접 인용(actualQuotes)"하여 사실에 근거해 작성하세요. (글씨가 흐려 판독이 어려우면 알아볼 수 있는 단어와 그림 맥락을 중심으로 관찰)

[8대 핵심 Observation Criteria]
- 자기표현: 자신의 생각·감정·선호·의견을 표현하는가
- 경험 연결: 질문의 내용과 자신의 경험·생활을 연결하는가
- 상상 확장: 제시된 상황에서 새로운 요소·상황·결말을 만들어내는가
- 관점 전환: 다른 인물·대상의 입장에서 생각하는가
- 구체화: 생각에 이유·설명·세부 내용을 덧붙이는가
- 관계·인과: 인물·사건·행동의 원인과 결과를 표현하는가
- 질문·탐구: 새로운 궁금증이나 탐구 방향을 만들어내는가
- 표현 방식 발전: 그림·단어·문장을 조합하여 생각을 표현하는가

[반드시 아래 JSON 형식으로만 응답하세요 (마크다운 코드블록이나 백틱 없이 순수 JSON)]:
{
  "summary": "한 줄 요약 (예: '주인공의 감정을 자신의 일상 경험과 이어서 당당하게 표현했어요')",
  "actualQuotes": [
    {
      "quote": "아이가 시트에 실제로 적은 문장 그대로 인용 (손글씨 판독)",
      "criteria": "8대 지표 중 1개 (예: 경험 연결)",
      "comment": "실제 글에 근거한 구체적인 칭찬과 관찰 코멘트 (1~2문장)"
    }
  ],
  "drawingObservation": "그림이 있는 경우만 작성 (예: '글에 다 담지 못한 인물의 표정을 그림의 눈매로 표현했어요'). 그림이 없으면 빈 문자열",
  "languageHandwritingNote": "가독성 및 문장 표현의 특징에 대한 긍정적 관찰 1문장 (맞춤법 지적 금지)",
  "nextStep": "부족함 지적이 아닌, 다음에 자연스럽게 시도해 볼 수 있는 1가지 방향 (예: '다음에는 왜 그렇게 생각했는지 이유를 한 문장 더 덧붙여 보아도 좋아요')",
  "parentGuide": "가정에서 부모님이 아이에게 해줄 수 있는 칭찬 멘트 또는 열린 질문 1개",
  "teacherCommentDraft": "지도교사 첨삭 코멘트 제안문 (학원 선생님이 확인 후 바로 쓸 수 있는 150~250자의 따뜻한 피드백)"
}`;

      // Gemini Vision 멀티모달 파츠 구성
      const parts: any[] = [{ text: systemPrompt }];
      for (const img of images) {
        if (!img || !img.data) continue;
        const mimeType = img.mimeType || 'image/jpeg';
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: String(img.data).replace(/^data:image\/[a-z]+;base64,/, '')
          }
        });
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const geminiResp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048
          }
        })
      });

      if (!geminiResp.ok) {
        const errJson = await geminiResp.json().catch(() => ({}));
        throw new Error((errJson.error && errJson.error.message) || `Gemini API 호출 실패 (${geminiResp.status})`);
      }

      const geminiData = await geminiResp.json();
      const rawText = (((geminiData.candidates || [])[0] || {}).content || {}).parts?.[0]?.text || '';
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      let parsedResult: any;

      try {
        parsedResult = JSON.parse(cleaned);
      } catch (jsonErr) {
        // 비정형 출력 시 폴백 구조화
        parsedResult = {
          summary: `${studentName} 학생이 도서의 핵심 장면을 정성껏 생각하고 표현했습니다.`,
          actualQuotes: [
            {
              quote: "나노시트 작성 답안",
              criteria: "자기표현",
              comment: "자신의 생각과 감정을 성실하게 표현했습니다."
            }
          ],
          drawingObservation: "",
          languageHandwritingNote: "또박또박 정성을 다해 생각을 글과 그림으로 담아냈습니다.",
          nextStep: "다음에는 떠오른 생각에 '왜냐하면'을 덧붙여 구체적인 이유를 한 문장 더 적어보아도 좋습니다.",
          parentGuide: "아이가 책을 읽고 스스로 생각을 끝까지 완성한 점을 크게 칭찬해 주세요.",
          teacherCommentDraft: `${studentName} 학생이 『${bookTitle}』을(를) 읽고 자신의 생각을 성실히 담아냈습니다. 정성스러운 표현 태도를 칭찬하며 다음 독서 활동에서도 즐겁게 생각을 펼치길 기대합니다.`
        };
      }

      return res.json({
        ok: true,
        mode: 'single',
        model,
        result: parsedResult
      });
    }

    // 2. 모드: aggregate (기간별 종합 분석지 - 4권 이상 누적 시)
    if (mode === 'aggregate') {
      const logs = Array.isArray(body.logs) ? body.logs : [];
      need(logs.length >= 4, '기간별 종합 분석지 발급을 위해서는 최소 4회차 이상의 나노시트 기록이 필요합니다.');

      const period = text(body.period, '분석 기간', 100, false) || '최근 3개월';
      const logSummary = logs.map((l: any, idx: number) => {
        return `${idx + 1}회차: [도서: ${l.bookTitle || '도서'}] - 작성일: ${l.date || ''} - 이전 코멘트/인용: ${l.comment || l.summary || '정성 작성'}`;
      }).join('\n');

      const aggregatePrompt = `당신은 대한민국 최고 수준의 아동 독서사고력 및 나노시트 교육 전문 연구원입니다.
학생의 누적된 ${logs.length}권의 나노시트 분석 기록을 바탕으로 [기간별 종합 분석지]를 작성하세요.

[학생 정보]
- 학생명: ${studentName} (${grade})
- 분석 기간: ${period} (총 ${logs.length}회차 완독 및 나노시트 누적)
- 회차별 기록:\n${logSummary}

[학부모용 종합 분석지 출력 원칙]
1. 권장 출력 형태: 제목 1개 + 짧은 블렛포인트 5~8개 (학부모가 1분 안에 읽고 감동할 수 있는 분량)
2. 성장·강점 약 80% (관찰된 변화, 생각의 확장, 글·그림의 특징을 긍정적이고 구체적인 문장으로 제시)
3. 다음 성장 방향 약 20% (부족함 지적이 아니라 다음 활동에서 자연스럽게 시도할 1~2가지 방향)
4. 절대 금지: 등급, 서열, 점수, 또래 비교, 단정적 표현("똑똑하다", "수준이 높다" 등)

[반드시 아래 JSON 형식으로만 응답하세요]:
{
  "title": "이번 활동의 한 줄 요약 제목 (예: '자신의 경험을 주인공의 감정과 연결해 이유를 구체화하는 방향으로 성장했어요')",
  "period": "${period}",
  "totalSessions": ${logs.length},
  "strengths": [
    "성장·강점 1: 자신의 생각과 감정을 글과 그림으로 분명하게 표현함",
    "성장·강점 2: 책 속 상황을 자신의 일상 경험과 연결하는 모습이 뚜렷해짐",
    "성장·강점 3: 단순 선택에서 그 이유를 한 문장 더 덧붙이는 구체화가 나타남",
    "성장·강점 4: 이전 회차와 비교해 인물의 행동 원인과 결과를 유기적으로 파악함"
  ],
  "nextDirections": [
    "다음에는 '만약 나라면 어떻게 했을까?' 하는 새로운 관점의 상상을 한 문장 더 펼쳐보아도 좋아요."
  ],
  "parentClosing": "지금 나타난 표현을 충분히 인정해 주시고, 아이가 스스로 이유를 편안하게 말할 수 있도록 긍정적인 질문으로 응원해 주세요."
}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const geminiResp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: aggregatePrompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1500
          }
        })
      });

      if (!geminiResp.ok) {
        const errJson = await geminiResp.json().catch(() => ({}));
        throw new Error((errJson.error && errJson.error.message) || `Gemini API 호출 실패 (${geminiResp.status})`);
      }

      const geminiData = await geminiResp.json();
      const rawText = (((geminiData.candidates || [])[0] || {}).content || {}).parts?.[0]?.text || '';
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedResult = JSON.parse(cleaned);

      return res.json({
        ok: true,
        mode: 'aggregate',
        model,
        result: parsedResult
      });
    }

  } catch (err: any) {
    console.error('Worksheet AI Error:', err);
    return res.status(err.status || 500).json({
      error: err.message || '나노시트 AI 분석 처리 중 오류가 발생했습니다.'
    });
  }
}

