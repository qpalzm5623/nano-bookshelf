import { prisma } from '../lib/prisma';
import { authenticate, staff, need, text, failure } from '../lib/portal-http';
import { callGeminiWithFallback, parseGeminiJson, DEFAULT_GEMINI_MODEL } from '../lib/portal-gemini';

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
    const rawModel = typeof aiConfig.model === 'string' && aiConfig.model.trim() ? aiConfig.model.trim() : (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL);

    const devLevel = resolveDevelopmentLevel(grade);

    if (mode === 'single') {
      need(images.length > 0, '나노시트 사진(2~3페이지)을 최소 1장 이상 업로드해 주세요.');
      need(images.length <= 5, '나노시트 사진은 한 번에 최대 5장까지 분석할 수 있습니다.');

      if (!apiKey) {
        return res.status(400).json({
          error: '본사 마스터 관리자 [AI 엔진 설정]에서 Google Gemini API 키(AIzaSy...)를 먼저 등록해 주세요.'
        });
      }
      if (apiKey.startsWith('sk-')) {
        return res.status(400).json({
          error: '현재 등록된 키는 OpenAI API 키(sk-...)입니다. 본사 마스터 관리자 [AI 엔진 설정]에서 Google Gemini API 키(AIzaSy...)로 변경해 주세요.'
        });
      }

      const systemPrompt = `당신은 대한민국 최고 수준의 아동 독서사고력 및 나노시트(독서활동지) 전문 첨삭 연구원입니다.
제공된 이미지는 학생이 오프라인에서 직접 손글씨와 그림으로 작성한 "나노시트(독서활동지)" 사진입니다.
반드시 첨부된 나노시트 사진 속에 실제로 보이는 손글씨와 그림 내용만을 직접 판독하여 분석하세요.

[분석 대상자 정보]
- 학생명: ${studentName}
- 학년/연령: ${grade} (발달 모델: ${devLevel.level} - 핵심 질문: ${devLevel.coreQuestion} / ${devLevel.direction})
- 도서명: 『${bookTitle}』 (저자: ${bookAuthor})
- 누적 회차: ${sheetCount}번째 나노시트

[★ 가장 중요한 작성 지침: 사진 기반 실제 판독 & 상투적이고 정형화된 매크로 멘트 전면 금지 ★]
1. 이미지-온리(Vision-Only) 판독 및 날조 금지 원칙:
   - 오직 첨부된 사진 속에 실제로 쓰여 있거나 그려져 있는 내용만 분석하세요. 온라인 '생각 담기' 문장이나 사진에 없는 내용을 절대 추측·창작하지 마세요.
   - 학생이 사진 속 활동지에 직접 손글씨로 적은 문장·단어와 그린 그림(인물, 사물, 표정, 말풍선 등)을 우선 읽어낸 뒤, 그 실제 표현을 근거로 피드백을 작성하세요.
   - 만약 사진이 비어 있거나 판독이 어려운 흐린 글씨·단순 낙서 위주라면, 없는 문장이나 거창한 사고력을 꾸며내지 말고 사진에서 실제로 관찰되는 활동 상태(예: 그림 표현 중심, 짧은 메모 등)만 사실대로 따뜻하게 서술하세요.
   - actualQuotes[].quote 에는 사진 속 손글씨에서 실제로 읽히는 문장/단어만 인용하고, 판독 가능한 문장이 없으면 빈 배열([])로 반환하세요.
2. 절대 금지 표현 (다음과 같은 뻔하고 추상적인 문장은 절대 쓰지 마세요):
   - "도서의 핵심 줄거리를 바탕으로 자신의 생각과 느낌을 성실하게 표현했습니다" (절대 금지)
   - "다음에는 왜 그렇게 생각했는지 구체적인 이유나 까닭을 한 문장 더 덧붙여 보면 더욱 좋습니다" (절대 금지)
   - "아이가 스스로 생각을 끝까지 매듭지은 점을 크게 칭찬해 주시고, 재미있었던 장면에 대해 열린 대화를 나누어 보세요" (절대 금지)
   - "자신의 생각과 느낌을 주도적으로 표현했습니다" (절대 금지)
3. 반드시 지켜야 할 작성 원칙:
   - 『${bookTitle}』의 구체적인 장면, 인물(주인공, 주변 인물 등), 사건, 갈등, 혹은 도서의 핵심 주제와 학생의 실제 사진 속 글/그림이 어떻게 연결되는지 직접 언급하세요.
   - 학부모가 읽었을 때 "선생님이 우리 아이가 나노시트에 적은 글과 그림을 정말 꼼꼼하게 읽고 보셨구나!"라고 느낄 수 있는 구체적이고 따뜻한 문장이어야 합니다.
   - 짧은 답변이나 맞춤법 오류를 지적하지 말고, 관찰된 강점 80%, 자연스러운 다음 성장 방향 20%의 비율을 지키세요.

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
  "summary": "첨부된 나노시트 사진에서 실제로 확인된 학생의 글·그림 표현과 『${bookTitle}』의 내용을 연결하여, 아이가 보여준 시선·감정·상상력·표현 특징을 구체적으로 관찰 요약한 2~3문장",
  "actualQuotes": [
    {
      "quote": "사진 속 학생 손글씨에서 실제로 판독한 문장 또는 단어 그대로 인용 (글씨가 없으면 actualQuotes를 빈 배열로 반환)",
      "criteria": "8대 지표 중 1개 (예: 경험 연결)",
      "comment": "인용한 사진 속 실제 글에 근거한 구체적인 관찰 코멘트 (1~2문장)"
    }
  ],
  "drawingObservation": "사진에 그림이 있는 경우 그림 속 사물·인물·표정 등을 구체적으로 서술. 그림이 없으면 빈 문자열",
  "languageHandwritingNote": "사진에서 확인된 손글씨/문장 구성 특징에 대한 긍정적 관찰 1문장 (맞춤법 지적 금지)",
  "nextStep": "『${bookTitle}』의 주제 및 사진 속 활동과 연결하여, 다음 독서에서 시도해볼 구체적인 생각 놀이·활동 미션을 제시한 2~3문장",
  "parentGuide": "부모님이 아이의 나노시트 글·그림을 보며 바로 건넬 수 있는 『${bookTitle}』 맞춤형 대화 질문 1~2개와 따뜻한 대화 팁을 담은 2~3문장",
  "teacherCommentDraft": "지도교사 첨삭 코멘트 제안문 (사진 속 아이의 글·그림 내용을 반영한 150~250자의 따뜻한 피드백)"
}`;

      // Google Gemini Vision 멀티모달 호출
      const parts: any[] = [{ text: systemPrompt }];
      for (const img of images) {
        if (!img || !img.data) continue;
        const mimeType = img.mimeType || 'image/jpeg';
        const base64Data = String(img.data).replace(/^data:image\/[a-z0-9+.-]+;base64,/i, '').trim();
        if (!base64Data) continue;
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }
      need(parts.length > 1, '유효한 나노시트 이미지 데이터를 찾을 수 없습니다. 사진을 다시 선택해 주세요.');

      let parsedResult: any = null;
      let usedModel = rawModel;

      try {
        const geminiCall = await callGeminiWithFallback({
          apiKey,
          rawModel,
          timeoutMs: 55000,
          body: {
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2500,
              responseMimeType: 'application/json'
            }
          }
        });
        usedModel = geminiCall.model;
        parsedResult = parseGeminiJson(geminiCall.data);
      } catch (visionErr: any) {
        console.error('[WorksheetAI] Vision 호출/파싱 실패:', visionErr?.message || visionErr);
        return res.status(502).json({
          error: visionErr?.message || '나노시트 사진 AI 분석에 실패했습니다. 본사 AI 설정과 사진 선명도를 확인한 뒤 다시 시도해 주세요.'
        });
      }

      const summaryText = typeof parsedResult?.summary === 'string' ? parsedResult.summary.trim() : '';
      if (!summaryText) {
        return res.status(502).json({
          error: 'AI가 나노시트 사진에서 분석 요약을 생성하지 못했습니다. 사진이 잘 보이도록 다시 촬영해 주세요.'
        });
      }

      const normalizedQuotes = Array.isArray(parsedResult.actualQuotes)
        ? parsedResult.actualQuotes
            .filter((q: any) => q && typeof q.quote === 'string' && q.quote.trim())
            .map((q: any) => ({
              quote: q.quote.trim(),
              criteria: String(q.criteria || '자기표현').trim(),
              comment: String(q.comment || '').trim()
            }))
        : [];

      const safeResult = {
        summary: summaryText,
        actualQuotes: normalizedQuotes,
        drawingObservation: typeof parsedResult.drawingObservation === 'string' ? parsedResult.drawingObservation.trim() : '',
        languageHandwritingNote: typeof parsedResult.languageHandwritingNote === 'string' ? parsedResult.languageHandwritingNote.trim() : '',
        nextStep: typeof parsedResult.nextStep === 'string' ? parsedResult.nextStep.trim() : '',
        parentGuide: typeof parsedResult.parentGuide === 'string' ? parsedResult.parentGuide.trim() : '',
        teacherCommentDraft: typeof parsedResult.teacherCommentDraft === 'string' && parsedResult.teacherCommentDraft.trim()
          ? parsedResult.teacherCommentDraft.trim()
          : summaryText
      };

      return res.json({
        ok: true,
        mode: 'single',
        model: usedModel,
        result: safeResult
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

      need(apiKey && !apiKey.startsWith('sk-'), '본사 마스터 관리자에서 Google Gemini API 키를 확인해 주세요.', 400);

      const geminiCall = await callGeminiWithFallback({
        apiKey,
        rawModel,
        timeoutMs: 45000,
        body: {
          contents: [{ role: 'user', parts: [{ text: aggregatePrompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1500,
            responseMimeType: 'application/json'
          }
        }
      });

      const parsedResult = parseGeminiJson(geminiCall.data);

      return res.json({
        ok: true,
        mode: 'aggregate',
        model: geminiCall.model,
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
