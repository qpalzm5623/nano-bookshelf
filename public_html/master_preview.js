/**
 * ============================================================================
 * [나노의 책장 B2B 마스터 관리자] 모듈 통합 엔트리 로더 (Master Preview Loader)
 * ----------------------------------------------------------------------------
 * 기존 12,000줄의 거대 단일 파일이 기능/메뉴별 8개의 독립 모듈로 완전 분기되었습니다:
 *
 *  [1] js/master/master-core.js        : 공통 코어 (전역 데이터셋, 스토리지, 네비게이션, 유틸)
 *  [2] js/master/master-franchise.js   : 1. 가맹점 관리 (14개소 렌더링, 등록/수정/삭제/권장도서)
 *  [3] js/master/master-members.js     : 2. 통합 회원 관리 (원장/교사/원생, 승인/탈퇴/학급 연동)
 *  [4] js/master/master-operations.js  : 3. 서비스 운영 관리 (홈 배너, 테마 도서, 플랫폼 공지/팝업)
 *  [5] js/master/master-ranking.js     : 4. 전국 랭킹 시스템 (학생/학원 랭킹, 명예의 전당, 학원순위)
 *  [6] js/master/master-contents.js    : 5. 마스터 콘텐츠 관리 (도서 라이브러리, 북퀴즈, 나노시트 PDF)
 *  [7] js/master/master-dispatch.js    : 6. 도서 배정 관리 & 알리고 카톡 발송 로그
 *  [8] js/master/master-payment.js     : 7. 결제 내역 관리 (구독 결제 내역, 수동 수납 등록)
 * ============================================================================
 * ※ 메뉴별 코드는 public_html/js/master/ 폴더에서 개별 파일로 분리되어 관리됩니다.
 * ※ 분기 전 통합 원본 백업: public_html/master_preview.backup.js
 * ============================================================================
 */

(function() {
  // 이미 모듈들이 로드되었거나 로드 중인 경우 중복 로딩 방지
  if (window.__NANO_MASTER_MODULES_LOADED__) return;

  var MODULE_FILES = [
    "js/master/master-core.js",
    "js/master/master-franchise.js",
    "js/master/master-members.js",
    "js/master/master-operations.js",
    "js/master/master-ranking.js",
    "js/master/master-contents.js",
    "js/master/master-dispatch.js",
    "js/master/master-payment.js"
  ];

  // HTML 문서에 이미 개별 모듈 태그가 삽입되어 있는지 확인
  var scripts = Array.from(document.querySelectorAll("script[src]"));
  var alreadyLoaded = MODULE_FILES.some(function(f) {
    return scripts.some(function(s) {
      return s.src && s.src.indexOf(f) !== -1;
    });
  });

  // HTML에서 master_preview.js 하나만 단독으로 호출했을 때도 8개 모듈이 자동 로드되도록 지원
  if (!alreadyLoaded && typeof document !== "undefined" && document.write) {
    var version = "20261030_v4";
    MODULE_FILES.forEach(function(file) {
      document.write('<script src="' + file + '?v=' + version + '"><\/script>');
    });
    window.__NANO_MASTER_MODULES_LOADED__ = true;
  }
})();
