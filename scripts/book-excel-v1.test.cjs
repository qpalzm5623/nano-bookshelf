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

  const wb = XLSX.readFile(templatePath, { cellNF: true });
  assert.ok(wb.SheetNames.includes('입력'), "'입력' 시트가 존재해야 합니다.");
  assert.ok(wb.SheetNames.includes('참고'), "'참고' 시트가 존재해야 합니다.");

  const ws = wb.Sheets['입력'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // 1행: 컬럼 부가설명, 2행: 헤더, 3행: 샘플 데이터
  assert.ok(rows.length >= 3, '최소 3행 이상의 데이터가 존재해야 합니다.');
  assert.ok(String(rows[1][2]).includes('ISBN'), '2행 C열에 ISBN 컬럼 헤더가 있어야 합니다.');
  assert.equal(ws['C3'].z, '0', 'C3(ISBN) 셀의 표시형식이 숫자(0)여야 합니다.');
  assert.equal(String(rows[2][2]).trim(), '9788932902708', '3행 C열 ISBN이 지수 표기 없이 13자리 숫자로 읽혀야 합니다.');
  assert.ok(String(rows[1][3]).includes('주제분류태그'), '2행 D열에 주제분류태그 컬럼 헤더가 있어야 합니다.');
  assert.ok(String(rows[1][11]).includes('생각담기') && String(rows[1][11]).includes('(필수)'), '2행 L열 생각담기 헤더에 (필수) 표기가 있어야 합니다.');
  assert.equal(String(rows[1][12]).trim(), '나노시트', '2행 M열에 나노시트 컬럼 헤더가 있어야 합니다.');
  assert.ok(String(rows[0][12]).includes('나노시트'), '1행 M열에 나노시트 파일명 안내가 있어야 합니다.');
  assert.equal(String(rows[2][12]).trim(), '9788932902708.pdf', '3행 M열에 확장자 포함 나노시트 파일명 예시가 있어야 합니다.');
});

test('2. 3행부터 시작 및 빈 템플릿 행(4~6행) 자동 건너뛰기 검증', () => {
  const wb = XLSX.readFile(templatePath, { cellNF: true });
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
    thinkInsert: headerRow.findIndex(h => String(h).includes('생각담기')),
    nanoSheet: headerRow.findIndex(h => String(h).includes('나노시트'))
  };

  assert.equal(colMap.isbn, 2, 'ISBN 컬럼 인덱스는 2여야 합니다.');
  assert.equal(colMap.theme, 3, '주제분류태그 컬럼 인덱스는 3이어야 합니다.');
  assert.equal(colMap.nanoSheet, 12, '나노시트 컬럼 인덱스는 12(M열)여야 합니다.');

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
    const nanoSheetFileName = String(row[colMap.nanoSheet] ?? '').trim();

    const hasAnyContent = rawIsbn || rawTheme || detail1 || detail2 || detail3 || detail4 || detail5 || awards || thinkExtract || rawThinkInsert || nanoSheetFileName;
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
      nanoSheetFileName,
      rowNum
    });
  }

  // 3행은 정상 파싱 (어린왕자)
  assert.equal(parsedBooks.length, 1, '정상 도서 행은 1건(어린왕자)이어야 합니다.');
  assert.equal(parsedBooks[0].isbn, '9788932902708', '어린왕자 ISBN 확인');
  assert.equal(parsedBooks[0].theme, '#이야기', '어린왕자 주제분류태그 확인');
  assert.deepEqual(parsedBooks[0].details, ['어린왕자', '사막', '여우', '장미', '순수'], '세부태그 5종 확인');
  assert.equal(parsedBooks[0].nanoSheetFileName, '9788932902708.pdf', '나노시트 파일명(확장자 포함) 파싱 확인');

  // 4, 5, 6행은 순번만 있고 내용이 없으므로 빈 행으로 skip되어야 함
  assert.deepEqual(skippedEmptyRows, [4, 5, 6], '순번만 있고 비어있는 4, 5, 6행이 정확히 스킵되어야 합니다.');
});

