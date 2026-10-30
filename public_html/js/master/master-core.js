/**
 * [Nano BookShelf B2B Master] Core Module
 * - Global State & Storage Key
 * - Datasets & LocalStorage Sync
 * - Global Navigation & Lifecycle Initializer
 * - Shared Utilities (Formatters, CSV, Toast, Validation)
 * - Gemini AI Configuration & Safe Logout
 */

/**
 * 나노의 책장 - B2B 마스터 관리자(Master Admin) 포털 로직
 * 6대 핵심 모듈: 가맹점 관리, 통합 회원 관리, 운영 관리, 랭킹 시스템, 마스터 콘텐츠 관리, 카톡 발송 내역
 */

// ==========================================
// 1. 상태 및 샘플 데이터셋 (State & Datasets)
// ==========================================

// 1-1. 가맹 학원 데이터 (B2B Franchises)
const defaultFranchiseList = [
  {
    id: "ACAD-001",
    name: "나노 독서아카데미 목동본원",
    bizNumber: "105-86-12345",
    director: "김은영 원장",
    email: "director_mokdong@nano.kr",
    phone: "010-3342-9981",
    region: "서울 양천구",
    adminId: "director_mokdong",
    plan: "Standard",
    joinDate: "2025-03-01",
    startDate: "2025-03-01",
    endDate: "2026-12-31",
    currentStudents: 48,
    maxStudents: 50,
    monthlyFee: "330,000원",
    paymentStatus: "PAID",
    status: "ACTIVE"
  },
  {
    id: "ACAD-002",
    name: "대치 에듀 독서논술센터",
    bizNumber: "214-82-67890",
    director: "박진수 원장",
    email: "director_daechi@nano.kr",
    phone: "010-8871-2311",
    region: "서울 강남구",
    adminId: "director_daechi",
    plan: "Royal",
    joinDate: "2025-01-15",
    startDate: "2025-01-15",
    endDate: "2026-09-30",
    currentStudents: 92,
    maxStudents: 100,
    monthlyFee: "550,000원",
    paymentStatus: "PAID",
    status: "EXPIRING"
  },
  {
    id: "ACAD-003",
    name: "송도 센트럴 리딩랩",
    bizNumber: "131-87-54321",
    director: "최윤정 원장",
    email: "director_songdo@nano.kr",
    phone: "010-5541-0982",
    region: "인천 연수구",
    adminId: "director_songdo",
    plan: "Standard",
    joinDate: "2025-06-01",
    startDate: "2025-06-01",
    endDate: "2027-05-31",
    currentStudents: 41,
    maxStudents: 50,
    monthlyFee: "330,000원",
    paymentStatus: "PAID",
    status: "ACTIVE"
  },
  {
    id: "ACAD-004",
    name: "판교 알파 독서학원",
    bizNumber: "129-81-43210",
    director: "정성훈 원장",
    email: "director_pangyo@nano.kr",
    phone: "010-4490-1123",
    region: "경기 성남시",
    adminId: "director_pangyo",
    plan: "Basic",
    joinDate: "2025-04-10",
    startDate: "2025-04-10",
    endDate: "2026-10-10",
    currentStudents: 29,
    maxStudents: 30,
    monthlyFee: "220,000원",
    paymentStatus: "UNPAID",
    status: "ACTIVE"
  },
  {
    id: "ACAD-005",
    name: "분당 서현 리딩클럽",
    bizNumber: "142-83-99123",
    director: "이지혜 원장",
    email: "director_bundang@nano.kr",
    phone: "010-7712-4456",
    region: "경기 성남시",
    adminId: "director_bundang",
    plan: "Premium",
    joinDate: "2025-02-01",
    startDate: "2025-02-01",
    endDate: "2027-01-31",
    currentStudents: 68,
    maxStudents: 80,
    monthlyFee: "440,000원",
    paymentStatus: "PAID",
    status: "ACTIVE"
  },
  {
    id: "ACAD-006",
    name: "부산 센텀 나노주니어",
    bizNumber: "602-85-11223",
    director: "강민우 원장",
    email: "director_centum@nano.kr",
    phone: "010-6632-7789",
    region: "부산 해운대구",
    adminId: "director_centum",
    plan: "Standard",
    joinDate: "2024-09-01",
    startDate: "2024-09-01",
    endDate: "2026-09-20",
    currentStudents: 49,
    maxStudents: 50,
    monthlyFee: "330,000원",
    paymentStatus: "PAID",
    status: "EXPIRING"
  },
  {
    id: "ACAD-007",
    name: "광주 봉선 생각하는책상",
    bizNumber: "408-81-77889",
    director: "임혜림 원장",
    email: "director_bongseon@nano.kr",
    phone: "010-9923-5561",
    region: "광주 남구",
    adminId: "director_bongseon",
    plan: "Standard",
    joinDate: "2025-05-15",
    startDate: "2025-05-15",
    endDate: "2026-11-15",
    currentStudents: 32,
    maxStudents: 50,
    monthlyFee: "330,000원",
    paymentStatus: "PAID",
    status: "ACTIVE"
  },
  {
    id: "ACAD-008",
    name: "대전 둔산 글마루학원",
    bizNumber: "305-82-44331",
    director: "오현석 원장",
    email: "director_dunsan@nano.kr",
    phone: "010-2213-9900",
    region: "대전 서구",
    adminId: "director_dunsan",
    plan: "Standard",
    joinDate: "2024-11-01",
    startDate: "2024-11-01",
    endDate: "2025-10-31",
    currentStudents: 18,
    maxStudents: 50,
    monthlyFee: "330,000원",
    paymentStatus: "PAID",
    status: "PAUSED"
  },
  {
    id: "ACAD-009",
    name: "대구 수성 미래리딩원",
    bizNumber: "504-81-33211",
    director: "조은서 원장",
    email: "director_suseong@nano.kr",
    phone: "010-3399-4455",
    region: "대구 수성구",
    adminId: "director_suseong",
    plan: "VIP",
    joinDate: "2025-07-01",
    startDate: "2025-07-01",
    endDate: "2027-06-30",
    currentStudents: 88,
    maxStudents: 120,
    monthlyFee: "770,000원",
    paymentStatus: "PAID",
    status: "ACTIVE"
  },
  {
    id: "ACAD-010",
    name: "일산 마두 지혜의샘",
    bizNumber: "128-86-99002",
    director: "한승우 원장",
    email: "director_madu@nano.kr",
    phone: "010-5577-8811",
    region: "경기 고양시",
    adminId: "director_madu",
    plan: "Basic",
    joinDate: "2025-08-10",
    startDate: "2025-08-10",
    endDate: "2026-08-09",
    currentStudents: 24,
    maxStudents: 30,
    monthlyFee: "220,000원",
    paymentStatus: "PAID",
    status: "ACTIVE"
  },
  {
    id: "ACAD-011",
    name: "세종 아름 글나무학원",
    bizNumber: "314-87-11445",
    director: "유재석 원장",
    email: "director_areum@nano.kr",
    phone: "010-6644-2233",
    region: "세종 아름동",
    adminId: "director_areum",
    plan: "Premium",
    joinDate: "2025-03-20",
    startDate: "2025-03-20",
    endDate: "2026-03-19",
    currentStudents: 52,
    maxStudents: 60,
    monthlyFee: "440,000원",
    paymentStatus: "PAID",
    status: "ACTIVE"
  },
  {
    id: "ACAD-012",
    name: "수원 광교 스마트독서원",
    bizNumber: "135-82-77665",
    director: "백지훈 원장",
    email: "director_gwanggyo@nano.kr",
    phone: "010-8811-9922",
    region: "경기 수원시",
    adminId: "director_gwanggyo",
    plan: "Royal",
    joinDate: "2025-05-01",
    startDate: "2025-05-01",
    endDate: "2027-04-30",
    currentStudents: 71,
    maxStudents: 90,
    monthlyFee: "550,000원",
    paymentStatus: "PAID",
    status: "ACTIVE"
  },
  {
    id: "ACAD-013",
    name: "전주 혁신 꿈꾸는책방",
    bizNumber: "402-86-55112",
    director: "서미경 원장",
    email: "director_jeonju@nano.kr",
    phone: "010-4433-8899",
    region: "전북 전주시",
    adminId: "director_jeonju",
    plan: "Basic",
    joinDate: "2024-12-01",
    startDate: "2024-12-01",
    endDate: "2025-11-30",
    currentStudents: 15,
    maxStudents: 30,
    monthlyFee: "220,000원",
    paymentStatus: "PAID",
    status: "PAUSED"
  },
  {
    id: "ACAD-014",
    name: "울산 삼산 인재리딩클래스",
    bizNumber: "610-85-44991",
    director: "권태호 원장",
    email: "director_samsan@nano.kr",
    phone: "010-7755-1144",
    region: "울산 남구",
    adminId: "director_samsan",
    plan: "VIP",
    joinDate: "2025-09-01",
    startDate: "2025-09-01",
    endDate: "2027-08-31",
    currentStudents: 63,
    maxStudents: 100,
    monthlyFee: "770,000원",
    paymentStatus: "PAID",
    status: "ACTIVE"
  }
];

