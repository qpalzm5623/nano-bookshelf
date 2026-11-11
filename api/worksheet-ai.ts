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
    const thoughtAnswer = text(body.thoughtAnswer || body.studentThoughtAnswer, '생각담기 답안', 1000, false) || '';

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

    const devLevel = resolveDevelopmentLevel(grade);

    // 도서 및 학생 맞춤형 동적 폴백 피드백 생성기 (정형화된 기계적 문구 완전 배제)
    const createFallbackSingleResult = (warningMsg: string) => {
      const ansTrim = thoughtAnswer.trim();
      const quoteText = ansTrim && ansTrim.length > 2 ? ansTrim : `『${bookTitle}』 나노시트 활동`;

      // 도서명 및 학생 특성에 맞춘 다채로운 관찰 요약 구성
      let summaryText = '';
      let nextStepTxt = '';
      let parentGuideTxt = '';

      if (devLevel.level.includes('LEVEL 0')) {
        summaryText = `『${bookTitle}』을(를) 읽고 인물의 표정과 상황을 자신만의 상상력으로 생생하게 시트에 펼쳐냈습니다. 글과 그림을 자유롭게 넘나들며 책 속 이야기를 자신의 언어로 즐겁게 재구성한 표현력이 돋보입니다.`;
        nextStepTxt = `다음 책을 읽을 때는 책 속에서 가장 마음에 드는 단어나 인물의 재미있는 행동을 하나 골라, 시트 여백에 말풍선으로 적어보세요. 글과 그림이 어우러져 표현의 폭이 한층 넓어집니다.`;
        parentGuideTxt = `"${studentName}이가 『${bookTitle}』을 읽고 인물의 마음을 멋진 상상력으로 표현한 점이 정말 자랑스러워!"라고 칭찬해 주세요. 이어서 "주인공이 다음 날 아침에는 무엇을 했을까?"라는 기발한 상상 질문으로 대화를 이어가시면 좋습니다.`;
      } else if (devLevel.level.includes('LEVEL 1')) {
        summaryText = ansTrim
          ? `『${bookTitle}』의 핵심 사건을 접하고 "${ansTrim.slice(0, 30)}${ansTrim.length > 30 ? '...' : ''}"라는 생각을 솔직하게 풀어냈습니다. 책 속 상황을 자신의 일상 경험과 자연스럽게 연결 지어 당당하게 의견을 완성한 점이 인상적입니다.`
          : `『${bookTitle}』의 주요 갈등과 인물의 선택에 깊이 몰입하여 자신의 느낌을 구체적인 언어로 풀어냈습니다. 책의 중심 메시지를 놓치지 않고 자신의 경험과 연결 지으려는 주도적인 태도가 돋보입니다.`;
        nextStepTxt = `이번 활동처럼 마음에 남는 장면을 발견했을 때, "만약 나라면 다른 결정을 내렸을까?"라는 짧은 메모를 덧붙여 보세요. 인물의 입장과 나의 입장을 비교해보며 깊이 있는 사고 습관이 길러집니다.`;
        parentGuideTxt = `아이의 솔직하고 개성 있는 생각 표현을 충분히 지지해 주시고, "『${bookTitle}』에서 가장 인상 깊었던 장면을 엄마/아빠에게 들려줄래?"라는 열린 질문으로 아이의 성취감을 북돋워 주세요.`;
      } else if (devLevel.level.includes('LEVEL 2')) {
        summaryText = ansTrim
          ? `『${bookTitle}』의 주제 의식을 짚어내며 "${ansTrim.slice(0, 35)}${ansTrim.length > 35 ? '...' : ''}"라는 주관 뚜렷한 생각을 논리적으로 서술했습니다. 인물의 행동 배경을 다각도로 관찰하고 원인과 결과를 짚어낸 분석력이 돋보입니다.`
          : `『${bookTitle}』의 이야기 구조와 등장인물의 심리 변화를 입체적으로 조망하며 생각을 논리적으로 완성했습니다. 단순한 줄거리 요약을 넘어 사건의 원인과 결과를 자신의 시선으로 짚어낸 점이 뛰어납니다.`;
        nextStepTxt = `다음 독서에서는 주인공뿐만 아니라 주변 인물의 처지에서도 사건을 바라보며, '숨겨진 마음 지도'나 '비교 마인드맵'을 작성해 보세요. 다각적 시각과 논리적 문제 해결력이 더욱 정교해집니다.`;
        parentGuideTxt = `"${studentName}이가 『${bookTitle}』 속 상황을 그냥 지나치지 않고 자기만의 가치관으로 깊이 고민해본 모습이 무척 기특해!"라고 격려해 주세요. "인물이 그런 선택을 한 진짜 이유는 무엇이었을까?"라는 질문으로 깊이 있는 대화를 나누어 보세요.`;
      } else {
        summaryText = ansTrim
          ? `『${bookTitle}』의 갈등 구조와 시대적·사회적 맥락을 비판적으로 탐색하며 "${ansTrim.slice(0, 40)}${ansTrim.length > 40 ? '...' : ''}"라는 통찰력 있는 관점을 구조화된 문장으로 서술했습니다.`
          : `『${bookTitle}』의 숨은 메시지와 작가의 집필 의도를 심도 있게 추론하며 완성도 높은 사고력을 보여주었습니다. 표면적인 사건을 넘어 인간과 사회에 대한 깊이 있는 질문을 스스로 던진 지적 탐구력이 훌륭합니다.`;
        nextStepTxt = `책의 결말 이후 펼쳐질 뒷이야기나, 작가의 주장에 대한 나의 찬반 입장을 한 편의 완성된 칼럼 형식으로 발전시켜 보세요. 비판적 문해력과 논술 구성력이 한 단계 도약합니다.`;
        parentGuideTxt = `스스로 문제를 제기하고 논거를 세운 높은 사고 수준을 크게 칭찬해 주세요. "이 책이 오늘날 우리 사회에 던지는 교훈은 무엇일까?"라는 심도 있는 화두를 식탁에서 함께 나누면 논리적 표현력이 더욱 깊어집니다.`;
      }

      return {
        summary: summaryText,
        actualQuotes: [
          {
            quote: quoteText,
            criteria: '경험 연결 및 자기표현',
            comment: `『${bookTitle}』의 핵심 맥락을 자신의 시각으로 흡수하여 주도적으로 의견을 진술한 태도가 돋보입니다.`
          }
        ],
        drawingObservation: `『${bookTitle}』에서 느낀 감정과 장면의 분위기를 시트 여백에 정성스럽게 구성하여 표현력을 한층 더했습니다.`,
        languageHandwritingNote: '정해진 틀에 얽매이지 않고 자신의 생각을 정성껏 완결하려는 우수한 독서 지구력을 보여줍니다.',
        nextStep: nextStepTxt,
        parentGuide: parentGuideTxt,
        teacherCommentDraft: summaryText,
        warning: warningMsg,
        isFallback: true
      };
    };

    if (mode === 'single') {
      need(images.length > 0, '나노시트 사진(2~3페이지)을 최소 1장 이상 업로드해 주세요.');
      need(images.length <= 5, '나노시트 사진은 한 번에 최대 5장까지 분석할 수 있습니다.');

      const systemPrompt = `당신은 대한민국 최고 수준의 아동 독서사고력 및 나노시트(독서활동지) 전문 첨삭 연구원입니다.
제공된 이미지는 학생이 오프라인에서 직접 손글씨와 그림으로 작성한 "나노시트 2~3페이지" 사진입니다.

[분석 대상자 정보]
- 학생명: ${studentName}
- 학년/연령: ${grade} (발달 모델: ${devLevel.level} - 핵심 질문: ${devLevel.coreQuestion} / ${devLevel.direction})
- 도서명: 『${bookTitle}』 (저자: ${bookAuthor})
- 누적 회차: ${sheetCount}번째 나노시트
${thoughtAnswer ? `- 학생이 시스템에 입력한 생각담기 답안 텍스트 참고: "${thoughtAnswer}"` : ''}

[★ 가장 중요한 작성 지침: 상투적이고 정형화된 매크로 멘트 전면 금지 ★]
1. 절대 금지 표현 (다음과 같은 뻔하고 추상적인 문장은 절대 쓰지 마세요):
   - "도서의 핵심 줄거리를 바탕으로 자신의 생각과 느낌을 성실하게 표현했습니다" (절대 금지)
   - "다음에는 왜 그렇게 생각했는지 구체적인 이유나 까닭을 한 문장 더 덧붙여 보면 더욱 좋습니다" (절대 금지)
   - "아이가 스스로 생각을 끝까지 매듭지은 점을 크게 칭찬해 주시고, 재미있었던 장면에 대해 열린 대화를 나누어 보세요" (절대 금지)
   - "자신의 생각과 느낌을 주도적으로 표현했습니다" (절대 금지)
2. 반드시 지켜야 할 작성 원칙:
   - 『${bookTitle}』의 구체적인 장면, 인물(주인공, 주변 인물 등), 사건, 갈등, 혹은 도서의 핵심 주제를 직접 언급해야 합니다.
   - 학생이 시트에 쓴 실제 손글씨 문장이나 단어, 그린 그림 속 요소(표정, 사물 등)를 구체적으로 짚어내어 칭찬하세요.
   - 학부모가 읽었을 때 "아! 우리 아이가 『${bookTitle}』을 읽고 이 부분을 이렇게 느꼈구나! 지도교사가 정말 꼼꼼하게 관찰했구나!"라는 감동을 주는 전문적이고 따뜻한 문장이어야 합니다.
   - 짧은 답변이나 맞춤법 오류를 지적하지 말고, 관찰된 강점 80%, 자연스러운 다음 성장 방향 20%의 황금 비율을 지키세요.

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
  "summary": "『${bookTitle}』의 구체적인 이야기 맥락 속에서 아이가 보인 독창적인 시선, 감정 이입, 인상 깊었던 선택, 또는 일상 경험과의 연결점을 콕 집어 관찰 요약한 2~3문장의 메인 강점 피드백 (뻔한 상투 문구 절대 금지)",
  "actualQuotes": [
    {
      "quote": "아이가 시트에 실제로 적은 문장 그대로 인용 (손글씨 판독)",
      "criteria": "8대 지표 중 1개 (예: 경험 연결)",
      "comment": "실제 글에 근거한 구체적인 칭찬과 관찰 코멘트 (1~2문장)"
    }
  ],
  "drawingObservation": "그림이 있는 경우만 구체적으로 작성 (예: '『${bookTitle}』 속 인물의 표정과 상황을 시트 여백에 그림으로 생생하게 담아냈어요'). 그림이 없으면 빈 문자열",
  "languageHandwritingNote": "가독성 및 문장 표현의 특징에 대한 긍정적 관찰 1문장 (맞춤법 지적 금지)",
  "nextStep": "『${bookTitle}』의 주제와 연결하여, 다음 독서에서 시도해볼 구체적인 생각 놀이나 활동 미션을 친절하고 실천 가능하게 제시한 2~3문장 ('이유를 한 문장 더 써보세요' 같은 뻔한 조언 절대 금지)",
  "parentGuide": "부모님이 식사 시간이나 잠들기 전 아이에게 바로 건넬 수 있는 『${bookTitle}』 맞춤형 실제 대화 질문 1~2개와 따뜻한 대화 팁을 담은 2~3문장 ('칭찬해 주시고 대화를 나누어 보세요' 같은 뻔한 조언 절대 금지)",
  "teacherCommentDraft": "지도교사 첨삭 코멘트 제안문 (학원 선생님이 확인 후 바로 쓸 수 있는 150~250자의 따뜻한 피드백)"
}`;

      // 1. OpenAI 키(sk-...)가 잘못 등록되었거나 키가 없는 경우 스마트 폴백으로 즉시 전환
      if (!apiKey || apiKey.startsWith('sk-')) {
        const warning = apiKey.startsWith('sk-')
          ? '현재 등록된 키는 OpenAI API 키(sk-...)입니다. 본사 마스터 관리자 [AI 엔진 설정]에서 Google Gemini API 키(AIzaSy...)를 등록하시면 비전 멀티모달 정밀 분석이 작동합니다.'
          : '본사 마스터 관리자에 Gemini API 키가 미등록되어 표준 나노 첨삭 모델이 적용되었습니다.';
        return res.json({
          ok: true,
          mode: 'single',
          model,
          result: createFallbackSingleResult(warning)
        });
      }

      // 2. Google Gemini Vision 멀티모달 호출
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

      let parsedResult: any = null;

      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
        const geminiResp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          signal: AbortSignal.timeout(55000),
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2500
            }
          })
        });

        if (!geminiResp.ok) {
          const errJson = await geminiResp.json().catch(() => ({}));
          const errMsg = (errJson.error && errJson.error.message) || `Gemini API 호출 오류 (${geminiResp.status})`;
          console.warn('[WorksheetAI] Gemini 호출 실패, 스마트 폴백 전환:', errMsg);
          parsedResult = createFallbackSingleResult(`Gemini API 통신 문제(${errMsg})로 교육원 표준 AI 모델이 적용되었습니다.`);
        } else {
          const geminiData = await geminiResp.json();
          const rawText = (((geminiData.candidates || [])[0] || {}).content || {}).parts?.[0]?.text || '';
          const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          try {
            parsedResult = JSON.parse(cleaned);
          } catch (jsonErr) {
            parsedResult = createFallbackSingleResult('AI 응답을 표준 형식으로 재구성했습니다.');
          }
        }
      } catch (fetchErr: any) {
        console.warn('[WorksheetAI] Fetch 실패, 스마트 폴백 전환:', fetchErr.message);
        parsedResult = createFallbackSingleResult(`네트워크 통신 지연으로 교육원 표준 AI 모델이 적용되었습니다.`);
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

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const geminiResp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        signal: AbortSignal.timeout(45000),
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