test('3. ISBN 및 주제분류태그 유효성 검사 에러 감지 로직 검증', () => {
  const allowedThemes = new Set(['인간', '생활', '자연', '생물', '기술', '과학', '역사', '이야기', '건강', '음식', '학습', '수학', '기타', '사회']);
  const registeredIsbns = new Map([
    ['9788932902708', '어린왕자 (기등록 도서)']
  ]);

  function validateRow(rowNum, rawIsbn, rawTheme, seenInFile, rawThinkInsert = '1') {
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
      return errors;
    }

    if (!String(rawThinkInsert || '').trim()) {
      errors.push(`[${rowNum}행: ISBN ${cleanIsbn}] 생각담기가 비어있습니다. (필수 입력 항목: 1~7 코드, 직접 입력 또는 0 입력)`);
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

  // 생각담기 누락
  const emptyThinkErrors = validateRow(8, '9788943305444', '#과학', seen, '');
  assert.ok(emptyThinkErrors[0].includes('생각담기가 비어있습니다'), '생각담기 누락 오류 메시지 발생');

  // 생각담기 '0' (없음 명시) 허용
  const zeroThinkErrors = validateRow(9, '9788943305451', '#과학', seen, '0');
  assert.equal(zeroThinkErrors.length, 0, "생각담기 '0' 입력은 필수값 입력으로 허용되어야 합니다.");
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

  // 6. 생각 담기(필수) & 7. 나노시트(선택) 안내 및 드래그앤드롭 핸들러 검증
  assert.ok(masterModalsHtml.includes('6. 생각 담기 (필수)'), '마스터 도서 엑셀 모달에 6. 생각 담기 (필수) 안내가 있어야 합니다.');
  assert.ok(adminHtml.includes('6. 생각 담기 (필수)'), '학원 도서 엑셀 모달에 6. 생각 담기 (필수) 안내가 있어야 합니다.');
  assert.ok(masterModalsHtml.includes('7. 나노시트 (선택)'), '마스터 도서 엑셀 모달에 7. 나노시트 (선택) 안내가 있어야 합니다.');
  assert.ok(adminHtml.includes('7. 나노시트 (선택)'), '학원 도서 엑셀 모달에 7. 나노시트 (선택) 안내가 있어야 합니다.');
  assert.ok(masterModalsHtml.includes('ondrop="handleMasterBookExcelFileDrop(event)"'), '마스터 도서 엑셀 모달에 드래그앤드롭 ondrop 핸들러가 연결되어야 합니다.');
  assert.ok(masterModalsHtml.includes('ondrop="handleMasterQuizExcelFileDrop(event)"'), '마스터 북퀴즈 엑셀 모달에 드래그앤드롭 ondrop 핸들러가 연결되어야 합니다.');
  assert.ok(adminHtml.includes('ondrop="handleBulkFileDrop(event)"'), '학원 도서 엑셀 모달에 드래그앤드롭 ondrop 핸들러가 연결되어야 합니다.');
  assert.ok(adminHtml.includes('ondrop="handleAcadQuizExcelFileDrop(event)"'), '학원 북퀴즈 엑셀 모달에 드래그앤드롭 ondrop 핸들러가 연결되어야 합니다.');

  // JS 핸들러 및 R2 나노시트 매칭 로직 존재 검증
  const masterContentsJs = fs.readFileSync(path.join(root, 'public_html', 'js', 'master', 'master-contents.js'), 'utf8');
  const adminBooksJs = fs.readFileSync(path.join(root, 'public_html', 'js', 'admin_books.js'), 'utf8');
  const apiFilesTs = fs.readFileSync(path.join(root, 'api', 'files.ts'), 'utf8');
  const r2StorageTs = fs.readFileSync(path.join(root, 'lib', 'r2-storage.ts'), 'utf8');

  assert.ok(masterContentsJs.includes('function handleMasterBookExcelFileDrop'), 'master-contents.js에 도서 엑셀 드롭 핸들러가 구현되어야 합니다.');
  assert.ok(masterContentsJs.includes('생각담기가 비어있습니다'), 'master-contents.js에 생각담기 필수 검증 로직이 구현되어야 합니다.');
  assert.ok(masterContentsJs.includes('function handleMasterQuizExcelFileDrop'), 'master-contents.js에 북퀴즈 엑셀 드롭 핸들러가 구현되어야 합니다.');
  assert.ok(masterContentsJs.includes('function resolveMasterNanoSheetFiles'), 'master-contents.js에 R2 나노시트 파일 매칭 헬퍼가 구현되어야 합니다.');
  assert.ok(adminBooksJs.includes('function handleBulkFileDrop'), 'admin_books.js에 도서 엑셀 드롭 핸들러가 구현되어야 합니다.');
  assert.ok(adminBooksJs.includes('생각담기가 비어있습니다'), 'admin_books.js에 생각담기 필수 검증 로직이 구현되어야 합니다.');
  assert.ok(adminBooksJs.includes('function handleAcadQuizExcelFileDrop'), 'admin_books.js에 북퀴즈 엑셀 드롭 핸들러가 구현되어야 합니다.');
  assert.ok(adminBooksJs.includes('function resolveAcadNanoSheetFiles'), 'admin_books.js에 R2 나노시트 파일 매칭 헬퍼가 구현되어야 합니다.');
  assert.ok(apiFilesTs.includes("body.operation === 'resolve-sheets'"), 'api/files.ts에 resolve-sheets 오퍼레이션이 구현되어야 합니다.');
  assert.ok(r2StorageTs.includes('export async function resolveR2NanoSheetUrls'), 'lib/r2-storage.ts에 resolveR2NanoSheetUrls 함수가 구현되어야 합니다.');
});

test('5. 신규 도서 등록 모달의 관리코드 직접입력 차단 및 유치부 학년코드 매핑 검증', () => {
  const masterModalsHtml = fs.readFileSync(path.join(root, 'public_html', 'modals', 'master_modals.html'), 'utf8');
  const adminHtml = fs.readFileSync(path.join(root, 'public_html', 'admin_preview.html'), 'utf8');
  const masterContentsJs = fs.readFileSync(path.join(root, 'public_html', 'js', 'master', 'master-contents.js'), 'utf8');
  const portalClientJs = fs.readFileSync(path.join(root, 'public_html', 'js', 'portal-client.js'), 'utf8');

  assert.match(masterModalsHtml, /id="mbAddId"[^>]*\breadonly\b/, '마스터 모달 도서 관리 코드 입력칸은 readonly여야 합니다.');
  assert.doesNotMatch(masterModalsHtml, /onclick="generateNewBookId\(\)"/, '마스터 모달에서 수동 코드 생성 버튼을 제거해야 합니다.');
  assert.doesNotMatch(masterModalsHtml, /직접 입력 또는 자동 생성 가능/, '직접 입력 안내 문구를 제거해야 합니다.');
  assert.match(adminHtml, /id="abEditId"[^>]*\breadonly\b/, '학원 모달 도서 관리 코드 입력칸은 readonly여야 합니다.');

  assert.match(masterContentsJs, /gradeVal\.includes\("유치"\).*gCode = "0"/, '마스터 모달 코드 생성에 유치부 -> 0 매핑이 있어야 합니다.');
  assert.match(masterContentsJs, /gStr\.includes\("유치"\).*gCode = "0"/, '마스터 대량 등록 코드 생성에 유치부 -> 0 매핑이 있어야 합니다.');
  assert.match(portalClientJs, /if\s*\(result\.item\.bookNo\)\s*\{\s*item\.bookNo\s*=\s*result\.item\.bookNo;\s*item\.id\s*=\s*result\.item\.bookNo;/, 'portal-client.js는 서버가 발급한 bookNo를 item.id/bookNo에 동기화해야 합니다.');

  const adminBooksJs = fs.readFileSync(path.join(root, 'public_html', 'js', 'admin_books.js'), 'utf8');
  assert.match(masterContentsJs, /async function deleteMasterBook\(id\)[\s\S]*?(nanoConfirm|confirm)\(/, '마스터 도서 삭제 시 확인 창이 먼저 표시되어야 합니다.');
  assert.match(masterContentsJs, /function setMasterBookIsbnLocked[\s\S]*ISBN 편집[\s\S]*ISBN 조회/, '마스터 도서 편집 모달에서 ISBN 잠금/편집 전환 버튼이 동작해야 합니다.');
  assert.match(adminBooksJs, /function setAcadBookIsbnLocked[\s\S]*ISBN 편집[\s\S]*ISBN 조회/, '학원 도서 편집 모달에서도 ISBN 잠금/편집 전환 버튼이 동작해야 합니다.');
});