// 운영 환경(Vercel 서버)에서는 브라우저에 남아있던 예전 로컬 스토리지 더미 캐시를 제거하여 서버 DB와 100% 일치 보장
if (typeof window !== "undefined" && window.location.protocol !== "file:" && !["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)) {
  try {
    localStorage.removeItem("NANO_MASTER_FRANCHISE_LIST");
    localStorage.removeItem("NANO_MASTER_DELETED_FRANCHISES");
    localStorage.removeItem("NANO_REAL_DATA_LOADED_VER");
  } catch (e) {}
}

// ==========================================
// 1-1-B. 가맹 학원 요금제 및 계정 안전 헬퍼 & LocalStorage 영구 보존 모듈
// ==========================================
const STORAGE_KEY_FRANCHISES = "NANO_MASTER_FRANCHISE_LIST";
const STORAGE_KEY_DELETED_FRANCHISES = "NANO_MASTER_DELETED_FRANCHISES";

// 이용 상품명(요금제) 표준 정규화 함수 (대소문자/한글 등 안전 매핑)
function normalizePlan(plan) {
  if (!plan) return "Basic";
  const p = String(plan).trim().toLowerCase();
  if (p === "vip" || p === "브이아이피") return "VIP";
  if (p === "royal" || p === "로얄") return "Royal";
  if (p === "premium" || p === "프리미엄") return "Premium";
  if (p === "standard" || p === "스탠다드") return "Standard";
  return "Basic";
}

// 인위적으로 자동 생성된 더미 ID 패턴 검증
function isSyntheticAdminId(id) {
  if (!id) return true;
  const s = String(id).toLowerCase().trim();
  return s.startsWith("admin_acad_") || s.startsWith("director_acad") || /^acad-\d+/i.test(s) || /^acad\d+/i.test(s);
}

// 가맹점 원장(DIRECTOR) 또는 대표 교사(TEACHER) 실제 계정 정보 조회 헬퍼
function getFranchiseAdminStaff(acad) {
  if (!acad) return null;
  if (typeof window !== "undefined" && Array.isArray(window.MIGRATED_MEMBERS)) {
    // 1. DIRECTOR 중 실제 실명 아이디 보유자
    const director = window.MIGRATED_MEMBERS.find(m => 
      (m.role === "DIRECTOR" || m.grade === "원장") &&
      ((m.academyId && (m.academyId === acad.id || m.academyId === acad.code)) || (m.academyName && m.academyName === acad.name)) &&
      !isSyntheticAdminId(m.username)
    );
    if (director) return director;

    // 2. TEACHER 중 실제 관리자/대표 교사 계정
    const teacher = window.MIGRATED_MEMBERS.find(m => 
      m.role === "TEACHER" &&
      ((m.academyId && (m.academyId === acad.id || m.academyId === acad.code)) || (m.academyName && m.academyName === acad.name)) &&
      !isSyntheticAdminId(m.username)
    );
    if (teacher) return teacher;
  }
  return null;
}

// 가맹점 관리자 ID 안전 조회 헬퍼 (기존 실제 원장/대표교사 로그인 아이디 우선 조회)
function getFranchiseAdminId(acad) {
  if (!acad) return "";

  // 1. 루크러닝 신규 등록 계정 보정
  if (acad.name && acad.name.includes("루크러닝")) {
    if (acad.adminId && !isSyntheticAdminId(acad.adminId)) return acad.adminId;
    return "lookadmin";
  }

  // 2. 통합 회원 원본 데이터셋(MIGRATED_MEMBERS)에서 해당 학원의 원장(DIRECTOR) 또는 대표 교사(TEACHER) 계정 조회
  const staff = getFranchiseAdminStaff(acad);
  if (staff && staff.username) {
    return staff.username;
  }

  // 3. Neon DB 이관 원본 데이터셋(MIGRATED_FRANCHISES)에서 기존 실제 adminId 우선 조회 (인위적 ID 제외)
  if (typeof window !== "undefined" && Array.isArray(window.MIGRATED_FRANCHISES)) {
    const orig = window.MIGRATED_FRANCHISES.find(f => 
      (f.id && f.id === acad.id) || 
      (f.name && f.name === acad.name) ||
      (f.bizNumber && acad.bizNumber && f.bizNumber === acad.bizNumber)
    );
    if (orig && orig.adminId && !isSyntheticAdminId(orig.adminId)) {
      return orig.adminId;
    }
  }

  // 4. 기존 저장된 ID가 정상 실명 아이디인 경우 (director_acad, admin_acad 등 인위적 접두어가 아닌 경우)
  const currentId = String(acad.adminId || acad.loginId || "").trim();
  if (currentId && !isSyntheticAdminId(currentId)) {
    return currentId;
  }

  // 5. fallback: 원본 adminId 또는 loginId (단, 인위적 더미 ID는 차단하여 빈 문자열 반환)
  if (acad.adminId && !isSyntheticAdminId(acad.adminId)) return acad.adminId;
  if (acad.loginId && !isSyntheticAdminId(acad.loginId)) return acad.loginId;
  return "";
}

// 가맹점 목록 데이터 무결성 검증 및 보정 (ID, 요금제, 계약 만료 자동 정규화)
function sanitizeFranchises(list) {
  if (!Array.isArray(list)) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  list.forEach(f => {
    if (!f.adminPw) f.adminPw = "nano123!";

    // admin_acad_033 또는 ACAD-033 같은 인위적 생성 ID는 실제 원장 아이디(enggan018 등)로 강제 복원
    const realId = getFranchiseAdminId(f);
    if (realId) {
      f.adminId = realId;
    }

    f.plan = normalizePlan(f.plan);

    // 계약 만료 자동 판정: 계약 종료일이 오늘 이전이면 EXPIRED로 자동 설정 (단, 이미 해지된 TERMINATED는 유지)
    if (f.endDate && f.status !== "TERMINATED") {
      const endD = new Date(f.endDate);
      endD.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((endD - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        f.status = "EXPIRED";
      } else if (diffDays <= 30 && f.status !== "PAUSED") {
        f.status = "EXPIRING";
      }
    }
  });
  return list;
}

const CURRENT_DATA_SYNC_VER = "20261022_RESTORE_ORIGINAL_ID_V4";

function loadFranchisesFromStorage() {
  // 1. Vercel 운영 환경 또는 DB 서버 실데이터 우선 로드 (Single Source of Truth)
  if (typeof window !== "undefined" && Array.isArray(window.MIGRATED_FRANCHISES) && window.MIGRATED_FRANCHISES.length > 0) {
    return sanitizeFranchises(window.MIGRATED_FRANCHISES);
  }
  if (window.NANO_SERVER_DATA) {
    return sanitizeFranchises(window.MIGRATED_FRANCHISES || []);
  }

  // 2. 오프라인 로컬(file://) 체험용 환경에서만 로컬 스토리지 보조 사용
  try {
    const stored = localStorage.getItem(STORAGE_KEY_FRANCHISES);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sanitizeFranchises(parsed);
      }
    }
  } catch (e) {}

  return sanitizeFranchises(JSON.parse(JSON.stringify(defaultFranchiseList)));
}

function saveFranchisesToStorage() {
  // 운영 환경(Vercel + Neon DB)에서는 로컬 스토리지 캐시를 오염시키지 않고 메모리/서버 일관성 유지
  if (window.NanoPortal && NanoPortal.remote) {
    if (typeof window !== "undefined") {
      window.MIGRATED_FRANCHISES = franchiseList;
    }
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY_FRANCHISES, JSON.stringify(franchiseList));
    if (typeof deletedAcademyList !== "undefined" && Array.isArray(deletedAcademyList)) {
      localStorage.setItem(STORAGE_KEY_DELETED_FRANCHISES, JSON.stringify(deletedAcademyList));
    }
  } catch (e) {}
}

let franchiseList = loadFranchisesFromStorage();

// 가맹 학원 20개 단위 페이징 상태 변수 (TDZ 호이스팅 오류 방지를 위해 상단 선언)
let franchiseCurrentPage = 1;
const FRANCHISE_PAGE_SIZE = 20;
let lastSortedFranchises = [];

// 1-2. 통합 회원 데이터 (Universal Members)
const defaultMemberList = [
  { id: 101, academyId: "ACAD-001", academyName: "나노 독서아카데미 목동본원", role: "DIRECTOR", name: "김은영", username: "director_mokdong", grade: "원장", className: "-", phone: "010-3342-9981", parentPhone: "-", points: 0, lastLogin: "2026-09-09 08:45", createdAt: "2025-03-01", status: "APPROVED" },
  { id: 102, academyId: "ACAD-001", academyName: "나노 독서아카데미 목동본원", role: "TEACHER", name: "송지민", username: "teacher_song", grade: "교사", className: "초등전담", phone: "010-5512-8871", parentPhone: "-", points: 0, lastLogin: "2026-09-09 09:10", createdAt: "2025-03-05", status: "APPROVED" },
  { id: 103, academyId: "ACAD-001", academyName: "나노 독서아카데미 목동본원", role: "STUDENT", name: "김태윤", username: "taeyoon_k", grade: "초6", className: "소나무반", phone: "010-2211-9981", parentPhone: "010-9988-1122", points: 4850, lastLogin: "2026-09-08 20:30", createdAt: "2025-03-10", status: "APPROVED" },
  { id: 104, academyId: "ACAD-001", academyName: "나노 독서아카데미 목동본원", role: "STUDENT", name: "이민우", username: "minwoo_lee", grade: "초5", className: "매화반", phone: "010-3388-1122", parentPhone: "010-8877-2233", points: 3920, lastLogin: "2026-09-08 19:15", createdAt: "2025-03-12", status: "APPROVED" },
  { id: 105, academyId: "ACAD-001", academyName: "나노 독서아카데미 목동본원", role: "STUDENT", name: "박소율", username: "soyul_p", grade: "초4", className: "난초반", phone: "010-7788-9900", parentPhone: "010-5544-3322", points: 3640, lastLogin: "2026-09-07 18:40", createdAt: "2025-04-02", status: "APPROVED" },
  { id: 106, academyId: "ACAD-001", academyName: "나노 독서아카데미 목동본원", role: "STUDENT", name: "최준혁", username: "junhyuk_c", grade: "초3", className: "미지정", phone: "010-6677-8899", parentPhone: "010-1122-4455", points: 0, lastLogin: "2026-09-05 14:20", createdAt: "2025-09-05", status: "PENDING" },
  
  { id: 201, academyId: "ACAD-002", academyName: "대치 에듀 독서논술센터", role: "DIRECTOR", name: "박진수", username: "director_daechi", grade: "원장", className: "-", phone: "010-8871-2311", parentPhone: "-", points: 0, lastLogin: "2026-09-08 22:10", createdAt: "2025-01-15", status: "APPROVED" },
  { id: 202, academyId: "ACAD-002", academyName: "대치 에듀 독서논술센터", role: "TEACHER", name: "정다은", username: "teacher_jung", grade: "교사", className: "중등전담", phone: "010-6622-1134", parentPhone: "-", points: 0, lastLogin: "2026-09-09 08:30", createdAt: "2025-01-20", status: "APPROVED" },
  { id: 203, academyId: "ACAD-002", academyName: "대치 에듀 독서논술센터", role: "STUDENT", name: "이서현", username: "seohyun_l", grade: "초5", className: "심화반", phone: "010-4499-1122", parentPhone: "010-2233-5566", points: 4520, lastLogin: "2026-09-08 21:05", createdAt: "2025-02-01", status: "APPROVED" },
  { id: 204, academyId: "ACAD-002", academyName: "대치 에듀 독서논술센터", role: "STUDENT", name: "장민재", username: "minjae_j", grade: "중1", className: "논술A", phone: "010-1122-3344", parentPhone: "010-9988-6655", points: 3890, lastLogin: "2026-09-07 19:20", createdAt: "2025-02-15", status: "APPROVED" },
  { id: 205, academyId: "ACAD-002", academyName: "대치 에듀 독서논술센터", role: "STUDENT", name: "정우진", username: "woojin_j", grade: "중2", className: "논술B", phone: "010-3344-7788", parentPhone: "010-7766-5544", points: 1200, lastLogin: "2026-08-10 11:30", createdAt: "2025-03-01", status: "WITHDRAWN" },
  
  { id: 301, academyId: "ACAD-003", academyName: "송도 센트럴 리딩랩", role: "DIRECTOR", name: "최윤정", username: "director_songdo", grade: "원장", className: "-", phone: "010-5541-0982", parentPhone: "-", points: 0, lastLogin: "2026-09-08 17:50", createdAt: "2025-06-01", status: "APPROVED" },
  { id: 302, academyId: "ACAD-003", academyName: "송도 센트럴 리딩랩", role: "STUDENT", name: "박지우", username: "jiwoo_p", grade: "초6", className: "마스터반", phone: "010-9988-7766", parentPhone: "010-3322-1100", points: 4210, lastLogin: "2026-09-08 22:40", createdAt: "2025-06-10", status: "APPROVED" },
  { id: 303, academyId: "ACAD-003", academyName: "송도 센트럴 리딩랩", role: "STUDENT", name: "강도현", username: "dohyun_k", grade: "초3", className: "기초반", phone: "010-3344-5566", parentPhone: "010-5566-7788", points: 2150, lastLogin: "2026-08-25 15:10", createdAt: "2025-06-15", status: "WITHDRAWN" },
  
  { id: 401, academyId: "ACAD-004", academyName: "판교 알파 독서학원", role: "DIRECTOR", name: "정성훈", username: "director_pangyo", grade: "원장", className: "-", phone: "010-4490-1123", parentPhone: "-", points: 0, lastLogin: "2026-09-09 09:00", createdAt: "2025-04-10", status: "APPROVED" },
  { id: 402, academyId: "ACAD-004", academyName: "판교 알파 독서학원", role: "STUDENT", name: "윤하은", username: "haeun_y", grade: "초5", className: "창의반", phone: "010-7711-2233", parentPhone: "010-8899-0011", points: 2850, lastLogin: "2026-09-08 16:50", createdAt: "2025-04-20", status: "APPROVED" },
  { id: 403, academyId: "ACAD-004", academyName: "판교 알파 독서학원", role: "STUDENT", name: "조현우", username: "hyunwoo_j", grade: "초4", className: "미지정", phone: "010-5522-3344", parentPhone: "010-6677-1122", points: 0, lastLogin: "2026-09-06 18:10", createdAt: "2025-09-06", status: "PENDING" }
];

