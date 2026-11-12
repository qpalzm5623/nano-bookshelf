// 나노의책장 개편 도서 엑셀 등록(양식 v1) 및 검증 테스트
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const XLSX = require('xlsx');

const root = path.resolve(__dirname, '..');
const templatePath = path.join(root, 'public_html', 'resources', '나노의책장_개편_책등록_양식_v1.xlsx');
const desktopTemplatePath = 'd:/Desktop/나노의책장_개편_책등록_양식_v1.xlsx';

test('1. 개편 엑셀 양식 파일 존재 및 시트 구조 검증', () => {
  assert.ok(fs.existsSync(templatePath), 'resources 폴더에 나노의책장_개편_책등록_양식_v1.xlsx 파일이 존재해야 합니다.');

  const wb = XLSX.readFile(templatePath);
  assert.ok(wb.SheetNames.includes('입력'), "'입력' 시트가 존재해야 합니다.");
  assert.ok(wb.SheetNames.includes('참고'), "'참고' 시트가 존재해야 합니다.");

  const ws = wb.Sheets['입력'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // 1행: 컬럼 부가설명, 2행: 헤더, 3행: 샘플 데이터
  assert.ok(rows.length >= 3, '최소 3행 이상의 데이터가 존재해야 합니다.');
  assert.ok(String(rows[1][2]).includes('ISBN'), '2행 C열에 ISBN 컬럼 헤더가 있어야 합니다.');
  assert.ok(String(rows[1][3]).includes('주제분류태그'), '2행 D열에 주제분류태그 컬럼 헤더가 있어야 합니다.');
});

test('2. 3행부터 시작 및 빈 템플릿 행(4~6행) 자동 건너뛰기 검증', () => {
  const wb = XLSX.readFile(templatePath);
  const ws = wb.Sheets['입력'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // 2행 기준 컬럼 매핑
  const headerRow = rows[1] || [];
  const colMap = {
    isbn: headerRow.findIndex(h => String(h).includes('ISBN')),
    theme: headerRow.findIndex(h => String(h).includes('주제분류')),
    detail1: headerRow.findIndex(h => String(h).includes('세부태그1')),
    detail2: headerRow.findIndex(h => String(h).includes('세부태그2')),
    detail3: headerRow.findIndex(h => String(h).includes('세부태그3')),
    detail4: headerRow.findIndex(h => String(h).includes('세부태그4')),
    detail5: headerRow.findIndex(h => String(h).includes('세부태그5')),
    awards: headerRow.findIndex(h => String(h).includes('어워드')),
    thinkExtract: headerRow.findIndex(h => String(h).includes('생각꺼내기')),
    thinkInsert: headerRow.findIndex(h => String(h).includes('생각담기'))
  };

  assert.equal(colMap.isbn, 2, 'ISBN 컬럼 인덱스는 2여야 합니다.');
  assert.equal(colMap.theme, 3, '주제분류태그 컬럼 인덱스는 3이어야 합니다.');

  const parsedBooks = [];
  const skippedEmptyRows = [];

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    const rawIsbn = String(row[colMap.isbn] ?? '').trim();
    const rawTheme = String(row[colMap.theme] ?? '').trim();
    const detail1 = String(row[colMap.detail1] ?? '').trim();
    const detail2 = String(row[colMap.detail2] ?? '').trim();
    const detail3 = String(row[colMap.detail3] ?? '').trim();
    const detail4 = String(row[colMap.detail4] ?? '').trim();
    const detail5 = String(row[colMap.detail5] ?? '').trim();
    const awards = String(row[colMap.awards] ?? '').trim();
    const thinkExtract = String(row[colMap.thinkExtract] ?? '').trim();
    const rawThinkInsert = String(row[colMap.thinkInsert] ?? '').trim();

    const hasAnyContent = rawIsbn || rawTheme || detail1 || detail2 || detail3 || detail4 || detail5 || awards || thinkExtract || rawThinkInsert;
    if (!hasAnyContent) {
      skippedEmptyRows.push(rowNum);
      continue;
    }

    parsedBooks.push({
      isbn: rawIsbn,
      theme: rawTheme,
      details: [detail1, detail2, detail3, detail4, detail5].filter(Boolean),
      awards,
      thinkExtract,
      thinkInsert: rawThinkInsert,
      rowNum
    });
  }

  // 3행은 정상 파싱 (어린왕자)
  assert.equal(parsedBooks.length, 1, '정상 도서 행은 1건(어린왕자)이어야 합니다.');
  assert.equal(parsedBooks[0].isbn, '9788932902708', '어린왕자 ISBN 확인');
  assert.equal(parsedBooks[0].theme, '#이야기', '어린왕자 주제분류태그 확인');
  assert.deepEqual(parsedBooks[0].details, ['어린왕자', '사막', '여우', '장미', '순수'], '세부태그 5종 확인');

  // 4, 5, 6행은 순번만 있고 내용이 없으므로 빈 행으로 skip되어야 함
  assert.deepEqual(skippedEmptyRows, [4, 5, 6], '순번만 있고 비어있는 4, 5, 6행이 정확히 스킵되어야 합니다.');
});

test('3. ISBN 및 주제분류태그 유효성 검사 에러 감지 로직 검증', () => {
  const allowedThemes = new Set(['인간', '생활', '자연', '생물', '기술', '과학', '역사', '이야기', '건강', '음식', '학습', '수학', '기타', '사회']);
  const registeredIsbns = new Map([
    ['9788932902708', '어린왕자 (기등록 도서)']
  ]);

  function validateRow(rowNum, rawIsbn, rawTheme, seenInFile) {
    const errors = [];
    if (!rawIsbn) {
      errors.push(`[${rowNum}행] ISBN이 비어있습니다. (필수 입력 항목)`);
      return errors;
    }

    const cleanIsbn = String(rawIsbn).replace(/[^0-9Xx]/g, '');
    if (cleanIsbn.length !== 10 && cleanIsbn.length !== 13) {
      errors.push(`[${rowNum}행] 유효하지 않은 ISBN 넘버입니다. (입력값: '${rawIsbn}'): 10자리 또는 13자리 숫자로 입력해주세요.`);
      return errors;
    }

    if (seenInFile.has(cleanIsbn)) {
      errors.push(`[${rowNum}행] 업로드 파일 내에 중복된 ISBN이 존재합니다. (ISBN: ${cleanIsbn})`);
      return errors;
    }
    seenInFile.add(cleanIsbn);

    if (registeredIsbns.has(cleanIsbn)) {
      errors.push(`[${rowNum}행] 이미 등록되어 있는 ISBN 넘버입니다. (ISBN: ${cleanIsbn}, 도서명: '${registeredIsbns.get(cleanIsbn)}')`);
      return errors;
    }

    if (!rawTheme) {
      errors.push(`[${rowNum}행: ISBN ${cleanIsbn}] 주제분류태그가 비어있습니다. (필수 입력 항목)`);
      return errors;
    }

    const cleanTheme = rawTheme.replace(/^#/, '').trim();
    if (!allowedThemes.has(cleanTheme)) {
      errors.push(`[${rowNum}행: ISBN ${cleanIsbn}] 유효하지 않은 주제분류태그입니다. (입력값: '${rawTheme}'): '참고' 시트의 표준 주제명(인간, 생활, 자연, 생물, 기술, 과학, 역사, 이야기, 건강, 음식, 학습, 수학, 기타 등)을 입력해주세요.`);
    }

    return errors;
  }

  const seen = new Set();

  // 정상 도서
  const okErrors = validateRow(3, '9788934986637', '#과학', seen);
  assert.equal(okErrors.length, 0, '정상 도서는 오류가 없어야 합니다.');

  // 잘못된 ISBN
  const badIsbnErrors = validateRow(4, '12345', '#이야기', seen);
  assert.ok(badIsbnErrors[0].includes('유효하지 않은 ISBN 넘버입니다'), '잘못된 ISBN 오류 메시지 발생');

  // 기등록 ISBN
  const duplicateRegErrors = validateRow(5, '9788932902708', '#이야기', seen);
  assert.ok(duplicateRegErrors[0].includes('이미 등록되어 있는 ISBN 넘버입니다'), '기등록 ISBN 오류 메시지 발생');

  // 파일 내 중복 ISBN
  const duplicateFileErrors = validateRow(6, '9788934986637', '#과학', seen);
  assert.ok(duplicateFileErrors[0].includes('업로드 파일 내에 중복된 ISBN이 존재합니다'), '파일 내 중복 ISBN 오류 발생');

  // 잘못된 주제분류태그
  const badThemeErrors = validateRow(7, '9788943305437', '#외계인침공', seen);
  assert.ok(badThemeErrors[0].includes('유효하지 않은 주제분류태그입니다'), '잘못된 주제분류태그 오류 메시지 발생');
});

test('4. 마스터 및 학원 모달 UI의 .xlsx 샘플 다운로드 마크업 검증', () => {
  const masterModalsHtml = fs.readFileSync(path.join(root, 'public_html', 'modals', 'master_modals.html'), 'utf8');
  assert.ok(masterModalsHtml.includes('샘플 다운로드 (.xlsx)'), '마스터 모달에 샘플 다운로드 (.xlsx) 버튼이 존재해야 합니다.');
  assert.ok(masterModalsHtml.includes("'입력'</strong> 시트"), '마스터 모달 안내에 입력 시트 안내가 있어야 합니다.');
  assert.ok(masterModalsHtml.includes('3행부터</strong>'), '마스터 모달 안내에 3행부터 등록 안내가 있어야 합니다.');

  const adminHtml = fs.readFileSync(path.join(root, 'public_html', 'admin_preview.html'), 'utf8');
  assert.ok(adminHtml.includes('샘플 다운로드 (.xlsx)'), '학원 화면에 샘플 다운로드 (.xlsx) 버튼이 존재해야 합니다.');
  assert.ok(adminHtml.includes("'입력'</strong> 시트"), '학원 화면 안내에 입력 시트 안내가 있어야 합니다.');
  assert.ok(adminHtml.includes('3행부터</strong>'), '학원 화면 안내에 3행부터 등록 안내가 있어야 합니다.');
});

