const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function runTests() {
  console.log('=== 나노의책장 개편 퀴즈등록 양식 v1 검증 테스트 시작 ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${extraInfo}`);
      failed++;
    }
  }

  // 1. 개편 엑셀 템플릿 파일 존재 및 구조 검증
  const templatePath = path.join(__dirname, '../public_html/resources/나노의책장_개편_퀴즈등록_양식_v1.xlsx');
  assert(fs.existsSync(templatePath), '개편 퀴즈등록 양식 v1 파일 존재 여부 확인');

  const wb = XLSX.readFile(templatePath);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  assert(rows.length >= 4, `템플릿 파일 행 수 확인 (최소 4행 이상: 현재 ${rows.length}행)`);
  assert(rows[0][0].includes('주의사항') || rows[0][0].includes('북퀴즈'), '1행: 주의사항 배너 확인');
  assert(rows[1][2].includes('도서코드') || rows[1][2].includes('문항'), '2행: 상세 작성 가이드 확인');

  const row3 = rows[2];
  assert(row3[0] === '도서코드', '3행 1열: 도서코드 헤더 확인');
  assert(row3[1] === '도서명(참고)', '3행 2열: 도서명(참고) 헤더 확인');
  assert(row3[2] === '문항번호', '3행 3열: 문항번호 헤더 확인');
  assert(row3[3] === '문항유형', '3행 4열: 문항유형 헤더 확인');
  assert(row3[4] === '문항내용(질문)', '3행 5열: 문항내용(질문) 헤더 확인');
  assert(row3[5] === '보기1', '3행 6열: 보기1 헤더 확인');
  assert(row3[6] === '보기2', '3행 7열: 보기2 헤더 확인');
  assert(row3[7] === '보기3', '3행 8열: 보기3 헤더 확인');
  assert(row3[8].includes('보기4'), '3행 9열: 보기4(선택) 헤더 확인');
  assert(row3[9].includes('보기5'), '3행 10열: 보기5(선택) 헤더 확인');
  assert(row3[10] === '정답', '3행 11열: 정답 헤더 확인');
  assert(row3[11].includes('유사인정정답'), '3행 12열: 유사인정정답(선택) 헤더 확인');

  // 4행 실제 데이터 확인
  const row4 = rows[3];
  assert(row4[0] === 'FA000001', '4행(데이터 시작): 도서코드 확인 (FA000001)');
  assert(row4[3] === '객관식', '4행: 문항유형 확인 (객관식)');
  assert(row4[10] === row4[5], '4행: 객관식 정답이 보기1 내용과 일치함 확인');

  // 2. 파싱 & 유효성 검사 로직 시뮬레이션
  function parseQuizHeaderIndices(headerRow) {
    const map = {
      bookNo: -1,
      title: -1,
      questionNo: -1,
      quizType: -1,
      question: -1,
      opt1: -1,
      opt2: -1,
      opt3: -1,
      opt4: -1,
      opt5: -1,
      ans: -1,
      similarAns: -1,
      hint: -1,
      score: -1
    };

    headerRow.forEach((col, idx) => {
      if (!col) return;
      const s = String(col).toLowerCase().replace(/[\s_\-()（）[\]]/g, "");

      if (s.includes("도서코드") || s.includes("관리코드") || s === "bookno" || s === "code" || s === "도서번호") {
        map.bookNo = idx;
      } else if (s.includes("도서명") || s === "제목" || s === "booktitle" || s === "title") {
        map.title = idx;
      } else if (s.includes("문항번호") || s.includes("문제번호") || s === "순번" || s === "no" || s === "questionno") {
        map.questionNo = idx;
      } else if (s.includes("문항유형") || s.includes("문제유형") || s === "유형" || s === "quiztype" || s === "type") {
        map.quizType = idx;
      } else if (s.includes("문항내용") || s.includes("질문") || s === "문제" || s === "문항" || s === "question") {
        map.question = idx;
      } else if (s.includes("보기1") || s.includes("선택지1") || s === "opt1" || s === "option1") {
        map.opt1 = idx;
      } else if (s.includes("보기2") || s.includes("선택지2") || s === "opt2" || s === "option2") {
        map.opt2 = idx;
      } else if (s.includes("보기3") || s.includes("선택지3") || s === "opt3" || s === "option3") {
        map.opt3 = idx;
      } else if (s.includes("보기4") || s.includes("선택지4") || s === "opt4" || s === "option4") {
        map.opt4 = idx;
      } else if (s.includes("보기5") || s.includes("선택지5") || s === "opt5" || s === "option5") {
        map.opt5 = idx;
      } else if (s.includes("유사인정") || s.includes("유사정답") || s.includes("인정정답") || s.includes("similarans") || s.includes("similaranswer") || s.includes("similar")) {
        map.similarAns = idx;
      } else if (s.includes("정답") || s.includes("정답번호") || s === "답" || s === "ans" || s === "answer" || s === "correctanswer") {
        map.ans = idx;
      }
    });

    return map;
  }

  const mockBooks = new Map([
    ['FA000001', { id: 'FA000001', bookNo: 'FA000001', title: '고양이 목욕탕' }],
    ['FA000002', { id: 'FA000002', bookNo: 'FA000002', title: '푸른 딱지' }]
  ]);

  function testValidateRows(rawRows) {
    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(6, rawRows.length); r++) {
      const row = rawRows[r] || [];
      const hasExactCodeCol = row.some(cell => {
        const s = String(cell ?? '').trim().replace(/[\s_\-()（）[\]]/g, '');
        return s === '도서코드' || s === '도서번호' || s === 'bookno' || s === 'code';
      });
      const hasQuestionCol = row.some(cell => {
        const s = String(cell ?? '').trim().replace(/[\s_\-()（）[\]]/g, '');
        return s.includes('문항내용') || s.includes('질문') || s === 'question';
      });
      if (hasExactCodeCol && hasQuestionCol) {
        headerRowIdx = r;
        break;
      }
    }
    if (headerRowIdx === -1) headerRowIdx = 0;

    const colMap = parseQuizHeaderIndices(rawRows[headerRowIdx]);
    const validationErrors = [];
    const parsedQuestions = [];

    for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 1;
      if (!row || !row.some(cell => String(cell ?? "").trim().length > 0)) continue;

      const rawBookCode = String(row[colMap.bookNo] ?? "").trim();
      const rawQNo = colMap.questionNo !== -1 ? String(row[colMap.questionNo] ?? "").trim() : "";
      const rawType = colMap.quizType !== -1 ? String(row[colMap.quizType] ?? "").trim() : "";
      const rawQuestion = String(row[colMap.question] ?? "").trim();
      const opt1 = colMap.opt1 !== -1 ? String(row[colMap.opt1] ?? "").trim() : "";
      const opt2 = colMap.opt2 !== -1 ? String(row[colMap.opt2] ?? "").trim() : "";
      const opt3 = colMap.opt3 !== -1 ? String(row[colMap.opt3] ?? "").trim() : "";
      const opt4 = colMap.opt4 !== -1 ? String(row[colMap.opt4] ?? "").trim() : "";
      const opt5 = colMap.opt5 !== -1 ? String(row[colMap.opt5] ?? "").trim() : "";
      const rawAns = String(row[colMap.ans] ?? "").trim();
      const rawSimilarAns = colMap.similarAns !== -1 ? String(row[colMap.similarAns] ?? "").trim() : "";

      if (!rawBookCode) {
        validationErrors.push(`[${rowNum}행] 도서코드가 비어있습니다.`);
        continue;
      }
      const matchedBook = mockBooks.get(rawBookCode.toUpperCase());
      if (!matchedBook) {
        validationErrors.push(`[${rowNum}행] 도서코드 '${rawBookCode}'에 해당하는 등록 도서가 없습니다.`);
        continue;
      }
      const bookTitle = matchedBook.title;

      let questionNo = null;
      if (rawQNo) {
        const numQNo = Number(rawQNo);
        if (isNaN(numQNo) || !Number.isInteger(numQNo) || numQNo < 1 || numQNo > 20) {
          validationErrors.push(`[${rowNum}행: 도서 ${bookTitle}] 문항번호는 1번부터 20번 사이의 정수여야 합니다.`);
          continue;
        }
        questionNo = numQNo;
      } else {
        questionNo = parsedQuestions.filter(q => q.bookCode.toUpperCase() === rawBookCode.toUpperCase()).length + 1;
        if (questionNo > 20) {
          validationErrors.push(`[${rowNum}행: 도서 ${bookTitle}] 문항번호는 최대 20번까지만 등록할 수 있습니다.`);
          continue;
        }
      }

      if (rawType !== '객관식' && rawType !== '주관식') {
        validationErrors.push(`[${rowNum}행: 도서 ${bookTitle}] 문항유형은 '객관식' 또는 '주관식' 중 하나여야 합니다.`);
        continue;
      }

      if (!rawQuestion) {
        validationErrors.push(`[${rowNum}행: 도서 ${bookTitle}] 문항내용(질문)이 비어있습니다.`);
        continue;
      }

      let finalOptions = [];
      let normalizedAns = "";
      let finalSimilarAns = "";
      let finalSimilarAnswers = [];

      if (rawType === '객관식') {
        if (!opt1 || !opt2 || !opt3) {
          validationErrors.push(`[${rowNum}행: 도서 ${bookTitle}] 객관식 문항은 '보기1', '보기2', '보기3'을 필수로 입력해야 합니다.`);
          continue;
        }
        finalOptions = [opt1, opt2, opt3];
        if (opt4) finalOptions.push(opt4);
        if (opt5) finalOptions.push(opt5);

        if (!rawAns) {
          validationErrors.push(`[${rowNum}행: 도서 ${bookTitle}] 객관식 문항의 '정답'이 비어있습니다.`);
          continue;
        }

        const matchedIndex = finalOptions.findIndex(o => o.trim() === rawAns.trim());
        if (matchedIndex === -1) {
          validationErrors.push(`[${rowNum}행: 도서 ${bookTitle}] 객관식 '정답'('${rawAns}')이 입력된 보기 내용과 일치하지 않습니다.`);
          continue;
        }
        normalizedAns = String(matchedIndex + 1);
      } else {
        if (!rawAns) {
          validationErrors.push(`[${rowNum}행: 도서 ${bookTitle}] 주관식 문항의 '정답'을 필수로 입력해야 합니다.`);
          continue;
        }
        normalizedAns = rawAns.trim();
        if (rawSimilarAns) {
          finalSimilarAnswers = rawSimilarAns
            .split(',')
            .map(s => s.trim())
            .filter(token => token.length > 0 && token !== normalizedAns);
          finalSimilarAnswers = Array.from(new Set(finalSimilarAnswers));
          finalSimilarAns = finalSimilarAnswers.join(', ');
        }
      }

      parsedQuestions.push({
        rowNum,
        bookCode: rawBookCode,
        matchedBook,
        questionNo,
        type: rawType === '주관식' ? "SUBJECTIVE" : "CHOICE",
        ans: normalizedAns,
        similarAnswers: finalSimilarAnswers
      });
    }

    const groupedMap = new Map();
    parsedQuestions.forEach(q => {
      const key = q.matchedBook.id;
      if (!groupedMap.has(key)) groupedMap.set(key, { book: q.matchedBook, questions: [] });
      groupedMap.get(key).questions.push(q);
    });

    groupedMap.forEach((group) => {
      if (group.questions.length < 3) {
        validationErrors.push(`[도서: ${group.book.title}] 등록된 문항 수가 ${group.questions.length}개로 부족합니다. 도서코드 당 최소 3문항 이상 등록해야 합니다.`);
      }
      if (group.questions.length > 20) {
        validationErrors.push(`[도서: ${group.book.title}] 등록된 문항 수가 ${group.questions.length}개로 20개를 초과했습니다. 도서코드 당 최대 20문항까지만 등록할 수 있습니다.`);
      }
      const seenNos = new Set();
      group.questions.forEach(q => {
        if (seenNos.has(q.questionNo)) {
          validationErrors.push(`[도서: ${group.book.title}] 문항번호 ${q.questionNo}번이 중복되었습니다.`);
        }
        seenNos.add(q.questionNo);
      });
    });

    return { validationErrors, parsedQuestions, groupedMap };
  }

  // 템플릿 실제 파일 파싱 테스트
  const templateResult = testValidateRows(rows);
  assert(templateResult.validationErrors.length === 0, '실제 템플릿 엑셀 파싱 시 오류 0건 통과', JSON.stringify(templateResult.validationErrors));
  assert(templateResult.parsedQuestions.length > 0, `템플릿 데이터 파싱 문항 수 확인: ${templateResult.parsedQuestions.length}문항`);

  // 테스트 케이스: 문항유형 에러
  const badTypeRows = [
    rows[0], rows[1], rows[2],
    ['FA000001', '도서명', 1, 'OX퀴즈', '질문', 'O', 'X', '선택지', '', '', 'O', '']
  ];
  const badTypeResult = testValidateRows(badTypeRows);
  assert(badTypeResult.validationErrors.some(e => e.includes('문항유형')), '잘못된 문항유형 입력 시 오류 발생 확인');

  // 테스트 케이스: 객관식 보기1~3 누락 에러
  const missingOptsRows = [
    rows[0], rows[1], rows[2],
    ['FA000001', '도서명', 1, '객관식', '질문', '보기1만있음', '', '', '', '', '보기1만있음', '']
  ];
  const missingOptsResult = testValidateRows(missingOptsRows);
  assert(missingOptsResult.validationErrors.some(e => e.includes('필수로 입력')), '객관식 보기1~3 누락 시 오류 발생 확인');

  // 테스트 케이스: 객관식 정답 번호 입력(보기와 불일치) 에러
  const badAnsRows = [
    rows[0], rows[1], rows[2],
    ['FA000001', '도서명', 1, '객관식', '질문', '사과', '바나나', '포도', '', '', '1', '']
  ];
  const badAnsResult = testValidateRows(badAnsRows);
  assert(badAnsResult.validationErrors.some(e => e.includes('일치하지 않습니다')), '객관식 정답에 번호 입력(보기에 없는 텍스트) 시 오류 발생 확인');

  // 테스트 케이스: 주관식 보기 채워져 있어도 무시 및 유사인정정답 콤마 파싱
  const subjRows = [
    rows[0], rows[1], rows[2],
    ['FA000001', '도서명', 1, '주관식', '질문1', '채워진보기1', '채워진보기2', '채워진보기3', '', '', '정답단어', '유사1, 유사2, 유사3'],
    ['FA000001', '도서명', 2, '주관식', '질문2', '', '', '', '', '', '정답2', ''],
    ['FA000001', '도서명', 3, '주관식', '질문3', '', '', '', '', '', '정답3', '']
  ];
  const subjResult = testValidateRows(subjRows);
  assert(subjResult.validationErrors.length === 0, '주관식 보기 채워져 있어도 오류 없이 파싱 성공', JSON.stringify(subjResult.validationErrors));
  assert(subjResult.parsedQuestions[0].similarAnswers.length === 3, '주관식 유사인정정답 3개 콤마 파싱 확인');

  // 테스트 케이스: 도서당 2문항 이하 에러
  const twoQRows = [
    rows[0], rows[1], rows[2],
    ['FA000001', '도서명', 1, '주관식', '질문1', '', '', '', '', '', '정답1', ''],
    ['FA000001', '도서명', 2, '주관식', '질문2', '', '', '', '', '', '정답2', '']
  ];
  const twoQResult = testValidateRows(twoQRows);
  assert(twoQResult.validationErrors.some(e => e.includes('최소 3문항 이상')), '도서당 2문항 등록 시 3문항 이상 필요 에러 발생 확인');

  // 테스트 케이스: 도서당 21문항 이상 에러
  const over20Rows = [rows[0], rows[1], rows[2]];
  for (let q = 1; q <= 21; q++) {
    over20Rows.push(['FA000001', '도서명', q > 20 ? 20 : q, '주관식', `질문${q}`, '', '', '', '', '', `정답${q}`, '']);
  }
  const over20Result = testValidateRows(over20Rows);
  assert(over20Result.validationErrors.some(e => e.includes('20개') || e.includes('중복')), '도서당 21문항 등록 시 에러 발생 확인');

  // 문법 검사 (master-contents.js, admin_books.js)
  const masterJs = fs.readFileSync(path.join(__dirname, '../public_html/js/master/master-contents.js'), 'utf8');
  assert(!masterJs.includes('<<<<<<<'), 'master-contents.js conflict marker 없음');
  const adminJs = fs.readFileSync(path.join(__dirname, '../public_html/js/admin_books.js'), 'utf8');
  assert(!adminJs.includes('<<<<<<<'), 'admin_books.js conflict marker 없음');

  console.log(`\n=== 검증 완료: 성공 ${passed}개, 실패 ${failed}개 ===`);
  if (failed > 0) process.exit(1);
}

runTests();