// ==========================================
// 1-2-B. 통합 회원 LocalStorage 영구 보존 모듈
// ==========================================
const STORAGE_KEY_MEMBERS = "NANO_MASTER_MEMBER_LIST";

function loadMembersFromStorage() {
  // 1. Vercel 운영 환경 또는 DB 서버 실데이터 우선 로드
  if (typeof window !== "undefined" && Array.isArray(window.MIGRATED_MEMBERS) && window.MIGRATED_MEMBERS.length > 0) {
    return window.MIGRATED_MEMBERS;
  }
  if (window.NANO_SERVER_DATA) return window.MIGRATED_MEMBERS || [];

  // 2. 오프라인 체험 환경 보조
  try {
    return NanoPreviewData.readArray(STORAGE_KEY_MEMBERS, defaultMemberList);
  } catch(e) {
    return defaultMemberList;
  }
}

// 회원 정렬 캐시 및 고속 Collator (Intl.Collator는 일반 localeCompare 대비 약 8~10배 빠름)
let cachedSortedDefaultMembers = null;
let cachedMemberSourceRef = null;
const koCollator = new Intl.Collator('ko', { numeric: true, sensitivity: 'base' });

function invalidateMemberSortCache() {
  cachedSortedDefaultMembers = null;
  cachedMemberSourceRef = null;
}

function saveMembersToStorage() {
  invalidateMemberSortCache();
  if (window.NanoPortal && NanoPortal.remote) {
    if (typeof window !== "undefined") {
      window.MIGRATED_MEMBERS = memberList;
    }
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(memberList));
  } catch (e) {}
}

let memberList = loadMembersFromStorage();

// 1-3. 운영 관리 배너 데이터 (Rolling Banners)
// 1-3. 운영 관리 배너 데이터 (Rolling Banners)
let bannerList = [
  {
    id: 1,
    title: "9월 나노 독서왕 챌린지 🏆",
    sub: "이번 달 3권 이상 완독하고 골드 뱃지를 획득하세요!",
    imageUrl: "upload/banner/banner_reading_king.jpg",
    bgTheme: "linear-gradient(135deg, #7a6348, #4a3b32)",
    order: 1,
    active: "Y",
    clicks: 1420,
    createdAt: "2026-09-01",
    bookIds: ["MB-001", "MB-003", "MB-007"]
  },
  {
    id: 2,
    title: "상상력 쑥쑥! 나노 시트 개편 🌿",
    sub: "새로워진 독서 생각담기 양식으로 내 생각을 표현해보세요.",
    imageUrl: "upload/banner/banner_nanosheet.jpg",
    bgTheme: "linear-gradient(135deg, #4b6b55, #2f5436)",
    order: 2,
    active: "Y",
    clicks: 890,
    createdAt: "2026-09-03",
    bookIds: ["MB-004", "MB-011", "MB-014"]
  },
  {
    id: 3,
    title: "전국 학생 랭킹 실시간 집계 오픈 🌟",
    sub: "내가 속한 학원의 친구들과 전국 친구들의 독서 포인트를 확인해요.",
    imageUrl: "upload/banner/banner_ranking.jpg",
    bgTheme: "linear-gradient(135deg, #8c6d48, #d4a373)",
    order: 3,
    active: "Y",
    clicks: 2150,
    createdAt: "2026-09-05",
    bookIds: ["MB-002", "MB-005", "MB-008", "MB-016"]
  }
];

// 1-4. 추천 도서 큐레이션 테마 및 주제별 태그 관리 (도서 ID 매핑 연동 - 13개 표준 테마 기본 탑재)
let defaultMasterThemeList = [
  {
    id: 1,
    title: "인간",
    tag: "#인간",
    subTag: "# 신체, 가족, 꿈, 직업, 인류, 외국인, 친구, 양자, 우정, 항쟁, 사랑",
    desc: "신체, 가족, 인류, 우정과 삶의 이야기를 담은 테마 도서",
    image: "upload/code/code_thumb_20240619114230_주제별아이콘_인간.jpg",
    bookIds: [],
    active: "Y",
    createdAt: "2026-09-01"
  },
  {
    id: 2,
    title: "생활",
    tag: "#생활",
    subTag: "# 집, 도시, 시골, 직업, 경제, 놀이, 게임",
    desc: "일상생활, 도시와 시골, 경제와 놀이 이야기 테마 도서",
    image: "upload/code/code_thumb_20240619114304_주제별아이콘_생활.jpg",
    bookIds: [],
    active: "Y",
    createdAt: "2026-09-01"
  },
  {
    id: 3,
    title: "자연",
    tag: "#자연",
    subTag: "# 산, 바다, 강, 호수, 하늘, 태양, 달, 별, 바람, 비, 무지개, 구름",
    desc: "아름다운 자연과 환경, 지구의 신비를 담은 테마 도서",
    image: "upload/code/code_thumb_20240618021550_주제별아이콘_자연.jpg",
    bookIds: ["MB-005"],
    active: "Y",
    createdAt: "2026-09-01"
  },
  {
    id: 4,
    title: "생물",
    tag: "#생물",
    subTag: "# 애완동물, 가축, 야생동물, 식물, 곤충, 물고기, 새, 미생물",
    desc: "동물, 식물, 곤충과 다양한 생명체들의 이야기 테마 도서",
    image: "upload/code/code_thumb_20240619114501_주제별아이콘_생물.jpg",
    bookIds: [],
    active: "Y",
    createdAt: "2026-09-01"
  },
  {
    id: 5,
    title: "기술",
    tag: "#기술",
    subTag: "# 탈것, 자동차, 비행기, 배, 자전거, 핸드폰, 컴퓨터",
    desc: "자동차, 비행기, 컴퓨터와 미래 기술을 탐구하는 테마 도서",
    image: "upload/code/code_thumb_20240619114512_주제별아이콘_기술.jpg",
    bookIds: [],
    active: "Y",
    createdAt: "2026-09-01"
  },
  {
    id: 6,
    title: "과학",
    tag: "#과학",
    subTag: "# 로봇, AI, 복제인간, 우주",
    desc: "로봇, 인공지능, 우주와 과학의 원리를 배우는 테마 도서",
    image: "upload/code/code_thumb_20240618021615_주제별아이콘_과학.jpg",
    bookIds: ["MB-005", "MB-008", "MB-012", "MB-016"],
    active: "Y",
    createdAt: "2026-09-01"
  },
  {
    id: 7,
    title: "역사",
    tag: "#역사",
    subTag: "# 과거, 시대, 인물, 사건, 유물, 전통, 문화유산",
    desc: "한국사와 세계사의 위대한 인물과 역사적 사건 테마 도서",
    image: "upload/code/code_thumb_20240619114326_주제별아이콘_역사.jpg",
    bookIds: ["MB-009", "MB-010"],
    active: "Y",
    createdAt: "2026-09-01"
  },
  {
    id: 8,
    title: "이야기",
    tag: "#이야기",
    subTag: "# 전래동화, 신화, 모험, 판타지, 상상, 우화",
    desc: "상상력을 키워주는 흥미진진한 모험과 명작 이야기 테마 도서",
    image: "upload/code/code_thumb_20240619114237_주제별아이콘_이야기.jpg",
    bookIds: ["MB-001", "MB-002", "MB-003", "MB-004"],
    active: "Y",
    createdAt: "2026-09-01"
  },
  {
    id: 9,
    title: "사회",
    tag: "#사회",
    subTag: "# 사회, 정치, 법, 공동체, 시민, 환경, 지구촌",
    desc: "더불어 살아가는 사회와 법, 공동체와 정의를 배우는 테마 도서",
    image: "upload/code/code_thumb_20240421062532_planet-earth.png",
    bookIds: ["MB-006"],
    active: "Y",
    createdAt: "2026-09-01"
  },
  {
    id: 10,
    title: "건강",
    tag: "#건강",
    subTag: "# 운동, 식습관, 마음건강, 안전, 보건, 신체발달",
    desc: "몸과 마음을 튼튼하게 가꾸는 건강과 안전 상식 테마 도서",
    image: "upload/code/code_thumb_20240619114246_주제별아이콘_건강-08.jpg",
    bookIds: [],
    active: "Y",
    createdAt: "2026-09-01"
  },
  {
    id: 11,
    title: "학습",
    tag: "#학습",
    subTag: "# 공부, 교과연계, 언어, 수학, 탐구, 호기심",
    desc: "교과와 연계된 기초 학력과 지적 호기심을 채우는 테마 도서",
    image: "upload/code/code_thumb_20240619114312_주제별아이콘_학습.jpg",
    bookIds: [],
    active: "Y",
    createdAt: "2026-09-01"
  },
  {
    id: 12,
    title: "요리",
    tag: "#요리",
    subTag: "# 음식, 요리, 영양, 식문화, 베이킹, 식재료",
    desc: "맛있는 음식과 영양, 세계의 식문화를 배우는 테마 도서",
    image: "upload/code/code_thumb_20240619114534_주제별아이콘_요리.jpg",
    bookIds: [],
    active: "Y",
    createdAt: "2026-09-01"
  },
  {
    id: 13,
    title: "기타",
    tag: "#기타",
    subTag: "# 예술, 취미, 특별활동, 상식, 자유주제",
    desc: "예술, 취미, 다양한 관심사를 탐색하는 특별 테마 도서",
    image: "upload/code/code_thumb_20240619114559_주제별아이콘_기타.jpg",
    bookIds: [],
    active: "Y",
    createdAt: "2026-09-01"
  }
];

let themeList = defaultMasterThemeList.slice();

// 배너 linkUrl('#books=ID1,ID2&sub=...')에서 도서 목록 및 서브 설명 추출 헬퍼
function parseBannerMetaFromLink(linkStr) {
  var res = { hasBooksParam: false, bookIds: [], sub: "" };
  if (!linkStr || typeof linkStr !== "string" || !linkStr.startsWith("#")) return res;
  try {
    var params = new URLSearchParams(linkStr.slice(1));
    if (params.has("books")) {
      res.hasBooksParam = true;
      var raw = params.get("books") || "";
      res.bookIds = raw ? raw.split(",").map(function(s) { return s.trim(); }).filter(Boolean) : [];
    }
    if (params.has("sub")) {
      res.sub = params.get("sub") || "";
    }
  } catch (e) {}
  return res;
}

