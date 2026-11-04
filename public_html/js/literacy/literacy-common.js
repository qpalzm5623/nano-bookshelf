/* ==============================================================
 * 나노의 책장 - 초등 문해력 진단 공통 모듈 (관리자 / 학생 / 마스터 / 학부모 뷰어 공용)
 *
 * 원본: Korean Test/byeolbyeol-literacy (components/Report.tsx 등)를 나노판(NEXT_PUBLIC_BRAND=nano) 기준으로
 * 순수 JS 문자열 템플릿으로 이식했습니다.
 * - 결과지(정기 진단용 / 신규 상담용) HTML 생성
 * - 레벨 변화 추이 · 레이더 · 눈금 SVG
 * - 서버 API 호출 헬퍼
 *
 * [왜 문자열 템플릿인가] 기존 관리자/학생 화면이 프레임워크 없이 동작하므로,
 * React 없이도 어디서든 호출할 수 있도록 "데이터 → HTML 문자열" 함수로 만들었습니다.
 * 모든 사용자 입력(학생 이름 등)은 esc()로 이스케이프합니다.
 * ============================================================== */
(function (global) {
  'use strict';

  var BRAND = {
    org: '나노의책장',
    reportTitle: '나노의책장 초등 문해력 진단지 결과',
    consultTitle: '나노의책장 초등 문해력 진단 결과',
    testTitle: '나노의책장 초등 문해력 진단지',
    levelName: '나노 레벨',
    levelFull: '나노 문해력 레벨',
    // 나노의책장은 수업에서 학습도구어를 직접 훈련하지 않으므로 훈련 약속 문구를 쓰지 않는다
    trainsInClass: false,
    guideHref: 'resources/literacy/guide_nano.html'
  };
  var AREAS = ['어휘이해력', '학습도구어', '요약', '비교', '추론'];
  var BOOK_AREAS = ['어휘이해력', '요약', '비교', '추론'];
  var AREA_DESC = {
    '어휘이해력': '낱말의 뜻과 문맥 속 쓰임',
    '학습도구어': "'기준', '비교하시오' 같은 공부의 언어",
    '요약': '중심 생각을 추려 간추리기',
    '비교': '두 대상·두 글의 같은 점과 다른 점',
    '추론': '글에 숨은 뜻을 근거로 짐작하기'
  };
  var EXPECTED_RANGE = { 0: [1, 2], 1: [3, 4], 2: [5, 6], 3: [7, 8], 4: [9, 10] };
  var GRADE_LABEL = { 0: '7세', 1: '초등 1학년', 2: '초등 2학년', 3: '초등 3학년', 4: '초등 4학년' };
  var BAND_LABEL = { 0: '밴드0 (7세 · 15문항)', 1: '밴드1 (초1~2 · 25문항)', 2: '밴드2 (초3~4 · 25문항)' };
  var LEVEL_DESC = [
    [9, '여러 글을 견주고 스스로 정리하는 단계예요.'],
    [7, '글의 뜻을 추리고 간추리는 단계예요.'],
    [5, '글의 흐름을 따라가며 이해하는 단계예요.'],
    [3, '짧은 글을 읽고 내용을 잡는 단계예요.'],
    [1, '글자와 낱말에 익숙해지는 단계예요.']
  ];
  var CATEGORY_LABEL = { above: '기대 수준 이상', at: '기대 수준 도달', near: '기대 구간 바로 아래', 'needs-support': '함께 키워 갈 단계' };
  var JUDGE_ORDER = { '기대 이상': 3, '도달': 2, '근접': 1, '보완 필요': 0 };
  var PILL_CLASS = { '기대 이상': 'top', '도달': 'ok', '근접': 'near', '보완 필요': 'low' };

  var STRENGTH = {
    '어휘이해력': '낱말의 뜻을 잘 알고 문맥에 맞는 말을 골라 써요.',
    '학습도구어': "'기준', '원리' 같은 공부의 언어를 든든하게 알고 있어요. 교과 수업을 따라갈 바탕이에요.",
    '요약': '글에서 중요한 내용을 추려 간추릴 줄 알아요.',
    '비교': '두 대상과 두 글을 견주어 같은 점과 다른 점을 잘 찾아요.',
    '추론': '글에 숨은 뜻과 인물의 마음을 근거를 들어 짐작해요.'
  };
  var GROWTH = {
    '어휘이해력': '낱말의 뜻을 문맥 속에서 가늠하는 힘이 책 속에서 자랄 차례예요.',
    '학습도구어': "'기준', '비교하시오' 같은 공부의 언어는 책 읽기만으로는 늘지 않아요. 책 읽기와 별개로 꾸준히 훈련해야 늘어요.",
    '요약': '중요한 내용과 덜 중요한 내용을 가려내는 힘이 책 속에서 자랄 차례예요.',
    '비교': '두 대상을 나란히 놓고 견주어 보는 경험이 책 속에서 더 쌓일 차례예요.',
    '추론': '글에 그대로 나온 내용은 잘 찾지만, 인물의 마음이나 까닭을 짐작하는 문제는 아직 낯설어요.'
  };
  // 가정 팁은 책 놀이 중심 (교습식 처방 금지 - 검사설계서 §6)
  var TIPS = [
    { area: '추론', title: '“왜 그랬을까?” 물어보기', body: '책을 읽다가 인물의 행동에서 멈추고 “왜 그랬을 것 같아?”라고 물어보세요. 답보다 근거(“어디 보고 알았어?”)를 칭찬해 주세요.' },
    { area: '요약', title: '세 문장 간추리기', body: "읽은 이야기를 '처음–가운데–끝' 세 문장으로 말하게 해 보세요." },
    { area: '비교', title: '닮은 점·다른 점 찾기', body: '두 인물이나 두 책을 놓고 “뭐가 닮았고 뭐가 달라?”를 한 가지씩 번갈아 말해 보세요.' },
    { area: '어휘이해력', title: '낱말 짐작 놀이', body: '책에서 처음 본 낱말이 나오면 “무슨 뜻일 것 같아?” 하고 먼저 짐작해 본 뒤 함께 확인해 보세요.' },
    { area: '학습도구어', title: '공부의 언어 말로 써 보기', body: '새로 만난 학습도구어를 집에서 한 번씩 말로 써 보게 해 주세요 — “오늘은 무엇을 \'비교\'해 봤어?”처럼요.' },
    { area: null, title: '다음 장면 맞히기', body: '책장을 넘기기 전에 “다음에 무슨 일이 생길까?”를 먼저 말해 보게 하세요.' },
    { area: null, title: '제목 새로 짓기', body: '다 읽은 책에 새 제목을 붙이고 까닭을 말해 보세요 — 요약과 추론이 한 번에 자라는 책 놀이예요.' }
  ];

  /* ---------- 공통 헬퍼 ---------- */
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // 날짜는 한국 시간(KST) 기준으로 표기 (자정~오전 9시 사이 응시의 날짜 밀림 방지)
  function kst(iso) { return new Date(+new Date(iso) + 9 * 3600000); }
  function fmtDate(iso) { var d = kst(iso); return d.getUTCFullYear() + '. ' + (d.getUTCMonth() + 1) + '. ' + d.getUTCDate() + '.'; }
  function fmtDateShort(iso) { var d = kst(iso); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); }
  function fmtMonth(iso) { var d = kst(iso); return d.getUTCFullYear() + '.' + String(d.getUTCMonth() + 1).padStart(2, '0'); }
  function gradeName(g) { return g === 0 ? '7세' : g + '학년'; }
  function levelDesc(level) {
    for (var i = 0; i < LEVEL_DESC.length; i++) if (level >= LEVEL_DESC[i][0]) return LEVEL_DESC[i][1];
    return LEVEL_DESC[LEVEL_DESC.length - 1][1];
  }
  // 받침 유무에 따라 조사 고르기: josa('요약','은','는') → '요약은'
  function josa(word, withFinal, withoutFinal) {
    var code = String(word).charCodeAt(String(word).length - 1);
    var has = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 > 0;
    return word + (has ? withFinal : withoutFinal);
  }
  var strong = function (a) { return JUDGE_ORDER[a.judgement] >= 2; };

  // 서버 API 호출 (같은 도메인 쿠키 세션 사용)
  async function api(action, options) {
    options = options || {};
    var query = new URLSearchParams(Object.assign({ action: action }, options.params || {}));
    var res = await fetch('/api/literacy?' + query.toString(), {
      method: options.body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(options.timeout || 20000)
    });
    var data;
    try { data = await res.json(); } catch (e) { throw new Error('서버 응답을 확인하지 못했습니다.'); }
    if (!res.ok) throw new Error(data.error || '서버 요청에 실패했습니다.');
    return data;
  }

  /* ---------- 결과지 서사 ---------- */
  // 영역 결과를 서사용으로 정리: 책이 키우는 영역(강한 순) · 학습도구어 · 강점 · 보완
  function analyze(areas) {
    var bookAreas = areas.filter(function (a) { return BOOK_AREAS.indexOf(a.area) >= 0; })
      .sort(function (a, b) { return JUDGE_ORDER[b.judgement] - JUDGE_ORDER[a.judgement] || b.correct - a.correct; });
    var toolArea = areas.filter(function (a) { return a.area === '학습도구어'; })[0];
    var all = bookAreas.concat([toolArea]);
    var strengths = all.filter(strong).sort(function (a, b) { return JUDGE_ORDER[b.judgement] - JUDGE_ORDER[a.judgement] || b.correct - a.correct; });
    var growths = all.filter(function (a) { return !strong(a); }).sort(function (a, b) { return JUDGE_ORDER[a.judgement] - JUDGE_ORDER[b.judgement] || a.correct - b.correct; });
    // 모두 강하거나 모두 약해도 양쪽에 한 가지씩은 적는다 (강점 먼저 서사 유지)
    if (!strengths.length) strengths = [all.slice().sort(function (a, b) { return b.correct - a.correct; })[0]];
    if (!growths.length) growths = [all.slice().sort(function (a, b) { return a.correct - b.correct; })[0]];
    return { bookAreas: bookAreas, toolArea: toolArea, strengths: strengths, growths: growths };
  }

  function badgeText(rec) {
    var g = gradeName(rec.student.gradeStep);
    var c = rec.result.category;
    return g + ' ' + (c === 'above' ? '기대 수준 이상' : c === 'at' ? '기대 수준 도달' : c === 'near' ? '기대 구간 바로 아래' : '기대 구간까지 함께 가요');
  }

  function summaryText(rec, strengths, growths) {
    var grade = rec.student.gradeStep, range = EXPECTED_RANGE[grade], g = gradeName(grade);
    var where = rec.result.category === 'above' ? g + ' 기대 구간(★' + range[0] + '~' + range[1] + ')을 넘어섰어요.'
      : rec.result.category === 'at' ? g + ' 기대 구간(★' + range[0] + '~' + range[1] + ')에 들어 있어요.'
        : g + ' 기대 구간은 ★' + range[0] + '~' + range[1] + '이에요.';
    var s = strengths[0], w = growths[0];
    // 강점으로 꼽을 영역이 실제로는 강하지 않을 때(전 영역 근접·보완)는 과장하지 않는다
    if (s && !strong(s)) return where + " 이번 진단에서는 '" + s.area + "' 영역이 가장 좋았어요. 아직 낯선 영역들은 좋아하는 책을 읽어 가면서 하나씩 자라날 거예요.";
    var sText = s ? (s.area === '학습도구어' ? ' 공부의 언어(학습도구어)는 또래보다 탄탄하고,' : " '" + s.area + "' 영역은 든든하게 자리 잡았고,") : '';
    var wText = (!w || strong(w)) ? ' 다섯 영역이 고르게 자라 있어요.'
      : w.area === '학습도구어' ? ' 학습도구어는 책 읽기와 별개로 꾸준히 훈련하면 늘어요.'
        : " '" + w.area + "' 영역은 지금부터 책과 함께 키우면 좋아요.";
    return where + sText + wText;
  }

  function consultText(rec, strengths, growths) {
    var grade = rec.student.gradeStep, range = EXPECTED_RANGE[grade], g = gradeName(grade);
    if (rec.result.category === 'above') return g + ' 기대 구간(★' + range[0] + '~' + range[1] + ')을 이미 넘어섰어요. 이제 더 넓고 깊은 책으로 성장을 이어 갈 차례예요.';
    if (rec.result.category === 'at') return g + ' 기대 구간(★' + range[0] + '~' + range[1] + ') 안에 있어요. 아이가 즐겁게 읽을 수 있는 책의 범위가 잘 보이는 자리예요.';
    var s = strengths[0];
    var sText = s && strong(s) ? (s.area === '학습도구어' ? '공부의 언어(학습도구어)는 든든한 편이라, ' : "'" + s.area + "' 영역은 또래 수준에 도달해 있어서, ") : '';
    var wNames = growths.slice(0, 2).map(function (a) { return "'" + a.area + "'"; }).join('·');
    return g + ' 기대 구간은 ★' + range[0] + '~' + range[1] + '이에요. ' + sText + wNames + ' 영역이 자라면 기대 구간 진입도 충분히 가능해요.';
  }

  /* ---------- SVG ---------- */
  function rulerSvg(level, grade) {
    var r = EXPECTED_RANGE[grade], x = function (lv) { return 45 + 67 * (lv - 1); };
    var rectX = x(r[0]) - 20, rectW = x(r[1]) - x(r[0]) + 40, s = '';
    for (var i = 0; i < 10; i++) {
      s += '<text x="' + x(i + 1) + '" y="42" fill="' + (i < level ? '#1F8A7E' : '#D1D5DB') + '" font-size="24" text-anchor="middle">★</text>';
    }
    var nums = '';
    for (var j = 0; j < 10; j++) nums += '<text x="' + x(j + 1) + '" y="59" font-size="10.5" font-weight="600" fill="#94A3B8" text-anchor="middle">' + (j + 1) + '</text>';
    return '<svg viewBox="0 0 680 66" role="img" aria-label="' + esc(BRAND.levelName + ' ' + level) + '">' +
      '<rect x="' + rectX + '" y="18" width="' + rectW + '" height="30" rx="6" fill="#F0FDFA" stroke="#5EEAD4" stroke-width="1.2"/>' +
      '<text x="' + (rectX + rectW / 2) + '" y="13" font-size="10.5" font-weight="700" fill="#0D9488" text-anchor="middle">' + gradeName(grade) + ' 기대 구간</text>' +
      s + nums + '<circle cx="' + x(level) + '" cy="34" r="18" fill="none" stroke="#EA580C" stroke-width="2.2"/></svg>';
  }

  function radarSvg(areas) {
    var cx = 135, cy = 115, R = 75;
    var angle = function (i) { return ((i * 72 - 90) * Math.PI) / 180; };
    var pt = function (i, r) { return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))]; };
    var ring = function (r) { return AREAS.map(function (_, i) { return pt(i, r).map(function (v) { return v.toFixed(1); }).join(','); }).join(' '); };
    var data = AREAS.map(function (a, i) {
      var f = areas.filter(function (x) { return x.area === a; })[0];
      return pt(i, Math.max((f ? f.correct / f.total : 0) * R, 5));
    });
    var labels = [{ x: 135, y: 22 }, { x: 236, y: 84, tool: 1 }, { x: 195, y: 198 }, { x: 75, y: 198 }, { x: 34, y: 84 }];
    var g = [R, R * 0.75, R * 0.5, R * 0.25].map(function (r) { return '<polygon points="' + ring(r) + '"/>'; }).join('') +
      AREAS.map(function (_, i) { var p = pt(i, R); return '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '"/>'; }).join('');
    return '<svg viewBox="0 0 270 215" role="img" aria-label="다섯 영역 레이더 차트"><g fill="none" stroke="#E2E8F0">' + g + '</g>' +
      '<polygon points="' + data.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="rgba(31,138,126,.14)" stroke="#1F8A7E" stroke-width="2.2"/>' +
      data.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === 1 ? 4 : 3) + '" fill="#fff" stroke="' + (i === 1 ? '#EA580C' : '#1F8A7E') + '" stroke-width="' + (i === 1 ? 2.2 : 1.8) + '"/>'; }).join('') +
      '<g font-size="11.5" font-weight="700" text-anchor="middle">' + AREAS.map(function (a, i) { return '<text x="' + labels[i].x + '" y="' + labels[i].y + '" fill="' + (labels[i].tool ? '#EA580C' : '#334155') + '">' + a + '</text>'; }).join('') + '</g></svg>';
  }

  // 레벨 변화 꺾은선 (같은 학생 기록 2개 이상일 때). history: [{id, finishedAt, level}] 오래된 순
  function trendSvg(history, grade) {
    var shown = history.slice(-5), n = shown.length;
    var x = function (i) { return n === 1 ? 350 : 90 + (i * 520) / (n - 1); };
    var y = function (lv) { return 95 - ((lv - 1) * 75) / 9; };
    var expected = EXPECTED_RANGE[grade][1];
    var s = '<svg viewBox="0 0 680 115" role="img" aria-label="진단 회차별 ' + BRAND.levelName + ' 변화">';
    s += '<g font-size="11" fill="#94A3B8" text-anchor="end">' + [9, 7, 5, 3].map(function (lv) { return '<text x="50" y="' + (y(lv) + 4) + '">★' + lv + '</text>'; }).join('') + '</g>';
    s += '<g stroke="#E2E8F0">' + [9, 7, 5, 3].map(function (lv) { return '<line x1="60" y1="' + y(lv) + '" x2="660" y2="' + y(lv) + '"/>'; }).join('') + '</g>';
    s += '<line x1="60" y1="' + y(expected) + '" x2="660" y2="' + y(expected) + '" stroke="#EA580C" stroke-dasharray="4 4" stroke-width="1.2"/>';
    s += '<text x="656" y="' + (y(expected) - 6) + '" font-size="10" font-weight="600" fill="#EA580C" text-anchor="end">지금 학년 기대</text>';
    if (n > 1) s += '<polyline points="' + shown.map(function (r, i) { return x(i) + ',' + y(r.level); }).join(' ') + '" fill="none" stroke="#1F8A7E" stroke-width="2.5"/>';
    s += '<g fill="#fff" stroke="#1F8A7E" stroke-width="2.5">' + shown.map(function (r, i) { return '<circle cx="' + x(i) + '" cy="' + y(r.level) + '" r="5"/>'; }).join('') + '</g>';
    s += '<g font-size="11" font-weight="600" fill="#475569" text-anchor="middle">' + shown.map(function (r, i) {
      return '<text x="' + x(i) + '" y="' + Math.min(y(r.level) + 18, 110) + '">' + (i + 1) + '회 · ' + fmtMonth(r.finishedAt) + ' · ★' + r.level + '</text>';
    }).join('') + '</g></svg>';
    return s;
  }

  /* ---------- 결과지 블록 ---------- */
  function areasBlock(a) {
    var s = '<div class="areas"><div class="grouphead">📖 책이 키우는 영역 — <span>독서 활동을 통해 자연스럽게 자라는 영역입니다.</span></div>';
    a.bookAreas.forEach(function (x) {
      s += '<div class="area"><div><h3>' + x.area + '</h3></div><div class="desc">' + AREA_DESC[x.area] + '<span class="pcount">' + x.total + '문항 중 ' + x.correct + '개</span></div>' +
        '<span class="rpill ' + PILL_CLASS[x.judgement] + '">' + x.judgement + '</span></div>';
    });
    s += '<div class="grouphead tool">✏️ 훈련으로 키우는 영역 — <span>책 읽기만으로는 늘지 않아 별도 학습 훈련이 필요한 영역입니다.</span></div>' +
      '<div class="area tool"><div><h3>학습도구어</h3></div><div class="desc">' + AREA_DESC['학습도구어'] + '<span class="pcount">' + a.toolArea.total + '문항 중 ' + a.toolArea.correct + '개</span></div>' +
      '<span class="rpill">' + a.toolArea.judgement + '</span></div></div>';
    return s;
  }

  // 바닥/천장 재응시 권장 박스. opts.retakeFn 이 있으면(관리자 화면) 재배정 버튼을 붙인다
  function retakeBox(rec, opts) {
    var r = rec.result;
    if (!r.floor && !r.ceiling) return '';
    var band = r.floor ? r.band - 1 : r.band + 1;
    var btn = (opts && opts.retakeFn)
      ? '<button type="button" class="retake-btn" onclick="' + opts.retakeFn + '(\'' + esc(rec.memberId || '') + '\',' + band + ')">밴드' + band + ' 검사지로 다시 배정하기 →</button>' : '';
    return r.floor
      ? '<div class="retake"><b>아랫단계 검사지 재응시 권장</b> — 이번 검사지가 아직 어려웠어요. 한 단계 아래 검사지로 다시 재어 보면 지금 위치가 더 정확하게 보여요. 재응시하면 결과지는 그 검사지 기준으로 다시 발행돼요.' + btn + '</div>'
      : '<div class="retake"><b>윗단계 검사지 응시 권장</b> — 이번 검사지를 거의 다 맞혔어요. 한 단계 위 검사지로 재면 지금 실력의 윗부분까지 볼 수 있어요.' + btn + '</div>';
  }

  function minutesOf(rec) {
    if (rec.minutes) return rec.minutes;
    var ms = (rec.responses || []).reduce(function (s, r) { return s + (r.ms || 0); }, 0);
    return Math.max(1, Math.round(ms / 60000));
  }

  var FOOTER_REGULAR = function (total) {
    return '<footer><p><b>이 진단의 근거</b> — 전 문항 2022 개정 교육과정 성취기준(7세는 누리과정) 기반 출제 · 어휘는 국립국어원 어휘 등급 자료 등재 낱말 · 지문 전부 자체 창작 · 독서지도 전문가 전수 검수. ' +
      '<a href="' + BRAND.guideHref + '" target="_blank" rel="noreferrer">상세 안내문 보기</a></p>' +
      '<p><b>알아두세요</b> — 본 결과는 ' + total + '문항 선별용 간이 진단의 참고 자료로, 공인 검사를 대신하지 않습니다. 유창성(소리 내어 읽기)·쓰기는 수업 중 관찰로 보완합니다.</p></footer>';
  };

  // 정기 진단용 결과지 (A4 2장 규격). history = 같은 학생 완료 기록(오래된 순)
  function renderRegular(rec, history, opts) {
    var st = rec.student, res = rec.result;
    var round = Math.max(1, history.map(function (h) { return h.id; }).indexOf(rec.id) + 1);
    var an = analyze(res.areas);
    var weakOrder = an.growths.map(function (a) { return a.area; });
    var tips = TIPS.filter(function (t) { return t.area && weakOrder.indexOf(t.area) >= 0; }).sort(function (a, b) { return weakOrder.indexOf(a.area) - weakOrder.indexOf(b.area); })
      .concat(TIPS.filter(function (t) { return t.area === null; }), TIPS.filter(function (t) { return t.area && weakOrder.indexOf(t.area) < 0; })).slice(0, 4);
    var next = kst(rec.finishedAt); next.setUTCMonth(next.getUTCMonth() + 6);
    var nextIso = new Date(+next - 9 * 3600000).toISOString();

    var h = '<main class="page">' +
      // [A4 제1장: 나노 레벨 및 5대 영역 종합 진단]
      '<div class="lit-sheet lit-sheet-1">' +
      '<header><div><div class="brand">' + BRAND.org + '</div><h1>' + BRAND.reportTitle + '</h1></div>' +
      '<div class="meta"><b>' + esc(st.name) + '</b> · ' + GRADE_LABEL[st.gradeStep] + '<br>진단일 ' + fmtDate(rec.finishedAt) + ' · ' + round + '회차<br>' + res.total + '문항 · 약 ' + minutesOf(rec) + '분</div></header>' +
      '<div class="about"><p><b>문해력이란?</b> 글을 읽고 뜻을 이해하며 생각을 끌어내는 힘입니다. 이 진단은 문해력을 <b>어휘이해력·학습도구어·요약·비교·추론</b> 다섯 영역으로 나누어 진단하며, 서울시교육청 등 공적 표준 검사 틀을 초등 눈높이로 다듬은 체계적인 구성입니다.</p></div>' +
      '<section class="sec-level"><h2><span class="no">1</span>우리 아이의 ' + BRAND.levelName + '</h2><div class="rcard"><div class="hero"><div class="level"><small>' + BRAND.levelFull + '</small><strong>★ ' + res.level + '</strong><span class="badge">' + badgeText(rec) + '</span></div>' +
      '<div class="summary"><b>' + levelDesc(res.level) + '</b><p>' + esc(summaryText(rec, an.strengths, an.growths)) + '</p></div></div><div class="ruler">' + rulerSvg(res.level, st.gradeStep) + '</div>' + retakeBox(rec, opts) + '</div></section>' +
      '<section class="sec-profile"><h2><span class="no">2</span>다섯 영역, 어디가 강하고 어디를 키울까요?</h2><div class="rcard"><div class="profile"><div class="radar">' + radarSvg(res.areas) + '</div>' + areasBlock(an) + '</div>' +
      '<div class="rnote">영역별 결과는 영역당 ' + an.toolArea.total + '문항에 기반한 경향 참고 자료입니다. 책이 키우는 영역은 강한 순서로 표시됩니다.</div></div></section>' +
      '</div>' + // end lit-sheet-1

      // [A4 제2장: 강점/보완 처방, 가정 독서 팁, 레벨 성장 추이]
      '<div class="lit-sheet lit-sheet-2">' +
      '<section class="sec-strengths"><h2><span class="no">3</span>잘하는 것부터 볼게요</h2><div class="cols"><div class="col"><h3>👍 ' + esc(st.name) + '의 강점</h3><ul>' +
      an.strengths.slice(0, 3).map(function (a) { return '<li><b>' + a.area + '</b> — ' + (strong(a) ? STRENGTH[a.area] : '다섯 영역 가운데 가장 잘한 영역이에요. 여기서 얻는 자신감이 다른 영역을 키우는 힘이 돼요.') + '</li>'; }).join('') +
      '</ul></div><div class="col focus"><h3>🌱 함께 키울 부분</h3><ul>' +
      (strong(an.growths[0]) ? '<li>다섯 영역이 고르게 자라 있어요 — 지금보다 한 뼘 어려운 책으로 넓혀 가면 더 자랄 거예요.</li>'
        : an.growths.filter(function (a) { return !strong(a); }).slice(0, 3).map(function (a) { return '<li><b>' + a.area + '</b> — ' + GROWTH[a.area] + '</li>'; }).join('')) +
      '</ul></div></div></section>' +
      '<section class="sec-tips"><h2><span class="no">4</span>이렇게 도와주세요</h2><div class="tips">' + tips.map(function (t) { return '<div class="tip"><b>' + t.title + '</b>' + t.body + '</div>'; }).join('') + '</div>' +
      '<div class="classbox"><b>' + josa(BRAND.org, '은', '는') + '</b> 아이가 <b>직접 고른 책</b>을 읽는 것을 중요하게 생각합니다. 어휘·요약·추론 같은 힘이 책 속에서 자라는 모습을 다음 진단에서 함께 확인해 주세요. 학습도구어는 책 읽기와 별개로 <b>꾸준한 훈련</b>을 해야 실력이 늘 수 있으니, 이 점도 참고해 주세요.</div></section>' +
      '<section class="trend sec-trend"><h2><span class="no">5</span>' + BRAND.levelName + ' 변화</h2><div class="rcard">' +
      (history.length > 1 ? trendSvg(history, st.gradeStep) : '<p style="margin:0;font-size:12.5px;color:#64748b">첫 진단이에요. 6개월마다 다시 진단하면 이 자리에 별이 쌓여요.</p>') +
      '<div class="rnote">6개월마다 다시 진단하면 별이 쌓입니다. 다음 진단 추천일: <b>' + fmtDate(nextIso) + '</b></div></div></section>' +
      FOOTER_REGULAR(res.total) +
      '</div>' + // end lit-sheet-2
      '</main>';
    return h;
  }

  // 신규 상담용 결과지 (1장 요약 + 6개월 로드맵)
  function renderConsult(rec, opts) {
    var st = rec.student, res = rec.result, an = analyze(res.areas), range = EXPECTED_RANGE[st.gradeStep];
    var inRange = res.category === 'at' || res.category === 'above', name = esc(st.name);
    var h = '<main class="page compact"><div class="lit-sheet lit-sheet-1"><header><div><div class="brand">' + BRAND.org + '</div><h1>' + BRAND.consultTitle + '</h1></div>' +
      '<div class="meta"><b>' + name + '</b> · ' + GRADE_LABEL[st.gradeStep] + '<br>진단일 ' + fmtDate(rec.finishedAt) + ' · 신규 상담<br>' + res.total + '문항 · 약 ' + minutesOf(rec) + '분</div></header>' +
      '<div class="about"><p><b>이 진단은 평가가 아니라, 아이의 현재를 가늠하기 위한 자료입니다.</b> 지금 위치를 알면 아이가 즐겁게 읽을 수 있는 책의 범위가 보입니다.</p></div>' +
      '<section><h2><span class="no">1</span>지금 위치</h2><div class="rcard"><div class="hero"><div class="level"><small>' + BRAND.levelFull + '</small><strong>★ ' + res.level + '</strong><span class="badge">' + badgeText(rec) + '</span></div>' +
      '<div class="summary"><b>' + levelDesc(res.level) + '</b><p>' + esc(consultText(rec, an.strengths, an.growths)) + '</p></div></div>' + retakeBox(rec, opts) + '</div></section>' +
      '<section><h2><span class="no">2</span>영역별 한눈에</h2>' + areasBlock(an) + '</section>' +
      '<section><h2><span class="no">3</span>앞으로의 6개월, 아이는 이렇게 자랍니다</h2><div class="roadmap">' +
      '<div class="rstep now"><b>지금 · ★' + res.level + '</b>현재 위치를 확인했어요 — ' + josa(name, '이가', '가') + ' 즐겁게 읽을 수 있는 책의 범위가 보여요</div>' +
      '<div class="rstep"><b>다니는 동안 · 책 읽기</b>아이가 <b>직접 책을 고르고</b>, ' + josa(BRAND.org, '은', '는') + ' 수준에 맞는 범위를 안내해요. 읽는 즐거움이 어휘·요약·추론을 키워요</div>' +
      '<div class="rstep"><b>틈틈이 · 학습도구어</b>책 읽기만으로는 늘지 않는 공부의 언어예요. 책 읽기와 별개로 꾸준한 훈련이 필요해요</div>' +
      '<div class="rstep"><b>6개월 후 · 재진단</b>책이 키운 성장을 기록으로 확인해요 — ' + (inRange ? '다음 목표는 한 단계 위, 다음 학년 기대 구간이에요' : '목표는 기대 구간(★' + range[0] + '~' + range[1] + ') 진입 — 충분히 가능해요') + '</div></div>' +
      '<div class="classbox"><b>' + josa(BRAND.org, '은', '는') + '</b> 아이가 <b>직접 고른 책</b>을 읽는 것을 중요하게 생각합니다. 다음 상담에서 ' + josa(name, '이가', '가') + ' 즐겁게 읽을 만한 책의 범위를 보여 드릴게요.</div></section>' +
      '<footer><p><b>이 진단의 근거</b> — 전 문항 2022 개정 교육과정 성취기준(7세는 누리과정) 기반 · 국립국어원 어휘 등급 자료 · 지문 전부 자체 창작 · 독서지도 전문가 전수 검수. <a href="' + BRAND.guideHref + '" target="_blank" rel="noreferrer">상세 안내문 보기</a></p>' +
      '<p><b>알아두세요</b> — 본 결과는 선별용 간이 진단의 참고 자료이며 공인 검사를 대신하지 않습니다.</p></footer></div></main>';
    return h;
  }

  // mode: 'regular' | 'consult'
  function renderReport(rec, history, mode, opts) {
    return '<div class="lit-report">' + (mode === 'consult' ? renderConsult(rec, opts) : renderRegular(rec, history || [], opts)) + '</div>';
  }

  // 결과지만 새 창으로 열어 인쇄 (관리자 화면의 다른 요소가 섞이지 않도록 독립 문서로 출력)
  function printReport(html) {
    var w = window.open('', '_blank');
    if (!w) { alert('팝업이 차단되었습니다. 팝업을 허용한 뒤 다시 시도해 주세요.'); return; }
    var base = location.origin + '/';
    var ts = Date.now();
    w.document.write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><base href="' + base + '"><title>' + BRAND.reportTitle + '</title>' +
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">' +
      '<link rel="stylesheet" href="css/literacy-report.css?v=' + ts + '">' +
      '<style>@page { size: A4 portrait; margin: 0; } body { margin: 0; padding: 0; background: #ffffff !important; }</style>' +
      '</head><body style="margin:0;padding:0;background:#fff">' + html + '</body></html>');
    w.document.close();
    var printed = false;
    function triggerPrint() {
      if (printed) return;
      printed = true;
      w.focus();
      w.print();
    }
    w.onload = function () { setTimeout(triggerPrint, 350); };
    setTimeout(triggerPrint, 800);
  }

  global.NanoLiteracy = {
    BRAND: BRAND, AREAS: AREAS, GRADE_LABEL: GRADE_LABEL, BAND_LABEL: BAND_LABEL, CATEGORY_LABEL: CATEGORY_LABEL, EXPECTED_RANGE: EXPECTED_RANGE,
    esc: esc, fmtDate: fmtDate, fmtDateShort: fmtDateShort, fmtMonth: fmtMonth, api: api,
    renderReport: renderReport, printReport: printReport, trendSvg: trendSvg
  };
})(window);
