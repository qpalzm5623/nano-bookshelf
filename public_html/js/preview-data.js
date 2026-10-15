// 프리뷰의 학원 구분과 파일 입출력 규칙을 한곳에서 관리합니다.
(function (global) {
  'use strict';
  function readArray(key, seed) {
    var raw = localStorage.getItem(key);
    var data = raw === null ? (seed || []) : JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('저장된 목록 형식이 올바르지 않습니다.');
    return data;
  }
  function belongsToAcademy(item, academy) {
    return !!item && !!academy.id && String(item.academyId || '') === String(academy.id);
  }
  function assignmentKey(academyId) {
    if (!academyId) throw new Error('학원 정보가 없습니다. 다시 로그인해 주세요.');
    return 'NANO_ASSIGNMENTS_' + academyId;
  }
  function readAssignments(academyId) {
    var raw = localStorage.getItem(assignmentKey(academyId));
    var value = raw === null ? { students: [], classes: [] } : JSON.parse(raw);
    if (!value || !Array.isArray(value.students) || !Array.isArray(value.classes)) {
      throw new Error('배정 목록을 읽을 수 없습니다. 저장 데이터를 확인해 주세요.');
    }
    return value;
  }
  function saveAssignments(academyId, students, classes) {
    // 하나의 키로 저장하여 두 목록 중 하나만 저장되는 문제를 막습니다.
    localStorage.setItem(assignmentKey(academyId), JSON.stringify({ students: students, classes: classes }));
  }
  function assignedBookIds(identity) {
    if (!identity || !identity.academyId) return [];
    var data = readAssignments(identity.academyId);
    var rows = data.students.filter(function (row) { return String(row.studentId) === String(identity.studentId); });
    if (identity.classGroup && identity.classGroup !== '미지정') {
      rows = rows.concat(data.classes.filter(function (row) { return row.className === identity.classGroup; }));
    }
    return Array.from(new Set(rows.flatMap(function (row) {
      return (row.books || []).map(function (book) { return String(book.id); });
    })));
  }
  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, '');
    var rows = [], row = [], cell = '', quoted = false, closed = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') { quoted = false; closed = true; }
        else cell += ch;
      } else if (ch === ',' || ch === '\n' || ch === '\r') {
        row.push(cell); cell = ''; closed = false;
        if (ch !== ',') {
          if (row.some(function (value) { return value.trim() !== ''; })) rows.push(row);
          row = [];
          if (ch === '\r' && text[i + 1] === '\n') i++;
        }
      } else if (ch === '"' && cell === '' && !closed) quoted = true;
      else {
        if (closed || ch === '"') throw new Error('CSV 따옴표 형식을 확인해 주세요.');
        cell += ch;
      }
    }
    if (quoted) throw new Error('CSV의 닫는 따옴표가 누락되었습니다.');
    row.push(cell);
    if (row.some(function (value) { return value.trim() !== ''; })) rows.push(row);
    return rows;
  }
  function csvCell(value) {
    var text = String(value == null ? '' : value);
    // 사용자가 입력한 내용을 스프레드시트 수식으로 실행하지 않습니다.
    if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  global.NanoPreviewData = {
    readArray: readArray, belongsToAcademy: belongsToAcademy,
    readAssignments: readAssignments, saveAssignments: saveAssignments,
    assignedBookIds: assignedBookIds, parseCSV: parseCSV, csvCell: csvCell
  };
})(window);