function getEffectiveBannerBookIds(b) {
  if (!b) return [];
  if (Array.isArray(b.bookIds) && b.bookIds.length > 0) {
    return b.bookIds.map(function(id) { return String(id).trim(); }).filter(Boolean);
  }
  var parsed = parseBannerMetaFromLink(b.linkUrl || b.link || "");
  if (parsed.hasBooksParam) return parsed.bookIds;
  return Array.isArray(b.bookIds) ? b.bookIds.map(function(id) { return String(id).trim(); }).filter(Boolean) : [];
}

// 로컬스토리지 및 중앙 서버 동기화 헬퍼 함수
function saveOperationsToStorage() {
  const saveTime = Date.now();
  // 각 배너에 updatedAt 및 linkUrl(#books=...) 부여 (동기화 정합성 보장)
  bannerList.forEach(b => {
    if (!b.updatedAt) b.updatedAt = saveTime;
    const bIds = Array.isArray(b.bookIds) ? b.bookIds.map(id => String(id).trim()).filter(Boolean) : [];
    b.bookIds = bIds;
    if (!b.linkUrl || !/^https?:\/\//i.test(b.linkUrl)) {
      b.linkUrl = "#books=" + encodeURIComponent(bIds.join(",")) + (b.sub ? "&sub=" + encodeURIComponent(b.sub) : "");
      b.link = b.linkUrl;
    }
  });
  themeList.forEach(t => {
    if (!t.updatedAt) t.updatedAt = saveTime;
  });

  if (typeof window !== "undefined") {
    window.NANO_SERVER_BANNERS = bannerList.map(b => ({ ...b, bookIds: [...(b.bookIds || [])] }));
    window.NANO_SERVER_THEMES = themeList.map(t => ({ ...t }));
  }

  try {
    localStorage.setItem("NANO_MASTER_BANNERS_TIME", saveTime.toString());
    localStorage.setItem("NANO_MASTER_BANNERS", JSON.stringify(bannerList));
    localStorage.setItem("NANO_MASTER_THEMES_TIME", saveTime.toString());
    localStorage.setItem("NANO_MASTER_THEMES", JSON.stringify(themeList));
  } catch (e) {
    console.warn("로컬스토리지 저장 중 용량 주의:", e);
    try {
      localStorage.removeItem("NANO_MASTER_BANNERS");
      localStorage.setItem("NANO_MASTER_BANNERS_TIME", saveTime.toString());
      localStorage.setItem("NANO_MASTER_BANNERS", JSON.stringify(bannerList));
      localStorage.setItem("NANO_MASTER_THEMES_TIME", saveTime.toString());
      localStorage.setItem("NANO_MASTER_THEMES", JSON.stringify(themeList));
    } catch(err2) {
      console.error("로컬스토리지 재시도 실패:", err2);
      showMasterToast("저장소 용량 한도로 일부 변경사항이 브라우저에 영구 저장되지 못했습니다.");
    }
  }

  // 동일 기기 다른 탭(학생 화면 등)에 즉각 반영되도록 커스텀 스토리지 이벤트 발송
  try {
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'NANO_MASTER_BANNERS',
      newValue: JSON.stringify(bannerList)
    }));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'NANO_MASTER_THEMES',
      newValue: JSON.stringify(themeList)
    }));
  } catch(evErr) {}

  if (window.NANO_SERVER_DATA) return;

  // [태블릿/모바일 기기간 실시간 배너 동기화] 서버 중앙 저장소(api/sync_banners.php)로 비동기 전송
  try {
    fetch('api/sync_banners.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bannerList)
    }).then(res => {
      if (!res.ok) throw new Error('서버 응답 오류: ' + res.status);
      return res.json();
    }).then(data => {
      if (data && data.banners && Array.isArray(data.banners)) {
        let hasImageConverted = false;
        data.banners.forEach(sb => {
          const target = bannerList.find(b => String(b.id) === String(sb.id));
          if (target && target.imageUrl !== sb.imageUrl) {
            target.imageUrl = sb.imageUrl;
            target.updatedAt = sb.updatedAt || Date.now();
            hasImageConverted = true;
          }
        });
        if (hasImageConverted) {
          localStorage.setItem("NANO_MASTER_BANNERS_TIME", Date.now().toString());
          localStorage.setItem("NANO_MASTER_BANNERS", JSON.stringify(bannerList));
          if (typeof renderBannerList === 'function') renderBannerList();
        }
      }
      console.log("중앙 배너 서버 동기화 완료: 태블릿 및 모바일 기기에 즉시 반영됩니다.");
    }).catch(err => {
      console.warn("중앙 배너 서버 동기화 안내 (오프라인 상태 또는 네트워크 환경, 로컬스토리지에는 안전 보존됨):", err);
    });
  } catch(netErr) {
    console.warn("중앙 서버 동기화 요청 실패:", netErr);
  }

  // [실시간 테마 동기화] 학생 화면 연동용 중앙 저장소(api/sync_themes.php)로 비동기 전송
  try {
    fetch('api/sync_themes.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(themeList)
    }).then(res => {
      if (!res.ok) throw new Error('서버 응답 오류: ' + res.status);
      return res.json();
    }).then(data => {
      if (data && data.themes && Array.isArray(data.themes)) {
        let hasImgConverted = false;
        data.themes.forEach(st => {
          const target = themeList.find(t => String(t.id) === String(st.id));
          if (target && target.image !== st.image) {
            target.image = st.image;
            target.updatedAt = st.updatedAt || Date.now();
            hasImgConverted = true;
          }
        });
        if (hasImgConverted) {
          localStorage.setItem("NANO_MASTER_THEMES_TIME", Date.now().toString());
          localStorage.setItem("NANO_MASTER_THEMES", JSON.stringify(themeList));
          if (typeof renderThemeTable === 'function') renderThemeTable();
        }
      }
      console.log("중앙 테마 서버 동기화 완료: 학생 페이지 [주제별 도서]에 즉시 반영됩니다.");
    }).catch(err => {
      console.warn("중앙 테마 서버 동기화 안내:", err);
    });
  } catch(themeNetErr) {
    console.warn("중앙 서버 테마 동기화 요청 실패:", themeNetErr);
  }
}

function loadOperationsFromStorage() {
  if (window.NANO_SERVER_DATA) {
    var localBanners = [];
    var localThemes = [];
    try {
      localBanners = JSON.parse(localStorage.getItem("NANO_MASTER_BANNERS") || "[]");
      localThemes = JSON.parse(localStorage.getItem("NANO_MASTER_THEMES") || "[]");
    } catch (e) {}
    bannerList = (window.NANO_SERVER_BANNERS || []).map(function(sb) {
      var lb = Array.isArray(localBanners) ? localBanners.find(function(x) { return String(x.id) === String(sb.id) || (x.title && x.title === sb.title); }) : null;
      var linkMeta = parseBannerMetaFromLink(sb.linkUrl || sb.link || (lb && (lb.linkUrl || lb.link)) || "");
      var serverBookIds = (Array.isArray(sb.bookIds) && sb.bookIds.length > 0)
        ? sb.bookIds
        : (linkMeta.hasBooksParam ? linkMeta.bookIds : []);
      var localBookIds = (lb && Array.isArray(lb.bookIds)) ? lb.bookIds : [];
      var finalBookIds = serverBookIds.length > 0 ? serverBookIds : localBookIds;
      if (lb && lb.updatedAt && (!sb.updatedAt || lb.updatedAt >= sb.updatedAt) && Array.isArray(lb.bookIds)) {
        finalBookIds = lb.bookIds;
      }
      return Object.assign({}, sb, {
        sub: sb.sub || linkMeta.sub || (lb && lb.sub) || "",
        bookIds: finalBookIds.map(function(id) { return String(id).trim(); }).filter(Boolean),
        imageUrl: sb.imageUrl || sb.image || (lb && (lb.imageUrl || lb.image)) || "",
        clicks: sb.clicks || (lb && lb.clicks) || 0,
        createdAt: sb.createdAt || (lb && lb.createdAt) || "2026-09-01"
      });
    });
    window.NANO_SERVER_BANNERS = bannerList.slice();
    themeList = (window.NANO_SERVER_THEMES || []).map(function(st) {
      var lt = Array.isArray(localThemes) ? localThemes.find(function(x) { return String(x.id) === String(st.id) || (x.title && x.title === st.title) || (x.tag && x.tag === st.tag); }) : null;
      if (!lt) return st;
      return Object.assign({}, st, {
        subTag: st.subTag || lt.subTag || "",
        desc: st.desc || lt.desc || st.description || "",
        image: (st.image && !st.image.includes("photo-1544716278")) ? st.image : (lt.image || st.image || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80"),
        active: st.active || lt.active || "Y"
      });
    });
    return;
  }
  const localTime = parseInt(localStorage.getItem("NANO_MASTER_BANNERS_TIME") || "0", 10);
  let hasLocalData = false;

  try {
    const b = localStorage.getItem("NANO_MASTER_BANNERS");
    if (b) {
      const parsed = JSON.parse(b);
      if (Array.isArray(parsed) && parsed.length > 0) {
        bannerList = parsed;
        hasLocalData = true;
      }
    } else if (window.NANO_SERVER_BANNERS && Array.isArray(window.NANO_SERVER_BANNERS) && window.NANO_SERVER_BANNERS.length > 0) {
      bannerList = window.NANO_SERVER_BANNERS;
    }

    const t = localStorage.getItem("NANO_MASTER_THEMES");
    if (t) {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 기존 4개 구버전 더미 데이터가 저장되어 있던 경우 13개 신규 표준 테마로 안전 마이그레이션
        if (parsed.length === 4 && parsed.some(item => item.tag === "#이달의나노북클럽")) {
          themeList = defaultMasterThemeList.slice();
          localStorage.setItem("NANO_MASTER_THEMES", JSON.stringify(themeList));
        } else {
          themeList = parsed;
        }
      }
    } else if (window.NANO_SERVER_THEMES && Array.isArray(window.NANO_SERVER_THEMES) && window.NANO_SERVER_THEMES.length > 0) {
      themeList = window.NANO_SERVER_THEMES;
    } else {
      themeList = defaultMasterThemeList.slice();
    }
  } catch (e) {
    console.warn("로컬스토리지 불러오기 중 오류:", e);
  }

  // 서버의 최신 중앙 배너 가져와서 동기화 (지능형 타임스탬프 검증으로 로컬 수정본 덮어쓰기 방지)
  try {
    fetch('api/sync_banners.php?t=' + Date.now())
      .then(res => {
        if (!res.ok) throw new Error('API 응답 불가: ' + res.status);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const serverLatestTime = data.reduce((max, item) => Math.max(max, item.updatedAt || 0), 0);
          if (hasLocalData && localTime > (serverLatestTime + 1000)) {
            console.log("[동기화 보호] 로컬 배너 데이터가 서버보다 최신입니다. 서버로 최신 데이터를 푸시합니다.");
            saveOperationsToStorage();
            return;
          }
          bannerList = data;
          localStorage.setItem("NANO_MASTER_BANNERS_TIME", (serverLatestTime || Date.now()).toString());
          localStorage.setItem("NANO_MASTER_BANNERS", JSON.stringify(bannerList));
          if (typeof renderBannerList === 'function') renderBannerList();
          console.log("서버 중앙 배너 목록 동기화 완료:", bannerList.length + "개 배너");
        }
      }).catch(e => {
        console.log("서버 배너 로드 건너뜀 (로컬스토리지 최신값 안전 유지):", e);
      });
  } catch(e) {}

  // 서버의 최신 중앙 테마 가져와서 동기화
  try {
    fetch('api/sync_themes.php?t=' + Date.now())
      .then(res => {
        if (!res.ok) throw new Error('API 응답 불가: ' + res.status);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const localThemeTime = parseInt(localStorage.getItem("NANO_MASTER_THEMES_TIME") || "0", 10);
          const serverThemeTime = data.reduce((max, item) => Math.max(max, item.updatedAt || 0), 0);
          if (localThemeTime > (serverThemeTime + 1000)) return;
          themeList = data;
          localStorage.setItem("NANO_MASTER_THEMES_TIME", (serverThemeTime || Date.now()).toString());
          localStorage.setItem("NANO_MASTER_THEMES", JSON.stringify(themeList));
          if (typeof renderThemeTable === 'function') renderThemeTable();
          console.log("서버 중앙 테마 목록 동기화 완료:", themeList.length + "개 테마");
        }
      }).catch(e => {
        console.log("서버 테마 로드 건너뜀 (로컬스토리지 최신값 유지):", e);
      });
  } catch(e) {}
}
loadOperationsFromStorage();

