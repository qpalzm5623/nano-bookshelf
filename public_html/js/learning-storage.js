// 학생과 학원 화면이 같은 학원별 학습 기록을 읽고 저장하도록 하는 공통 모듈입니다.
(function(global) {
  'use strict';

  function getKey(academyId) {
    if (academyId === undefined || academyId === null || String(academyId).trim() === '') {
      throw new Error('소속 학원 정보가 없습니다. 다시 로그인해 주세요.');
    }
    return 'NANO_LEARNING_LOGS_' + String(academyId);
  }

  function read(academyId, seedLogs) {
    var raw = global.localStorage.getItem(getKey(academyId));
    var logs = raw === null ? (seedLogs || []) : JSON.parse(raw);
    if (!Array.isArray(logs)) {
      throw new Error('학습 기록을 읽을 수 없습니다. 저장된 데이터를 확인해 주세요.');
    }
    // 기존 학원별 캐시는 소속 필드가 없어도 유지하고, 이관 자료는 소속이 일치할 때만 사용합니다.
    var scoped = logs.filter(function(log) {
      return log && (String(log.academyId) === String(academyId) ||
        (raw !== null && !log.academyId));
    });
    return JSON.parse(JSON.stringify(scoped));
  }

  function save(academyId, logs) {
    if (!Array.isArray(logs)) throw new Error('학습 기록 형식이 올바르지 않습니다.');
    var scoped = logs.map(function(log) {
      if (!log || (log.academyId && String(log.academyId) !== String(academyId))) {
        throw new Error('다른 학원의 학습 기록은 저장할 수 없습니다.');
      }
      return Object.assign({}, log, { academyId: String(academyId) });
    });
    global.localStorage.setItem(getKey(academyId), JSON.stringify(scoped));
  }

  function add(academyId, log, seedLogs) {
    var logs = read(academyId, seedLogs);
    // 같은 풀이를 여러 번 저장해도 학습 이력이 중복되지 않도록 합니다.
    var existing = logs.find(function(item) { return item.id === log.id; });
    if (existing) return existing;
    logs.unshift(log);
    save(academyId, logs);
    return log;
  }

  global.NanoLearningStore = { getKey: getKey, read: read, save: save, add: add };
})(window);