// 1-5. 마스터 콘텐츠 도서 라이브러리 풀 (Central Books Pool & Academy Created Books)
let masterBooks = [
  {
    id: "MB-001",
    title: "어린 왕자",
    author: "앙투안 드 생텍쥐페리",
    publisher: "열린책들",
    grade: "초등 5학년",
    category: "문학",
    cat1: "외서",
    cat2: "소설",
    series: "단권",
    isSingle: true,
    tags: ["#이달의나노북클럽", "문학", "인문"],
    detailTag: "#세계명작 #우정 #성장",
    awards: "르몽드 선정 20세기 최고의 책",
    thinkExtract: "만약 나만의 작은 소행성이 있다면 어떤 꽃이나 동물을 가장 소중히 가꾸고 싶나요?",
    thinkInsert: "주인공이 옆에 있다면 하고 싶은 이야기를 적어주세요.",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 38,
    recommends: 42,
    quizCompletions: 115,
    academyId: "HQ",
    academyName: "본사 직속 (공용)",
    creatorType: "HQ",
    sheet: true,
    date: "2025-01-10",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&q=80",
    quizList: [
      { type: "CHOICE", question: "어린 왕자가 자신의 별을 떠나 여행을 시작하게 된 결정적인 이유는 무엇인가요?", opt1: "오만하고 변덕스러운 장미와의 갈등 때문에", opt2: "더 넓은 우주를 정복하고 싶어서", opt3: "별에 화산이 폭발할 위험이 있어서", opt4: "비행사 아저씨를 만나기 위해", ans: "1", hint: "도서 전반부 장미꽃과의 대화를 살펴보세요." },
      { type: "SUBJECTIVE", question: "어린 왕자가 사막에서 여우를 만나 배운 가장 중요한 개념이자, 서로 특별한 관계를 맺는 행위를 뜻하는 단어는 무엇인가요?", subjectiveAns: "길들이다", similarAns: "길들임, 길들이는 것", hint: "여우가 '네가 나를 길들인다면...'이라고 말합니다." },
      { type: "CHOICE", question: "여우가 어린 왕자에게 작별 선물로 알려준 비밀은 무엇인가요?", opt1: "가장 중요한 것은 눈에 보이지 않고 마음으로 보아야 한다", opt2: "세상에서 가장 강한 것은 황금과 권력이다", opt3: "어른들은 언제나 옳고 현명하다", opt4: "꽃은 물을 자주 주지 않아도 스스로 자란다", ans: "1", hint: "여우의 명대사를 떠올려보세요." },
      { type: "SUBJECTIVE", question: "지구에 불시착하여 어린 왕자를 만난 화자의 본래 직업은 무엇이었나요?", subjectiveAns: "비행사", similarAns: "비행기 조종사, 조종사", hint: "사막에 비행기 고장으로 불시착했습니다." },
      { type: "CHOICE", question: "이 작품에서 작가가 궁극적으로 비판하고자 한 대상은 누구인가요?", opt1: "숫자와 눈앞의 이익에만 집착하여 순수함을 잃어버린 어른들", opt2: "자연을 소중히 여기지 않는 과학자들", opt3: "공부를 게을리하는 게으른 아이들", opt4: "거짓말을 밥먹듯이 하는 정치가들", ans: "1", hint: "어린 왕자가 만난 소행성의 어른들을 떠올려보세요." }
    ]
  },
  {
    id: "MB-002",
    title: "아몬드",
    author: "손원평",
    publisher: "창비",
    grade: "중등 2학년",
    category: "문학",
    cat1: "국내서",
    cat2: "소설",
    series: "단권",
    isSingle: true,
    tags: ["#이달의나노북클럽", "문학"],
    detailTag: "#청소년문학 #공감 #감정표현",
    awards: "제10회 창비청소년문학상 수상작",
    thinkExtract: "만약 다른 사람의 슬픔이나 기쁨을 전혀 느낄 수 없다면 세상은 어떻게 보일까요?",
    thinkInsert: "이 책을 읽고 가장 많이 떠오른 내 주변의 사람은 누구이며 그 이유는 무엇인가요?",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 54,
    recommends: 61,
    quizCompletions: 142,
    academyId: "HQ",
    academyName: "본사 직속 (공용)",
    creatorType: "HQ",
    sheet: true,
    date: "2025-01-15",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=150&q=80",
    quizList: [
      { type: "CHOICE", question: "주인공 윤재가 뇌의 '편도체' 이상으로 겪고 있는 증상은 무엇인가요?", opt1: "공포나 분노, 슬픔 등 타인의 감정을 느끼지 못함", opt2: "기억을 며칠 이상 보존하지 못함", opt3: "색깔을 구분하지 못하는 전색맹", opt4: "거짓말을 절대 하지 못하는 성향", ans: "1", hint: "감정표현불능증(알렉시티미아)을 떠올려보세요." },
      { type: "SUBJECTIVE", question: "윤재와 대립하면서도 점차 깊은 우정과 교감을 나누게 되는 거칠고 반항적인 친구의 이름은 무엇인가요?", subjectiveAns: "곤이", similarAns: "윤이수, 이수", hint: "어린 시절 길을 잃고 거칠게 자란 소년입니다." },
      { type: "CHOICE", question: "윤재의 할머니와 어머니가 비극적인 사고를 당한 장소와 날은 언제인가요?", opt1: "크리스마스이브의 눈 내리는 거리", opt2: "설날 아침 고향 집 앞", opt3: "윤재의 중학교 입학식 날 학교 운동장", opt4: "여름 방학 가족 여행을 떠난 바닷가", ans: "1", hint: "작품 시작부의 비극적인 사건입니다." },
      { type: "SUBJECTIVE", question: "윤재가 어머니의 헌책방을 이어받아 운영할 때 옆에서 큰 힘이 되어준 의사 선생님이자 건물주의 성함은?", subjectiveAns: "심 박사", similarAns: "심박사, 심윤권", hint: "윤재 어머니의 오랜 친구이자 따뜻한 멘토입니다." },
      { type: "CHOICE", question: "작가가 '아몬드'를 통해 우리 사회에 던지는 핵심 메시지는 무엇인가요?", opt1: "진정한 공감과 소통은 조건 없이 다가가는 용기에서 비롯된다", opt2: "감정을 억제하는 사람만이 냉철한 성공을 거둘 수 있다", opt3: "선천적 장애는 어떠한 노력으로도 극복할 수 없다", opt4: "청소년 범죄에 대해서는 엄벌주의를 적용해야 한다", ans: "1", hint: "윤재와 곤이가 서로를 이해해 가는 과정을 생각하세요." }
    ]
  },
  {
    id: "MB-003",
    title: "마당을 나온 암탉",
    author: "황선미",
    publisher: "사계절",
    grade: "초등 4학년",
    category: "문학",
    cat1: "국내서",
    cat2: "소설",
    series: "단권",
    isSingle: true,
    tags: ["#인문문학여행", "문학"],
    detailTag: "#생명존중 #모성애 #자유",
    awards: "한국 아동문학 베스트셀러",
    thinkExtract: "안전하지만 갇혀 있는 삶과 위험하지만 자유로운 삶 중 어느 쪽을 선택하고 싶나요?",
    thinkInsert: "이야기는 끝났지만, 그 이후 어떤 일이 벌어졌는 지 상상해서 이야기를 만들어주세요.",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 29,
    recommends: 35,
    quizCompletions: 98,
    academyId: "HQ",
    academyName: "본사 직속 (공용)",
    creatorType: "HQ",
    sheet: true,
    date: "2025-02-01",
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=150&q=80"
  },
  {
    id: "MB-004",
    title: "자전거 도둑",
    author: "박완서",
    publisher: "다림",
    grade: "초등 6학년",
    category: "문학",
    cat1: "국내서",
    cat2: "소설",
    series: "단권",
    isSingle: true,
    tags: ["문학", "사회"],
    detailTag: "#성장소설 #양심 #도덕",
    awards: "초등 6학년 국어 교과서 수록",
    thinkExtract: "어려운 상황에 처했을 때 양심을 지키는 것은 왜 어려울까요?",
    thinkInsert: "기억나는 장면이나 문장을 적어보세요.",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 31,
    recommends: 27,
    quizCompletions: 88,
    academyId: "ACAD-001",
    academyName: "나노 목동본원",
    creatorType: "ACADEMY",
    sheet: true,
    date: "2025-02-10",
    cover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150&q=80"
  },
  {
    id: "MB-005",
    title: "지구의 마지막 환경 수업",
    author: "남성현",
    publisher: "동아시아",
    grade: "초등 6학년",
    category: "과학",
    cat1: "국내서",
    cat2: "비문학",
    series: "단권",
    isSingle: true,
    tags: ["#미래과학환경", "과학"],
    detailTag: "#기후변화 #환경보호 #생태계",
    awards: "우수환경도서 선정",
    thinkExtract: "지구의 온도가 1도 더 오른다면 우리 동네에는 어떤 변화가 생길까요?",
    thinkInsert: "책을 읽고 새롭게 알게된 내용은 무엇인가요?",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 41,
    recommends: 49,
    quizCompletions: 104,
    academyId: "ACAD-002",
    academyName: "대치 에듀센터",
    creatorType: "ACADEMY",
    sheet: true,
    date: "2025-03-05",
    cover: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=150&q=80"
  },
  {
    id: "MB-006",
    title: "정의란 무엇인가 (주니어)",
    author: "마이클 샌델",
    publisher: "와이즈베리",
    grade: "중등 1학년",
    category: "사회",
    cat1: "외서",
    cat2: "비문학",
    series: "단권",
    isSingle: true,
    tags: ["#인문문학여행", "사회", "인문"],
    detailTag: "#철학 #공동체윤리 #정의",
    awards: "청소년 필독 교양 도서",
    thinkExtract: "다수의 행복을 위해 소수의 희생을 요구하는 것은 과연 정의로울까요?",
    thinkInsert: "이 책에서 가장 기억에 남은 내용은 무엇인가요?",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 47,
    recommends: 52,
    quizCompletions: 110,
    academyId: "HQ",
    academyName: "본사 직속 (공용)",
    creatorType: "HQ",
    sheet: true,
    date: "2025-04-12",
    cover: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=150&q=80"
  },
  {
    id: "MB-007",
    title: "만복이네 떡집",
    author: "김리리",
    publisher: "비룡소",
    grade: "초등 2학년",
    category: "문학",
    cat1: "국내서",
    cat2: "소설",
    series: "만복이네 떡집 시리즈",
    isSingle: false,
    tags: ["#이달의나노북클럽", "문학"],
    detailTag: "#초등저학년 #배려 #고운말",
    awards: "초등 3학년 국어 수록",
    thinkExtract: "먹으면 착하고 고운 말만 술술 나오는 떡이 있다면 누구에게 선물하고 싶나요?",
    thinkInsert: "이 책에서 얻은 교훈이 있다면?",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 58,
    recommends: 64,
    quizCompletions: 167,
    academyId: "ACAD-003",
    academyName: "송도 센트럴랩",
    creatorType: "ACADEMY",
    sheet: true,
    date: "2025-05-20",
    cover: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=150&q=80"
  },
  {
    id: "MB-008",
    title: "십 대를 위한 과학 읽기",
    author: "정재승 외",
    publisher: "동아엠앤비",
    grade: "중등 3학년",
    category: "과학",
    cat1: "국내서",
    cat2: "비문학",
    series: "단권",
    isSingle: true,
    tags: ["#미래과학환경", "과학"],
    detailTag: "#뇌과학 #우주물리 #인공지능",
    awards: "과학창의재단 우수과학도서",
    thinkExtract: "인공지능이 인간보다 더 뛰어난 감정을 표현하게 된다면 우리는 친구가 될 수 있을까요?",
    thinkInsert: "이 책을 추천한다면 어떻게 설명하고 싶나요?",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 33,
    recommends: 39,
    quizCompletions: 74,
    academyId: "HQ",
    academyName: "본사 직속 (공용)",
    creatorType: "HQ",
    sheet: true,
    date: "2025-06-18",
    cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=150&q=80"
  },
  {
    id: "MB-009",
    title: "한국사 편지 (1권)",
    author: "박은봉",
    publisher: "웅진주니어",
    grade: "초등 5학년",
    category: "역사",
    cat1: "국내서",
    cat2: "비문학",
    series: "한국사 편지",
    isSingle: false,
    tags: ["#교과연계한국사", "역사"],
    detailTag: "#선사시대 #고조선 #삼국시대",
    awards: "어린이 도서연구회 권장도서",
    thinkExtract: "타임머신을 타고 과거 역사 속 한 시대로 갈 수 있다면 어디로 가고 싶나요?",
    thinkInsert: "이 책을 읽고 생각난 사람은 누구이며 이유는 무엇인가요?",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 49,
    recommends: 53,
    quizCompletions: 129,
    academyId: "ACAD-004",
    academyName: "판교 알파학원",
    creatorType: "ACADEMY",
    sheet: true,
    date: "2025-07-02",
    cover: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=150&q=80"
  },
  {
    id: "MB-010",
    title: "용선생의 시끌벅적 한국사",
    author: "금현경 외",
    publisher: "사회평론",
    grade: "초등 5학년",
    category: "역사",
    cat1: "국내서",
    cat2: "비문학",
    series: "용선생 한국사",
    isSingle: false,
    tags: ["#교과연계한국사", "역사"],
    detailTag: "#조선시대 #역사스토리텔링",
    awards: "학부모 추천 한국사 1위",
    thinkExtract: "역사 속 위인 중 가장 지혜로운 결단을 내린 인물은 누구일까요?",
    thinkInsert: "책을 읽고 새롭게 알게된 내용은 무엇인가요?",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 62,
    recommends: 70,
    quizCompletions: 184,
    academyId: "ACAD-001",
    academyName: "나노 목동본원",
    creatorType: "ACADEMY",
    sheet: true,
    date: "2025-07-15",
    cover: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=150&q=80"
  },
  {
    id: "MB-011",
    title: "이상한 과자 가게 전천당",
    author: "히로시마 레이코",
    publisher: "길벗스쿨",
    grade: "초등 3학년",
    category: "문학",
    cat1: "외서",
    cat2: "소설",
    series: "전천당 시리즈",
    isSingle: false,
    tags: ["#이달의나노북클럽", "문학"],
    detailTag: "#판타지 #인과응보 #마법과자",
    awards: "초등 독서 인기 베스트 1위",
    thinkExtract: "소원을 이루어주는 마법 과자가 하나 있다면 어떤 맛과 효능을 원하나요?",
    thinkInsert: "가장 기억에 남는 등장인물은 누구이며 그 이유는 무엇인가요?",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 72,
    recommends: 85,
    quizCompletions: 210,
    academyId: "ACAD-002",
    academyName: "대치 에듀센터",
    creatorType: "ACADEMY",
    sheet: true,
    date: "2025-08-01",
    cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150&q=80"
  },
  {
    id: "MB-012",
    title: "수학도둑 (심화편)",
    author: "송도수",
    publisher: "서울문화사",
    grade: "초등 3학년",
    category: "과학",
    cat1: "국내서",
    cat2: "비문학",
    series: "수학도둑",
    isSingle: false,
    tags: ["과학"],
    detailTag: "#학습만화 #수리력 #논리퍼즐",
    awards: "학습만화 스테디셀러",
    thinkExtract: "일상생활에서 수학적 논리가 가장 유용하게 쓰이는 순간은 언제일까요?",
    thinkInsert: "이 책을 추천한다면 어떻게 설명하고 싶나요?",
    isPublic: "Y",
    hasQuiz: false,
    quizzes: 0,
    likes: 19,
    recommends: 22,
    quizCompletions: 45,
    academyId: "HQ",
    academyName: "본사 직속 (공용)",
    creatorType: "HQ",
    sheet: true,
    date: "2025-08-10",
    cover: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=150&q=80"
  },
  {
    id: "MB-013",
    title: "마법천자문",
    author: "시리얼",
    publisher: "아울북",
    grade: "초등 1학년",
    category: "문학",
    cat1: "국내서",
    cat2: "소설",
    series: "마법천자문",
    isSingle: false,
    tags: ["문학"],
    detailTag: "#한자학습 #모험 #용기",
    awards: "어린이 한자만화 1위",
    thinkExtract: "가장 멋있고 힘이 센 한자 마법을 하나 만들 수 있다면 어떤 글자를 고를까요?",
    thinkInsert: "이 책을 친구에게 추천한다면, 뭐라고 소개하고 싶은가요?",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 35,
    recommends: 40,
    quizCompletions: 89,
    academyId: "HQ",
    academyName: "본사 직속 (공용)",
    creatorType: "HQ",
    sheet: true,
    date: "2025-08-20",
    cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=150&q=80"
  },
  {
    id: "MB-014",
    title: "푸른 사자 와니니",
    author: "이현",
    publisher: "창비",
    grade: "초등 5학년",
    category: "문학",
    cat1: "국내서",
    cat2: "소설",
    series: "푸른 사자 와니니",
    isSingle: false,
    tags: ["#이달의나노북클럽", "문학"],
    detailTag: "#동물문학 #성장 #자연생태",
    awards: "초등학생이 가장 사랑하는 동화",
    thinkExtract: "무리에서 쫓겨난 약한 와니니가 진정한 리더로 성장할 수 있었던 비결은 무엇일까요?",
    thinkInsert: "가장 기억에 남는 등장인물은 누구이며 그 이유는 무엇인가요?",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 44,
    recommends: 48,
    quizCompletions: 112,
    academyId: "ACAD-003",
    academyName: "송도 센트럴랩",
    creatorType: "ACADEMY",
    sheet: true,
    date: "2025-09-01",
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=150&q=80"
  },
  {
    id: "MB-015",
    title: "시간을 파는 상점",
    author: "김선영",
    publisher: "자음과모음",
    grade: "중등 1학년",
    category: "문학",
    cat1: "국내서",
    cat2: "소설",
    series: "단권",
    isSingle: true,
    tags: ["#인문문학여행", "문학"],
    detailTag: "#청소년소설 #시간의의미 #소통",
    awards: "자음과모음 청소년문학상 대상",
    thinkExtract: "시간을 돈으로 살 수 있다면 나의 과거 1시간과 미래 1시간 중 무엇을 사겠습니까?",
    thinkInsert: "기억나는 장면이나 문장을 적어보세요.",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 51,
    recommends: 57,
    quizCompletions: 130,
    academyId: "ACAD-004",
    academyName: "판교 알파학원",
    creatorType: "ACADEMY",
    sheet: true,
    date: "2025-09-05",
    cover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150&q=80"
  },
  {
    id: "MB-016",
    title: "코스모스 (주니어 에디션)",
    author: "칼 세이건",
    publisher: "사이언스북스",
    grade: "중등 3학년",
    category: "과학",
    cat1: "외서",
    cat2: "비문학",
    series: "단권",
    isSingle: true,
    tags: ["#미래과학환경", "과학"],
    detailTag: "#우주과학 #천문학 #칼세이건",
    awards: "전 세계 1억 독자의 교양서",
    thinkExtract: "우주 어딘가에 지적 생명체가 존재한다면 그들에게 인류를 어떻게 소개하고 싶나요?",
    thinkInsert: "이 책에서 가장 기억에 남은 내용은 무엇인가요?",
    isPublic: "N",
    hasQuiz: false,
    quizzes: 0,
    likes: 12,
    recommends: 15,
    quizCompletions: 28,
    academyId: "HQ",
    academyName: "본사 직속 (공용)",
    creatorType: "HQ",
    sheet: true,
    date: "2025-09-10",
    cover: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=150&q=80"
  },
  {
    id: "MB-017",
    title: "백범일지 (청소년을 위한)",
    author: "김구",
    publisher: "돌베개",
    grade: "중등 2학년",
    category: "역사",
    cat1: "국내서",
    cat2: "위인전(전기)",
    series: "단권",
    isSingle: true,
    tags: ["#교과연계한국사", "역사", "인문"],
    detailTag: "#독립운동 #문화강국 #위인전",
    awards: "대한민국 임시정부 기념 도서",
    thinkExtract: "김구 선생이 꿈꾸었던 '아름다운 문화의 힘을 가진 나라'는 지금 어떤 모습일까요?",
    thinkInsert: "주인공이 옆에 있다면 하고 싶은 이야기를 적어주세요.",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 39,
    recommends: 44,
    quizCompletions: 92,
    academyId: "HQ",
    academyName: "본사 직속 (공용)",
    creatorType: "HQ",
    sheet: true,
    date: "2025-09-12",
    cover: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=150&q=80"
  },
  {
    id: "MB-018",
    title: "난중일기",
    author: "이순신",
    publisher: "민음사",
    grade: "초등 6학년",
    category: "역사",
    cat1: "국내서",
    cat2: "위인전(전기)",
    series: "단권",
    isSingle: true,
    tags: ["#교과연계한국사", "역사"],
    detailTag: "#이순신 #임진왜란 #일기문학",
    awards: "유네스코 세계기록유산",
    thinkExtract: "절체절명의 위기 앞에서도 꺾이지 않는 용기는 어디에서 나오는 것일까요?",
    thinkInsert: "이 책에서 얻은 교훈이 있다면?",
    isPublic: "Y",
    hasQuiz: true,
    quizzes: 5,
    likes: 48,
    recommends: 50,
    quizCompletions: 118,
    academyId: "HQ",
    academyName: "본사 직속 (공용)",
    creatorType: "HQ",
    sheet: true,
    date: "2025-09-14",
    cover: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=150&q=80"
  }
];

// Neon DB 실데이터 도서 라이브러리 연동 (300권) - 도서 번호 기준 중복 제거
if (typeof window !== "undefined" && Array.isArray(window.MIGRATED_BOOKS) && (window.NANO_SERVER_DATA || window.MIGRATED_BOOKS.length > 0)) {
  var seenMaster = {};
  masterBooks = window.MIGRATED_BOOKS.filter(function(b) {
    if (!b) return false;
    var k = String(b.id || b.bookNo || '').trim();
    if (!k || seenMaster[k]) return false;
    seenMaster[k] = true;
    return true;
  });
}

// 1-6. 알리고 카톡 발송 로그 (Aligo Dispatch History)
let aligoCash = 854200;
let dispatchLogs = [
  {
    id: "ALIGO-98421",
    datetime: "2026-09-08 17:30:12",
    academyId: "ACAD-001",
    academyName: "나노 독서아카데미 목동본원",
    type: "PORTFOLIO",
    typeName: "독서 포트폴리오 리포트",
    receiverName: "김태윤 학부모",
    receiverPhone: "010-3342-9981",
    summary: "[나노의 책장] 김태윤 학생의 8월 독서 포트폴리오 및 북퀴즈 인증 리포트가 발급되었습니다.",
    status: "SUCCESS",
    code: "0000"
  },
  {
    id: "ALIGO-98420",
    datetime: "2026-09-08 16:45:00",
    academyId: "ACAD-002",
    academyName: "대치 에듀 독서논술센터",
    type: "ASSIGN",
    typeName: "도서 배정 알림",
    receiverName: "이서현 학부모",
    receiverPhone: "010-4499-1122",
    summary: "[나노의 책장] 이번 주 필수 배정 도서 <아몬드>가 배정되었습니다. 마감일: 9월 15일",
    status: "SUCCESS",
    code: "0000"
  },
  {
    id: "ALIGO-98419",
    datetime: "2026-09-08 15:10:44",
    academyId: "ACAD-003",
    academyName: "송도 센트럴 리딩랩",
    type: "PORTFOLIO",
    typeName: "독서 포트폴리오 리포트",
    receiverName: "박지우 학부모",
    receiverPhone: "010-9988-7766",
    summary: "[나노의 책장] 박지우 학생의 8월 독서 포트폴리오 및 북퀴즈 인증 리포트가 발급되었습니다.",
    status: "SUCCESS",
    code: "0000"
  },
  {
    id: "ALIGO-98418",
    datetime: "2026-09-08 14:02:19",
    academyId: "ACAD-004",
    academyName: "판교 알파 독서학원",
    type: "ENCOURAGE",
    typeName: "독서 격려 알림톡",
    receiverName: "김민재 학생",
    receiverPhone: "010-7711-2299",
    summary: "[나노의 책장] 김민재 학생, 북퀴즈 도전까지 1권 남았어요! 오늘도 즐겁게 읽어보아요.",
    status: "FAILED",
    code: "3202 (수신자 번호 오류)"
  },
  {
    id: "ALIGO-98417",
    datetime: "2026-09-08 11:20:05",
    academyId: "ACAD-001",
    academyName: "나노 독서아카데미 목동본원",
    type: "ASSIGN",
    typeName: "도서 배정 알림",
    receiverName: "이민우 학부모",
    receiverPhone: "010-3388-1122",
    summary: "[나노의 책장] 이번 주 필수 배정 도서 <자전거 도둑>이 배정되었습니다. 마감일: 9월 14일",
    status: "SUCCESS",
    code: "0000"
  },
  {
    id: "ALIGO-98416",
    datetime: "2026-09-08 10:05:32",
    academyId: "ACAD-002",
    academyName: "대치 에듀 독서논술센터",
    type: "AUTH",
    typeName: "본인인증 번호",
    receiverName: "장민재 학생",
    receiverPhone: "010-1122-3344",
    summary: "[나노의 책장] 최초 로그인 본인 인증번호는 [ 591823 ] 입니다. 3분 내 입력해주세요.",
    status: "SUCCESS",
    code: "0000"
  }
];
if (window.NANO_SERVER_DATA) dispatchLogs = window.NANO_SERVER_DISPATCH || [];

// ==========================================
// 2. 초기화 및 네비게이션 (Init & Tabs)
// ==========================================
// 자동완성을 제한하는 속성만 설정하고 사용자가 입력한 검색어는 보존합니다.
function purgeAutofilledSearchInputs() {
  const searchInputConfigs = [
    { id: "franchiseSearchInput", fn: filterFranchiseList },
    { id: "memberSearchInput", fn: filterMemberList },
    { id: "rankStudentSearchInput", fn: filterStudentRankings },
    { id: "contentSearchInput", fn: filterMasterContentList },
    { id: "dispatchSearchInput", fn: filterDispatchList },
    { id: "masterPaymentSearchInput", fn: filterMasterPaymentList }
  ];

  searchInputConfigs.forEach(item => {
    const el = document.getElementById(item.id);
    if (!el) return;
    // 계정명도 정상적인 검색어입니다. 포커스나 탭 전환을 이유로 입력값을 지우지 않습니다.
    el.setAttribute("autocomplete", "off");
    el.removeAttribute("readonly");
  });
}

// 검색창 이벤트 레벨 자동완성 방어선 바인딩
function bindMasterSearchAutofillGuards() {
  const searchInputConfigs = [
    { id: "franchiseSearchInput", fn: filterFranchiseList },
    { id: "memberSearchInput", fn: filterMemberList },
    { id: "rankStudentSearchInput", fn: filterStudentRankings },
    { id: "contentSearchInput", fn: filterMasterContentList },
    { id: "dispatchSearchInput", fn: filterDispatchList },
    { id: "masterPaymentSearchInput", fn: filterMasterPaymentList }
  ];

  searchInputConfigs.forEach(item => {
    const el = document.getElementById(item.id);
    if (!el) return;
    
    // 기존 검색창의 readonly 속성만 해제하고 검색어는 유지합니다.
    el.addEventListener("focus", () => {
      el.removeAttribute("readonly");
    });
  });
}

// 탭 초기화(Dropdown 등 1회성 작업) 완료 여부 추적
// ※ 렌더링(데이터 갱신)은 탭 전환 시마다 항상 재실행됩니다
const initializedMasterTabs = {
  franchise: false,
  members: false,
  operations: false,
  ranking: false,
  contents: false,
  dispatch: false,
  payment: false
};

// 탭 전환 시마다 항상 최신 데이터로 렌더링 (stale 데이터 방지)
function ensureMasterTabRendered(tabName) {
  // [1회성 초기화] 드롭다운 등 DOM 세팅은 처음 1번만 실행
  if (!initializedMasterTabs[tabName]) {
    initializedMasterTabs[tabName] = true;
    if (tabName === "members") {
      if (typeof initMemberAcademyDropdown === "function") initMemberAcademyDropdown();
      if (typeof populateMemberAcademyFilter === "function") populateMemberAcademyFilter();
    } else if (tabName === "dispatch") {
      if (typeof populateDispatchAcademyFilter === "function") populateDispatchAcademyFilter();
    } else if (tabName === "payment") {
      if (typeof populateMasterPaymentAcademyFilter === "function") populateMasterPaymentAcademyFilter();
    }
  }

  // [매번 실행] 탭 전환 시마다 항상 최신 데이터를 렌더링 (모듈화 안전 방어)
  if (tabName === "franchise") {
    if (typeof updateFranchiseStats === "function") updateFranchiseStats();
    if (typeof renderFranchiseTable === "function") renderFranchiseTable();
  } else if (tabName === "members") {
    if (typeof updateMemberStats === "function") updateMemberStats();
    if (typeof renderMemberTable === "function") renderMemberTable();
  } else if (tabName === "operations") {
    if (typeof renderBannerList === "function") renderBannerList();
    if (typeof renderThemeTable === "function") renderThemeTable();
    if (typeof renderNoticeTable === "function") renderNoticeTable();
  } else if (tabName === "ranking") {
    if (typeof renderRankings === "function") renderRankings();
  } else if (tabName === "contents") {
    if (typeof populateMasterContentCategoryOptions === "function") populateMasterContentCategoryOptions();
    if (typeof renderMasterContents === "function") renderMasterContents();
  } else if (tabName === "dispatch") {
    if (typeof renderDispatchTable === "function") renderDispatchTable();
  } else if (tabName === "payment") {
    if (typeof renderMasterPaymentTable === "function") renderMasterPaymentTable();
    if (typeof updatePaymentKpis === "function") updatePaymentKpis();
  }
}

// 초기화 함수: DOM 로드 완료 여부에 관계없이 항상 가맹점 탭을 즉시 안전하게 렌더링
function initMasterDashboardOnReady() {
  // [Lazy Loading] 초기 활성 탭(가맹점 관리)만 즉시 렌더링하고 나머지는 탭 클릭 시 지연 로딩
  ensureMasterTabRendered("franchise");

  // 검색창 속성 설정: 자동완성을 제한하되 검색값은 보존합니다.
  bindMasterSearchAutofillGuards();
  purgeAutofilledSearchInputs();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMasterDashboardOnReady);
} else {
  // 모든 모듈 스크립트가 온전히 평가된 직후 안전하게 초기화 실행!
  setTimeout(initMasterDashboardOnReady, 0);
}

window.addEventListener("pageshow", () => {
  purgeAutofilledSearchInputs();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    purgeAutofilledSearchInputs();
    // 브라우저 탭이 다시 활성화되면 현재 마스터 탭 데이터를 즉시 재갱신
    const activeNavBtn = document.querySelector(".master-nav-btn.active");
    if (activeNavBtn) {
      const currentTab = activeNavBtn.id.replace("nav-master-", "");
      ensureMasterTabRendered(currentTab);
    }
  }
});

// 마스터 대메뉴 탭 전환 (지연 렌더링 지원)
function switchMasterTab(tabName) {
  const tabs = ["franchise", "members", "operations", "ranking", "contents", "dispatch", "payment"];
  
  tabs.forEach(t => {
    const navBtn = document.getElementById(`nav-master-${t}`);
    const tabSection = document.getElementById(`tab-master-${t}`);
    if (navBtn) navBtn.classList.remove("active");
    if (tabSection) tabSection.style.display = "none";
  });

  const activeBtn = document.getElementById(`nav-master-${tabName}`);
  const activeSection = document.getElementById(`tab-master-${tabName}`);
  if (activeBtn) activeBtn.classList.add("active");
  if (activeSection) activeSection.style.display = "block";

  // 대상 탭 지연 렌더링(Lazy Loading) 실행
  ensureMasterTabRendered(tabName);

  const mainEl = document.querySelector('.main-workspace');
  if (mainEl) mainEl.scrollTop = 0;
  window.scrollTo(0, 0);

  // 탭 전환 후에도 검색어를 유지하며 검색창 속성을 설정합니다.
  purgeAutofilledSearchInputs();
}

// 운영 관리 서브탭 전환
function switchOpSubTab(subName) {
  const subs = ["banners", "themes", "notices", "recommended"];
  subs.forEach(s => {
    const btn = document.getElementById(`btn-op-${s}`);
    const box = document.getElementById(`op-sub-${s}`);
    if (btn) {
      btn.className = "btn btn-beige-secondary";
    }
    if (box) box.style.display = "none";
  });

  const activeBtn = document.getElementById(`btn-op-${subName}`);
  const activeBox = document.getElementById(`op-sub-${subName}`);
  if (activeBtn) activeBtn.className = "btn btn-beige-primary";
  if (activeBox) activeBox.style.display = "block";

  if (subName === "banners") renderBannerList();
  if (subName === "themes") renderThemeTable();
  if (subName === "notices" && typeof renderNoticeTable === "function") renderNoticeTable();
  if (subName === "recommended") renderRecommendedBooksTable();
  const mainEl = document.querySelector('.main-workspace');
  if (mainEl) mainEl.scrollTop = 0;
  window.scrollTo(0, 0);
}

// ==========================================


// --- [Core Utilities from Update Pack] ---

// -----------------------------------------------------------
// [1] 사업자 등록번호 자동 하이픈 포맷 (숫자만 입력, 하이픈 자동)
// 형식: 000-00-00000
// -----------------------------------------------------------
function formatBizNumber(input) {
  let val = input.value.replace(/\D/g, ""); // 숫자만
  if (val.length > 10) val = val.substring(0, 10);
  let formatted = val;
  if (val.length > 5) {
    formatted = val.substring(0, 3) + "-" + val.substring(3, 5) + "-" + val.substring(5);
  } else if (val.length > 3) {
    formatted = val.substring(0, 3) + "-" + val.substring(3);
  }
  input.value = formatted;

  // 메모 글자수 카운터도 업데이트
  const memoEl = document.getElementById("regMemo");
  const memoCount = document.getElementById("regMemoCount");
  if (memoEl && memoCount) {
    memoEl.addEventListener("input", () => {
      memoCount.textContent = `${memoEl.value.length} / 100자`;
    });
  }
}

// -----------------------------------------------------------
// [2] 이메일 형식 검증 (@포함 필수)
// -----------------------------------------------------------
function validateEmailField(input) {
  const val = input.value.trim();
  const errEl = document.getElementById(input.id === "regDirectorEmail" ? "regEmailError" : null);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (val && !emailRegex.test(val)) {
    if (errEl) errEl.classList.remove("d-none");
    input.classList.add("is-invalid");
    if (!errEl) alert("올바른 이메일 형식(@포함)을 입력해주세요.");
  } else {
    if (errEl) errEl.classList.add("d-none");
    input.classList.remove("is-invalid");
  }
}

// -----------------------------------------------------------
// [3] 카카오 우편번호 검색 API 연동
// prefix: 'reg' (신규등록), 'edit' (수정)
// -----------------------------------------------------------
function openKakaoAddressSearch(prefix) {
  // Daum 우편번호 서비스 스크립트 동적 로드
  if (typeof daum === "undefined" || !daum.Postcode) {
    const script = document.createElement("script");
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.onload = () => _execKakaoSearch(prefix);
    document.head.appendChild(script);
  } else {
    _execKakaoSearch(prefix);
  }
}

function _execKakaoSearch(prefix) {
  new daum.Postcode({
    oncomplete: function(data) {
      const postcodeEl = document.getElementById(prefix + "Postcode");
      const addressEl = document.getElementById(prefix + "Address");
      const detailEl = document.getElementById(prefix + "AddressDetail");

      let fullAddr = data.address;
      if (data.buildingName) fullAddr += ` (${data.buildingName})`;

      if (postcodeEl) postcodeEl.value = data.zonecode;
      if (addressEl) addressEl.value = fullAddr;
      if (detailEl) {
        detailEl.value = "";
        detailEl.focus();
      }
    }
  }).open();
}

// -----------------------------------------------------------
// [4] 관리자 아이디 중복 체크 (학원 등록 시)
// -----------------------------------------------------------
function checkAdminIdDuplicate(val, statusElId) {
  const statusEl = document.getElementById(statusElId);
  if (!statusEl || !val.trim()) return;

  const isDuplicate = franchiseList.some(f => f.adminId === val.trim()) ||
    memberList.some(m => m.username === val.trim());

  if (isDuplicate) {
    statusEl.innerHTML = '<span class="text-danger"><i class="fa-solid fa-xmark mr-1"></i>이미 사용 중인 아이디입니다.</span>';
  } else {
    statusEl.innerHTML = '<span class="text-success"><i class="fa-solid fa-check mr-1"></i>사용 가능한 아이디입니다.</span>';
  }
}

// -----------------------------------------------------------
// [5] 회원 아이디 중복 체크 (회원 등록 시)
// -----------------------------------------------------------
function checkMemberIdDuplicate(val, statusElId) {
  const statusEl = document.getElementById(statusElId);
  if (!statusEl || !val.trim()) return;

  const isDuplicate = memberList.some(m => m.username === val.trim().toLowerCase());

  if (isDuplicate) {
    statusEl.innerHTML = '<span class="text-danger"><i class="fa-solid fa-xmark mr-1"></i>이미 사용 중인 아이디입니다.</span>';
  } else if (val.trim().length > 0) {
    statusEl.innerHTML = '<span class="text-success"><i class="fa-solid fa-check mr-1"></i>사용 가능한 아이디입니다.</span>';
  }
}

// -----------------------------------------------------------
// [6] 성함(원장/회원) 유효성 검사 (특수문자 및 숫자 즉시 제거 - 한글, 영문, 띄어쓰기 100% 보장)
// -----------------------------------------------------------
function validateKoreanEngName(input, errorElementId = "newMemNameError") {
  const original = input.value;
  if (!original) {
    const errEl = errorElementId ? document.getElementById(errorElementId) : null;
    if (errEl) errEl.classList.add("d-none");
    return;
  }

  // 숫자(0-9) 및 특수기호만 정확하게 타겟팅하여 제거 (한글 자모/조합 절대 방해 안 함)
  const cleaned = original.replace(/[0-9`~!@#$%^&*()_=+\[\]{};':"\\|,.<>\/?₩]/g, "");

  const errEl = errorElementId ? document.getElementById(errorElementId) : null;
  if (original !== cleaned) {
    // 특수문자나 숫자가 실제로 들어왔을 때만 치환
    input.value = cleaned;
    if (errEl) {
      errEl.classList.remove("d-none");
      clearTimeout(input._nameErrTimer);
      input._nameErrTimer = setTimeout(() => {
        errEl.classList.add("d-none");
      }, 2500);
    }
  } else {
    // 정상 한글/영문 입력 중일 때
    if (errEl && !input._nameErrTimer) {
      errEl.classList.add("d-none");
    }
  }
}

// -----------------------------------------------------------
// [7] 아이디 형식 강제 (영문 소문자, 숫자, 특수문자 허용 - 공백X)
// 단, DB 안전 특수문자만 (_, -, .)
// -----------------------------------------------------------
function formatUsernameInput(input) {
  // 공백 제거, 소문자 변환, 허용되지 않는 특수문자 제거
  input.value = input.value
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/[^a-z0-9_\-.]/g, "");
}

// -----------------------------------------------------------


// --- [Shared CSV Downloader] ---

function downloadAsCSV(filename, headers, rows) {
  const content = '\uFEFF' + [headers, ...rows].map(row => row.map(NanoPreviewData.csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// -----------------------------------------------------------


// --- [Master Logout & AI Configuration] ---

// 마스터 운영자 전용 안전 로그아웃 처리
async function handleMasterLogout() {
  if (!confirm('로그아웃 하시겠습니까?')) return;
  try {
    if (window.NanoPortal && typeof NanoPortal.logout === 'function') {
      await NanoPortal.logout();
      return;
    }
  } catch(e) {}
  sessionStorage.removeItem('nano_auth_user');
  location.href = 'index.html';
}

// ========================================================
// [신규] Google Gemini AI 엔진 설정 모달 및 제어 로직
// ========================================================
function toggleGeminiKeyVisibility() {
  var input = document.getElementById('masterGeminiApiKey');
  var icon = document.getElementById('geminiEyeIcon');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
  } else {
    input.type = 'password';
    if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
  }
}

async function openMasterAiSettingsModal() {
  var keyInput = document.getElementById('masterGeminiApiKey');
  var modelSelect = document.getElementById('masterGeminiModel');
  var statusElem = document.getElementById('masterGeminiKeyStatus');

  if (keyInput) {
    keyInput.value = '';
    keyInput.placeholder = 'AIzaSy... 형식의 API 키를 입력하세요';
  }
  if (statusElem) {
    statusElem.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>현재 상태를 확인 중입니다...';
    statusElem.className = 'form-text text-muted';
  }

  $('#masterAiSettingsModal').modal('show');

  try {
    var res = await fetch('/api/manage?entity=ai_config');
    if (res.ok) {
      var data = await res.json();
      if (modelSelect && data.model) {
        modelSelect.value = data.model;
      }
      if (statusElem) {
        if (data.hasKey) {
          statusElem.innerHTML = '<i class="fa-solid fa-circle-check mr-1 text-success"></i><strong>API 키 등록 완료:</strong> ' + (data.maskedKey || '등록됨') + ' (정상 연동 중)';
          statusElem.className = 'form-text text-success font-weight-bold';
          if (keyInput) keyInput.placeholder = '새 API 키로 변경 시에만 입력하세요 (현재 키 유지됨)';
        } else {
          statusElem.innerHTML = '<i class="fa-solid fa-circle-exclamation mr-1 text-warning"></i><strong>API 키 미등록:</strong> 현재 교육원 내장 AI 룰베이스 엔진으로 작동 중입니다.';
          statusElem.className = 'form-text text-warning font-weight-bold';
        }
      }
    }
  } catch(e) {
    if (statusElem) {
      statusElem.innerHTML = '<i class="fa-solid fa-circle-info mr-1"></i>로컬 미리보기 모드 (API 키 설정 가능)';
    }
  }
}

async function saveMasterAiSettings() {
  var keyInput = document.getElementById('masterGeminiApiKey');
  var modelSelect = document.getElementById('masterGeminiModel');
  var apiKey = keyInput ? keyInput.value.trim() : '';
  var model = modelSelect ? modelSelect.value : 'gemini-2.0-flash';

  try {
    var res = await fetch('/api/manage?entity=ai_config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'save',
        data: { apiKey: apiKey, model: model }
      })
    });
    if (!res.ok) {
      var errData = await res.json().catch(function(){ return {}; });
      throw new Error(errData.error || '저장 실패');
    }
    var result = await res.json();
    if (apiKey) localStorage.setItem('NANO_GEMINI_API_KEY', apiKey);
    localStorage.setItem('NANO_GEMINI_MODEL', model);
    showMasterToast('Google Gemini AI 설정이 성공적으로 저장되었습니다!');
    $('#masterAiSettingsModal').modal('hide');
  } catch(err) {
    try {
      localStorage.setItem('NANO_GEMINI_API_KEY', apiKey);
      localStorage.setItem('NANO_GEMINI_MODEL', model);
      showMasterToast('Google Gemini AI 설정이 로컬에 저장되었습니다.');
      $('#masterAiSettingsModal').modal('hide');
    } catch(e) {
      alert('설정 저장 중 오류가 발생했습니다: ' + err.message);
    }
  }
}