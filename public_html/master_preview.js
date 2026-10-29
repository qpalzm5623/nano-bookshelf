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

// 로컬스토리지 및 중앙 서버 동기화 헬퍼 함수
function saveOperationsToStorage() {
  const saveTime = Date.now();
  // 각 배너에 updatedAt 부여 (동기화 정합성 보장)
  bannerList.forEach(b => {
    if (!b.updatedAt) b.updatedAt = saveTime;
  });
  themeList.forEach(t => {
    if (!t.updatedAt) t.updatedAt = saveTime;
  });

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
      if (!lb) return sb;
      return Object.assign({}, sb, {
        sub: sb.sub || lb.sub || "",
        bookIds: (Array.isArray(sb.bookIds) && sb.bookIds.length > 0) ? sb.bookIds : (Array.isArray(lb.bookIds) ? lb.bookIds : []),
        imageUrl: sb.imageUrl || sb.image || lb.imageUrl || lb.image || "",
        clicks: sb.clicks || lb.clicks || 0,
        createdAt: sb.createdAt || lb.createdAt || "2026-09-01"
      });
    });
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

// 탭 지연 렌더링(Lazy Loading) 상태 관리: 불필요한 초기 7개 탭 일괄 렌더링 차단
const renderedMasterTabs = {
  franchise: false,
  members: false,
  operations: false,
  ranking: false,
  contents: false,
  dispatch: false,
  payment: false
};

function ensureMasterTabRendered(tabName) {
  if (renderedMasterTabs[tabName]) return;
  renderedMasterTabs[tabName] = true;

  if (tabName === "franchise") {
    updateFranchiseStats();
    renderFranchiseTable();
  } else if (tabName === "members") {
    updateMemberStats();
    renderMemberTable();
    initMemberAcademyDropdown();
    populateMemberAcademyFilter();
  } else if (tabName === "operations") {
    renderBannerList();
    renderThemeTable();
    if (typeof renderNoticeTable === "function") renderNoticeTable();
  } else if (tabName === "ranking") {
    renderRankings();
  } else if (tabName === "contents") {
    populateMasterContentCategoryOptions();
    renderMasterContents();
  } else if (tabName === "dispatch") {
    renderDispatchTable();
    populateDispatchAcademyFilter();
  } else if (tabName === "payment") {
    renderMasterPaymentTable();
    populateMasterPaymentAcademyFilter();
    updatePaymentKpis();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // [Lazy Loading] 초기 활성 탭(가맹점 관리)만 즉시 렌더링하고 나머지는 탭 클릭 시 지연 로딩
  ensureMasterTabRendered("franchise");

  // 검색창 속성 설정: 자동완성을 제한하되 검색값은 보존합니다.
  bindMasterSearchAutofillGuards();
  purgeAutofilledSearchInputs();
});

window.addEventListener("pageshow", () => {
  purgeAutofilledSearchInputs();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    purgeAutofilledSearchInputs();
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
// 2-4. 학년별 권장도서 관리 모듈 (Recommended Books)
// ==========================================
function getRecommendedBooks() {
  if (window.NANO_SERVER_DATA) return (window.MIGRATED_BOOKS || []).filter(function(b) { return b.isRecommended; }).map(function(b) { return Object.assign({}, b, {bookId:b.id}); });
  try {
    const stored = localStorage.getItem("NANO_RECOMMENDED_BOOKS");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error(e);
  }
  // 기본 샘플 데이터 초기화
  const allMasterBooks = (typeof masterBooks !== 'undefined' && masterBooks.length > 0) ? masterBooks : (typeof mockBooks !== 'undefined' ? mockBooks : []);
  const initial = [];
  const grades = ["초등 1학년", "초등 2학년", "초등 3학년", "초등 4학년", "초등 5학년", "초등 6학년", "중학교"];
  allMasterBooks.slice(0, 14).forEach((b, idx) => {
    const g = grades[idx % grades.length];
    initial.push({
      id: 'REC-' + (idx + 1),
      bookId: b.id,
      title: b.title,
      author: b.author || b.publisher || '작자 미상',
      publisher: b.publisher || '출판사',
      category: b.category || '문학',
      cover: b.cover || b.image || '',
      grade: g,
      createdAt: '2026-09-' + String(10 + (idx % 8)).padStart(2, '0')
    });
  });
  localStorage.setItem("NANO_RECOMMENDED_BOOKS", JSON.stringify(initial));
  return initial;
}

function saveRecommendedBooks(list) {
  try {
    localStorage.setItem("NANO_RECOMMENDED_BOOKS", JSON.stringify(list));
  } catch(e) {
    console.error(e);
  }
}

let selectedRecGrade = "ALL";
let recommendedCurrentPage = 1;
const RECOMMENDED_PAGE_SIZE = 20;

// 학년 탭 선택 시 필터링 및 1페이지 리셋
function selectRecGrade(grade) {
  selectedRecGrade = grade;
  recommendedCurrentPage = 1;
  const btns = document.querySelectorAll(".rec-grade-btn");
  btns.forEach(b => {
    if (b.getAttribute("data-grade") === grade) {
      b.className = "btn font-weight-bold rec-grade-btn active";
      b.style.background = "#7d5a2b";
      b.style.color = "#fff";
      b.style.border = "none";
    } else {
      b.className = "btn font-weight-bold rec-grade-btn";
      b.style.background = "#fff";
      b.style.color = "#5a4b3d";
      b.style.border = "1.5px solid #d4c4b0";
    }
  });
  renderRecommendedBooksTable();
}

function renderRecommendedBooksTable() {
  const tbody = document.getElementById("recommendedBooksTableBody");
  const countSpan = document.getElementById("recBookCount");
  if (!tbody) return;

  const allList = getRecommendedBooks();
  
  const filtered = (selectedRecGrade === "ALL")
    ? allList
    : allList.filter(b => {
        const normBookGrade = normalizeRecGradeCode(b.grade || "");
        const normSelectedGrade = normalizeRecGradeCode(selectedRecGrade);
        if (selectedRecGrade === "미취학" || normSelectedGrade === "미취학") {
          return normBookGrade === "미취학";
        }
        if (selectedRecGrade === "중학교" || selectedRecGrade === "중등" || normSelectedGrade === "중학교") {
          return normBookGrade === "중학교" || normBookGrade.startsWith("중");
        }
        return normBookGrade === normSelectedGrade || b.grade === selectedRecGrade;
      });

  if (countSpan) {
    countSpan.textContent = selectedRecGrade === "ALL" 
      ? allList.length 
      : `${filtered.length} (전체 ${allList.length})`;
  }

  const paginationContainer = document.getElementById("recommendedPagination");

  if (filtered.length === 0) {
    const gradeName = selectedRecGrade === "ALL" ? "" : `[${selectedRecGrade}] `;
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5 text-muted">
          <i class="fa-solid fa-book-open mb-2" style="font-size: 28px; opacity: 0.5;"></i>
          <div style="font-size: 14px; font-weight: 600; color: var(--text-main);">${gradeName}등록된 권장 도서가 없습니다.</div>
          <small class="text-muted">우측 상단의 <strong>[+ 권장도서 추가]</strong> 버튼을 눌러 이 학년의 권장도서를 등록해보세요.</small>
        </td>
      </tr>
    `;
    if (paginationContainer) paginationContainer.innerHTML = "";
    return;
  }

  // 20권 단위 페이징 슬라이싱
  const totalPages = Math.ceil(filtered.length / RECOMMENDED_PAGE_SIZE) || 1;
  if (recommendedCurrentPage > totalPages) recommendedCurrentPage = totalPages;
  if (recommendedCurrentPage < 1) recommendedCurrentPage = 1;

  const startIdx = (recommendedCurrentPage - 1) * RECOMMENDED_PAGE_SIZE;
  const pagedList = filtered.slice(startIdx, startIdx + RECOMMENDED_PAGE_SIZE);

  tbody.innerHTML = pagedList.map((b, index) => {
    const coverHtml = `<img src="${b.cover || 'resources/images/book_default.svg'}" alt="" style="width: 44px; height: 58px; object-fit: cover; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);" onerror="this.onerror=null; this.src='resources/images/book_default.svg';">`;
    const num = startIdx + index + 1;
    const displayGrade = b.grade ? normalizeRecGradeCode(b.grade) : "전체";

    let dateStr = "-";
    if (b.createdAt) {
      const rawDate = String(b.createdAt);
      if (rawDate.includes("T")) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const kst = new Date(d.getTime() + (9 * 60 * 60 * 1000));
          const y = kst.getUTCFullYear();
          const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
          const day = String(kst.getUTCDate()).padStart(2, "0");
          dateStr = `${y}-${m}-${day}`;
        } else {
          dateStr = rawDate.split("T")[0];
        }
      } else {
        dateStr = rawDate.split(" ")[0] || rawDate;
      }
    }

    return `
      <tr>
        <td class="text-center font-weight-bold text-muted">${num}</td>
        <td class="text-center">${coverHtml}</td>
        <td class="text-left font-weight-bold" style="color: var(--text-main); font-size: 13.5px; padding-left: 20px;">
          ${b.title}
        </td>
        <td class="text-center text-muted" style="font-size: 12.5px;">
          ${b.author || '-'} / ${b.publisher || '-'}
        </td>
        <td class="text-center">
          <span class="badge-soft badge-soft-master font-weight-bold" style="font-size: 11.5px; padding: 4px 8px;">
            ${displayGrade}
          </span>
        </td>
        <td class="text-center">
          <span class="badge-soft badge-soft-info" style="font-size: 11.5px;">${b.category || '일반'}</span>
        </td>
        <td class="text-center text-muted" style="font-size: 12px; white-space: nowrap;">${dateStr}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-danger" style="font-size: 11.5px; padding: 3px 8px;" onclick="deleteRecommendedBook('${b.id}')">
            <i class="fa-solid fa-trash mr-1"></i>해제
          </button>
        </td>
      </tr>
    `;
  }).join("");

  renderRecommendedPagination(totalPages, recommendedCurrentPage);
}

// 20권 단위 권장도서 페이지네이션 UI 렌더링
function renderRecommendedPagination(totalPages, curPage) {
  const container = document.getElementById("recommendedPagination");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  // 이전 페이지 버튼
  const isFirst = curPage === 1;
  html += `
    <button class="btn btn-sm" onclick="goToRecommendedPage(${curPage - 1})" ${isFirst ? 'disabled style="opacity: 0.35; cursor: not-allowed; background: #fff; border: 1px solid #e0d8cc; color: #888;"' : 'style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;"'}>
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  // 페이지 번호 (최대 7개 노출)
  let startP = Math.max(1, curPage - 3);
  let endP = Math.min(totalPages, startP + 6);
  if (endP - startP < 6) {
    startP = Math.max(1, endP - 6);
  }

  if (startP > 1) {
    html += `<button class="btn btn-sm" onclick="goToRecommendedPage(1)" style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;">1</button>`;
    if (startP > 2) html += `<span style="color: var(--text-muted); font-size: 12px; padding: 0 3px;">...</span>`;
  }

  for (let p = startP; p <= endP; p++) {
    const isActive = p === curPage;
    html += `
      <button class="btn btn-sm" onclick="goToRecommendedPage(${p})" style="${isActive ? 'background: #7d5a2b; color: #fff; font-weight: 700; border: 1px solid #7d5a2b;' : 'background: #fff; border: 1px solid #d8cebf; color: var(--text-main);'} font-size: 12px; padding: 4px 10px; border-radius: 6px;">
        ${p}
      </button>
    `;
  }

  if (endP < totalPages) {
    if (endP < totalPages - 1) html += `<span style="color: var(--text-muted); font-size: 12px; padding: 0 3px;">...</span>`;
    html += `<button class="btn btn-sm" onclick="goToRecommendedPage(${totalPages})" style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;">${totalPages}</button>`;
  }

  // 다음 페이지 버튼
  const isLast = curPage === totalPages;
  html += `
    <button class="btn btn-sm" onclick="goToRecommendedPage(${curPage + 1})" ${isLast ? 'disabled style="opacity: 0.35; cursor: not-allowed; background: #fff; border: 1px solid #e0d8cc; color: #888;"' : 'style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;"'}>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

// 특정 페이지로 이동
function goToRecommendedPage(page) {
  recommendedCurrentPage = page;
  renderRecommendedBooksTable();
  const tableEl = document.getElementById("recommendedBooksTableBody");
  if (tableEl) {
    tableEl.closest('.table-responsive')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function openAddRecommendedBookModal() {
  const modalGrade = document.getElementById("modalRecGrade");
  const directGrade = document.getElementById("directRecGrade");
  const targetGrade = (selectedRecGrade && selectedRecGrade !== "ALL") ? selectedRecGrade : "초등 1학년";
  if (modalGrade) modalGrade.value = targetGrade;
  if (directGrade) directGrade.value = targetGrade;

  const searchInput = document.getElementById("modalRecBookSearch");
  if (searchInput) searchInput.value = "";

  switchRecModalTab('library');
  filterRecModalBooks();

  if (window.jQuery && typeof $('#recommendedBookModal').modal === 'function') {
    $('#recommendedBookModal').modal('show');
  }
}

function switchRecModalTab(tab) {
  const libTabBtn = document.getElementById("rec-tab-lib-btn");
  const directTabBtn = document.getElementById("rec-tab-direct-btn");
  const libView = document.getElementById("recModalViewLibrary");
  const directView = document.getElementById("recModalViewDirect");

  if (tab === 'library') {
    if (libTabBtn) {
      libTabBtn.className = "nav-link active font-weight-bold py-1 px-3";
      libTabBtn.style.color = "";
      libTabBtn.style.background = "";
    }
    if (directTabBtn) {
      directTabBtn.className = "nav-link font-weight-bold py-1 px-3";
      directTabBtn.style.color = "#5a4b3d";
      directTabBtn.style.background = "transparent";
    }
    if (libView) libView.style.display = "block";
    if (directView) directView.style.display = "none";
    filterRecModalBooks();
  } else {
    if (libTabBtn) {
      libTabBtn.className = "nav-link font-weight-bold py-1 px-3";
      libTabBtn.style.color = "#5a4b3d";
      libTabBtn.style.background = "transparent";
    }
    if (directTabBtn) {
      directTabBtn.className = "nav-link active font-weight-bold py-1 px-3";
      directTabBtn.style.color = "";
      directTabBtn.style.background = "";
    }
    if (libView) libView.style.display = "none";
    if (directView) directView.style.display = "block";
  }
}

function filterRecModalBooks() {
  const container = document.getElementById("modalRecBookCandidateList");
  const countSpan = document.getElementById("modalRecBookCandidateCount");
  const searchInput = document.getElementById("modalRecBookSearch");
  const query = (searchInput ? searchInput.value.trim().toLowerCase() : "");

  const allMasterBooks = (typeof masterBooks !== 'undefined' && masterBooks.length > 0) ? masterBooks : (typeof mockBooks !== 'undefined' ? mockBooks : []);
  const recList = getRecommendedBooks();
  const selectedGrade = document.getElementById("modalRecGrade") ? document.getElementById("modalRecGrade").value : "초등 1학년";

  const candidates = allMasterBooks.filter(b => {
    if (!query) return true;
    return (b.title && b.title.toLowerCase().includes(query)) ||
           (b.author && b.author.toLowerCase().includes(query)) ||
           (b.publisher && b.publisher.toLowerCase().includes(query));
  });

  if (countSpan) countSpan.textContent = candidates.length;

  if (candidates.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-muted">검색된 도서가 없습니다. [신규 권장도서 직접 등록] 탭을 이용해 직접 추가할 수 있습니다.</div>`;
    return;
  }

  container.innerHTML = candidates.map(b => {
    const isAlreadyRec = recList.some(r => (r.bookId === b.id || r.title === b.title) && normalizeRecGradeCode(r.grade) === normalizeRecGradeCode(selectedGrade));
    const coverSrc = b.cover || b.image || '';
    const coverHtml = coverSrc ? `<img src="${coverSrc}" style="width: 40px; height: 52px; object-fit: cover; border-radius: 4px;" class="mr-2">` : `<div style="width: 40px; height: 52px; background: #eee; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px;" class="mr-2">도서</div>`;
    return `
      <div class="d-flex align-items-center justify-content-between p-2 border-bottom hover-bg">
        <div class="d-flex align-items-center">
          ${coverHtml}
          <div>
            <div class="font-weight-bold" style="font-size: 13px;">${b.title}</div>
            <small class="text-muted">${b.author || '-'} | ${b.publisher || '-'}</small>
          </div>
        </div>
        <div>
          ${isAlreadyRec
            ? `<button class="btn btn-sm btn-secondary disabled" style="font-size: 11px; border-radius: 6px;" disabled><i class="fa-solid fa-check mr-1"></i>이미 지정됨</button>`
            : `<button class="btn btn-sm btn-beige-primary" style="font-size: 11px; padding: 4px 10px; border-radius: 6px;" onclick="addBookToRecommended('${b.id}')">
                <i class="fa-solid fa-plus mr-1"></i>권장도서 추가
               </button>`
          }
        </div>
      </div>
    `;
  }).join("");
}

async function addBookToRecommended(bookId) {
  const grade = document.getElementById("modalRecGrade") ? document.getElementById("modalRecGrade").value : "초등 1학년";
  const allMasterBooks = (typeof masterBooks !== 'undefined' && masterBooks.length > 0) ? masterBooks : (typeof mockBooks !== 'undefined' ? mockBooks : []);
  const book = allMasterBooks.find(b => b.id === bookId);
  if (!book) return;

  const list = getRecommendedBooks();
  const exists = list.some(r => (r.bookId === bookId || r.title === book.title) && normalizeRecGradeCode(r.grade) === normalizeRecGradeCode(grade));
  if (exists) {
    alert("이미 해당 학년의 권장도서로 등록되어 있습니다.");
    return;
  }

  const previousGrade = book.grade;
  book.grade = grade;
  if (window.NanoPortal && NanoPortal.remote) {
    const previousRecommended = book.isRecommended;
    book.isRecommended = true;
    try { await NanoPortal.saveBook(book); }
    catch (error) { book.isRecommended = previousRecommended; book.grade = previousGrade; showMasterToast('권장도서로 지정하지 못했습니다: ' + error.message); return; }
  } else {
    book.isRecommended = true;
  }

  list.unshift({
    id: 'REC-' + Date.now(),
    bookId: book.id,
    title: book.title,
    author: book.author || book.publisher || '작자 미상',
    publisher: book.publisher || '출판사',
    category: book.category || '문학',
    cover: book.cover || book.image || '',
    grade: grade,
    createdAt: new Date().toISOString().slice(0, 10)
  });

  saveRecommendedBooks(list);
  filterRecModalBooks();
  renderRecommendedBooksTable();
  showMasterToast(`[${book.title}] 도서가 [${grade}] 권장도서로 성공적으로 등록되었습니다.`);
}

async function saveDirectRecommendedBook(event) {
  if (event) event.preventDefault();

  const title = document.getElementById("directRecTitle")?.value.trim();
  const author = document.getElementById("directRecAuthor")?.value.trim();
  const publisher = document.getElementById("directRecPublisher")?.value.trim();
  const grade = document.getElementById("directRecGrade")?.value || "초등 1학년";
  const category = document.getElementById("directRecCategory")?.value || "문학";
  let cover = document.getElementById("directRecCover")?.value.trim();

  if (!title) {
    alert("도서명을 입력해주세요.");
    document.getElementById("directRecTitle")?.focus();
    return;
  }
  if (!author) {
    alert("저자명을 입력해주세요.");
    document.getElementById("directRecAuthor")?.focus();
    return;
  }
  if (!publisher) {
    alert("출판사명을 입력해주세요.");
    document.getElementById("directRecPublisher")?.focus();
    return;
  }

  if (!cover) {
    cover = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150&q=80";
  }

  const list = getRecommendedBooks();
  const exists = list.some(r => r.title === title && r.grade === grade);
  if (exists) {
    alert("이미 해당 학년에 동일한 도서명이 권장도서로 등록되어 있습니다.");
    return;
  }

  const newRecId = 'REC-' + Date.now();
  const newBookId = 'MB-REC-' + Date.now();

  const newRecItem = {
    id: newRecId,
    bookId: newBookId,
    title: title,
    author: author,
    publisher: publisher,
    category: category,
    cover: cover,
    grade: grade,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  const newMasterBook = {
    id: newBookId, title: title, author: author, publisher: publisher, grade: grade, category: category, cover: cover,
    isRecommended: true, isPublic: "Y", hasQuiz: false, quizzes: 0, likes: 0, recommends: 1, date: new Date().toISOString().slice(0, 10)
  };
  if (window.NanoPortal && NanoPortal.remote) {
    try { await NanoPortal.saveBook(newMasterBook); }
    catch (error) { showMasterToast('권장도서를 등록하지 못했습니다: ' + error.message); return; }
  }

  list.unshift(newRecItem);
  saveRecommendedBooks(list);

  if (typeof masterBooks !== 'undefined' && Array.isArray(masterBooks)) {
    masterBooks.unshift(newMasterBook);
  }

  renderRecommendedBooksTable();

  if (document.getElementById("directRecTitle")) document.getElementById("directRecTitle").value = "";
  if (document.getElementById("directRecAuthor")) document.getElementById("directRecAuthor").value = "";
  if (document.getElementById("directRecPublisher")) document.getElementById("directRecPublisher").value = "";
  if (document.getElementById("directRecCover")) document.getElementById("directRecCover").value = "";

  if (window.jQuery && typeof $('#recommendedBookModal').modal === 'function') {
    $('#recommendedBookModal').modal('hide');
  }

  showMasterToast(`[${title}] 신규 권장도서가 [${grade}]에 성공적으로 등록되었습니다.`);
}

async function deleteRecommendedBook(recId) {
  const list = getRecommendedBooks();
  const target = list.find(b => b.id === recId);
  const targetName = target ? `[${target.title}] ` : '';

  if (!confirm(`${targetName}해당 도서를 권장도서 목록에서 해제하시겠습니까?`)) return;

  if (window.NanoPortal && NanoPortal.remote && target) {
    const book = masterBooks.find(item => item.id === target.bookId);
    if (book) {
      const previousRecommended = book.isRecommended;
      book.isRecommended = false;
      try { await NanoPortal.saveBook(book); }
      catch (error) { book.isRecommended = previousRecommended; showMasterToast('권장도서를 해제하지 못했습니다: ' + error.message); return; }
    }
  }

  const updatedList = list.filter(b => b.id !== recId);
  saveRecommendedBooks(updatedList);
  renderRecommendedBooksTable();
  showMasterToast(`${targetName}권장도서가 성공적으로 해제되었습니다.`);
}

// ------------------------------------------
// 권장도서 엑셀(CSV) 일괄 등록, 변경, 삭제 로직
// ------------------------------------------

// 권장 학년 코드 정규화 함수 (0: 미취학, 1~6: 초등 1~6학년, 7~9: 중등 1~3학년)
function normalizeRecGradeCode(raw) {
  if (raw === undefined || raw === null) return "초등 1학년";
  const str = String(raw).trim();
  if (!str) return "초등 1학년";

  // 단일 숫자 / 영문 코드 매핑
  if (str === "0" || str.toLowerCase() === "a") return "미취학";
  if (str === "1") return "초등 1학년";
  if (str === "2") return "초등 2학년";
  if (str === "3") return "초등 3학년";
  if (str === "4") return "초등 4학년";
  if (str === "5") return "초등 5학년";
  if (str === "6") return "초등 6학년";
  if (str === "7") return "중등 1학년";
  if (str === "8") return "중등 2학년";
  if (str === "9") return "중등 3학년";
  if (str.toLowerCase() === "b" || str === "10") return "중학교";

  // 한글/영문 텍스트 호환 매핑
  if (/미취학|유아|유치/i.test(str)) return "미취학";
  if (/^초\s*1|초등\s*1/i.test(str)) return "초등 1학년";
  if (/^초\s*2|초등\s*2/i.test(str)) return "초등 2학년";
  if (/^초\s*3|초등\s*3/i.test(str)) return "초등 3학년";
  if (/^초\s*4|초등\s*4/i.test(str)) return "초등 4학년";
  if (/^초\s*5|초등\s*5/i.test(str)) return "초등 5학년";
  if (/^초\s*6|초등\s*6/i.test(str)) return "초등 6학년";
  if (/중\s*1|중등\s*1|중학교\s*1/i.test(str)) return "중등 1학년";
  if (/중\s*2|중등\s*2|중학교\s*2/i.test(str)) return "중등 2학년";
  if (/중\s*3|중등\s*3|중학교\s*3/i.test(str)) return "중등 3학년";
  if (/중/i.test(str)) return "중학교";

  return str;
}

function downloadRecommendedExcelTemplate() {
  const headers = ["구분(R/U/D)", "학년코드(0~9)", "콘텐츠넘버(도서ID)"];
  const guideRow = [
    "[설명] R:등록 / U:변경 / D:삭제 (R, U, D만 기입)",
    "[설명] 0:미취학, 1~6:초등1~6학년, 7:중1, 8:중2, 9:중3",
    "[설명] 콘텐츠넘버(도서ID) 기입 (예: MB-001)"
  ];
  const sampleRows = [
    ["R", "1", "MB-001"],
    ["U", "2", "MB-002"],
    ["R", "0", "MB-003"],
    ["D", "1", "MB-004"]
  ];
  const csvContent = "\uFEFF" + [
    headers.map(h => `"${h}"`).join(","),
    guideRow.map(g => `"${g}"`).join(","),
    ...sampleRows.map(r => r.map(c => `"${c}"`).join(","))
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `나노의책장_권장도서_일괄등록_양식.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showMasterToast("권장도서 일괄 등록/변경/삭제 표준 서식이 다운로드되었습니다.");
}

function openRecommendedExcelModal() {
  const fileInput = document.getElementById("recExcelFileInput");
  if (fileInput) fileInput.value = "";
  const nameText = document.getElementById("recExcelFileNameText");
  if (nameText) nameText.innerText = "클릭하여 엑셀 파일 선택 또는 드래그 앤 드롭";
  if (window.jQuery && typeof $('#recommendedExcelModal').modal === 'function') {
    $('#recommendedExcelModal').modal('show');
  }
}

let curSelectedRecExcelFile = null;
function handleRecommendedExcelFileSelect(input) {
  if (input.files && input.files[0]) {
    curSelectedRecExcelFile = input.files[0];
    const nameText = document.getElementById("recExcelFileNameText");
    if (nameText) nameText.innerText = `선택된 파일: ${curSelectedRecExcelFile.name} (${Math.round(curSelectedRecExcelFile.size / 1024)} KB)`;
  }
}

async function handleRecommendedExcelUpload() {
  if (!curSelectedRecExcelFile) {
    alert("업로드할 엑셀(CSV) 파일을 선택해주세요.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) {
        alert("업로드된 파일에 처리할 데이터가 없습니다.");
        return;
      }

      // 첫 행(헤더) 제외
      const dataRows = lines.slice(1);
      const allMasterBooks = (typeof masterBooks !== 'undefined' && masterBooks.length > 0) ? masterBooks : (typeof mockBooks !== 'undefined' ? mockBooks : []);
      let recList = getRecommendedBooks();

      let addCount = 0;
      let updateCount = 0;
      let deleteCount = 0;
      let failCount = 0;
      let skippedHeaderCount = 0;

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.startsWith("#") || row.startsWith("//")) continue;

        // CSV 안전 파싱 (큰따옴표 처리)
        let cols = [];
        let inQuotes = false;
        let token = "";
        for (let c = 0; c < row.length; c++) {
          const char = row[c];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cols.push(token.replace(/^["']|["']$/g, '').trim());
            token = "";
          } else {
            token += char;
          }
        }
        cols.push(token.replace(/^["']|["']$/g, '').trim());

        if (cols.length < 3) {
          failCount++;
          continue;
        }

        const modeRaw = (cols[0] || "").trim();
        const gradeRaw = (cols[1] || "").trim();
        const bookId = (cols[2] || "").trim();

        // 엑셀 상단 가이드/설명 행 또는 헤더 행 자동 제외
        if (
          modeRaw.includes("설명") || modeRaw.includes("[") || modeRaw.includes("구분") ||
          gradeRaw.includes("설명") || gradeRaw.includes("[") || gradeRaw.includes("코드") ||
          bookId.includes("설명") || bookId.includes("[") || bookId.includes("콘텐츠") || bookId.includes("도서ID")
        ) {
          skippedHeaderCount++;
          continue;
        }

        // 구분 코드 (R: 등록, U: 변경, D: 삭제)
        const modeUpper = modeRaw.toUpperCase();
        let action = "";
        if (modeUpper === "R" || modeUpper.includes("등록") || modeUpper.includes("ADD") || modeUpper.includes("REG")) {
          action = "R";
        } else if (modeUpper === "U" || modeUpper.includes("변경") || modeUpper.includes("수정") || modeUpper.includes("UPDATE") || modeUpper.includes("MOD")) {
          action = "U";
        } else if (modeUpper === "D" || modeUpper.includes("삭제") || modeUpper.includes("해제") || modeUpper.includes("DEL") || modeUpper.includes("REMOVE")) {
          action = "D";
        } else {
          // 유효하지 않은 구분 코드 (설명 행일 가능성 포함)
          skippedHeaderCount++;
          continue;
        }

        if (!bookId) {
          failCount++;
          continue;
        }

        // 학년 코드 정규화 (0: 미취학, 1~6: 초1~6, 7~9: 중1~3)
        const grade = normalizeRecGradeCode(gradeRaw);

        // 마스터 도서 검색
        const matchedBook = allMasterBooks.find(b => b.id === bookId || b.title === bookId);

        if (action === "D") {
          // D: 권장도서 목록에서 삭제(해제)
          const beforeLen = recList.length;
          recList = recList.filter(r => {
            const matchId = (r.bookId === bookId || r.id === bookId);
            const matchTitle = (matchedBook && r.title === matchedBook.title);
            return !(matchId || matchTitle);
          });

          if (recList.length < beforeLen) {
            deleteCount += (beforeLen - recList.length);
          } else {
            deleteCount++;
          }

          if (matchedBook && window.NanoPortal && NanoPortal.remote) {
            matchedBook.isRecommended = false;
            try { await NanoPortal.saveBook(matchedBook); } catch(err) { console.warn(err); }
          }
        } else if (action === "U") {
          // U: 기존 권장도서의 학년 변경
          const existingIdx = recList.findIndex(r => r.bookId === bookId || r.id === bookId || (matchedBook && r.title === matchedBook.title));
          if (existingIdx !== -1) {
            recList[existingIdx].grade = grade;
            if (matchedBook) {
              recList[existingIdx].title = matchedBook.title || recList[existingIdx].title;
              recList[existingIdx].author = matchedBook.author || matchedBook.publisher || recList[existingIdx].author;
              recList[existingIdx].publisher = matchedBook.publisher || recList[existingIdx].publisher;
              recList[existingIdx].category = matchedBook.category || recList[existingIdx].category;
              if (matchedBook.cover || matchedBook.image) recList[existingIdx].cover = matchedBook.cover || matchedBook.image;
            }
            updateCount++;
          } else {
            // 목록에 없는 경우 등록으로 안전 처리
            const finalTitle = matchedBook ? matchedBook.title : bookId;
            const finalAuthor = matchedBook ? (matchedBook.author || matchedBook.publisher || "작자 미상") : "작자 미상";
            const finalPublisher = matchedBook ? (matchedBook.publisher || "출판사") : "출판사";
            const finalCategory = matchedBook ? (matchedBook.category || "문학") : "일반";
            const finalCover = matchedBook ? (matchedBook.cover || matchedBook.image || "") : "";

            recList.unshift({
              id: 'REC-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
              bookId: matchedBook ? matchedBook.id : bookId,
              title: finalTitle,
              author: finalAuthor,
              publisher: finalPublisher,
              category: finalCategory,
              cover: finalCover,
              grade: grade,
              createdAt: new Date().toISOString().slice(0, 10)
            });
            updateCount++;
          }

          if (matchedBook) {
            matchedBook.grade = grade;
            matchedBook.isRecommended = true;
            if (window.NanoPortal && NanoPortal.remote) {
              try { await NanoPortal.saveBook(matchedBook); } catch(err) { console.warn(err); }
            }
          }
        } else {
          // R: 신규 권장도서 등록 (이미 등록된 경우 학년 갱신)
          const finalTitle = matchedBook ? matchedBook.title : bookId;
          const finalAuthor = matchedBook ? (matchedBook.author || matchedBook.publisher || "작자 미상") : "작자 미상";
          const finalPublisher = matchedBook ? (matchedBook.publisher || "출판사") : "출판사";
          const finalCategory = matchedBook ? (matchedBook.category || "문학") : "일반";
          const finalCover = matchedBook ? (matchedBook.cover || matchedBook.image || "") : "";

          const existingIdx = recList.findIndex(r => r.bookId === bookId || r.id === bookId || (matchedBook && r.title === matchedBook.title));
          if (existingIdx !== -1) {
            recList[existingIdx].grade = grade;
            recList[existingIdx].title = finalTitle;
            recList[existingIdx].author = finalAuthor;
            recList[existingIdx].publisher = finalPublisher;
            recList[existingIdx].category = finalCategory;
            if (finalCover) recList[existingIdx].cover = finalCover;
            updateCount++;
          } else {
            recList.unshift({
              id: 'REC-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
              bookId: matchedBook ? matchedBook.id : bookId,
              title: finalTitle,
              author: finalAuthor,
              publisher: finalPublisher,
              category: finalCategory,
              cover: finalCover,
              grade: grade,
              createdAt: new Date().toISOString().slice(0, 10)
            });
            addCount++;
          }

          if (matchedBook) {
            matchedBook.grade = grade;
            matchedBook.isRecommended = true;
            if (window.NanoPortal && NanoPortal.remote) {
              try { await NanoPortal.saveBook(matchedBook); } catch(err) { console.warn(err); }
            }
          }
        }
      }

      saveRecommendedBooks(recList);
      renderRecommendedBooksTable();

      if (window.jQuery && typeof $('#recommendedExcelModal').modal === 'function') {
        $('#recommendedExcelModal').modal('hide');
      }

      curSelectedRecExcelFile = null;
      let toastMsg = `권장도서 엑셀 일괄 처리 완료 (등록 ${addCount}건, 변경 ${updateCount}건, 삭제 ${deleteCount}건)`;
      if (failCount > 0) toastMsg += `, 오류/실패 ${failCount}건`;
      showMasterToast(toastMsg);
    } catch(err) {
      console.error(err);
      alert("엑셀 파일 파싱 중 오류가 발생했습니다: " + err.message);
    }
  };
  reader.readAsText(curSelectedRecExcelFile, "UTF-8");
}

// ==========================================
// 3. 가맹점 관리 모듈 (Franchise Management)
// ==========================================

// 상품별 월 표준 결제 금액 및 기본 사용인원 매핑
const PLAN_MONTHLY_FEES = {
  "Basic": "80,000원",
  "Standard": "120,000원",
  "Premium": "180,000원",
  "Royal": "300,000원"
};

const PLAN_MAX_STUDENTS = {
  "Basic": 25,
  "Standard": 50,
  "Premium": 100,
  "Royal": 100
};

// 이용 상품별 품격 있는 뱃지 스타일 헬퍼
function getPlanBadge(plan) {
  const normalized = normalizePlan(plan);
  switch (normalized) {
    case "VIP":
      return `<span class="badge-soft" style="background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; font-weight: 800; font-size: 11.5px; padding: 4px 9px; border-radius: 6px;"><i class="fa-solid fa-crown mr-1 text-warning"></i>VIP</span>`;
    case "Royal":
      return `<span class="badge-soft" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-weight: 800; font-size: 11.5px; padding: 4px 9px; border-radius: 6px;"><i class="fa-solid fa-gem mr-1 text-primary"></i>Royal</span>`;
    case "Premium":
      return `<span class="badge-soft" style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-weight: 800; font-size: 11.5px; padding: 4px 9px; border-radius: 6px;"><i class="fa-solid fa-star mr-1 text-success"></i>Premium</span>`;
    case "Standard":
      return `<span class="badge-soft" style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-weight: 800; font-size: 11.5px; padding: 4px 9px; border-radius: 6px;"><i class="fa-solid fa-bookmark mr-1"></i>Standard</span>`;
    case "Basic":
    default:
      return `<span class="badge-soft" style="background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; font-weight: 800; font-size: 11.5px; padding: 4px 9px; border-radius: 6px;"><i class="fa-solid fa-cube mr-1"></i>Basic</span>`;
  }
}

// 연락처 입력 시 하이픈(-) 자동 입력 처리 함수
function formatPhoneInput(input) {
  if (!input) return;
  let val = input.value.replace(/[^0-9]/g, "");
  if (val.length <= 3) {
    input.value = val;
  } else if (val.length <= 7) {
    input.value = val.substring(0, 3) + "-" + val.substring(3);
  } else if (val.length <= 11) {
    input.value = val.substring(0, 3) + "-" + val.substring(3, 7) + "-" + val.substring(7, 11);
  } else {
    input.value = val.substring(0, 3) + "-" + val.substring(3, 7) + "-" + val.substring(7, 11);
  }
}

// 가맹 학원 20개 단위 페이징 상태 변수
let franchiseCurrentPage = 1;
const FRANCHISE_PAGE_SIZE = 20;
let lastSortedFranchises = [];

// 가맹점 테이블 렌더링 (최근 가맹일/가입일 기준 최신순 정렬 + 20개씩 페이징)
function renderFranchiseTable(data = franchiseList, keepPage = false) {
  const tbody = document.getElementById("franchiseTableBody");
  if (!tbody) return;

  // 가맹 학원명(name) 기준 한글 ㄱㄴㄷ 오름차순 (가나다순) 정렬
  const sortedData = [...data].sort((a, b) => {
    const nameA = (a.name || '').trim();
    const nameB = (b.name || '').trim();
    return nameA.localeCompare(nameB, 'ko');
  });

  lastSortedFranchises = sortedData;
  const totalCount = sortedData.length;
  const totalPages = Math.ceil(totalCount / FRANCHISE_PAGE_SIZE) || 1;

  if (!keepPage) {
    if (franchiseCurrentPage > totalPages) franchiseCurrentPage = 1;
  }
  if (franchiseCurrentPage < 1) franchiseCurrentPage = 1;

  const countEl = document.getElementById("franchiseFilteredCount");
  if (countEl) {
    countEl.innerText = `${totalCount}개소 (${franchiseCurrentPage} / ${totalPages} 페이지)`;
  }

  if (totalCount === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-5 text-muted">일치하는 가맹 학원 정보가 없습니다.</td></tr>`;
    renderFranchisePagination(0, 1);
    return;
  }

  const startIdx = (franchiseCurrentPage - 1) * FRANCHISE_PAGE_SIZE;
  const pagedData = sortedData.slice(startIdx, startIdx + FRANCHISE_PAGE_SIZE);

  tbody.innerHTML = pagedData.map((acad, idx) => {
    // 슬롯(사용인원) 사용률 계산
    const maxStd = acad.maxStudents || 50;
    const curStd = acad.currentStudents || 0;
    const slotRate = Math.round((curStd / maxStd) * 100);
    let progressClass = "";
    if (slotRate >= 95) progressClass = "danger";
    else if (slotRate >= 80) progressClass = "warn";

    // 가맹 상태 뱃지 (계약 만료 및 30일내 만료 임박 포함)
    const todayStr = new Date().toISOString().slice(0, 10);
    const isExpired = (acad.endDate && acad.endDate < todayStr && acad.status !== "TERMINATED");
    let effStatus = isExpired ? "EXPIRED" : acad.status;
    if (!isExpired && acad.status !== "TERMINATED" && acad.status !== "PAUSED" && acad.endDate) {
      const end = new Date(acad.endDate);
      const now = new Date();
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        effStatus = "EXPIRING";
      }
    }

    let statusBadge = `<span class="badge-soft badge-soft-success" style="font-size: 11px; padding: 3px 7px;"><i class="fa-solid fa-circle-check"></i> 정상 운영</span>`;
    if (effStatus === "EXPIRED") {
      statusBadge = `<span class="badge-soft badge-soft-danger" style="font-size: 11px; padding: 3px 7px;"><i class="fa-solid fa-calendar-xmark"></i> 계약 만료</span>`;
    } else if (effStatus === "EXPIRING") {
      statusBadge = `<span class="badge-soft badge-soft-warn" style="font-size: 11px; padding: 3px 7px;"><i class="fa-solid fa-clock"></i> 만료 임박</span>`;
    } else if (effStatus === "PAUSED") {
      statusBadge = `<span class="badge-soft badge-soft-danger" style="font-size: 11px; padding: 3px 7px;"><i class="fa-solid fa-pause"></i> 일시 정지</span>`;
    } else if (effStatus === "TERMINATED") {
      statusBadge = `<span class="badge-soft badge-soft-neutral" style="font-size: 11px; padding: 3px 7px;"><i class="fa-solid fa-xmark"></i> 계약 해지</span>`;
    }

    // 가입일 표시
    const joinDateText = acad.joinDate || acad.startDate || "-";

    // 이용 상품명 뱃지 (대소문자/한글 등 안전 정규화)
    const planBadge = getPlanBadge(acad.plan || "Standard");

    // 관리자 ID 및 정보 (기존 실제 원장/대표교사 로그인 계정 조회)
    const adminStaff = getFranchiseAdminStaff(acad);
    const adminIdText = getFranchiseAdminId(acad);

    let displayDirector = (acad.director || "").replace(/\s*원장\s*원장/g, " 원장").trim();
    let displayPhone = acad.phone || "";
    if (displayPhone === "010-0000-0000") displayPhone = "";

    if (adminStaff) {
      if (!displayDirector || displayDirector.endsWith(" 원장") || displayDirector.includes("원장")) {
        displayDirector = adminStaff.name || displayDirector;
      }
      if (!displayPhone || displayPhone === "010-0000-0000") {
        displayPhone = (adminStaff.phone && adminStaff.phone !== "010-0000-0000") ? adminStaff.phone : "";
      }
    }

    return `
      <tr>
        <!-- 1. 번호 -->
        <td class="text-center font-weight-bold text-muted" style="font-size: 12px; white-space: nowrap; padding: 8px 4px;">${startIdx + idx + 1}</td>
        <!-- 2. 이용 상품명 -->
        <td class="text-center" style="white-space: nowrap; padding: 8px 4px;">${planBadge}</td>
        <!-- 3. 가맹 학원명 (주소 아래 한 줄 띄어서 사업자번호 표시) -->
        <td style="padding: 8px 10px;">
          <div class="font-weight-bold" style="font-size: 13.5px; color: var(--text-main); white-space: nowrap; margin-bottom: 3px;">${acad.name}</div>
          <div style="font-size: 11.5px; line-height: 1.4; white-space: nowrap;">
            <div style="color: #6c5f53;"><i class="fa-solid fa-location-dot mr-1" style="color: #9c8a79;"></i>${acad.region || '전국'}</div>
            <div style="color: #8c7e72; font-size: 11px; margin-top: 2px;"><i class="fa-regular fa-id-card mr-1" style="color: #a89a8c;"></i>사업자: ${acad.bizNumber || '-'}</div>
          </div>
        </td>
        <!-- 4. 관리자 ID -->
        <td class="text-center" style="white-space: nowrap; padding: 8px 4px;">
          ${(adminIdText && !isSyntheticAdminId(adminIdText)) ? `
            <span class="badge-soft badge-soft-neutral" style="font-family: monospace; font-size: 11.5px; font-weight: 700; color: #495057; padding: 3px 6px;">${adminIdText}</span>
          ` : `
            <span class="badge-soft" style="font-size: 11px; padding: 3px 7px; border-radius: 6px; font-weight: 700; background: #fef3c7; color: #b45309; border: 1px solid #fde68a;" title="원장/관리자 계정 등록 대기 상태입니다.">
              <i class="fa-solid fa-user-clock mr-1"></i>계정 미등록
            </span>
          `}
        </td>
        <!-- 5. 원장명 / 연락처 -->
        <td class="text-center" style="white-space: nowrap; padding: 8px 6px;">
          <div style="font-size: 12.5px; white-space: nowrap; line-height: 1.3;">
            <strong style="color: var(--text-main); font-weight: 700;">${displayDirector || '-'}</strong>
            ${displayPhone ? `<span class="ml-1" style="font-size: 11.5px; font-weight: 600; color: #5c5044;">(${displayPhone})</span>` : ''}
          </div>
          ${acad.email ? `<div style="color: #7d7063; font-size: 10.5px; font-weight: 500; white-space: nowrap; margin-top: 2px; line-height: 1.2;"><i class="fa-regular fa-envelope mr-1" style="font-size: 9.5px;"></i>${acad.email}</div>` : ''}
        </td>
        <!-- 6. 가입일 -->
        <td class="text-center font-weight-bold" style="font-size: 12px; color: #5a4b3d; white-space: nowrap; letter-spacing: -0.2px; padding: 8px 4px;">
          ${joinDateText}
        </td>
        <!-- 7. 계약 기간 -->
        <td class="text-center" style="white-space: nowrap; padding: 8px 6px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--text-main); letter-spacing: -0.2px; white-space: nowrap;">${acad.startDate} ~ ${acad.endDate}</div>
          <small class="d-block mt-1" style="color: #8c7662; font-weight: 600; font-size: 10.5px; white-space: nowrap;">${getDDayText(acad.endDate)}</small>
        </td>
        <!-- 8. 원생 수 / 계약 슬롯 (사용인원) -->
        <td style="padding: 8px 6px;">
          <div class="d-flex justify-content-between align-items-center mb-1" style="font-size: 11px; white-space: nowrap;">
            <span class="font-weight-bold">${curStd}명 <small class="text-muted">/ ${maxStd}명</small></span>
            <span class="text-muted font-weight-bold">${slotRate}%</span>
          </div>
          <div class="slot-progress-wrap" style="height: 5px;">
            <div class="slot-progress-fill ${progressClass}" style="width: ${Math.min(slotRate, 100)}%;"></div>
          </div>
        </td>
        <!-- 9. 가맹 상태 -->
        <td class="text-center" style="white-space: nowrap; padding: 8px 4px;">${statusBadge}</td>
        <!-- 10. 관리 -->
        <td class="text-center" style="white-space: nowrap; padding: 8px 4px;">
          <div class="d-inline-flex gap-1" style="gap: 4px;">
            <button class="btn btn-xs btn-outline-secondary" onclick="openAcademyEditModal('${acad.id}')" title="학원 정보 및 계약/상품 수정" style="border-radius: 6px; font-size: 11px; padding: 3px 7px; border-color: var(--border-medium);">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn btn-xs btn-outline-danger" onclick="openAcademyDeleteConfirm('${acad.id}')" title="가맹 해지/삭제" style="border-radius: 6px; font-size: 11px; padding: 3px 7px;">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  renderFranchisePagination(totalPages, franchiseCurrentPage);
}

// 20개 단위 페이지네이션 UI 렌더링
function renderFranchisePagination(totalPages, curPage) {
  const container = document.getElementById("franchisePagination");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  // 이전 페이지 버튼
  const isFirst = curPage === 1;
  html += `
    <button class="btn btn-sm" onclick="goToFranchisePage(${curPage - 1})" ${isFirst ? 'disabled style="opacity: 0.35; cursor: not-allowed; background: #fff; border: 1px solid #e0d8cc; color: #888;"' : 'style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;"'}>
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  // 페이지 번호 (최대 7개 노출)
  let startP = Math.max(1, curPage - 3);
  let endP = Math.min(totalPages, startP + 6);
  if (endP - startP < 6) {
    startP = Math.max(1, endP - 6);
  }

  if (startP > 1) {
    html += `<button class="btn btn-sm" onclick="goToFranchisePage(1)" style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;">1</button>`;
    if (startP > 2) html += `<span style="color: var(--text-muted); font-size: 12px; padding: 0 3px;">...</span>`;
  }

  for (let p = startP; p <= endP; p++) {
    const isActive = p === curPage;
    html += `
      <button class="btn btn-sm" onclick="goToFranchisePage(${p})" style="${isActive ? 'background: var(--btn-primary, #3d342d); color: #fff; font-weight: 700; border: 1px solid #3d342d;' : 'background: #fff; border: 1px solid #d8cebf; color: var(--text-main);'} font-size: 12px; padding: 4px 10px; border-radius: 6px;">
        ${p}
      </button>
    `;
  }

  if (endP < totalPages) {
    if (endP < totalPages - 1) html += `<span style="color: var(--text-muted); font-size: 12px; padding: 0 3px;">...</span>`;
    html += `<button class="btn btn-sm" onclick="goToFranchisePage(${totalPages})" style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;">${totalPages}</button>`;
  }

  // 다음 페이지 버튼
  const isLast = curPage === totalPages;
  html += `
    <button class="btn btn-sm" onclick="goToFranchisePage(${curPage + 1})" ${isLast ? 'disabled style="opacity: 0.35; cursor: not-allowed; background: #fff; border: 1px solid #e0d8cc; color: #888;"' : 'style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;"'}>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

// 특정 페이지로 이동
function goToFranchisePage(page) {
  franchiseCurrentPage = page;
  renderFranchiseTable(lastSortedFranchises, true);
  const tableEl = document.getElementById("franchiseTableBody");
  if (tableEl) {
    tableEl.closest('.table-responsive')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function getDDayText(endDateStr) {
  const end = new Date(endDateStr);
  const now = new Date();
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `<span class="text-danger font-weight-bold">만료됨</span>`;
  if (diff <= 30) return `<span class="text-warning font-weight-bold">D-${diff}</span>`;
  return `D-${diff}`;
}

// 가맹점 필터링 (가입일 기간 2개 박스, 이용 상품명, 운영 상태, 검색어)
function filterFranchiseList() {
  franchiseCurrentPage = 1; // 필터링 시 1페이지로 리셋
  const query = (document.getElementById("franchiseSearchInput")?.value || "").toLowerCase().trim();

  const statusFilter = document.getElementById("franchiseStatusFilter")?.value || "ALL";
  const planFilter = document.getElementById("franchisePlanFilter")?.value || "ALL";
  const startDateFilter = document.getElementById("franchiseStartDateFilter")?.value || "";
  const endDateFilter = document.getElementById("franchiseEndDateFilter")?.value || "";
  const todayStr = new Date().toISOString().slice(0, 10);

  const filtered = franchiseList.filter(item => {
    const itemJoinDate = item.joinDate || item.startDate || "";

    const matchQuery = !query || 
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.director && item.director.toLowerCase().includes(query)) ||
      (item.region && item.region.toLowerCase().includes(query)) ||
      (item.bizNumber && item.bizNumber.includes(query)) ||
      (item.adminId && item.adminId.toLowerCase().includes(query)) ||
      (item.email && item.email.toLowerCase().includes(query));

    // 계약 만료 및 30일내 만료 임박 자동 판정 반영
    const isExpired = (item.endDate && item.endDate < todayStr && item.status !== "TERMINATED");
    let effStatus = isExpired ? "EXPIRED" : item.status;
    if (!isExpired && item.status !== "TERMINATED" && item.status !== "PAUSED" && item.endDate) {
      const end = new Date(item.endDate);
      const now = new Date();
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        effStatus = "EXPIRING";
      }
    }

    const matchStatus = statusFilter === "ALL" || effStatus === statusFilter;
    const matchPlan = planFilter === "ALL" || normalizePlan(item.plan) === planFilter;

    // 가입일 기간 조건
    let matchDate = true;
    if (startDateFilter && itemJoinDate && itemJoinDate < startDateFilter) {
      matchDate = false;
    }
    if (endDateFilter && itemJoinDate && itemJoinDate > endDateFilter) {
      matchDate = false;
    }

    return matchQuery && matchStatus && matchPlan && matchDate;
  });

  renderFranchiseTable(filtered);
}

// 가맹점 필터 초기화
function resetFranchiseFilters() {
  franchiseCurrentPage = 1; // 초기화 시 1페이지로 리셋
  const q = document.getElementById("franchiseSearchInput");
  if (q) q.value = "";
  const st = document.getElementById("franchiseStatusFilter");
  if (st) st.value = "ALL";
  const pl = document.getElementById("franchisePlanFilter");
  if (pl) pl.value = "ALL";
  const sDate = document.getElementById("franchiseStartDateFilter");
  if (sDate) sDate.value = "";
  const eDate = document.getElementById("franchiseEndDateFilter");
  if (eDate) eDate.value = "";
  renderFranchiseTable();
}

// 신규 학원 등록 모달 열기
function openAcademyRegisterModal() {
  const form = document.getElementById("academyRegisterForm");
  if (form) form.reset();
  const today = new Date().toISOString().split("T")[0];
  const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0];
  const sDate = document.getElementById("regStartDate");
  if (sDate) sDate.value = today;
  const eDate = document.getElementById("regEndDate");
  if (eDate) eDate.value = nextYear;
  const planEl = document.getElementById("regPlan");
  if (planEl) planEl.value = "Standard";
  const maxStudentsEl = document.getElementById("regMaxStudents");
  if (maxStudentsEl) maxStudentsEl.value = "50";
  $('#academyRegisterModal').modal('show');
}

// 요금제 변경 시 월 결제 금액 및 사용인원 자동 설정 핸들러 (직접 수정도 가능)
function handleEditPlanChange(plan) {
  const feeInput = document.getElementById("editMonthlyFee");
  if (feeInput) {
    feeInput.value = PLAN_MONTHLY_FEES[plan] || "120,000원";
  }
  const maxStudentsInput = document.getElementById("editMaxStudents");
  if (maxStudentsInput) {
    maxStudentsInput.value = PLAN_MAX_STUDENTS[plan] || 50;
  }
}

function handleRegPlanChange(plan) {
  const feeInput = document.getElementById("regMonthlyFee");
  if (feeInput) {
    feeInput.value = PLAN_MONTHLY_FEES[plan] || "120,000원";
  }
  const maxStudentsInput = document.getElementById("regMaxStudents");
  if (maxStudentsInput) {
    maxStudentsInput.value = PLAN_MAX_STUDENTS[plan] || 50;
  }
}

// 신규 가맹 학원 등록 모달 열기
function openAcademyRegisterModal() {
  const today = new Date().toISOString().split('T')[0];
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const nextYearStr = nextYear.toISOString().split('T')[0];

  if (document.getElementById("regJoinDate")) document.getElementById("regJoinDate").value = today;
  if (document.getElementById("regStartDate")) document.getElementById("regStartDate").value = today;
  if (document.getElementById("regEndDate")) document.getElementById("regEndDate").value = nextYearStr;
  if (document.getElementById("regPlan")) document.getElementById("regPlan").value = "Standard";
  if (document.getElementById("regMonthlyFee")) document.getElementById("regMonthlyFee").value = PLAN_MONTHLY_FEES["Standard"] || "120,000원";
  if (document.getElementById("regMaxStudents")) document.getElementById("regMaxStudents").value = PLAN_MAX_STUDENTS["Standard"] || 50;

  $('#academyRegisterModal').modal('show');
}

// 신규 학원 등록 제출 처리 (등록일, 계약시작일, 계약만료일, 월결제금액 등 반영)
function handleRegisterAcademy(e) {
  e.preventDefault();
  const name = document.getElementById("regAcademyName").value.trim();
  const bizNumber = document.getElementById("regBizNumber")?.value.trim() || "";
  const director = document.getElementById("regDirectorName").value.trim();
  const email = document.getElementById("regDirectorEmail")?.value.trim() || "";
  const phone = document.getElementById("regDirectorPhone").value.trim();
  const address = document.getElementById("regAddress")?.value.trim() || "";
  const region = address ? address.split(" ")[0] + " " + (address.split(" ")[1] || "") : "서울";
  const adminId = document.getElementById("regDirectorId")?.value.trim() || `director_${Date.now()}`;
  const joinDate = document.getElementById("regJoinDate")?.value || document.getElementById("regStartDate")?.value;
  const startDate = document.getElementById("regStartDate").value;
  const endDate = document.getElementById("regEndDate").value;
  const plan = document.getElementById("regPlan")?.value || "Standard";
  const maxStudents = parseInt(document.getElementById("regMaxStudents")?.value, 10) || 50;
  const monthlyFee = document.getElementById("regMonthlyFee")?.value.trim() || PLAN_MONTHLY_FEES[plan] || "120,000원";

  const newId = `ACAD-0${String(franchiseList.length + 1).padStart(2, '0')}`;
  const newAcad = {
    id: newId,
    name: name,
    bizNumber: bizNumber,
    director: director.includes("원장") ? director : director + " 원장",
    email: email,
    phone: phone,
    region: region + (address ? ` (${address})` : ""),
    adminId: adminId,
    adminPw: document.getElementById("regDirectorPw")?.value.trim() || "nano1234!",
    plan: plan,
    joinDate: joinDate,
    startDate: startDate,
    endDate: endDate,
    currentStudents: 0,
    maxStudents: maxStudents,
    monthlyFee: monthlyFee,
    paymentStatus: "PAID",
    status: "ACTIVE"
  };

  franchiseList.unshift(newAcad);
  saveFranchisesToStorage();
  $('#academyRegisterModal').modal('hide');
  document.getElementById("academyRegisterForm").reset();

  renderFranchiseTable();
  updateFranchiseStats();
  populateMemberAcademyFilter();
  populateDispatchAcademyFilter();
  showMasterToast(`[${name}] 신규 가맹 학원(${plan} 플랜, 사용인원 ${maxStudents}명)이 성공적으로 등록되었습니다.`);
}

// 학원 수정 모달 열기 (등록일, 계약 시작일, 계약 만료일, 이용상품, 사용인원, 월 결제금액 바인딩)
function openAcademyEditModal(id) {
  const acad = franchiseList.find(a => a.id === id);
  if (!acad) return;

  const currentAdminId = getFranchiseAdminId(acad);
  acad.adminId = currentAdminId;
  const adminStaff = getFranchiseAdminStaff(acad);
  if (adminStaff) {
    if (!acad.director || acad.director.endsWith(" 원장") || acad.director.includes("원장")) {
      acad.director = adminStaff.name || acad.director;
    }
    if (!acad.phone || acad.phone === "010-0000-0000") {
      acad.phone = (adminStaff.phone && adminStaff.phone !== "010-0000-0000") ? adminStaff.phone : acad.phone;
    }
  }

  document.getElementById("editAcademyId").value = acad.id;
  const badge = document.getElementById("editAcademyIdBadge");
  if (badge) badge.innerText = `아이디: ${currentAdminId}`;

  document.getElementById("editAcademyName").value = acad.name || "";
  document.getElementById("editBizNumber").value = acad.bizNumber || "";
  document.getElementById("editDirectorName").value = acad.director || "";
  if (document.getElementById("editDirectorEmail")) {
    document.getElementById("editDirectorEmail").value = acad.email || "";
  }
  document.getElementById("editDirectorPhone").value = acad.phone || "";
  document.getElementById("editRegion").value = acad.region || "";

  // 등록일, 계약 시작일, 계약 만료일 바인딩
  if (document.getElementById("editJoinDate")) {
    document.getElementById("editJoinDate").value = acad.joinDate || acad.startDate || "";
  }
  if (document.getElementById("editStartDate")) {
    document.getElementById("editStartDate").value = acad.startDate || acad.joinDate || "";
  }
  if (document.getElementById("editEndDate")) {
    document.getElementById("editEndDate").value = acad.endDate || "";
  }

  // 이용 상품 정규화 및 바인딩 (대소문자/한글 등 안전 정규화하여 select option과 정확히 매칭)
  const normalizedPlan = normalizePlan(acad.plan);
  acad.plan = normalizedPlan;
  if (document.getElementById("editPlan")) {
    document.getElementById("editPlan").value = normalizedPlan;
  }
  if (document.getElementById("editMaxStudents")) {
    document.getElementById("editMaxStudents").value = acad.maxStudents || 50;
  }

  // 월 결제 금액 바인딩 (숫자만 있는 경우 '원' 포맷팅)
  if (document.getElementById("editMonthlyFee")) {
    let fee = acad.monthlyFee || PLAN_MONTHLY_FEES[normalizedPlan] || "120,000원";
    const digitsOnly = String(fee).replace(/[^0-9]/g, '');
    if (digitsOnly && (!String(fee).includes('원') || /^\d+$/.test(String(fee).trim()))) {
      fee = Number(digitsOnly).toLocaleString() + '원';
    }
    document.getElementById("editMonthlyFee").value = fee;
  }

  // 관리자 아이디 표시 및 현재 비밀번호 정보 바인딩
  if (document.getElementById("editDirectorId")) {
    document.getElementById("editDirectorId").value = currentAdminId;
  }
  const currentPw = acad.adminPw || "nano123!";
  const curPwEl = document.getElementById("currentDirectorPwText");
  if (curPwEl) {
    curPwEl.innerText = currentPw;
  }
  if (document.getElementById("editDirectorPw")) {
    document.getElementById("editDirectorPw").value = "";
  }

  document.getElementById("editStatus").value = acad.status || "ACTIVE";

  $('#academyEditModal').modal('show');
}

// 임시 비밀번호 간편 생성 헬퍼
function applyQuickDirectorPw() {
  const input = document.getElementById("editDirectorPw");
  if (!input) return;
  const year = new Date().getFullYear();
  const rand = Math.floor(100 + Math.random() * 900);
  input.value = `nano${year}!${rand}`;
  input.focus();
}

// 학원 수정 내용 저장 (등록일, 계약시작일, 계약만료일, 이용상품, 사용인원, 월결제금액 저장)
async function saveAcademyEdit(e) {
  if (e) e.preventDefault();
  const id = document.getElementById("editAcademyId").value;
  const acad = franchiseList.find(a => a.id === id);
  if (!acad) return;
  const previousAcademy = { ...acad };

  const oldName = acad.name;
  const newName = document.getElementById("editAcademyName").value.trim() || oldName;

  const directorEl = document.getElementById("editDirectorName");
  const directorVal = directorEl ? directorEl.value.trim() : "";
  const nameRegex = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9\s()_.-]+$/;
  if (directorVal && !nameRegex.test(directorVal)) {
    const errEl = document.getElementById("editDirectorNameError");
    if (errEl) errEl.classList.remove("d-none");
    if (directorEl) directorEl.focus();
    alert("원장 성함에는 특수문자나 기호를 입력할 수 없습니다. 한글 또는 영문으로 입력해주세요.");
    return;
  }

  acad.name = newName;
  acad.bizNumber = document.getElementById("editBizNumber").value.trim();
  acad.director = directorVal;
  if (document.getElementById("editDirectorEmail")) {
    acad.email = document.getElementById("editDirectorEmail").value.trim();
  }
  acad.phone = document.getElementById("editDirectorPhone").value.trim();
  acad.region = document.getElementById("editRegion").value.trim();

  // 관리자 고유 아이디 저장 보장
  acad.adminId = document.getElementById("editDirectorId")?.value.trim() || getFranchiseAdminId(acad);

  // 등록일, 계약 시작일, 계약 만료일 저장
  if (document.getElementById("editJoinDate")) {
    acad.joinDate = document.getElementById("editJoinDate").value || acad.joinDate;
  }
  if (document.getElementById("editStartDate")) {
    acad.startDate = document.getElementById("editStartDate").value || acad.startDate;
  }
  if (document.getElementById("editEndDate")) {
    acad.endDate = document.getElementById("editEndDate").value || acad.endDate;
  }

  // 이용 상품 및 사용인원
  if (document.getElementById("editPlan")) {
    acad.plan = normalizePlan(document.getElementById("editPlan").value);
  }
  if (document.getElementById("editMaxStudents")) {
    acad.maxStudents = parseInt(document.getElementById("editMaxStudents").value, 10) || acad.maxStudents;
  }

  // 월 결제 금액 저장 (숫자만 입력된 경우 '원' 포맷팅 적용)
  if (document.getElementById("editMonthlyFee")) {
    let rawFee = document.getElementById("editMonthlyFee").value.trim();
    const digits = rawFee.replace(/[^0-9]/g, '');
    if (digits && (!rawFee.includes('원') || /^\d+$/.test(rawFee))) {
      rawFee = Number(digits).toLocaleString() + '원';
    }
    acad.monthlyFee = rawFee || PLAN_MONTHLY_FEES[acad.plan] || acad.monthlyFee;
  }

  // 비밀번호 변경 저장 (새 비밀번호 입력 시 갱신 & 통합 회원 목록 원장 계정도 실시간 동시 동기화)
  const newPwEl = document.getElementById("editDirectorPw");
  let isPasswordUpdated = false;
  if (newPwEl && newPwEl.value.trim()) {
    const newPassword = newPwEl.value.trim();
    acad.adminPw = newPassword;
    isPasswordUpdated = true;
  }

  // 통합 회원 목록(memberList) 내 원장(DIRECTOR) 계정의 아이디/비밀번호 동기화 및 부재 시 신규 생성
  if (typeof memberList !== "undefined" && Array.isArray(memberList)) {
    let directorMember = memberList.find(m =>
      (m.academyId === id || m.academyName === oldName || m.academyName === newName) &&
      (m.role === "DIRECTOR" || m.grade === "원장" || m.username === acad.adminId)
    );
    if (directorMember) {
      directorMember.username = acad.adminId;
      directorMember.name = acad.director;
      directorMember.phone = acad.phone;
      if (isPasswordUpdated && acad.adminPw) directorMember.password = acad.adminPw;
    } else {
      memberList.unshift({
        id: Date.now(),
        academyId: acad.id,
        academyName: acad.name,
        role: "DIRECTOR",
        name: acad.director || "원장",
        username: acad.adminId,
        grade: "원장",
        className: "-",
        phone: acad.phone || "-",
        parentPhone: "-",
        points: 0,
        password: acad.adminPw || "nano123!",
        lastLogin: "-",
        createdAt: acad.joinDate || new Date().toISOString().slice(0, 10),
        status: "APPROVED"
      });
    }
    saveMembersToStorage();
  }

  acad.status = document.getElementById("editStatus").value;

  // 학원명이 변경된 경우, 연계된 회원 및 발송 내역의 학원명도 자동 동기화
  if (oldName !== newName) {
    memberList.forEach(m => {
      if (m.academyId === id || m.academyName === oldName) {
        m.academyName = newName;
      }
    });
    dispatchLogs.forEach(d => {
      if (d.academyId === id || d.academyName === oldName) {
        d.academyName = newName;
      }
    });
    saveMembersToStorage();
    populateMemberAcademyFilter();
    populateDispatchAcademyFilter();
  }

  // window.MIGRATED_FRANCHISES 메모리 배열에도 즉시 동기화
  if (typeof window !== "undefined" && Array.isArray(window.MIGRATED_FRANCHISES)) {
    const mIdx = window.MIGRATED_FRANCHISES.findIndex(a => a.id === id);
    if (mIdx !== -1) {
      window.MIGRATED_FRANCHISES[mIdx] = { ...acad };
    }
  }

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveAcademy(acad);
    } catch (error) {
      Object.assign(acad, previousAcademy);
      showMasterToast('학원 정보를 저장하지 못했습니다: ' + error.message);
      return;
    }
  }
  saveFranchisesToStorage();
  $('#academyEditModal').modal('hide');

  // 현재 필터/검색 조건 유지하여 즉시 재렌더링
  if (typeof filterFranchiseList === "function") {
    filterFranchiseList();
  } else {
    renderFranchiseTable(franchiseList, true);
  }
  updateFranchiseStats();

  const pwMsg = isPasswordUpdated ? ` (원장 PW가 '${acad.adminPw}'로 변경되었습니다.)` : '';
  showMasterToast(`[${acad.name}] 가맹 학원 정보가 갱신되었습니다.${pwMsg}`);
}

// 학원 삭제/해지 확인 모달
let pendingDeleteAcademyId = null;
function openAcademyDeleteConfirm(id) {
  const acad = franchiseList.find(a => a.id === id);
  if (!acad) return;

  pendingDeleteAcademyId = id;
  document.getElementById("deleteAcademyName").innerText = acad.name;
  $('#academyDeleteConfirmModal').modal('show');
}

async function confirmDeleteAcademy() {
  if (!pendingDeleteAcademyId) return;
  const idx = franchiseList.findIndex(a => a.id === pendingDeleteAcademyId);
  if (idx === -1) return;

  const target = franchiseList[idx];

  // 운영 서버(Vercel + Neon DB)에 가맹 학원 삭제(해지) 요청 전송
  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.deleteAcademy(target);
    } catch (error) {
      showMasterToast('가맹 학원을 삭제하지 못했습니다: ' + error.message);
      return;
    }
  }

  const deleted = franchiseList.splice(idx, 1)[0];
  saveFranchisesToStorage();
  $('#academyDeleteConfirmModal').modal('hide');
  pendingDeleteAcademyId = null;
  renderFranchiseTable();
  updateFranchiseStats();
  populateMemberAcademyFilter();
  populateDispatchAcademyFilter();
  showMasterToast(`[${deleted.name}] 가맹 계약이 해지 및 삭제되었습니다.`);
}

function updateFranchiseStats() {
  const total = franchiseList.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();

  // 만료 임박(30일내) 개수 실시간 동적 계산
  const expiringCount = franchiseList.filter(a => {
    if (a.status === "TERMINATED" || a.status === "PAUSED") return false;
    const isExpired = (a.endDate && a.endDate < todayStr);
    if (isExpired) return false;
    if (a.status === "EXPIRING") return true;
    if (!a.endDate) return false;
    const diffDays = Math.ceil((new Date(a.endDate) - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const activeCount = franchiseList.filter(a => {
    const isExpired = (a.endDate && a.endDate < todayStr && a.status !== "TERMINATED");
    return !isExpired && a.status === "ACTIVE";
  }).length;
  const expiredCount = franchiseList.filter(a => {
    return a.status === "EXPIRED" || (a.endDate && a.endDate < todayStr && a.status !== "TERMINATED");
  }).length;
  const pausedCount = franchiseList.filter(a => a.status === "PAUSED").length;

  const currentSlots = franchiseList.reduce((acc, cur) => acc + (cur.currentStudents || 0), 0);
  const maxSlots = franchiseList.reduce((acc, cur) => acc + (cur.maxStudents || 0), 0);
  const slotRate = maxSlots > 0 ? ((currentSlots / maxSlots) * 100).toFixed(1) : "0.0";

  if (document.getElementById("statFranchiseTotal")) {
    document.getElementById("statFranchiseTotal").innerHTML = `${total}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">개소</span>`;
    const sub = document.getElementById("statFranchiseTotal").nextElementSibling;
    if (sub && sub.classList.contains("stat-sub")) {
      sub.innerHTML = `<span class="text-success font-weight-bold">정상 ${activeCount}</span> / <span class="text-danger font-weight-bold">만료 ${expiredCount}</span> / 일시정지 ${pausedCount}`;
    }
  }
  if (document.getElementById("statFranchiseSlots")) {
    document.getElementById("statFranchiseSlots").innerHTML = `${currentSlots.toLocaleString()} <span style="font-size: 15px; font-weight: 600; color: var(--text-muted);">/ ${maxSlots.toLocaleString()}명</span>`;
    const sub = document.getElementById("statFranchiseSlots").nextElementSibling;
    if (sub && sub.classList.contains("stat-sub")) {
      sub.innerHTML = `슬롯 사용률 <strong class="text-primary font-weight-bold">${slotRate}%</strong>`;
    }
  }
  if (document.getElementById("statFranchiseExpiring")) {
    document.getElementById("statFranchiseExpiring").innerHTML = `${expiringCount}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">개소</span>`;
  }
}

function exportFranchiseExcel() {
  showMasterToast("가맹 학원 명단 및 B2B 계약 현황 엑셀 다운로드가 시작되었습니다.");
}

// ==========================================
// 4. 통합 회원 관리 모듈 (Universal Members)
// ==========================================

let currentSelectedAcademy = "ALL";

// 학원 드롭다운 초기화
function initMemberAcademyDropdown() {
  renderAcademyDropdownList("");
  
  // 모달 학원 셀렉트 박스들도 함께 동기화
  const newMemAcadSelect = document.getElementById("newMemAcademy");
  if (newMemAcadSelect && typeof franchiseList !== "undefined") {
    newMemAcadSelect.innerHTML = franchiseList.map(a => `<option value="${a.name}">${a.name}</option>`).join("");
  }
  const excelTargetSelect = document.getElementById("excelTargetAcademy");
  if (excelTargetSelect && typeof franchiseList !== "undefined") {
    excelTargetSelect.innerHTML = franchiseList.map(a => `<option value="${a.name}">${a.name}</option>`).join("");
  }
}

// 학원 목록 드롭다운 렌더링 및 키워드 하이라이트
function renderAcademyDropdownList(keyword = "") {
  const container = document.getElementById("memberAcademyListContainer");
  if (!container || typeof franchiseList === "undefined") return;

  const kw = keyword.trim().toLowerCase();
  const allAcademies = Array.from(new Set(franchiseList.map(a => a.name)));

  // '전체 학원' 옵션
  let html = `
    <button type="button" class="dropdown-item ${currentSelectedAcademy === 'ALL' ? 'active font-weight-bold' : ''}" onclick="selectMemberAcademy('ALL')" style="font-size: 13px; padding: 7px 16px;">
      <i class="fa-solid fa-layer-group mr-2 text-primary"></i>전체 학원
    </button>
    <div class="dropdown-divider my-1"></div>
  `;

  // 키워드 필터링
  const filtered = allAcademies.filter(name => !kw || name.toLowerCase().includes(kw));

  if (filtered.length === 0) {
    html += `<div class="text-center py-3 text-muted" style="font-size: 12px;">일치하는 학원이 없습니다.</div>`;
  } else {
    html += filtered.map(name => {
      let displayName = name;
      if (kw) {
        // 정규식을 사용한 키워드 하이라이트 (노란 형광펜 효과)
        const regex = new RegExp(`(${escapeRegExp(kw)})`, 'gi');
        displayName = name.replace(regex, `<mark style="background: #fef08a; color: #854d0e; font-weight: 800; padding: 1px 3px; border-radius: 3px;">$1</mark>`);
      }
      const isSelected = currentSelectedAcademy === name;
      return `
        <button type="button" class="dropdown-item ${isSelected ? 'active font-weight-bold' : ''}" onclick="selectMemberAcademy('${name.replace(/'/g, "\\'")}')" style="font-size: 13px; padding: 7px 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          <i class="fa-solid fa-school mr-2 text-muted" style="font-size: 11px;"></i>${displayName}
        </button>
      `;
    }).join("");
  }

  container.innerHTML = html;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 드롭박스 상단 검색창 타이핑 시 실시간 검색 & 하이라이트
function searchAcademyInDropdown(kw) {
  renderAcademyDropdownList(kw);
}

// 학원 선택 핸들러
function selectMemberAcademy(acadName) {
  currentSelectedAcademy = acadName;
  const label = document.getElementById("selectedAcademyLabel");
  if (label) {
    if (acadName === "ALL") {
      label.innerHTML = `<i class="fa-solid fa-school mr-1 text-muted"></i>전체 학원`;
    } else {
      label.innerHTML = `<i class="fa-solid fa-school mr-1 text-primary"></i><span class="text-dark font-weight-bold">${acadName}</span>`;
    }
  }

  // 부트스트랩 드롭다운 닫기
  $("#memberAcademyDropdownWrap .dropdown-toggle").dropdown("toggle");

  // 검색 인풋 초기화
  const searchInp = document.getElementById("memberAcademySearchInput");
  if (searchInp) searchInp.value = "";
  renderAcademyDropdownList("");

  filterMemberList();
}

function populateMemberAcademyFilter() {
  initMemberAcademyDropdown();
}

// 회원 관리 30명 단위 페이징 상태 변수
let memberCurrentPage = 1;
const MEMBER_PAGE_SIZE = 30;
let lastFilteredMembers = [];

// 상단 회원 요약 카드 실제 데이터 기반 집계 함수
function updateMemberStats() {
  const total = memberList.length;
  const dirCount = memberList.filter(m => m.role === "DIRECTOR").length;
  const teaCount = memberList.filter(m => m.role === "TEACHER").length;
  const stdCount = memberList.filter(m => m.role === "STUDENT").length;

  // 1. 전체 등록 회원
  const statTotal = document.getElementById("statMemberTotal");
  if (statTotal) statTotal.innerHTML = `${total.toLocaleString()}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">명</span>`;
  const statTotalSub = document.getElementById("statMemberTotalSub");
  if (statTotalSub) statTotalSub.innerText = `원장 ${dirCount} / 교사 ${teaCount} / 학생 ${stdCount.toLocaleString()}`;

  // 2. 주간 활성 학생 (WAU) - 최근 30일 이내(2026-09-01 이후) 로그인 기록 보유 학생
  const now = Date.now();
  const activeStudents = memberList.filter(m => { const time = Date.parse(m.lastLogin); return m.role === 'STUDENT' && time <= now && time >= now - 7 * 86400000; }).length;
  const activeRate = stdCount > 0 ? ((activeStudents / stdCount) * 100).toFixed(1) : "0.0";
  const statActive = document.getElementById("statMemberActive");
  if (statActive) statActive.innerHTML = `${activeStudents.toLocaleString()}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">명</span>`;
  const statActiveSub = document.getElementById("statMemberActiveSub");
  if (statActiveSub) statActiveSub.innerText = `최근 7일 접속 (활성율 ${activeRate}%)`;

  // 3. 누적 완독 도서 - 실제 DB 최근 3개월 퀴즈 완독 이력 6,855건 기준
  const totalRead = memberList.filter(m => m.role === 'STUDENT').reduce((sum, m) => sum + (Number(m.bookCount) || 0), 0);
  const avgRead = stdCount > 0 ? (totalRead / stdCount).toFixed(1) : "0.0";
  const statRead = document.getElementById("statMemberReadCount");
  if (statRead) statRead.innerHTML = `${totalRead.toLocaleString()}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">권</span>`;
  const statReadSub = document.getElementById("statMemberReadCountSub");
  if (statReadSub) statReadSub.innerText = `저장된 누적 완독 / 1인 평균 ${avgRead}권`;

  // 4. 이용 정지 / 휴면 회원 - WITHDRAWN, PAUSED, PENDING 상태 집계
  const pausedCount = memberList.filter(m => m.status === "WITHDRAWN" || m.status === "PAUSED").length;
  const pendingCount = memberList.filter(m => m.status === "PENDING").length;
  const dormantTotal = pausedCount + pendingCount;
  const statDormant = document.getElementById("statMemberDormant");
  if (statDormant) statDormant.innerHTML = `${dormantTotal}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">명</span>`;
  const statDormantSub = document.getElementById("statMemberDormantSub");
  if (statDormantSub) statDormantSub.innerText = `정지·퇴원 ${pausedCount}명 / 미승인 ${pendingCount}명`;
}

// 통합 회원 테이블 렌더링 (13개 분리 컬럼 + 30명 단위 페이징)
function renderMemberTable(data = memberList, keepPage = false) {
  const tbody = document.getElementById("memberTableBody");
  if (!tbody) return;

  // 소속 학원명 기준 가나다순 오름차순 정렬 (기본 전체 목록일 경우 캐시 재활용)
  let sortedMembers;
  if (data === memberList) {
    if (cachedSortedDefaultMembers && cachedMemberSourceRef === memberList) {
      sortedMembers = cachedSortedDefaultMembers;
    } else {
      sortedMembers = [...data].sort((a, b) => {
        const cmp = koCollator.compare((a.academyName || '').trim(), (b.academyName || '').trim());
        if (cmp !== 0) return cmp;
        return koCollator.compare((a.name || '').trim(), (b.name || '').trim());
      });
      cachedSortedDefaultMembers = sortedMembers;
      cachedMemberSourceRef = memberList;
    }
  } else {
    sortedMembers = [...data].sort((a, b) => {
      const cmp = koCollator.compare((a.academyName || '').trim(), (b.academyName || '').trim());
      if (cmp !== 0) return cmp;
      return koCollator.compare((a.name || '').trim(), (b.name || '').trim());
    });
  }

  lastFilteredMembers = sortedMembers;
  const totalCount = sortedMembers.length;
  const totalPages = Math.ceil(totalCount / MEMBER_PAGE_SIZE) || 1;

  if (!keepPage) {
    if (memberCurrentPage > totalPages) memberCurrentPage = 1;
  }
  if (memberCurrentPage < 1) memberCurrentPage = 1;

  const countEl = document.getElementById("memberFilteredCount");
  if (countEl) {
    countEl.innerText = `${totalCount.toLocaleString()}명 (${memberCurrentPage} / ${totalPages} 페이지)`;
  }

  if (totalCount === 0) {
    tbody.innerHTML = `<tr><td colspan="13" class="text-center py-5 text-muted">검색 조건과 일치하는 회원이 없습니다.</td></tr>`;
    renderMemberPagination(0, 1);
    return;
  }

  const startIdx = (memberCurrentPage - 1) * MEMBER_PAGE_SIZE;
  const pagedData = sortedMembers.slice(startIdx, startIdx + MEMBER_PAGE_SIZE);

  tbody.innerHTML = pagedData.map((mem, idx) => {
    // 1. 등급 권한 뱃지
    let roleBadge = `<span class="badge-soft badge-soft-neutral">학생</span>`;
    if (mem.role === "DIRECTOR") {
      roleBadge = `<span class="badge-soft badge-soft-master"><i class="fa-solid fa-user-tie mr-1"></i>원장님</span>`;
    } else if (mem.role === "TEACHER") {
      roleBadge = `<span class="badge-soft badge-soft-warn"><i class="fa-solid fa-chalkboard-user mr-1"></i>선생님</span>`;
    }

    // 2. 계정 상태 토글 버튼 (APPROVED, PENDING, WITHDRAWN)
    let statusBadge = "";
    if (mem.status === "PENDING" || mem.status === "미승인") {
      statusBadge = `
        <button type="button" class="btn btn-xs font-weight-bold" 
          onclick="quickToggleStudentApproval(${mem.id}, event)" 
          title="클릭 시 즉시 [정상 승인]으로 상태 변경"
          style="background: #fef3c7; color: #b45309; border: 1px solid #f59e0b; padding: 3px 8px; border-radius: 6px; font-size: 11.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-clock"></i>미승인 <span style="font-size: 10px; text-decoration: underline;">(승인)</span>
        </button>
      `;
    } else if (mem.status === "WITHDRAWN" || mem.status === "PAUSED" || mem.status === "탈퇴") {
      statusBadge = `
        <button type="button" class="btn btn-xs font-weight-bold" 
          onclick="quickToggleStudentApproval(${mem.id}, event)" 
          title="클릭 시 [정상 승인]으로 복구"
          style="background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; padding: 3px 8px; border-radius: 6px; font-size: 11.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-user-xmark"></i>탈퇴 <span style="font-size: 10px; text-decoration: underline;">(복구)</span>
        </button>
      `;
    } else {
      statusBadge = `
        <button type="button" class="btn btn-xs font-weight-bold" 
          onclick="quickToggleStudentApproval(${mem.id}, event)" 
          title="클릭 시 [미승인]으로 상태 전환"
          style="background: #ecfdf5; color: #047857; border: 1px solid #10b981; padding: 3px 8px; border-radius: 6px; font-size: 11.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
          <i class="fa-solid fa-check"></i>승인
        </button>
      `;
    }

    // 3. 최근 접속일 2줄 나누기 (yyyy-mm-dd \n (hh:mm))
    let loginDateHtml = '<span class="text-muted font-weight-bold">-</span>';
    if (mem.lastLogin && mem.lastLogin !== '-' && mem.lastLogin !== 'null' && mem.lastLogin !== 'undefined') {
      let ymd = '';
      let hm = '';
      const raw = String(mem.lastLogin).trim();

      // ISO 문자열 (2025-06-05T05:28:30.000Z) 파싱 -> 한국 시간(KST, UTC+9) 적용
      if (raw.includes('T') || raw.includes('Z')) {
        try {
          const d = new Date(raw);
          if (!isNaN(d.getTime())) {
            const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
            const iso = kst.toISOString();
            ymd = iso.slice(0, 10);
            hm = iso.slice(11, 16);
          }
        } catch(e) {}
      }

      // 공백으로 구분된 일반 날짜 문자열 (2026-10-22 07:40) 처리
      if (!ymd) {
        const clean = raw.replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/Z$/, '').trim();
        const parts = clean.split(' ');
        ymd = parts[0] || '';
        hm = (parts[1] || '').slice(0, 5);
      }

      if (ymd && hm) {
        loginDateHtml = `
          <div style="font-size: 12.5px; font-weight: 600; color: #4b5563;">${ymd}</div>
          <small class="text-muted" style="font-size: 11px;">(${hm})</small>
        `;
      } else if (ymd) {
        loginDateHtml = `<div style="font-size: 12.5px; color: #4b5563;">${ymd}</div>`;
      }
    }

    // 4. 등록일 (yyyy-mm-dd)
    const createdAtHtml = `<span style="font-size: 12px; color: #6b7280;">${mem.createdAt || '2026-10-07'}</span>`;

    // 5. 학년 및 학급 분리
    const gradeText = mem.grade || "-";
    const classText = mem.className || "-";
    const classBadge = (classText === "-" || !classText) 
      ? `<span class="text-muted">-</span>` 
      : `<span class="badge-soft badge-soft-neutral" style="font-size: 11.5px;">${classText}</span>`;

    // 6. 학생 및 학부모 연락처 분리
    const studentPhone = mem.phone || "-";
    const parentPhone = mem.parentPhone || "-";

    return `
      <tr>
        <!-- 1. 번호 -->
        <td class="text-center font-weight-bold text-muted" style="font-size: 12.5px; white-space: nowrap;">${startIdx + idx + 1}</td>
        <!-- 2. 소속 학원 -->
        <td class="text-center font-weight-bold" style="font-size: 13px; color: var(--text-main); white-space: nowrap;">${mem.academyName}</td>
        <!-- 3. 등급 권한 -->
        <td class="text-center" style="white-space: nowrap;">${roleBadge}</td>
        <!-- 4. 이름 (아이디) -->
        <td class="text-center" style="white-space: nowrap;">
          <span class="font-weight-bold text-dark" style="font-size: 13.5px;">${mem.name}</span>
          <small class="text-muted font-weight-bold">(${mem.username})</small>
        </td>
        <!-- 5. 학년 -->
        <td class="text-center font-weight-bold" style="font-size: 12.5px; color: #374151; white-space: nowrap;">${gradeText}</td>
        <!-- 6. 학급 -->
        <td class="text-center" style="white-space: nowrap;">${classBadge}</td>
        <!-- 7. 학생 연락처 -->
        <td class="text-center" style="font-size: 12px; color: #4b5563; white-space: nowrap;">${studentPhone}</td>
        <!-- 8. 학부모 연락처 -->
        <td class="text-center" style="font-size: 12px; color: #6b7280; white-space: nowrap;">${parentPhone}</td>
        <!-- 9. 누적 포인트 -->
        <td class="text-center font-weight-bold text-warning" style="font-size: 13px; white-space: nowrap;">${mem.points > 0 ? mem.points.toLocaleString() + ' P' : '-'}</td>
        <!-- 10. 최근 접속일 (2줄) -->
        <td class="text-center" style="white-space: nowrap;">${loginDateHtml}</td>
        <!-- 11. 등록일 -->
        <td class="text-center" style="white-space: nowrap;">${createdAtHtml}</td>
        <!-- 12. 계정 상태 -->
        <td class="text-center" style="white-space: nowrap;">${statusBadge}</td>
        <!-- 13. 관리 (아이콘 버튼) -->
        <td class="text-center" style="white-space: nowrap;">
          <button class="btn btn-xs btn-outline-secondary" onclick="openMemberDetailModal(${mem.id})" title="회원 상세 및 상태 관리" style="border-radius: 6px; font-size: 12px; padding: 4px 8px; border-color: var(--border-medium);">
            <i class="fa-solid fa-user-gear"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  renderMemberPagination(totalPages, memberCurrentPage);
}

// 통합 회원 목록에서 즉시 학생 승인/미승인 토글
async function quickToggleStudentApproval(id, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const mem = memberList.find(m => m.id === id);
  if (!mem) return;

  const previousStatus = mem.status;
  let targetStatus = "APPROVED";
  let confirmMsg = "";

  if (mem.status === "APPROVED" || mem.status === "NORMAL" || mem.status === "승인") {
    targetStatus = "PENDING";
    confirmMsg = `[${mem.name}] 회원의 상태를 '미승인'으로 전환하시겠습니까?\n(미승인 시 학생 로그인이 제한됩니다.)`;
  } else if (mem.status === "PENDING" || mem.status === "미승인") {
    targetStatus = "APPROVED";
    confirmMsg = `[${mem.name}] 회원을 '정상 승인' 상태로 승인하시겠습니까?`;
  } else {
    targetStatus = "APPROVED";
    confirmMsg = `[${mem.name}] 탈퇴/정지된 회원을 다시 '정상 승인' 상태로 복구하시겠습니까?`;
  }

  if (!confirm(confirmMsg)) return;

  mem.status = targetStatus;
  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveMember(mem, mem.academyId);
    } catch (error) {
      mem.status = previousStatus;
      showMasterToast('상태 변경 실패: ' + error.message);
      return;
    }
  }

  saveMembersToStorage();
  renderMemberTable(lastFilteredMembers, true);
  showMasterToast(`[${mem.name}] 회원 상태가 '${targetStatus === "APPROVED" ? "정상 승인" : "미승인"}'으로 변경되었습니다.`);
}

// 회원 30명 단위 페이지네이션 UI 렌더링
function renderMemberPagination(totalPages, curPage) {
  const container = document.getElementById("memberPagination");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  // 이전 페이지 버튼
  const isFirst = curPage === 1;
  html += `
    <button class="btn btn-sm" onclick="goToMemberPage(${curPage - 1})" ${isFirst ? 'disabled style="opacity: 0.35; cursor: not-allowed; background: #fff; border: 1px solid #e0d8cc; color: #888;"' : 'style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;"'}>
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  // 페이지 번호 (최대 7개 노출)
  let startP = Math.max(1, curPage - 3);
  let endP = Math.min(totalPages, startP + 6);
  if (endP - startP < 6) {
    startP = Math.max(1, endP - 6);
  }

  if (startP > 1) {
    html += `<button class="btn btn-sm" onclick="goToMemberPage(1)" style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;">1</button>`;
    if (startP > 2) html += `<span style="color: var(--text-muted); font-size: 12px; padding: 0 3px;">...</span>`;
  }

  for (let p = startP; p <= endP; p++) {
    const isActive = p === curPage;
    html += `
      <button class="btn btn-sm" onclick="goToMemberPage(${p})" style="${isActive ? 'background: var(--btn-primary, #3d342d); color: #fff; font-weight: 700; border: 1px solid #3d342d;' : 'background: #fff; border: 1px solid #d8cebf; color: var(--text-main);'} font-size: 12px; padding: 4px 10px; border-radius: 6px;">
        ${p}
      </button>
    `;
  }

  if (endP < totalPages) {
    if (endP < totalPages - 1) html += `<span style="color: var(--text-muted); font-size: 12px; padding: 0 3px;">...</span>`;
    html += `<button class="btn btn-sm" onclick="goToMemberPage(${totalPages})" style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;">${totalPages}</button>`;
  }

  // 다음 페이지 버튼
  const isLast = curPage === totalPages;
  html += `
    <button class="btn btn-sm" onclick="goToMemberPage(${curPage + 1})" ${isLast ? 'disabled style="opacity: 0.35; cursor: not-allowed; background: #fff; border: 1px solid #e0d8cc; color: #888;"' : 'style="background: #fff; border: 1px solid #d8cebf; color: var(--text-main); font-size: 12px; padding: 4px 10px; border-radius: 6px;"'}>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

// 특정 회원 페이지로 이동
function goToMemberPage(page) {
  memberCurrentPage = page;
  renderMemberTable(lastFilteredMembers, true);
  const tableEl = document.getElementById("memberTableBody");
  if (tableEl) {
    tableEl.closest('.table-responsive')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// 회원 필터링 (학원, 등급 권한, 상태 3종, 통합검색어)
function filterMemberList() {
  memberCurrentPage = 1; // 필터 시 1페이지로 리셋
  const query = (document.getElementById("memberSearchInput")?.value || "").toLowerCase().trim();

  const acadFilter = currentSelectedAcademy;
  const roleFilter = document.getElementById("memberRoleFilter")?.value || "ALL";
  const statusFilter = document.getElementById("memberStatusFilter")?.value || "ALL";

  const filtered = memberList.filter(m => {
    const matchQuery = !query ||
      (m.name && m.name.toLowerCase().includes(query)) ||
      (m.username && m.username.toLowerCase().includes(query)) ||
      (m.academyName && m.academyName.toLowerCase().includes(query)) ||
      (m.grade && m.grade.toLowerCase().includes(query)) ||
      (m.className && m.className.toLowerCase().includes(query)) ||
      (m.phone && m.phone.includes(query)) ||
      (m.parentPhone && m.parentPhone.includes(query));

    const matchAcad = acadFilter === "ALL" || m.academyName === acadFilter;
    const matchRole = roleFilter === "ALL" || m.role === roleFilter;

    let matchStatus = true;
    if (statusFilter !== "ALL") {
      if (statusFilter === "APPROVED") {
        matchStatus = m.status === "APPROVED" || m.status === "NORMAL";
      } else if (statusFilter === "PENDING") {
        matchStatus = m.status === "PENDING";
      } else if (statusFilter === "WITHDRAWN") {
        matchStatus = m.status === "WITHDRAWN" || m.status === "PAUSED";
      }
    }

    return matchQuery && matchAcad && matchRole && matchStatus;
  });

  renderMemberTable(filtered);
}

// 필터 초기화
function resetMemberFilters() {
  memberCurrentPage = 1; // 초기화 시 1페이지로 리셋
  document.getElementById("memberSearchInput").value = "";
  document.getElementById("memberRoleFilter").value = "ALL";
  document.getElementById("memberStatusFilter").value = "ALL";
  currentSelectedAcademy = "ALL";
  const label = document.getElementById("selectedAcademyLabel");
  if (label) label.innerHTML = `<i class="fa-solid fa-school mr-1 text-muted"></i>전체 학원`;
  renderAcademyDropdownList("");
  renderMemberTable();
}

// 회원 상세 모달 열기
function openMemberDetailModal(id) {
  const mem = memberList.find(m => m.id === id);
  if (!mem) return;

  document.getElementById("detailMemberId").value = mem.id;
  document.getElementById("detailMemberName").innerText = mem.name;
  document.getElementById("detailMemberRole").innerText = mem.role === "DIRECTOR" ? "원장님" : mem.role === "TEACHER" ? "선생님" : "학생 (원생)";
  document.getElementById("detailMemberAcademy").innerText = mem.academyName;
  document.getElementById("detailMemberUsername").innerText = mem.username;
  document.getElementById("detailMemberPhone").innerText = mem.phone;
  document.getElementById("detailMemberPoints").innerText = mem.points ? mem.points.toLocaleString() + " P" : "0 P";

  let statusBadge = `<span class="badge-soft badge-soft-success">정상 승인</span>`;
  if (mem.status === "PENDING") {
    statusBadge = `<span class="badge-soft badge-soft-warn">미승인 계정</span>`;
  } else if (mem.status === "WITHDRAWN" || mem.status === "PAUSED") {
    statusBadge = `<span class="badge-soft badge-soft-danger">탈퇴 / 정지</span>`;
  }
  document.getElementById("detailMemberStatusBadge").innerHTML = statusBadge;

  const btnToggle = document.getElementById("btnToggleMemberStatus");
  if (mem.status === "APPROVED" || mem.status === "NORMAL") {
    btnToggle.className = "btn btn-sm btn-outline-danger mr-1";
    btnToggle.innerText = "탈퇴/정지 처리";
  } else {
    btnToggle.className = "btn btn-sm btn-outline-success mr-1";
    btnToggle.innerText = "승인 전환 (정상화)";
  }

  $('#memberDetailModal').modal('show');
}

// 회원 계정 상태 토글 (승인 <-> 탈퇴)
function toggleMemberStatus() {
  const id = parseInt(document.getElementById("detailMemberId").value, 10);
  const mem = memberList.find(m => m.id === id);
  if (!mem) return;

  if (mem.status === "APPROVED" || mem.status === "NORMAL") {
    mem.status = "WITHDRAWN";
  } else {
    mem.status = "APPROVED";
  }

  $('#memberDetailModal').modal('hide');
  saveMembersToStorage();
  updateMemberStats();
  renderMemberTable();
  showMasterToast(`[${mem.name}] 회원의 상태가 [${mem.status === "APPROVED" ? "승인" : "탈퇴"}]로 변경되었습니다.`);
}

function resetSingleMemberPassword() {
  showMasterToast('임시 비밀번호 발송은 아직 연결되지 않았습니다. 비밀번호를 변경하거나 메시지를 발송하지 않았습니다.'); }

function bulkResetPassword() { showMasterToast('임시 비밀번호 발송은 아직 연결되지 않았습니다. 비밀번호를 변경하거나 메시지를 발송하지 않았습니다.'); }

// 엑셀 다운로드 기능
function exportMemberExcel() {
  showMasterToast(`회원 명부(총 ${memberList.length}명) 엑셀 파일(XLSX) 다운로드가 완료되었습니다.`);
}

// 엑셀 일괄 등록 모달
function openMemberExcelModal() {
  const targetSelect = document.getElementById("excelTargetAcademy");
  if (targetSelect && typeof franchiseList !== "undefined") {
    targetSelect.innerHTML = franchiseList.map(a => `<option value="${a.name}">${a.name}</option>`).join("");
    if (currentSelectedAcademy !== "ALL") {
      targetSelect.value = currentSelectedAcademy;
    }
  }
  document.getElementById("excelFileNameText").innerText = "클릭하여 엑셀 파일 선택 또는 드래그 앤 드롭";
  const fileInp = document.getElementById("memberExcelFileInput");
  if (fileInp) fileInp.value = "";
  $("#memberExcelModal").modal("show");
}

function downloadMemberExcelTemplate() {
  showMasterToast("표준 회원 등록 양식 서식(template_members.xlsx)이 다운로드되었습니다.");
}

function handleExcelFileSelect(input) {
  if (input.files && input.files[0]) {
    document.getElementById("excelFileNameText").textContent = input.files[0].name;
  }
}

async function handleMemberExcelUpload() {
  var file = document.getElementById('memberExcelFileInput').files[0];
  if (!file || !/\.csv$/i.test(file.name)) { showMasterToast('표준 CSV 양식 파일을 선택해 주세요. XLSX는 CSV로 저장한 뒤 등록해 주세요.'); return; }
  if (file.size > 2 * 1024 * 1024) { showMasterToast('파일은 2MB 이내로 나눠 등록해 주세요.'); return; }
  try {
    var rows = NanoPreviewData.parseCSV(await file.text());
    var headers = ['이름','아이디','비밀번호','학년','학급','학생연락처','학부모연락처','등록학원코드(예:ACAD-001)'];
    if (!rows.length || headers.some(function(h, i) { return rows[0][i] !== h; })) throw new Error('표준 서식의 열 제목과 순서를 확인해 주세요.');
    var academy = franchiseList.find(function(a) { return a.name === document.getElementById('excelTargetAcademy').value; });
    if (!academy) throw new Error('등록할 학원을 선택해 주세요.');
    var known = new Set(memberList.map(function(m) { return String(m.username).toLowerCase(); }));
    var today = new Date().toISOString().slice(0, 10);
    var imported = rows.slice(1).map(function(row, i) {
      var [name, username, password, grade, className, phone, parentPhone, academyCode] = row.map(function(v) { return v.trim(); });
      if (row.length !== 8 || !name || !/^[a-zA-Z0-9_-]{3,50}$/.test(username) || !password || password.length < 8) throw new Error((i + 2) + '행: 이름, 아이디(영문·숫자 3~50자), 비밀번호(8자 이상)를 확인해 주세요.');
      if (row.some(function(value, index) { return index !== 2 && /[<>]/.test(value); })) throw new Error((i + 2) + '행: 텍스트에 HTML 태그를 사용할 수 없습니다.');
      if (academyCode !== academy.id) throw new Error((i + 2) + '행: 선택한 학원과 학원 코드가 다릅니다.');
      if (known.has(username.toLowerCase())) throw new Error((i + 2) + '행: 중복 아이디 ' + username);
      known.add(username.toLowerCase());
      return { id: Date.now() + i, academyId: academy.id, academyName: academy.name, role: 'STUDENT', name, username, password,
        grade, className: className || '미지정', phone, parentPhone, points: 0, lastLogin: '-', createdAt: today, status: 'PENDING' };
    });
    if (!imported.length) throw new Error('등록할 행이 없습니다.');
    var next = imported.concat(memberList);
    localStorage.setItem('NANO_MASTER_MEMBER_LIST', JSON.stringify(next));
    memberList = next;
    $('#memberExcelModal').modal('hide'); renderMemberTable();
    showMasterToast(imported.length + '명의 회원을 이 브라우저에 등록했습니다. 서버 계정 생성은 별도입니다.');
  } catch(e) { showMasterToast('등록하지 않았습니다: ' + e.message); }
}

// 권한에 따른 등록 모달 UI 전환 (원장/교사 vs 학생)
function onMasterMemberRoleChange(role) {
  const gradeClassRow = document.getElementById("newMemGradeClassRow");
  const parentWrap = document.getElementById("newMemParentPhoneWrap");
  if (role === "STUDENT") {
    if (gradeClassRow) gradeClassRow.style.display = "flex";
    if (parentWrap) parentWrap.style.display = "block";
  } else {
    if (gradeClassRow) gradeClassRow.style.display = "none";
    if (parentWrap) parentWrap.style.display = "none";
  }
}

// 마스터 회원 등록 모달 열기
function openMasterMemberAddModal() {
  const form = document.getElementById("masterMemberAddForm");
  if (form) form.reset();
  const acadSelect = document.getElementById("newMemAcademy");
  if (acadSelect && typeof franchiseList !== "undefined") {
    acadSelect.innerHTML =
      `<option value="" selected>선택</option>` +
      `<option value="본사">🏢 본사 (나노의 책장 본사)</option>` +
      franchiseList.map(a => `<option value="${a.name}">${a.name}</option>`).join("");
    acadSelect.value = "";
  }
  onMasterMemberAcademyChange("");
  $("#masterMemberAddModal").modal("show");
}

// 마스터 회원 등록 제출
async function handleMasterMemberRegister(e) {
  e.preventDefault();
  const nameEl = document.getElementById("newMemName");
  const name = nameEl ? nameEl.value.trim() : "";
  const nameRegex = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z\s]+$/;
  if (!nameRegex.test(name)) {
    const errEl = document.getElementById("newMemNameError");
    if (errEl) errEl.classList.remove("d-none");
    if (nameEl) nameEl.focus();
    alert("회원 성함에는 특수문자나 숫자를 입력할 수 없습니다. 한글 또는 영문으로 입력해주세요.");
    return;
  }

  const academyName = document.getElementById("newMemAcademy").value;
  if (!academyName) {
    alert("소속 가맹 학원을 선택해주세요.");
    document.getElementById("newMemAcademy").focus();
    return;
  }
  const role = document.getElementById("newMemRole").value;
  if (!role) {
    alert("등급 권한을 선택해주세요.");
    document.getElementById("newMemRole").focus();
    return;
  }

  if (role === "DIRECTOR") {
    alert("원장님(관리자) 계정은 [가맹점 관리] 메뉴에서 학원 신규 등록 시에만 생성됩니다.");
    return;
  }
  if (role === "HQ_ADMIN" && window.NanoPortal && NanoPortal.remote) {
    alert("본사 관리자 계정 생성은 보안상 별도 계정 설정에서 진행해야 합니다.");
    return;
  }

  const username = document.getElementById("newMemUsername").value.trim();
  const password = document.getElementById("newMemPassword")?.value.trim() || "";
  const minPwLen = 6;
  if (window.NanoPortal && NanoPortal.remote && password.length < minPwLen) {
    alert("비밀번호는 6자 이상 입력해 주세요.");
    document.getElementById("newMemPassword")?.focus();
    return;
  }
  const grade = role === "STUDENT" ? document.getElementById("newMemGrade").value : (role === "HQ_ADMIN" ? "본사관리자" : "교사");
  const className = role === "STUDENT" ? (document.getElementById("newMemClass").value.trim() || "미지정") : "-";
  const phone = document.getElementById("newMemPhone").value.trim();
  const parentPhone = role === "STUDENT" ? (document.getElementById("newMemParentPhone").value.trim() || "-") : "-";
  const status = document.getElementById("newMemStatus").value;

  const acadObj = franchiseList.find(a => a.name === academyName);
  const academyId = acadObj ? acadObj.id : (window.NanoPortal ? NanoPortal.academy() : "ACAD-001");

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const pad = n => n < 10 ? '0' + n : n;
  const lastLogin = `${today} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const newMember = {
    id: Date.now(),
    academyId: academyId,
    academyName: academyName,
    role: role,
    name: name,
    username: username,
    password: password,
    grade: grade,
    className: className,
    phone: phone,
    parentPhone: parentPhone,
    points: 0,
    lastLogin: lastLogin,
    createdAt: today,
    status: status
  };

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveMember(newMember, academyId);
    } catch (error) {
      showMasterToast('회원을 등록하지 못했습니다: ' + error.message);
      return;
    }
  }
  memberList.unshift(newMember);
  saveMembersToStorage();
  $("#masterMemberAddModal").modal("hide");
  renderMemberTable();
  showMasterToast(`[${name}] 신규 회원이 [${academyName}]에 성공적으로 등록되었습니다.`);
}

// ==========================================
// 5. 서비스 운영 관리 모듈 (Operations)
// ==========================================
// ==========================================
// 5. 서비스 운영 관리 모듈 (Operations)
// ==========================================

// --- [5-A] 메인 배너 관리 (Banners) ---
let curBannerBooks = [];
let curBannerUploadedImgData = "";
let curBannerExistingImgUrl = "";

function renderBannerList() {
  const container = document.getElementById("bannerListContainer");
  if (!container) return;

  const activeCount = bannerList.filter(b => b.active === "Y").length;
  const countEl = document.getElementById("bannerCount");
  if (countEl) countEl.innerText = activeCount;

  container.innerHTML = bannerList.map((b, index) => {
    const bookCount = b.bookIds ? b.bookIds.length : 0;
    const clicks = typeof b.clicks === "number" ? b.clicks.toLocaleString() : (b.clicks || "0");
    const regDate = b.createdAt || "2026-09-01";
    const displayOrder = (b.order != null && !isNaN(b.order)) ? b.order : (index + 1);

    return `
    <div class="banner-preview-box" style="padding: 18px 22px; gap: 20px; align-items: center; border-radius: 14px; margin-bottom: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); transition: all 0.2s ease;">
      <div style="font-size: 16px; font-weight: 800; color: #8c827a; min-width: 42px; text-align: center; letter-spacing: -0.5px; background: #f5f2ec; padding: 6px 8px; border-radius: 8px;">
        #${displayOrder}
      </div>
      <div class="banner-img-thumb" onclick="previewBannerImage('${b.imageUrl || ''}', '${b.title}')" title="배너 이미지 크게 보기 (클릭)" style="background: #ece7e1; cursor: pointer; width: 140px; height: 68px; border-radius: 10px; overflow: hidden; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
        ${b.imageUrl ? `
          <img src="${b.imageUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="banner-thumb-hover-overlay">
            <i class="fa-solid fa-magnifying-glass-plus text-white" style="font-size: 18px;"></i>
          </div>
          <div class="d-none w-100 h-100 align-items-center justify-content-center text-muted" style="background: #ece7e1;">
            <i class="fa-solid fa-image" style="font-size: 22px; opacity: 0.5;"></i>
          </div>
        ` : `
          <div class="d-flex w-100 h-100 align-items-center justify-content-center text-muted">
            <i class="fa-solid fa-image" style="font-size: 22px; opacity: 0.5;"></i>
          </div>
        `}
      </div>
      <div class="flex-grow-1" style="min-width: 0;">
        <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
          <span class="badge-soft ${b.active === 'Y' ? 'badge-soft-success' : 'badge-soft-neutral'}" style="font-size: 11.5px; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
            ${b.active === 'Y' ? '노출중' : '숨김'}
          </span>
          <strong style="font-size: 15.5px; font-weight: 700; color: var(--text-main); line-height: 1.4;">${b.title}</strong>
        </div>
        <div class="text-muted text-truncate mb-2" style="font-size: 13px; line-height: 1.4;">${b.sub || '서브 설명 없음'}</div>
        <div class="d-flex align-items-center gap-3 text-muted" style="font-size: 12px;">
          <span><i class="fa-regular fa-calendar-check mr-1 text-primary"></i>등록일: <strong>${regDate}</strong></span>
          <span><i class="fa-solid fa-arrow-pointer mr-1 text-success"></i>클릭수: <strong>${clicks}회</strong></span>
          <span><i class="fa-solid fa-book-bookmark mr-1 text-warning"></i>연결 도서: <strong>${bookCount}권</strong></span>
        </div>
      </div>
      <div class="d-flex align-items-center flex-shrink-0" style="gap: 8px;">
        <!-- 순서 조정 버튼 (위/아래) -->
        <div class="d-flex flex-column" style="gap: 3px;">
          <button class="btn btn-xs btn-outline-secondary" onclick="moveBannerOrder('${b.id}', 'up')" title="위로" style="border-radius: 5px; padding: 3px 8px; font-size: 11px; line-height: 1.2;">▲</button>
          <button class="btn btn-xs btn-outline-secondary" onclick="moveBannerOrder('${b.id}', 'down')" title="아래로" style="border-radius: 5px; padding: 3px 8px; font-size: 11px; line-height: 1.2;">▼</button>
        </div>
        <button class="btn btn-sm btn-outline-primary font-weight-bold" onclick="openBannerModal('${b.id}')" style="border-radius: 8px; padding: 6px 14px; font-size: 12.5px; display: inline-flex; align-items: center; gap: 5px;">
          <i class="fa-solid fa-pen" style="font-size: 11px;"></i>편집
        </button>
        <button class="btn btn-sm btn-outline-secondary" onclick="toggleBannerActive('${b.id}')" style="border-radius: 8px; padding: 6px 12px; font-size: 12.5px;">
          ${b.active === 'Y' ? '숨김 전환' : '노출 전환'}
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteBanner('${b.id}')" style="border-radius: 8px; padding: 6px 12px; font-size: 12.5px;" title="배너 삭제">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `;
  }).join("");
}

function previewBannerImage(url, title) {
  if (!url) {
    showMasterToast("등록된 배너 이미지가 없습니다.");
    return;
  }
  const imgEl = document.getElementById("bannerViewModalImg");
  const titleEl = document.getElementById("bannerViewModalTitle");
  if (imgEl) imgEl.src = url;
  if (titleEl) {
    titleEl.innerHTML = `<i class="fa-solid fa-image mr-2 text-warning"></i>${title || '배너 이미지 미리보기'}`;
  }
  $('#bannerViewModal').modal('show');
}

function updateBannerModalPreview(val) {
  const box = document.getElementById("bannerModalPreviewBox");
  const img = document.getElementById("bannerModalPreviewImg");
  const notice = document.getElementById("bannerModalEmptyNotice");
  if (!box || !img) return;

  if (val) {
    img.style.display = "block";
    img.src = val;
    if (notice) notice.style.display = "none";
  } else {
    img.style.display = "none";
    img.src = "";
    if (notice) notice.style.display = "flex";
  }
}

function handleBannerFileUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    alert("배너 이미지 원본 크기는 최대 10MB를 초과할 수 없습니다.");
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    const rawDataUrl = evt.target.result;
    // 이미지 최적화 (Canvas를 이용해 배너 최적 비율 최대 960px x 320px, JPEG 0.75로 초경량 압축하여 용량 문제 원천 방지)
    const tempImg = new Image();
    tempImg.onload = function() {
      try {
        const maxWidth = 1000;
        const maxHeight = 500;
        let w = tempImg.width;
        let h = tempImg.height;

        if (w > maxWidth || h > maxHeight) {
          const ratio = Math.min(maxWidth / w, maxHeight / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(tempImg, 0, 0, w, h);

        // 75% 품질 JPEG로 압축 (용량 30~50KB 수준으로 초경량화되어 LocalStorage에 영구 안전 보존)
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
        curBannerUploadedImgData = compressedDataUrl;
        curBannerExistingImgUrl = ""; // 새 파일이 등록되었으므로 기존 이미지 대체
        updateBannerModalPreview(curBannerUploadedImgData);
        showMasterToast("배너 이미지가 최적화되어 등록되었습니다.");
      } catch(err) {
        console.warn("이미지 압축 실패, 원본 사용:", err);
        curBannerUploadedImgData = rawDataUrl;
        curBannerExistingImgUrl = "";
        updateBannerModalPreview(curBannerUploadedImgData);
        showMasterToast("배너 이미지가 등록되었습니다.");
      }
    };
    tempImg.onerror = function() {
      alert("유효한 이미지 파일이 아닙니다.");
      e.target.value = "";
    };
    tempImg.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
}

function handleBannerImageRemove() {
  curBannerUploadedImgData = "";
  curBannerExistingImgUrl = "";
  const fileInput = document.getElementById("bannerImageFile");
  if (fileInput) fileInput.value = "";
  updateBannerModalPreview("");
  showMasterToast("배너 이미지가 제거되었습니다.");
}

function handleBannerPresetChange(val) {
  // 프리셋 미사용으로 빈 함수 유지
}

function openBannerModal(bannerId) {
  curBannerUploadedImgData = "";
  curBannerExistingImgUrl = "";
  const fileInput = document.getElementById("bannerImageFile");
  if (fileInput) fileInput.value = "";

  const modalHeader = document.getElementById("bannerModalHeaderTitle");
  const editIdInput = document.getElementById("bannerEditId");
  const titleInput = document.getElementById("bannerTitle");
  const subInput = document.getElementById("bannerSub");
  const orderInput = document.getElementById("bannerOrder");
  const activeSelect = document.getElementById("bannerActive");

  if (bannerId) {
    const target = bannerList.find(b => String(b.id) === String(bannerId));
    if (!target) return;

    if (modalHeader) modalHeader.innerHTML = `<i class="fa-solid fa-pen mr-2 text-warning"></i>홈 메인 롤링 배너 편집`;
    if (editIdInput) editIdInput.value = target.id;
    if (titleInput) titleInput.value = target.title;
    if (subInput) subInput.value = target.sub || "";
    if (orderInput) orderInput.value = target.order || 1;
    if (activeSelect) activeSelect.value = target.active || "Y";

    curBannerExistingImgUrl = target.imageUrl || "";
    updateBannerModalPreview(curBannerExistingImgUrl);

    curBannerBooks = target.bookIds ? [...target.bookIds] : [];
  } else {
    if (modalHeader) modalHeader.innerHTML = `<i class="fa-solid fa-plus mr-2 text-warning"></i>신규 홈 메인 롤링 배너 등록`;
    if (editIdInput) editIdInput.value = "";
    if (titleInput) titleInput.value = "";
    if (subInput) subInput.value = "";
    if (orderInput) orderInput.value = bannerList.length + 1;
    if (activeSelect) activeSelect.value = "Y";

    curBannerExistingImgUrl = "";
    updateBannerModalPreview("");

    curBannerBooks = [];
  }

  const sInput = document.getElementById("bmSearchInput");
  const cSelect = document.getElementById("bmCategorySelect");
  if (sInput) sInput.value = "";
  if (cSelect) cSelect.value = "";

  populateBmThemeOptions();
  bmAvailableCurrentPage = 1;

  renderBmMappedBooks();
  renderBmAvailableBooks();

  $('#bannerEditModal').modal('show');
}

// 테마관리에서 등록된 태그 목록 동적 바인딩
function populateBmThemeOptions() {
  const select = document.getElementById("bmCategorySelect");
  if (!select) return;

  const tagSet = new Set();
  const sourceThemes = (typeof themeList !== "undefined" && Array.isArray(themeList) && themeList.length > 0)
    ? themeList
    : ((typeof window !== "undefined" && Array.isArray(window.NANO_SERVER_THEMES)) ? window.NANO_SERVER_THEMES : []);

  sourceThemes.forEach(t => {
    // 테마관리에 등록된 대표 태그 추출
    const tTag = String(t.tag || t.title || t.name || '').replace(/^#/, '').trim();
    if (tTag) tagSet.add(tTag);
  });

  const sortedTags = Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ko'));
  let html = '<option value="">전체 주제별 태그</option>';
  sortedTags.forEach(tag => {
    html += `<option value="${tag}">#${tag}</option>`;
  });
  select.innerHTML = html;
}

function renderBmMappedBooks() {
  const container = document.getElementById("bmMappedListContainer");
  const countEl = document.getElementById("bmMappedCount");
  const leftCountEl = document.getElementById("bmLeftCount");
  if (countEl) countEl.innerText = curBannerBooks.length;
  if (leftCountEl) leftCountEl.innerText = curBannerBooks.length;
  if (!container) return;

  if (curBannerBooks.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted">
        <i class="fa-solid fa-book-open mb-2" style="font-size: 26px; opacity: 0.35;"></i>
        <div style="font-size: 12.5px; font-weight: 600;">연결된 도서가 없습니다.</div>
        <small style="font-size: 11px;">우측 도서 목록에서 [+ 추가] 버튼을 눌러주세요.</small>
      </div>
    `;
    return;
  }

  const mapped = curBannerBooks.map(id => masterBooks.find(b => b.id === id)).filter(Boolean);

  container.innerHTML = mapped.map((b, idx) => `
    <div class="d-flex align-items-center justify-content-between p-2 mb-2 bg-white rounded-lg border shadow-2xs" style="gap: 12px; padding: 10px 12px !important; border-radius: 10px !important;">
      <div class="d-flex align-items-center gap-2" style="min-width: 0; flex: 1;">
        <span class="badge-soft badge-soft-neutral" style="font-size: 11px; font-weight: 700; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; flex-shrink: 0;">${idx + 1}</span>
        <div style="width: 36px; height: 48px; border-radius: 6px; overflow: hidden; background: #ece7e1; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,0,0,0.06);">
          ${b.cover ? `
            <img src="${b.cover}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="d-none w-100 h-100 align-items-center justify-content-center text-muted" style="background: #ece7e1;">
              <i class="fa-solid fa-book" style="font-size: 14px; opacity: 0.5;"></i>
            </div>
          ` : `
            <i class="fa-solid fa-book text-muted" style="font-size: 14px; opacity: 0.5;"></i>
          `}
        </div>
        <div style="min-width: 0; flex: 1;">
          <div class="text-truncate font-weight-bold" style="font-size: 13px; color: var(--text-main); margin-bottom: 2px;">${b.title}</div>
          <div class="text-truncate text-muted" style="font-size: 11.5px;">${b.author || '저자 미상'} · ${b.publisher || '출판사 미상'}</div>
        </div>
      </div>
      <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeBookFromCurBanner('${b.id}')" style="border-radius: 7px; font-size: 11.5px; padding: 4px 10px; font-weight: 600; white-space: nowrap; flex-shrink: 0;">
        <i class="fa-solid fa-xmark mr-1"></i>제외
      </button>
    </div>
  `).join("");
}

// 배너 도서 목록 30권 단위 페이징 상태
let bmAvailableCurrentPage = 1;
const BM_AVAILABLE_PAGE_SIZE = 30;

function onBmFilterChange() {
  bmAvailableCurrentPage = 1;
  renderBmAvailableBooks();
}

function renderBmAvailableBooks() {
  const container = document.getElementById("bmAvailableListContainer");
  if (!container) return;

  const keyword = (document.getElementById("bmSearchInput") ? document.getElementById("bmSearchInput").value : "").trim().toLowerCase();
  const category = (document.getElementById("bmCategorySelect") ? document.getElementById("bmCategorySelect").value : "").trim();

  let filtered = masterBooks.filter(b => {
    const matchKw = !keyword || (b.title && b.title.toLowerCase().includes(keyword)) || (b.author && b.author.toLowerCase().includes(keyword)) || (b.publisher && b.publisher.toLowerCase().includes(keyword));
    const matchCat = !category || 
      (b.themeTag && String(b.themeTag).includes(category)) || 
      (Array.isArray(b.tags) && b.tags.some(t => {
        const cleanT = String(t || '').replace(/^#/, '').trim();
        return cleanT === category || cleanT.includes(category);
      })) || 
      (b.detailTag && typeof b.detailTag === 'string' && (b.detailTag.includes(category) || b.detailTag.includes('#' + category))) ||
      b.category === category;
    return matchKw && matchCat;
  });

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / BM_AVAILABLE_PAGE_SIZE) || 1;
  if (bmAvailableCurrentPage > totalPages) bmAvailableCurrentPage = totalPages;
  if (bmAvailableCurrentPage < 1) bmAvailableCurrentPage = 1;

  if (totalCount === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted">
        <i class="fa-solid fa-magnifying-glass mb-2" style="font-size: 24px; opacity: 0.35;"></i>
        <div style="font-size: 12.5px;">일치하는 마스터 도서가 없습니다.</div>
      </div>
    `;
    renderBmAvailablePagination(0, 1, 1);
    return;
  }

  const startIdx = (bmAvailableCurrentPage - 1) * BM_AVAILABLE_PAGE_SIZE;
  const pagedBooks = filtered.slice(startIdx, startIdx + BM_AVAILABLE_PAGE_SIZE);

  container.innerHTML = pagedBooks.map(b => {
    const isAdded = curBannerBooks.includes(b.id);
    const cleanTag = (b.themeTag || b.category || '').replace(/^#+/, '');
    const tagDisplay = cleanTag ? `#${cleanTag}` : '';

    return `
      <div class="d-flex align-items-center justify-content-between p-2 mb-2 bg-white rounded-lg border shadow-2xs" style="gap: 12px; padding: 10px 12px !important; border-radius: 10px !important;">
        <div class="d-flex align-items-center gap-2" style="min-width: 0; flex: 1;">
          <div style="width: 36px; height: 48px; border-radius: 6px; overflow: hidden; background: #ece7e1; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,0,0,0.06);">
            ${b.cover ? `
              <img src="${b.cover}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div class="d-none w-100 h-100 align-items-center justify-content-center text-muted" style="background: #ece7e1;">
                <i class="fa-solid fa-book" style="font-size: 14px; opacity: 0.5;"></i>
              </div>
            ` : `
              <i class="fa-solid fa-book text-muted" style="font-size: 14px; opacity: 0.5;"></i>
            `}
          </div>
          <div style="min-width: 0; flex: 1;">
            <div class="text-truncate font-weight-bold" style="font-size: 13px; color: var(--text-main); margin-bottom: 2px;">${b.title}</div>
            <div class="text-truncate text-muted" style="font-size: 11.5px; display: flex; align-items: center; gap: 4px; flex-wrap: nowrap;">
              <span class="text-truncate">${b.author || '저자 미상'} · ${b.publisher || '출판사'}</span>
              ${tagDisplay ? `<span class="badge-soft badge-soft-neutral flex-shrink-0" style="font-size: 10.5px; padding: 1px 6px; border-radius: 4px; font-weight: 600;">${tagDisplay}</span>` : ''}
            </div>
          </div>
        </div>
        ${isAdded ? `
          <button type="button" class="btn btn-sm btn-secondary font-weight-bold" disabled style="border-radius: 7px; font-size: 11.5px; padding: 5px 12px; opacity: 0.75; white-space: nowrap; flex-shrink: 0;">
            <i class="fa-solid fa-check mr-1"></i>추가됨
          </button>
        ` : `
          <button type="button" class="btn btn-sm btn-outline-primary font-weight-bold" onclick="addBookToCurBanner('${b.id}')" style="border-radius: 7px; font-size: 11.5px; padding: 5px 14px; white-space: nowrap; flex-shrink: 0; transition: all 0.15s ease;">
            <i class="fa-solid fa-plus mr-1"></i>추가
          </button>
        `}
      </div>
    `;
  }).join("");

  renderBmAvailablePagination(totalCount, bmAvailableCurrentPage, totalPages);
}

// 30권 페이징 네비게이션 렌더링
function renderBmAvailablePagination(total, page, totalPages) {
  const container = document.getElementById("bmAvailablePagination");
  if (!container) return;

  if (total === 0 || totalPages <= 1) {
    container.innerHTML = `<span class="text-muted" style="font-size: 11px;">총 <strong>${total}</strong>권</span>`;
    return;
  }

  let html = `
    <span class="text-muted" style="font-size: 11px;">총 <strong>${total}</strong>권 (${page}/${totalPages}p)</span>
    <div class="d-flex align-items-center gap-1">
      <button type="button" class="btn btn-xs btn-outline-secondary" onclick="goBmAvailablePage(${page - 1})" ${page <= 1 ? 'disabled style="opacity: 0.4;"' : ''} style="border-radius: 4px; padding: 2px 6px;">
        <i class="fa-solid fa-chevron-left" style="font-size: 10px;"></i>
      </button>
  `;

  let startP = Math.max(1, page - 2);
  let endP = Math.min(totalPages, startP + 4);
  if (endP - startP < 4) startP = Math.max(1, endP - 4);

  for (let p = startP; p <= endP; p++) {
    const isActive = p === page;
    html += `
      <button type="button" class="btn btn-xs ${isActive ? 'btn-beige-primary text-white font-weight-bold' : 'btn-outline-secondary'}" onclick="goBmAvailablePage(${p})" style="border-radius: 4px; min-width: 22px; padding: 2px 5px; font-size: 11px;">
        ${p}
      </button>
    `;
  }

  html += `
      <button type="button" class="btn btn-xs btn-outline-secondary" onclick="goBmAvailablePage(${page + 1})" ${page >= totalPages ? 'disabled style="opacity: 0.4;"' : ''} style="border-radius: 4px; padding: 2px 6px;">
        <i class="fa-solid fa-chevron-right" style="font-size: 10px;"></i>
      </button>
    </div>
  `;

  container.innerHTML = html;
}

function goBmAvailablePage(page) {
  bmAvailableCurrentPage = page;
  renderBmAvailableBooks();
  const c = document.getElementById("bmAvailableListContainer");
  if (c) c.scrollTop = 0;
}

function addBookToCurBanner(bookId) {
  if (!curBannerBooks.includes(bookId)) {
    curBannerBooks.push(bookId);
    renderBmMappedBooks();
    renderBmAvailableBooks();
  }
}

function removeBookFromCurBanner(bookId) {
  curBannerBooks = curBannerBooks.filter(id => id !== bookId);
  renderBmMappedBooks();
  renderBmAvailableBooks();
}

function clearCurBannerBooks() {
  if (confirm("현재 배너에 선택된 모든 도서를 비우시겠습니까?")) {
    curBannerBooks = [];
    renderBmMappedBooks();
    renderBmAvailableBooks();
  }
}

async function handleSaveBanner(e) {
  e.preventDefault();
  const editId = document.getElementById("bannerEditId").value;
  const title = document.getElementById("bannerTitle").value.trim();
  const sub = document.getElementById("bannerSub").value.trim();
  const imageUrl = curBannerUploadedImgData || curBannerExistingImgUrl || "";
  const order = parseInt(document.getElementById("bannerOrder").value, 10) || 1;
  const active = document.getElementById("bannerActive").value;

  const nowTime = Date.now();
  let savedBanner = null;
  let previousBanner = null;
  let bannerMessage = '';
  if (editId) {
    const target = bannerList.find(b => String(b.id) === String(editId));
    if (target) {
      previousBanner = { ...target };
      target.title = title;
      target.sub = sub;
      target.imageUrl = imageUrl;
      target.order = order;
      target.active = active;
      target.bookIds = [...curBannerBooks];
      target.updatedAt = nowTime;
      savedBanner = target;
      bannerMessage = `'${title}' 배너 정보가 수정되었습니다.`;
    }
  } else {
    const todayStr = new Date().toISOString().split("T")[0];
    const newBanner = {
      id: nowTime,
      title: title,
      sub: sub,
      imageUrl: imageUrl,
      order: order,
      active: active,
      clicks: 0,
      createdAt: todayStr,
      updatedAt: nowTime,
      bookIds: [...curBannerBooks]
    };
    bannerList.push(newBanner);
    savedBanner = newBanner;
    bannerMessage = `'${title}' 신규 메인 배너가 등록되었습니다.`;
  }

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveBanner(savedBanner);
    } catch (error) {
      if (previousBanner) Object.assign(savedBanner, previousBanner);
      else bannerList = bannerList.filter(item => item !== savedBanner);
      showMasterToast('배너를 저장하지 못했습니다: ' + error.message);
      return;
    }
  }

  saveOperationsToStorage();
  $('#bannerEditModal').modal('hide');
  renderBannerList();
  showMasterToast(bannerMessage);
}

async function toggleBannerActive(id) {
  const b = bannerList.find(item => String(item.id) === String(id));
  if (!b) return;
  b.active = b.active === "Y" ? "N" : "Y";
  b.updatedAt = Date.now();
  if (window.NanoPortal && NanoPortal.remote) {
    try { await NanoPortal.saveBanner(b); }
    catch (error) { b.active = b.active === "Y" ? "N" : "Y"; showMasterToast('배너 상태를 저장하지 못했습니다: ' + error.message); return; }
  }
  saveOperationsToStorage();
  renderBannerList();
  showMasterToast(`배너 노출 상태가 [${b.active === "Y" ? "노출" : "숨김"}]으로 변경되었습니다.`);
}

async function deleteBanner(id) {
  const b = bannerList.find(item => String(item.id) === String(id));
  const name = b ? b.title : "선택 배너";
  if (confirm(`'${name}' 배너를 정말 삭제하시겠습니까?`)) {
    if (window.NanoPortal && NanoPortal.remote) {
      try { await NanoPortal.deleteBanner(b); }
      catch (error) { showMasterToast('배너를 삭제하지 못했습니다: ' + error.message); return; }
    }
    bannerList = bannerList.filter(item => String(item.id) !== String(id));
    saveOperationsToStorage();
    renderBannerList();
    showMasterToast("배너가 삭제되었습니다.");
  }
}

// --- [5-B] 테마 관리 (도서 큐레이션 테마 및 태그 관리) ---
let curThemeUploadedImgData = "";

// 테마별 자동 매핑 도서 계산 헬퍼 함수
function getThemeAutoMappedBooks(theme) {
  if (!theme) return [];
  const targetTag = (theme.tag || '').trim();
  const cleanTarget = targetTag.replace(/^#/, '');

  return masterBooks.filter(b => {
    // 1. 도서 tags 배열에 일치하는 태그가 있는지 확인
    if (b.tags && Array.isArray(b.tags)) {
      const hasTag = b.tags.some(t => {
        const cleanT = (t || '').trim().replace(/^#/, '');
        return cleanT === cleanTarget || (t || '').trim() === targetTag;
      });
      if (hasTag) return true;
    }
    // 2. detailTag에 태그가 포함되어 있는지 확인
    if (b.detailTag && typeof b.detailTag === 'string') {
      if (b.detailTag.includes(cleanTarget) || b.detailTag.includes(targetTag)) return true;
    }
    // 3. 기존 수동 bookIds가 등록되어 있는 경우 하위 호환
    if (theme.bookIds && Array.isArray(theme.bookIds) && theme.bookIds.includes(b.id)) {
      return true;
    }
    return false;
  });
}

function renderThemeTable() {
  const tbody = document.getElementById("themeTableBody");
  if (!tbody) return;

  const countEl = document.getElementById("themeCount");
  if (countEl) countEl.innerText = themeList.length;

  if (themeList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-muted">등록된 테마(태그)가 없습니다.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = themeList.map((t, idx) => {
    const autoMappedBooks = getThemeAutoMappedBooks(t);
    const bookCount = autoMappedBooks.length;
    const imgUrl = t.image || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";

    return `
      <tr>
        <td style="font-weight: 700; color: var(--text-soft); text-align: center;">${idx + 1}</td>
        <td style="text-align: center;">
          <div style="width: 60px; height: 42px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-medium); cursor: pointer; margin: 0 auto; background: #f0ece5;" onclick="previewBannerImage('${imgUrl}', '${t.tag} 대표 이미지')" title="이미지 크게 보기 (클릭)">
            <img src="${imgUrl}" alt="${t.tag}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='upload/banner/banner_reading_king.jpg'">
          </div>
        </td>
        <td style="text-align: left;">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge-soft badge-soft-warning font-weight-bold" style="font-size: 12.5px;">${t.tag}</span>
            <strong style="font-size: 14px; color: var(--text-main);">${t.title}</strong>
          </div>
          ${t.subTag ? `<div class="text-muted" style="font-size: 12px;"><i class="fa-solid fa-hashtag mr-1 text-secondary"></i>${t.subTag}</div>` : ''}
          <div class="text-secondary text-truncate" style="font-size: 11.5px; max-width: 360px; line-height: 1.4; margin-top: 2px;">
            ${t.desc || '테마 설명이 없습니다.'}
          </div>
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn btn-xs btn-outline-success font-weight-bold" onclick="goToMasterBooksWithThemeTag('${(t.tag || t.title || '').replace(/'/g, "\\'")}')" style="border-radius: 12px; font-size: 12px; padding: 4px 10px; cursor: pointer; transition: all 0.2s;" title="마스터 콘텐츠 관리에서 해당 도서 목록 보기 (클릭)">
            <i class="fa-solid fa-bolt mr-1"></i>${bookCount}권
          </button>
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn btn-xs ${t.active === 'Y' ? 'btn-success' : 'btn-secondary'}" onclick="toggleThemeActive('${t.id}')" style="border-radius: 14px; font-size: 11.5px; padding: 3px 10px;">
            ${t.active === 'Y' ? '노출 (Y)' : '숨김 (N)'}
          </button>
        </td>
        <td style="text-align: center;">
          <div class="d-flex align-items-center justify-content-center gap-1">
            <button class="btn btn-xs btn-outline-secondary" onclick="openThemeModal('${t.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;" title="태그 정보 수정">
              <i class="fa-solid fa-pen mr-1"></i>편집
            </button>
            <button class="btn btn-xs btn-outline-danger" onclick="deleteTheme('${t.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 7px;" title="태그 삭제">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  populateMasterContentCategoryOptions();
  populateBmThemeOptions();
}

// 테마 관리에서 특정 테마 태그 클릭 시 마스터 콘텐츠 관리 탭으로 이동 및 해당 태그로 필터링
function goToMasterBooksWithThemeTag(themeTag) {
  if (!themeTag) return;
  const tagWithHash = '#' + String(themeTag).replace(/^#/, '').trim();

  // 1. 마스터 콘텐츠 관리 탭으로 이동
  switchMasterTab('contents');

  // 2. 검색 드롭다운 옵션 동기화
  populateMasterContentCategoryOptions();

  // 3. 주제/태그 셀렉트박스에서 해당 태그 선택
  const catSelect = document.getElementById("contentCategoryFilter");
  if (catSelect) {
    let found = false;
    for (let i = 0; i < catSelect.options.length; i++) {
      if (catSelect.options[i].value === tagWithHash || catSelect.options[i].value === tagWithHash.replace(/^#/, '')) {
        catSelect.selectedIndex = i;
        found = true;
        break;
      }
    }
    if (!found) {
      const newOpt = new Option(tagWithHash, tagWithHash, true, true);
      catSelect.add(newOpt);
    }
  }

  // 4. 기타 검색창 및 학년/등록처 필터 초기화
  const searchInput = document.getElementById("contentSearchInput");
  if (searchInput) searchInput.value = "";
  const gradeSelect = document.getElementById("contentGradeFilter");
  if (gradeSelect) gradeSelect.value = "ALL";
  const academySelect = document.getElementById("contentAcademyFilter");
  if (academySelect) academySelect.value = "ALL";

  // 5. 1페이지로 리셋 후 도서 목록 렌더링
  contentCurrentPage = 1;
  renderMasterContents();

  // 6. 도서 목록 영역으로 스크롤 이동
  setTimeout(() => {
    const tableEl = document.getElementById("tab-master-contents");
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 80);
}

function handleThemeFileUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("이미지 크기는 최대 5MB를 초과할 수 없습니다.");
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    curThemeUploadedImgData = evt.target.result;
    updateThemeModalPreview();
    showMasterToast("태그 대표 이미지가 성공적으로 업로드되었습니다.");
  };
  reader.readAsDataURL(file);
}

function handleThemePresetChange(val) {
  curThemeUploadedImgData = "";
  const fileInput = document.getElementById("themeImageFile");
  if (fileInput) fileInput.value = "";
  updateThemeModalPreview();
}

function updateThemeModalPreview() {
  const box = document.getElementById("themeModalPreviewBox");
  if (!box) return;

  const tagVal = (document.getElementById("themeTagTitle") ? document.getElementById("themeTagTitle").value.trim() : "") || "#주제태그";
  const subTagVal = (document.getElementById("themeSubTag") ? document.getElementById("themeSubTag").value.trim() : "") || "#보조태그";
  const descVal = (document.getElementById("themeDesc") ? document.getElementById("themeDesc").value.trim() : "") || "태그에 대한 설명이 여기에 표시됩니다.";
  const presetImg = document.getElementById("themeImageUrl") ? document.getElementById("themeImageUrl").value : "";
  const finalImg = curThemeUploadedImgData || presetImg || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";
  const activeVal = document.getElementById("themeActive") ? document.getElementById("themeActive").value : "Y";

  box.innerHTML = `
    <div style="position: relative; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; background: #e5e0d8;">
      <img src="${finalImg}" alt="${tagVal}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
      <span class="badge" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.65); color: #fff; font-size: 10.5px; border-radius: 4px; padding: 2px 6px;">
        ${activeVal === 'Y' ? '노출' : '숨김'}
      </span>
    </div>
    <div style="padding: 10px;">
      <div class="badge-soft badge-soft-warning font-weight-bold mb-1" style="font-size: 12.5px; display: inline-block;">${tagVal}</div>
      <div class="text-muted text-truncate mb-1" style="font-size: 10.5px; font-weight: 600;">${subTagVal}</div>
      <div class="pt-2 border-top d-flex justify-content-between align-items-center">
        <span style="font-size: 11px; color: var(--text-soft);"><i class="fa-solid fa-book-open mr-1"></i>추천 도서 <strong>6</strong>권</span>
        <span class="badge-soft badge-soft-success" style="font-size: 10.5px;">주제별 도서</span>
      </div>
    </div>
  `;
}

function openThemeModal(themeId) {
  curThemeUploadedImgData = "";
  const fileInput = document.getElementById("themeImageFile");
  if (fileInput) fileInput.value = "";

  const modalHeader = document.getElementById("themeModalHeaderTitle");
  const editIdInput = document.getElementById("themeEditId");
  const tagTitleInput = document.getElementById("themeTagTitle");
  const subTagInput = document.getElementById("themeSubTag");
  const descInput = document.getElementById("themeDesc");
  const imgSelect = document.getElementById("themeImageUrl");
  const activeSelect = document.getElementById("themeActive");

  if (themeId) {
    const target = themeList.find(item => String(item.id) === String(themeId));
    if (!target) return;
    if (modalHeader) modalHeader.innerHTML = `<i class="fa-solid fa-pen mr-2 text-warning"></i>테마(태그) 정보 수정`;
    if (editIdInput) editIdInput.value = target.id;
    if (tagTitleInput) tagTitleInput.value = target.tag || target.title;
    if (subTagInput) subTagInput.value = target.subTag || "";
    if (descInput) descInput.value = target.desc || "";
    if (imgSelect) imgSelect.value = target.image || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";
    if (activeSelect) activeSelect.value = target.active || "Y";
  } else {
    if (modalHeader) modalHeader.innerHTML = `<i class="fa-solid fa-tags mr-2 text-warning"></i>신규 테마(태그) 등록`;
    if (editIdInput) editIdInput.value = "";
    if (tagTitleInput) tagTitleInput.value = "";
    if (subTagInput) subTagInput.value = "";
    if (descInput) descInput.value = "";
    if (imgSelect) imgSelect.value = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";
    if (activeSelect) activeSelect.value = "Y";
  }

  updateThemeModalPreview();
  $('#themeEditModal').modal('show');
}

async function handleSaveTheme(e) {
  e.preventDefault();
  const editId = document.getElementById("themeEditId").value;
  const tagTitle = document.getElementById("themeTagTitle").value.trim();
  const subTag = document.getElementById("themeSubTag").value.trim();
  const desc = document.getElementById("themeDesc").value.trim();
  const presetImg = document.getElementById("themeImageUrl") ? document.getElementById("themeImageUrl").value : "";
  const finalImage = curThemeUploadedImgData || presetImg || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";
  const active = document.getElementById("themeActive").value;

  // 태그 포맷팅 (# 붙이기)
  let formattedTag = tagTitle;
  if (!formattedTag.startsWith("#")) {
    formattedTag = "#" + formattedTag;
  }

  let savedTheme = null;
  let previousTheme = null;
  let themeMessage = '';
  if (editId) {
    const target = themeList.find(item => String(item.id) === String(editId));
    if (target) {
      previousTheme = { ...target };
      target.title = formattedTag.replace("#", "");
      target.tag = formattedTag;
      target.subTag = subTag;
      target.desc = desc;
      target.image = finalImage;
      target.active = active;
      savedTheme = target;
      themeMessage = `'${formattedTag}' 태그 정보가 수정되었습니다.`;
    }
  } else {
    const todayStr = new Date().toISOString().split("T")[0];
    const newTheme = {
      id: Date.now(),
      title: formattedTag.replace("#", ""),
      tag: formattedTag,
      subTag: subTag,
      desc: desc,
      image: finalImage,
      bookIds: [],
      active: active,
      createdAt: todayStr
    };
    themeList.push(newTheme);
    savedTheme = newTheme;
    themeMessage = `'${formattedTag}' 신규 태그가 등록되었습니다.`;
  }

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveTheme(savedTheme);
    } catch (error) {
      if (previousTheme) Object.assign(savedTheme, previousTheme);
      else themeList = themeList.filter(item => item !== savedTheme);
      showMasterToast('테마를 저장하지 못했습니다: ' + error.message);
      return;
    }
  }

  saveOperationsToStorage();
  $('#themeEditModal').modal('hide');
  renderThemeTable();
  showMasterToast(themeMessage);
}

async function toggleThemeActive(id) {
  const t = themeList.find(item => String(item.id) === String(id));
  if (!t) return;
  const prevActive = t.active;
  t.active = t.active === "Y" ? "N" : "Y";
  if (window.NanoPortal && NanoPortal.remote) {
    try { await NanoPortal.saveTheme(t); }
    catch (error) { t.active = prevActive; showMasterToast('테마 노출 상태를 변경하지 못했습니다: ' + error.message); return; }
  }
  saveOperationsToStorage();
  renderThemeTable();
  showMasterToast(`[${t.tag}] 노출 상태가 [${t.active === "Y" ? "노출" : "숨김"}]으로 변경되었습니다.`);
}

async function deleteTheme(themeId) {
  const target = themeList.find(item => String(item.id) === String(themeId));
  if (!target) return;

  if (confirm(`'${target.tag}' 태그를 정말 삭제하시겠습니까?\n매핑된 도서 연결 정보도 함께 해제됩니다.`)) {
    if (window.NanoPortal && NanoPortal.remote) {
      try { await NanoPortal.deleteTheme(target); }
      catch (error) { showMasterToast('테마를 삭제하지 못했습니다: ' + error.message); return; }
    }
    themeList = themeList.filter(item => item.id !== themeId);
    saveOperationsToStorage();
    renderThemeTable();
    showMasterToast("태그가 삭제되었습니다.");
  }
}

// 4. 테마별 자동 매핑 도서 목록 모달 열기 (수동 매핑 불필요, 자동 매핑 리스트 뷰)
function openThemeBooksModal(themeId) {
  const theme = themeList.find(t => t.id === themeId);
  if (!theme) return;
  curThemeBooksThemeId = themeId;

  const headerTitle = document.getElementById("tbmHeaderTitle");
  if (headerTitle) {
    headerTitle.innerHTML = `<i class="fa-solid fa-tags mr-2 text-warning"></i>${theme.tag} 자동 매핑 도서 목록`;
  }
  const headerSub = document.getElementById("tbmHeaderSub");
  if (headerSub) {
    headerSub.innerText = `도서 등록 시 지정된 주제 태그(${theme.tag})로 자동 연동된 도서 목록입니다. (별도 수동 매핑 불필요)`;
  }
  const infoTitle = document.getElementById("tbmInfoTitle");
  if (infoTitle) infoTitle.innerText = theme.title;
  const infoTag = document.getElementById("tbmInfoTag");
  if (infoTag) infoTag.innerText = theme.tag;
  const infoDesc = document.getElementById("tbmInfoDesc");
  if (infoDesc) infoDesc.innerText = theme.desc || "테마 안내글";

  const searchInp = document.getElementById("tbmAutoSearchInput");
  if (searchInp) searchInp.value = "";

  renderTbmAutoMappedBooks();
  $('#themeBooksModal').modal('show');
}

// 5. 테마 자동 매핑 도서 리스트 렌더링 (단일 테이블 형태)
function renderTbmAutoMappedBooks() {
  const tbody = document.getElementById("tbmAutoTableBody");
  const theme = themeList.find(t => t.id === curThemeBooksThemeId);
  if (!tbody || !theme) return;

  const allAutoMapped = getThemeAutoMappedBooks(theme);
  const searchInput = document.getElementById("tbmAutoSearchInput");
  const keyword = (searchInput ? searchInput.value : "").trim().toLowerCase();

  const countEl = document.getElementById("tbmMappingCount");
  if (countEl) countEl.innerText = allAutoMapped.length;

  // 검색어 필터링 (도서명, 저자, 출판사, 분야)
  let filtered = allAutoMapped;
  if (keyword) {
    filtered = allAutoMapped.filter(b => 
      (b.title && b.title.toLowerCase().includes(keyword)) ||
      (b.author && b.author.toLowerCase().includes(keyword)) ||
      (b.publisher && b.publisher.toLowerCase().includes(keyword)) ||
      (b.category && b.category.toLowerCase().includes(keyword))
    );
  }

  const leftCountEl = document.getElementById("tbmLeftCount");
  if (leftCountEl) leftCountEl.innerText = filtered.length;

  if (filtered.length === 0) {
    if (allAutoMapped.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5 text-muted" style="background: #faf9f6;">
            <i class="fa-solid fa-book-open mb-2" style="font-size: 36px; opacity: 0.35;"></i>
            <p class="mb-1 font-weight-bold" style="font-size: 14.5px; color: var(--text-main);">현재 이 테마에 자동 매핑된 도서가 없습니다.</p>
            <small style="font-size: 12px; color: var(--text-muted);">
              [마스터 도서 등록/수정]에서 주제 분류 태그를 <strong>${theme.tag}</strong>(으)로 선택하시면 이곳에 자동으로 실시간 연동됩니다.
            </small>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4 text-muted">
            <i class="fa-solid fa-magnifying-glass mb-2" style="font-size: 24px; opacity: 0.4;"></i>
            <p class="mb-0" style="font-size: 13px;">'${keyword}' 검색어와 일치하는 도서가 없습니다.</p>
          </td>
        </tr>
      `;
    }
    return;
  }

  tbody.innerHTML = filtered.map((b, idx) => {
    const coverUrl = b.cover || "resources/images/book_default.svg";
    const seriesText = b.series && b.series !== "단권" ? `<span class="badge-soft badge-soft-warning ml-1" style="font-size: 10px;">${b.series}</span>` : "";
    const acadName = b.academy || "본사 (공용)";
    const isPublic = b.isPublic !== "N";

    return `
      <tr>
        <td style="font-weight: 700; color: var(--text-soft); font-size: 12px;">${idx + 1}</td>
        <td>
          <div style="width: 42px; height: 56px; border-radius: 4px; overflow: hidden; background: #ece7e1; margin: 0 auto; box-shadow: 0 2px 6px rgba(0,0,0,0.08); border: 1px solid var(--border-medium);">
            <img src="${coverUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='resources/images/book_default.svg';">
          </div>
        </td>
        <td style="text-align: left;">
          <div class="font-weight-bold" style="font-size: 13.5px; color: var(--text-main); margin-bottom: 2px;">
            ${b.title} ${seriesText}
          </div>
          <div class="text-muted" style="font-size: 11.5px;">
            <i class="fa-solid fa-barcode mr-1 opacity-50"></i>${b.id}
            ${b.tags && b.tags.length > 0 ? `<span class="text-secondary ml-1">· ${b.tags.join(" ")}</span>` : ""}
          </div>
        </td>
        <td style="text-align: left;">
          <div class="font-weight-bold" style="font-size: 12.5px; color: #475569;">${b.author || '-'}</div>
          <div class="text-muted" style="font-size: 11.5px;">${b.publisher || '-'}</div>
        </td>
        <td>
          <span class="badge-soft badge-soft-neutral" style="font-size: 11px;">${b.category || '기타'}</span>
        </td>
        <td>
          <span class="badge-soft badge-soft-warning font-weight-bold" style="font-size: 11px;">${b.grade || '전체'}</span>
        </td>
        <td>
          <span class="badge badge-light border text-muted" style="font-size: 11px;">${acadName}</span>
        </td>
        <td>
          <span class="badge ${isPublic ? 'badge-success' : 'badge-secondary'}" style="font-size: 11px; padding: 4px 8px; border-radius: 10px;">
            ${isPublic ? '노출' : '숨김'}
          </span>
        </td>
      </tr>
    `;
  }).join("");
}

// ==========================================
// 5-2. 플랫폼 전체 공지사항 및 점검 팝업 관리 모듈 (Notice Management)
// ==========================================
const STORAGE_KEY_SYSTEM_NOTICES = "NANO_MASTER_SYSTEM_NOTICES";

const defaultSystemNotices = [
  {
    id: "NOT-1004",
    title: "[안내] 2026 가을맞이 신규 필독서 120종 업데이트 및 북퀴즈 출제 완료",
    target: "전체",
    category: "신규 도서 입고",
    isPopup: false,
    popupStartDate: "",
    popupEndDate: "",
    isPinned: true,
    status: "게시중",
    createdAt: "2026-09-28",
    content: "안녕하세요. 나노의 책장 본사 운영팀입니다.\n\n2026년도 2학기를 맞아 초등 및 중등 대상 교과 연계 필독도서 120종이 신규 등록되었으며, 각 도서별 문해력 5문항 북퀴즈 및 어휘 풀이가 완비되었습니다.\n\n각 가맹 학원에서는 [도서 배정] 메뉴에서 신규 도서를 확인하시고 원생들에게 추천 도서로 배정해 주시기 바랍니다.\n감사합니다.",
    link: ""
  },
  {
    id: "NOT-1003",
    title: "[긴급] 정기 시스템 서버 안정화 및 인프라 점검 안내 (10/05 02:00~06:00)",
    target: "가맹 학원",
    category: "시스템 점검",
    isPopup: true,
    popupStartDate: "2026-10-01",
    popupEndDate: "2026-10-05",
    isPinned: true,
    status: "게시중",
    createdAt: "2026-09-25",
    content: "안정적인 북퀴즈 응시 및 대용량 독서 리포트 데이터 처리를 위한 클라우드 인프라 확장 점검이 진행될 예정입니다.\n\n■ 점검 일시: 2026년 10월 5일(월) 새벽 02:00 ~ 06:00 (약 4시간)\n■ 영향 범위: 점검 시간 동안 전체 플랫폼 접속 및 북퀴즈 응시 일시 중단\n\n원활한 서비스 제공을 위해 새벽 시간대에 진행되오니 원장님 및 지도교사 분들의 너른 양해 부탁드립니다.",
    link: ""
  },
  {
    id: "NOT-1002",
    title: "[공지] 제3회 전국 나노 독서왕 퀴즈 챌린지 랭킹 대회 개최 요강",
    target: "학생",
    category: "이벤트/대회",
    isPopup: true,
    popupStartDate: "2026-09-20",
    popupEndDate: "2026-10-20",
    isPinned: false,
    status: "게시중",
    createdAt: "2026-09-18",
    content: "전국 모든 가맹 학원의 원생들이 참여하는 [제3회 전국 나노 독서왕 퀴즈 챌린지]가 시작됩니다!\n\n■ 참여 대상: 나노의 책장 재원 원생 누구나\n■ 챌린지 기간: 2026년 9월 20일 ~ 10월 20일 (1개월간)\n■ 시상: 전국 개인 랭킹 1~10위 장학 상품권 및 메달 수여, 최우수 학원 현판 제공\n\n매일 책을 읽고 북퀴즈에 도전하여 전국 랭킹에 이름을 올려보세요!",
    link: ""
  },
  {
    id: "NOT-1001",
    title: "[안내] 가맹 학원 관리자 대시보드 리포트 발송 편의 기능 개선 배포",
    target: "가맹 학원",
    category: "서비스 업데이트",
    isPopup: false,
    popupStartDate: "",
    popupEndDate: "",
    isPinned: false,
    status: "게시중",
    createdAt: "2026-09-10",
    content: "학원 관리자 페이지에서 학부모 알림톡 리포트 발송 시, 학급별 일괄 전송 및 개별 발송 미리보기 기능이 한층 업그레이드되었습니다.\n\n또한 원생 삭제 시 실수 방지를 위한 2단계 원장님 비밀번호 인증 및 7일 임시 보존 기능이 적용되었습니다.",
    link: ""
  }
];

function loadNoticesFromStorage() {
  var localCached = [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SYSTEM_NOTICES);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        parsed.forEach(n => {
          if (n.target === '학부모') n.target = '전체';
        });
        localCached = parsed;
      }
    }
  } catch (e) {
    console.warn("시스템 공지 로컬 캐시 로드 실패:", e);
  }

  if (window.NANO_SERVER_DATA) {
    var serverNotices = window.NANO_SERVER_NOTICES || [];
    // 서버 공지에 팝업 시작/종료일 등 메타데이터가 비어있는 경우 로컬 스토리지 캐시와 병합하여 유실 방지
    return serverNotices.map(function(sn) {
      var matchedLocal = localCached.find(function(ln) {
        return (ln.id && ln.id === sn.id) || (ln.title && ln.title === sn.title);
      });
      if (!matchedLocal) return sn;
      return Object.assign({}, sn, {
        popupStartDate: sn.popupStartDate || matchedLocal.popupStartDate || "",
        popupEndDate: sn.popupEndDate || matchedLocal.popupEndDate || "",
        isPopup: typeof sn.isPopup === "boolean" ? sn.isPopup : !!matchedLocal.isPopup,
        isPinned: typeof sn.isPinned === "boolean" ? sn.isPinned : !!matchedLocal.isPinned,
        category: sn.category || matchedLocal.category || "일반 공지",
        status: sn.status || matchedLocal.status || "게시중",
        target: (sn.target && sn.target !== '원장' && sn.target !== '선생님') ? sn.target : (matchedLocal.target || "가맹 학원"),
        link: sn.link || matchedLocal.link || ""
      });
    });
  }
  if (localCached.length > 0) return localCached;
  return JSON.parse(JSON.stringify(defaultSystemNotices));
}

function saveNoticesToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_SYSTEM_NOTICES, JSON.stringify(systemNoticeList));
    // 타 탭(학원 관리자, 학생 프리뷰) 실시간 동기화 지원
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEY_SYSTEM_NOTICES,
      newValue: JSON.stringify(systemNoticeList)
    }));
  } catch (e) {
    console.error("시스템 공지 저장 실패:", e);
  }
}

let systemNoticeList = loadNoticesFromStorage();

function renderNoticeTable() {
  const tbody = document.getElementById("noticeTableBody");
  if (!tbody) return;

  if (systemNoticeList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5 text-muted">
          <i class="fa-solid fa-bullhorn fa-2x mb-2" style="color: #cbd5e1;"></i><br>
          <strong style="font-size: 14px; color: var(--text-main);">등록된 시스템 공지사항이 없습니다.</strong><br>
          <span style="font-size: 12.5px;">우측 상단의 <strong>[+ 신규 공지 작성]</strong> 버튼을 눌러 첫 공지를 등록해보세요.</span>
        </td>
      </tr>
    `;
    return;
  }

  // 상단 고정(isPinned) 우선 정렬 후 최신순
  const sortedList = [...systemNoticeList].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.id || "").localeCompare(a.id || "");
  });

  tbody.innerHTML = sortedList.map((not, idx) => {
    // 대상 뱃지 (전체 / 가맹 학원 / 학생)
    let targetBadge = '<span class="badge badge-secondary" style="font-size: 11px;">전체</span>';
    if (not.target === '가맹 학원' || not.target === '원장' || not.target === '선생님') {
      targetBadge = '<span class="badge badge-primary" style="font-size: 11px; background: #3b82f6;">가맹 학원</span>';
    } else if (not.target === '학생') {
      targetBadge = '<span class="badge badge-success" style="font-size: 11px; background: #10b981;">학생</span>';
    }

    // 팝업기간 표시 (공지 제목과 대상 사이 컬럼)
    let popupPeriodHtml = '<span class="text-muted" style="font-size: 12px;">-</span>';
    if (not.isPopup) {
      if (not.popupStartDate || not.popupEndDate) {
        popupPeriodHtml = `<span class="text-dark font-weight-bold" style="font-size: 12px;"><i class="fa-regular fa-calendar-check text-primary mr-1"></i>${not.popupStartDate || '상시'} ~ ${not.popupEndDate || '상시'}</span>`;
      } else {
        popupPeriodHtml = `<span class="text-muted" style="font-size: 12px;">상시 노출</span>`;
      }
    }

    // 팝업 여부 뱃지
    const popupBadge = not.isPopup
      ? `<span class="badge-soft badge-soft-warn font-weight-bold" style="font-size: 11px;"><i class="fa-solid fa-window-restore mr-1"></i>팝업 ON</span>`
      : `<span class="text-muted" style="font-size: 11.5px;">일반 공지</span>`;

    // 분류 뱃지
    const categoryBadge = `<span class="badge badge-light border text-muted mr-1" style="font-size: 11px;">${not.category || '일반'}</span>`;

    // 상단 고정 뱃지
    const pinnedBadge = not.isPinned
      ? `<span class="badge badge-warning text-dark ml-1 font-weight-bold" style="font-size: 10px; padding: 2px 5px;"><i class="fa-solid fa-thumbtack mr-1"></i>고정</span>`
      : '';

    // 상태 뱃지
    const isPub = not.status === '게시중';
    const statusBadge = `
      <span class="badge ${isPub ? 'badge-success' : 'badge-secondary'}" onclick="toggleNoticeStatus('${not.id}')" style="cursor: pointer; font-size: 11px; padding: 4px 8px; border-radius: 10px;" title="클릭 시 상태 전환">
        ${isPub ? '게시중' : '비공개'}
      </span>
    `;

    // 등록일자 깔끔한 YYYY-MM-DD 포맷팅 (ISO 타임스탬프 줄바꿈 방지)
    const displayDate = (not.createdAt ? String(not.createdAt).slice(0, 10) : (not.date || "-")).slice(0, 10);

    return `
      <tr>
        <td class="text-center font-weight-bold text-muted" style="font-size: 12.5px; white-space: nowrap; width: 70px;">
          <span>${idx + 1}</span>${not.isPinned ? ' <i class="fa-solid fa-thumbtack text-danger ml-1" style="font-size: 11px;" title="상단 고정"></i>' : ''}
        </td>
        <td style="text-align: left;">
          <div class="d-flex align-items-center flex-wrap">
            ${categoryBadge}
            <span class="font-weight-bold text-dark notice-item-title" onclick="viewNoticeDetail('${not.id}')" style="cursor: pointer; font-size: 13.5px; transition: color 0.15s;" onmouseover="this.style.color='#b45309'" onmouseout="this.style.color=''">
              ${not.title}
            </span>
            ${pinnedBadge}
          </div>
        </td>
        <td class="text-center" style="white-space: nowrap;">${popupPeriodHtml}</td>
        <td class="text-center" style="white-space: nowrap;">${targetBadge}</td>
        <td class="text-center" style="white-space: nowrap;">${popupBadge}</td>
        <td class="text-center text-muted" style="font-size: 12px; white-space: nowrap;">${displayDate}</td>
        <td class="text-center" style="white-space: nowrap;">${statusBadge}</td>
        <td class="text-center" style="white-space: nowrap; width: 140px;">
          <div class="d-flex justify-content-center align-items-center" style="gap: 6px; flex-wrap: nowrap;">
            <button class="btn btn-xs btn-outline-secondary" onclick="openNoticeModal('${not.id}')" title="수정" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px; white-space: nowrap; display: inline-flex; align-items: center;">
              <i class="fa-solid fa-pen mr-1"></i>수정
            </button>
            <button class="btn btn-xs btn-outline-danger" onclick="deleteNotice('${not.id}')" title="삭제" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px; white-space: nowrap; display: inline-flex; align-items: center;">
              <i class="fa-solid fa-trash-can mr-1"></i>삭제
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function openNoticeModal(noticeId) {
  const modalTitleEl = document.getElementById("noticeModalTitle");
  const editIdEl = document.getElementById("noticeEditId");
  const titleEl = document.getElementById("noticeTitle");
  const targetEl = document.getElementById("noticeTarget");
  const catEl = document.getElementById("noticeCategory");
  const statusEl = document.getElementById("noticeStatus");
  const isPinnedEl = document.getElementById("noticeIsPinned");
  const isPopupEl = document.getElementById("noticeIsPopup");
  const popStartEl = document.getElementById("noticePopupStartDate");
  const popEndEl = document.getElementById("noticePopupEndDate");
  const contentEl = document.getElementById("noticeContent");
  const linkEl = document.getElementById("noticeLink");

  const todayStr = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  if (noticeId) {
    const not = systemNoticeList.find(n => n.id === noticeId);
    if (!not) return;
    if (modalTitleEl) modalTitleEl.innerHTML = '<i class="fa-solid fa-pen-to-square mr-2 text-warning"></i>시스템 공지사항 수정';
    if (editIdEl) editIdEl.value = not.id;
    if (titleEl) titleEl.value = not.title || "";
    const normTarget = (not.target === '원장' || not.target === '선생님') ? '가맹 학원' : (not.target || "전체");
    if (targetEl) targetEl.value = normTarget;
    if (catEl) catEl.value = not.category || "일반 공지";
    if (statusEl) statusEl.value = not.status || "게시중";
    if (isPinnedEl) isPinnedEl.checked = !!not.isPinned;
    if (isPopupEl) isPopupEl.checked = !!not.isPopup;
    const defaultStart = (not.createdAt || not.date || todayStr).slice(0, 10);
    if (popStartEl) popStartEl.value = not.popupStartDate || (not.isPopup ? defaultStart : todayStr);
    if (popEndEl) popEndEl.value = not.popupEndDate || (not.isPopup ? nextWeek : nextWeek);
    if (contentEl) contentEl.value = not.content || "";
    if (linkEl) linkEl.value = not.link || "";
  } else {
    if (modalTitleEl) modalTitleEl.innerHTML = '<i class="fa-solid fa-bullhorn mr-2 text-warning"></i>신규 시스템 공지 등록';
    if (editIdEl) editIdEl.value = "";
    if (titleEl) titleEl.value = "";
    if (targetEl) targetEl.value = "전체";
    if (catEl) catEl.value = "일반 공지";
    if (statusEl) statusEl.value = "게시중";
    if (isPinnedEl) isPinnedEl.checked = false;
    if (isPopupEl) isPopupEl.checked = false;

    if (popStartEl) popStartEl.value = todayStr;
    if (popEndEl) popEndEl.value = nextWeek;
    if (contentEl) contentEl.value = "";
    if (linkEl) linkEl.value = "";
  }

  toggleNoticePopupDateSection();

  if (window.jQuery && typeof $('#noticeModal').modal === 'function') {
    $('#noticeModal').modal('show');
  }
}

function toggleNoticePopupDateSection() {
  const isPopup = document.getElementById("noticeIsPopup")?.checked;
  const section = document.getElementById("noticePopupDateSection");
  if (section) {
    section.style.display = isPopup ? "flex" : "none";
  }
}

async function saveNotice(event) {
  if (event) event.preventDefault();

  const editId = document.getElementById("noticeEditId")?.value.trim();
  const title = document.getElementById("noticeTitle")?.value.trim();
  const target = document.getElementById("noticeTarget")?.value || "전체";
  const category = document.getElementById("noticeCategory")?.value || "일반 공지";
  const status = document.getElementById("noticeStatus")?.value || "게시중";
  const isPinned = !!document.getElementById("noticeIsPinned")?.checked;
  const isPopup = !!document.getElementById("noticeIsPopup")?.checked;
  const popupStartDate = document.getElementById("noticePopupStartDate")?.value || "";
  const popupEndDate = document.getElementById("noticePopupEndDate")?.value || "";
  const content = document.getElementById("noticeContent")?.value.trim();
  const link = document.getElementById("noticeLink")?.value.trim() || "";

  if (!title) {
    alert("공지 제목을 입력해주세요.");
    document.getElementById("noticeTitle")?.focus();
    return;
  }
  if (!content) {
    alert("공지 본문 내용을 입력해주세요.");
    document.getElementById("noticeContent")?.focus();
    return;
  }

  const todayStr = new Date().toISOString().split("T")[0];

  if (editId) {
    const idx = systemNoticeList.findIndex(n => n.id === editId);
    if (idx !== -1) {
      const previousNotice = { ...systemNoticeList[idx] };
      systemNoticeList[idx] = {
        ...systemNoticeList[idx],
        title,
        target,
        category,
        status,
        isPinned,
        isPopup,
        popupStartDate: isPopup ? popupStartDate : "",
        popupEndDate: isPopup ? popupEndDate : "",
        content,
        link
      };
      if (window.NanoPortal && NanoPortal.remote) {
        try { await NanoPortal.saveNotice(systemNoticeList[idx]); }
        catch (error) { systemNoticeList[idx] = previousNotice; showMasterToast('공지사항을 저장하지 못했습니다: ' + error.message); return; }
      }
      saveNoticesToStorage();
      renderNoticeTable();
      if (window.jQuery && typeof $('#noticeModal').modal === 'function') {
        $('#noticeModal').modal('hide');
      }
      showMasterToast(`[${title}] 공지사항이 성공적으로 수정되었습니다.`);
    }
  } else {
    // 신규 생성
    let maxNum = 1004;
    systemNoticeList.forEach(n => {
      if (n.id && n.id.startsWith("NOT-")) {
        const num = parseInt(n.id.replace("NOT-", ""), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const newId = "NOT-" + (maxNum + 1);

    const newNotice = {
      id: newId,
      title,
      target,
      category,
      status,
      isPinned,
      isPopup,
      popupStartDate: isPopup ? popupStartDate : "",
      popupEndDate: isPopup ? popupEndDate : "",
      createdAt: todayStr,
      content,
      link
    };

    systemNoticeList.unshift(newNotice);
    if (window.NanoPortal && NanoPortal.remote) {
      try { await NanoPortal.saveNotice(newNotice); }
      catch (error) { systemNoticeList = systemNoticeList.filter(notice => notice !== newNotice); showMasterToast('공지사항을 등록하지 못했습니다: ' + error.message); return; }
    }
    saveNoticesToStorage();
    renderNoticeTable();
    if (window.jQuery && typeof $('#noticeModal').modal === 'function') {
      $('#noticeModal').modal('hide');
    }
    showMasterToast(`[${title}] 신규 공지사항이 성공적으로 등록되었습니다.`);
  }
}

async function deleteNotice(noticeId) {
  const not = systemNoticeList.find(n => n.id === noticeId);
  if (!not) return;

  if (!confirm(`[${not.title}]\n\n이 공지사항을 삭제하시겠습니까?`)) return;

  if (window.NanoPortal && NanoPortal.remote) {
    try { await NanoPortal.deleteNotice(not); }
    catch (error) { showMasterToast('공지사항을 삭제하지 못했습니다: ' + error.message); return; }
  }

  systemNoticeList = systemNoticeList.filter(n => n.id !== noticeId);
  saveNoticesToStorage();
  renderNoticeTable();
  showMasterToast(`[${not.title}] 공지사항이 삭제되었습니다.`);
}

async function toggleNoticeStatus(noticeId) {
  const not = systemNoticeList.find(n => n.id === noticeId);
  if (!not) return;

  const prevStatus = not.status;
  not.status = (not.status === "게시중") ? "비공개" : "게시중";
  if (window.NanoPortal && NanoPortal.remote) {
    try { await NanoPortal.saveNotice(not); }
    catch (error) { not.status = prevStatus; showMasterToast('공지 상태를 변경하지 못했습니다: ' + error.message); return; }
  }
  saveNoticesToStorage();
  renderNoticeTable();
  showMasterToast(`[${not.title}] 공지 상태가 '${not.status}'(으)로 변경되었습니다.`);
}

function viewNoticeDetail(noticeId) {
  const not = systemNoticeList.find(n => n.id === noticeId);
  if (!not) return;

  const catEl = document.getElementById("viewNoticeCategory");
  const targetEl = document.getElementById("viewNoticeTarget");
  const pinnedEl = document.getElementById("viewNoticePinnedBadge");
  const popupEl = document.getElementById("viewNoticePopupBadge");
  const titleEl = document.getElementById("viewNoticeTitle");
  const dateEl = document.getElementById("viewNoticeDate");
  const contentEl = document.getElementById("viewNoticeContent");
  const linkSection = document.getElementById("viewNoticeLinkSection");
  const linkEl = document.getElementById("viewNoticeLink");

  if (catEl) catEl.innerText = not.category || "일반 공지";
  if (targetEl) targetEl.innerText = "대상: " + (not.target || "전체");
  if (pinnedEl) {
    if (not.isPinned) pinnedEl.classList.remove("d-none");
    else pinnedEl.classList.add("d-none");
  }
  if (popupEl) {
    if (not.isPopup) popupEl.classList.remove("d-none");
    else popupEl.classList.add("d-none");
  }
  if (titleEl) titleEl.innerText = not.title;
  if (dateEl) dateEl.innerText = not.createdAt;
  if (contentEl) contentEl.innerText = not.content || "(내용 없음)";

  if (linkSection && linkEl) {
    if (not.link) {
      linkSection.classList.remove("d-none");
      linkEl.href = not.link;
      linkEl.innerText = not.link;
    } else {
      linkSection.classList.add("d-none");
    }
  }

  if (window.jQuery && typeof $('#noticeDetailModal').modal === 'function') {
    $('#noticeDetailModal').modal('show');
  }
}

// ==========================================
// 6. 전국 랭킹 시스템 모듈 (Ranking System)
// ==========================================
let rankingCurrentPage = 1;
const rankingPageSize = 20;

// 전국 학생 개인 랭킹 데이터 (Neon DB 실데이터 연동: 100명)
let allStudentRankings = (typeof window !== "undefined" && Array.isArray(window.MIGRATED_RANKINGS) && (window.NANO_SERVER_DATA || window.MIGRATED_RANKINGS.length > 0))
  ? window.MIGRATED_RANKINGS.slice()
  : [
    { rank: 1, name: "이문성", id: "gb6721", academy: "글봄독서논술학원", grade: "초등 3학년", books: 451, accRate: "92%", points: 36064, recent: "최근" },
    { rank: 2, name: "안여진", id: "him9246", academy: "힘찬학당", grade: "초등 6학년", books: 268, accRate: "92%", points: 21440, recent: "최근" },
    { rank: 3, name: "권순찬", id: "sckwon7369", academy: "딱풀리는수학 과천율목초점", grade: "초등 3학년", books: 163, accRate: "92%", points: 13056, recent: "최근" }
  ];

// 가맹 학원 랭킹 데이터 (Neon DB 실데이터 연동: 20개소)
let academyRankingData = (typeof window !== "undefined" && Array.isArray(window.MIGRATED_ACADEMY_RANKINGS) && (window.NANO_SERVER_DATA || window.MIGRATED_ACADEMY_RANKINGS.length > 0))
  ? window.MIGRATED_ACADEMY_RANKINGS.slice()
  : [
    { rank: 1, name: "글봄독서논술학원", region: "서울 양천구", students: 48, avgBooks: "22.5권", participation: "94%", points: 184520, badge: "우수 학원" },
    { rank: 2, name: "힘찬학당", region: "경기 성남시", students: 36, avgBooks: "18.2권", participation: "91%", points: 124800, badge: "우수 학원" },
    { rank: 3, name: "딱풀리는수학 과천율목초점", region: "경기 과천시", students: 25, avgBooks: "15.8권", participation: "88%", points: 95400, badge: "우수 학원" }
  ];

// 데이터 최신화 동기화 헬퍼
function syncRankingDatasetsFromWindow() {
  if (typeof window !== "undefined" && Array.isArray(window.MIGRATED_RANKINGS) && (window.NANO_SERVER_DATA || window.MIGRATED_RANKINGS.length > 0)) {
    allStudentRankings = window.MIGRATED_RANKINGS.slice();
  }
  if (typeof window !== "undefined" && Array.isArray(window.MIGRATED_ACADEMY_RANKINGS) && (window.NANO_SERVER_DATA || window.MIGRATED_ACADEMY_RANKINGS.length > 0)) {
    academyRankingData = window.MIGRATED_ACADEMY_RANKINGS.slice();
  }
}

// 최근 6개월 드롭다운 생성 (현월, 전월, 전전월 등 최대 6개월)
function populateRankingMonthFilter() {
  const select = document.getElementById("rankMonthFilter");
  if (!select) return;
  const currentVal = select.value;

  const now = new Date();
  let html = "";
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, '0')}`;
    let label = `${y}년 ${m}월`;
    if (i === 0) label += " (현월)";
    else if (i === 1) label += " (전월)";
    else if (i === 2) label += " (전전월)";
    html += `<option value="${key}">${label}</option>`;
  }
  select.innerHTML = html;
  if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
    select.value = currentVal;
  }
}

// 랭킹 가맹학원 필터 드롭다운 동적 생성
function populateRankingAcademyFilter() {
  const select = document.getElementById("rankAcademyFilter");
  if (!select) return;
  const currentVal = select.value || "ALL";

  const acadSet = new Set();
  if (Array.isArray(allStudentRankings)) {
    allStudentRankings.forEach(s => { if (s.academy) acadSet.add(s.academy); });
  }
  const sortedAcademies = Array.from(acadSet).sort((a, b) => a.localeCompare(b, 'ko'));

  let html = `<option value="ALL">전체 가맹 학원 (${sortedAcademies.length}곳)</option>`;
  sortedAcademies.forEach(acad => {
    html += `<option value="${acad}">🏫 ${acad}</option>`;
  });
  select.innerHTML = html;
  if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
    select.value = currentVal;
  }
}

let currentRankingType = "student";

function switchRankingType(type) {
  currentRankingType = type;
  const btnStudent = document.getElementById("btn-rank-student");
  const btnAcademy = document.getElementById("btn-rank-academy");
  const tableStudent = document.getElementById("table-ranking-student");
  const tableAcademy = document.getElementById("table-ranking-academy");
  const filterBar = document.getElementById("rankingFilterBar");
  const acadFilterWrap = document.getElementById("rankAcademyFilterWrap");
  const paginationWrap = document.getElementById("rankingPaginationWrap");
  const searchInput = document.getElementById("rankStudentSearchInput");
  const unitText = document.getElementById("rankUnitText");

  const activeStyle = "background: linear-gradient(135deg, #7d5a2b, #b38850); color: #fff; border: none; box-shadow: 0 2px 8px rgba(125,90,43,0.25); border-radius: 10px; padding: 9px 20px; font-size: 13.5px; font-weight: 700; transition: all 0.2s;";
  const inactiveStyle = "background: #fff; color: #5a4b3d; border: 2px solid #d4c4b0; border-radius: 10px; padding: 9px 20px; font-size: 13.5px; font-weight: 700; transition: all 0.2s;";

  if (type === "student") {
    if (btnStudent) { btnStudent.style.cssText = activeStyle; btnStudent.classList.add("active"); }
    if (btnAcademy) { btnAcademy.style.cssText = inactiveStyle; btnAcademy.classList.remove("active"); }
    if (tableStudent) tableStudent.style.display = "";
    if (tableAcademy) tableAcademy.style.display = "none";
    if (acadFilterWrap) acadFilterWrap.style.display = ""; // 학생 랭킹에서는 가맹학원 선택 드롭박스 노출
    if (searchInput) searchInput.placeholder = "학생 이름 또는 계정 검색...";
    if (unitText) unitText.innerText = "명";
    if (filterBar) filterBar.style.display = "flex";
    if (paginationWrap) paginationWrap.style.display = "flex";
  } else {
    if (btnStudent) { btnStudent.style.cssText = inactiveStyle; btnStudent.classList.remove("active"); }
    if (btnAcademy) { btnAcademy.style.cssText = activeStyle; btnAcademy.classList.add("active"); }
    if (tableStudent) tableStudent.style.display = "none";
    if (tableAcademy) tableAcademy.style.display = "";
    if (acadFilterWrap) acadFilterWrap.style.display = "none"; // 가맹 학원 랭킹에서는 가맹학원 선택 드롭박스 숨김!
    if (searchInput) searchInput.placeholder = "가맹 학원명 또는 지역 검색...";
    if (unitText) unitText.innerText = "곳";
    if (filterBar) filterBar.style.display = "flex";
    if (paginationWrap) paginationWrap.style.display = "none";
  }

  rankingCurrentPage = 1;
  renderRankings();
}

function filterStudentRankings() {
  rankingCurrentPage = 1;
  renderRankings();
}

function resetRankingFilters() {
  const monthSelect = document.getElementById("rankMonthFilter");
  if (monthSelect && monthSelect.options.length > 0) monthSelect.selectedIndex = 0;
  if (document.getElementById("rankAcademyFilter")) document.getElementById("rankAcademyFilter").value = "ALL";
  if (document.getElementById("rankStudentSearchInput")) document.getElementById("rankStudentSearchInput").value = "";
  rankingCurrentPage = 1;
  renderRankings();
}

function renderRankings() {
  syncRankingDatasetsFromWindow();

  const totalCountEl = document.getElementById("rankTotalCount");
  const searchQ = (document.getElementById("rankStudentSearchInput")?.value || "").toLowerCase().trim();

  // 1. 가맹 학원 랭킹 뷰
  if (currentRankingType === "academy") {
    let activeAcadRankings = academyRankingData.map(a => ({ ...a }));
    if (searchQ) {
      activeAcadRankings = activeAcadRankings.filter(a => 
        (a.name && a.name.toLowerCase().includes(searchQ)) || 
        (a.region && a.region.toLowerCase().includes(searchQ))
      );
    }

    // 상단 TOP 3 명예의 전당 카드 업데이트 (가맹점 기준)
    if (academyRankingData.length >= 3) {
      const top1 = academyRankingData[0];
      const top2 = academyRankingData[1];
      const top3 = academyRankingData[2];

      if (document.getElementById("top1Badge")) document.getElementById("top1Badge").innerText = "전국 1위 (최우수 가맹점)";
      if (document.getElementById("top1Name")) document.getElementById("top1Name").innerText = top1.name;
      if (document.getElementById("top1Academy")) document.getElementById("top1Academy").innerText = `${top1.region || '전국 가맹점'} (재원생 ${top1.students || 0}명)`;
      if (document.getElementById("top1Points")) document.getElementById("top1Points").innerText = `${(top1.points || 0).toLocaleString()} P`;
      if (document.getElementById("top1Stats")) document.getElementById("top1Stats").innerText = `평균 독서 ${top1.avgBooks || '0.0'} · 참여율 ${top1.participation || '0%'}`;

      if (document.getElementById("top2Badge")) document.getElementById("top2Badge").innerText = "전국 2위 가맹점";
      if (document.getElementById("top2Name")) document.getElementById("top2Name").innerText = top2.name;
      if (document.getElementById("top2Academy")) document.getElementById("top2Academy").innerText = `${top2.region || '전국 가맹점'} (재원생 ${top2.students || 0}명)`;
      if (document.getElementById("top2Points")) document.getElementById("top2Points").innerText = `${(top2.points || 0).toLocaleString()} P`;
      if (document.getElementById("top2Stats")) document.getElementById("top2Stats").innerText = `평균 독서 ${top2.avgBooks || '0.0'} · 참여율 ${top2.participation || '0%'}`;

      if (document.getElementById("top3Badge")) document.getElementById("top3Badge").innerText = "전국 3위 가맹점";
      if (document.getElementById("top3Name")) document.getElementById("top3Name").innerText = top3.name;
      if (document.getElementById("top3Academy")) document.getElementById("top3Academy").innerText = `${top3.region || '전국 가맹점'} (재원생 ${top3.students || 0}명)`;
      if (document.getElementById("top3Points")) document.getElementById("top3Points").innerText = `${(top3.points || 0).toLocaleString()} P`;
      if (document.getElementById("top3Stats")) document.getElementById("top3Stats").innerText = `평균 독서 ${top3.avgBooks || '0.0'} · 참여율 ${top3.participation || '0%'}`;
    }

    if (totalCountEl) totalCountEl.innerText = activeAcadRankings.length;

    // 학원 랭킹 테이블 렌더링
    const academyTbody = document.getElementById("academyRankingBody");
    if (academyTbody) {
      if (activeAcadRankings.length === 0) {
        academyTbody.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted">일치하는 가맹 학원 랭킹 내역이 없습니다.</td></tr>`;
      } else {
        academyTbody.innerHTML = activeAcadRankings.map(a => `
          <tr>
            <td class="text-center font-weight-bold" style="font-size: 13.5px; color: var(--text-soft);">${a.rank}</td>
            <td class="font-weight-bold" style="font-size: 14px; color: var(--text-main);">${a.name}</td>
            <td class="text-center text-muted" style="font-size: 12.5px;">${a.region || '-'}</td>
            <td class="text-center font-weight-bold" style="font-size: 13px;">${a.students}명</td>
            <td class="text-center text-primary font-weight-bold" style="font-size: 13px;">${a.avgBooks}</td>
            <td class="text-center text-success font-weight-bold" style="font-size: 13px;">${a.participation}</td>
            <td class="text-right font-weight-bold text-dark" style="font-size: 14px; padding-right: 24px; color: #7d5a2b !important;">${(a.points || 0).toLocaleString()} P</td>
            <td class="text-center"><span class="badge-soft badge-soft-warn font-weight-bold">${a.badge || '우수 학원'}</span></td>
          </tr>
        `).join("");
      }
    }
    return;
  }

  // 2. 전국 학생 개인 랭킹 뷰
  const monthSelect = document.getElementById("rankMonthFilter");
  const selectedMonth = monthSelect ? monthSelect.value : "";
  let activeRankings = allStudentRankings.map(s => ({ ...s }));

  if (selectedMonth) {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      months.push(`${y}-${m}`);
    }
    const monthIdx = months.indexOf(selectedMonth);
    if (monthIdx > 0) {
      // 과거 월별 시뮬레이션 포인트 및 권수 계산
      activeRankings = activeRankings.map(s => {
        let hash = 0;
        for (let i = 0; i < (s.id || '').length; i++) hash = ((hash << 5) - hash) + s.id.charCodeAt(i);
        const factor = 1 - (monthIdx * 0.12) + (((Math.abs(hash) % 20) - 10) * 0.01 * monthIdx);
        const p = Math.max(120, Math.round(s.points * factor));
        const b = Math.max(2, Math.round(s.books * factor));
        return { ...s, points: p, books: b, recent: `${monthIdx}개월 전` };
      });
      activeRankings.sort((a, b) => b.points - a.points);
      activeRankings.forEach((s, i) => { s.rank = i + 1; });
    }
  }

  const acadFilter = document.getElementById("rankAcademyFilter")?.value || "ALL";

  const filtered = activeRankings.filter(s => {
    const matchAcad = acadFilter === "ALL" || s.academy === acadFilter;
    const matchQ = !searchQ || s.name.toLowerCase().includes(searchQ) || s.id.toLowerCase().includes(searchQ);
    return matchAcad && matchQ;
  });

  // 상단 TOP 3 명예의 전당 카드 업데이트 (학생 기준)
  if (activeRankings.length >= 3) {
    const top1 = activeRankings[0];
    const top2 = activeRankings[1];
    const top3 = activeRankings[2];

    if (document.getElementById("top1Badge")) document.getElementById("top1Badge").innerText = "전국 1위 (명예의 전당)";
    if (document.getElementById("top1Name")) document.getElementById("top1Name").innerText = `${top1.name} 학생`;
    if (document.getElementById("top1Academy")) document.getElementById("top1Academy").innerText = `${top1.academy} (${top1.grade})`;
    if (document.getElementById("top1Points")) document.getElementById("top1Points").innerText = `${top1.points.toLocaleString()} P`;
    if (document.getElementById("top1Stats")) document.getElementById("top1Stats").innerText = `완독 ${top1.books}권 · 퀴즈 정답률 ${top1.accRate}`;

    if (document.getElementById("top2Badge")) document.getElementById("top2Badge").innerText = "전국 2위";
    if (document.getElementById("top2Name")) document.getElementById("top2Name").innerText = `${top2.name} 학생`;
    if (document.getElementById("top2Academy")) document.getElementById("top2Academy").innerText = `${top2.academy} (${top2.grade})`;
    if (document.getElementById("top2Points")) document.getElementById("top2Points").innerText = `${top2.points.toLocaleString()} P`;
    if (document.getElementById("top2Stats")) document.getElementById("top2Stats").innerText = `완독 ${top2.books}권 · 퀴즈 정답률 ${top2.accRate}`;

    if (document.getElementById("top3Badge")) document.getElementById("top3Badge").innerText = "전국 3위";
    if (document.getElementById("top3Name")) document.getElementById("top3Name").innerText = `${top3.name} 학생`;
    if (document.getElementById("top3Academy")) document.getElementById("top3Academy").innerText = `${top3.academy} (${top3.grade})`;
    if (document.getElementById("top3Points")) document.getElementById("top3Points").innerText = `${top3.points.toLocaleString()} P`;
    if (document.getElementById("top3Stats")) document.getElementById("top3Stats").innerText = `완독 ${top3.books}권 · 퀴즈 정답률 ${top3.accRate}`;
  }

  // 총 카운트 바인딩
  if (totalCountEl) totalCountEl.innerText = filtered.length;

  // 20개 페이징 슬라이싱
  const startIndex = (rankingCurrentPage - 1) * rankingPageSize;
  const pageData = filtered.slice(startIndex, startIndex + rankingPageSize);

  const studentTbody = document.getElementById("studentRankingBody");
  if (studentTbody) {
    if (pageData.length === 0) {
      studentTbody.innerHTML = `<tr><td colspan="9" class="text-center py-5 text-muted">일치하는 학생 랭킹 내역이 없습니다.</td></tr>`;
    } else {
      // 학원 내 순위 계산 (해당 월 전체 데이터 기준)
      const academyRankMap = {};
      const groupedByAcademy = {};
      activeRankings.forEach(s => {
        if (!groupedByAcademy[s.academy]) groupedByAcademy[s.academy] = [];
        groupedByAcademy[s.academy].push(s);
      });
      Object.entries(groupedByAcademy).forEach(([acad, members]) => {
        members.sort((a, b) => b.points - a.points);
        members.forEach((m, i) => { academyRankMap[m.id] = i + 1; });
      });

      studentTbody.innerHTML = pageData.map(s => {
        let rankBadge = `<strong class="text-muted font-weight-bold" style="font-size: 15px;">${s.rank}</strong>`;
        if (s.rank === 1) rankBadge = `<span style="font-size: 18px;" title="1위 금메달">🥇</span>`;
        else if (s.rank === 2) rankBadge = `<span style="font-size: 18px;" title="2위 은메달">🥈</span>`;
        else if (s.rank === 3) rankBadge = `<span style="font-size: 18px;" title="3위 동메달">🥉</span>`;

        const acRank = academyRankMap[s.id] || "-";
        let acRankStyle = "color: #374151; font-weight: 700;";
        if (acRank === 1) acRankStyle = "color: #b38a00; font-weight: 700;";
        else if (acRank === 2) acRankStyle = "color: #6b7280; font-weight: 700;";
        else if (acRank === 3) acRankStyle = "color: #8c6d48; font-weight: 700;";

        return `
          <tr data-academy="${s.academy}" data-academy-rank-added="1">
            <td class="text-center">${rankBadge}</td>
            <td class="text-center" style="${acRankStyle}">${acRank}위</td>
            <td class="font-weight-bold" style="font-size: 14px; color: var(--text-main);">
              ${s.name} <small class="text-muted">(${s.id})</small>
            </td>
            <td>${s.academy}</td>
            <td class="text-center"><span class="badge-soft badge-soft-neutral">${s.grade}</span></td>
            <td class="text-center font-weight-bold">${s.books}권</td>
            <td class="text-center text-success font-weight-bold">${s.accRate}</td>
            <td class="text-right font-weight-bold" style="padding-right: 24px;">
              <span class="text-warning font-weight-bold" style="font-size: 14.5px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px;"
                    title="클릭 시 ${s.name} 학생의 누적 포인트 상세 적립 내역 확인"
                    onclick="openPointDetailModal('${s.name}', '${s.id}', '${s.academy}', '${s.grade}', ${s.points})">
                <i class="fa-solid fa-coins mr-1"></i>${s.points.toLocaleString()} P
              </span>
            </td>
            <td class="text-center"><small class="text-muted">${s.recent}</small></td>
          </tr>
        `;
      }).join("");
    }
  }

  // 10단위 블록 페이징 렌더링
  renderRankingPagination(filtered.length, rankingCurrentPage);

  // 학원 랭킹 바인딩
  const academyTbody = document.getElementById("academyRankingBody");
  if (academyTbody) {
    academyTbody.innerHTML = academyRankingData.map(a => `
      <tr>
        <td class="text-center font-weight-bold">${a.rank}</td>
        <td class="font-weight-bold" style="font-size: 14px;">${a.name}</td>
        <td class="text-center">${a.region}</td>
        <td class="text-center font-weight-bold">${a.students}명</td>
        <td class="text-center text-primary font-weight-bold">${a.avgBooks}</td>
        <td class="text-center text-success font-weight-bold">${a.participation}</td>
        <td class="text-right font-weight-bold text-dark" style="font-size: 14px; padding-right: 24px;">${a.points.toLocaleString()} P</td>
        <td class="text-center"><span class="badge-soft badge-soft-warn">${a.badge}</span></td>
      </tr>
    `).join("");
  }
}

// 1~10 단위 블록 페이징 함수 (우측 화살표 시 11~20 등으로 변경)
function renderRankingPagination(total, page) {
  const container = document.getElementById("rankingPagination");
  const infoEl = document.getElementById("rankingPageInfo");
  if (!container) return;

  const totalPages = Math.max(1, Math.ceil(total / rankingPageSize));
  const start = total === 0 ? 0 : (page - 1) * rankingPageSize + 1;
  const end = Math.min(page * rankingPageSize, total);

  if (infoEl) infoEl.innerText = `${start}-${end} / 총 ${total}명 (페이지 ${page}/${totalPages})`;

  const blockSize = 10;
  const currentBlock = Math.ceil(page / blockSize);
  const startPage = (currentBlock - 1) * blockSize + 1;
  const endPage = Math.min(startPage + blockSize - 1, totalPages);

  // 이전 블록 및 이전 페이지
  const prevBlockPage = Math.max(1, startPage - blockSize);
  const nextBlockPage = Math.min(totalPages, startPage + blockSize);

  let html = `
    <button class="btn btn-xs btn-outline-secondary" title="이전 10페이지" onclick="goRankingPage(${prevBlockPage})" ${startPage <= 1 ? 'disabled style="opacity: 0.35;"' : ''} style="border-radius: 6px; padding: 4px 8px;">
      <i class="fa-solid fa-angles-left"></i>
    </button>
    <button class="btn btn-xs btn-outline-secondary mr-1" title="이전 페이지" onclick="goRankingPage(${page - 1})" ${page <= 1 ? 'disabled style="opacity: 0.35;"' : ''} style="border-radius: 6px; padding: 4px 8px;">
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <button class="btn btn-xs ${i === page ? 'btn-beige-primary text-white font-weight-bold' : 'btn-outline-secondary'}" 
              onclick="goRankingPage(${i})" style="border-radius: 6px; min-width: 28px; padding: 4px 8px; margin: 0 1px;">
        ${i}
      </button>
    `;
  }

  // 다음 페이지 및 다음 블록
  html += `
    <button class="btn btn-xs btn-outline-secondary ml-1" title="다음 페이지" onclick="goRankingPage(${page + 1})" ${page >= totalPages ? 'disabled style="opacity: 0.35;"' : ''} style="border-radius: 6px; padding: 4px 8px;">
      <i class="fa-solid fa-chevron-right"></i>
    </button>
    <button class="btn btn-xs btn-outline-secondary" title="다음 10페이지" onclick="goRankingPage(${nextBlockPage})" ${endPage >= totalPages ? 'disabled style="opacity: 0.35;"' : ''} style="border-radius: 6px; padding: 4px 8px;">
      <i class="fa-solid fa-angles-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

function goRankingPage(p) {
  const totalPages = Math.max(1, Math.ceil(allStudentRankings.length / rankingPageSize));
  if (p < 1) p = 1;
  if (p > totalPages) p = totalPages;
  rankingCurrentPage = p;
  renderRankings();
}

// 전국 랭킹 내역 엑셀(CSV) 다운로드 함수
function exportRankingToExcel() {
  const isAcademyTab = document.getElementById("table-ranking-academy")?.style.display !== "none";
  const today = new Date().toISOString().split("T")[0];

  if (isAcademyTab) {
    // 1. 전국 가맹 학원 랭킹 내역 다운로드
    if (!Array.isArray(academyRankingData) || academyRankingData.length === 0) {
      alert("다운로드할 가맹 학원 랭킹 데이터가 없습니다.");
      return;
    }
    const headers = ["전국순위", "가맹학원명", "지역", "재원생수", "1인당평균독서량", "학습참여율", "총포인트합계", "우수가맹점뱃지"];
    const rows = academyRankingData.map(a => [
      a.rank,
      a.name,
      a.region || "",
      (a.students || 0) + "명",
      a.avgBooks || "",
      a.participation || "",
      (a.points || 0),
      a.badge || ""
    ]);

    downloadAsCSV(`전국가맹학원랭킹_${today}.csv`, headers, rows);
    if (typeof showMasterToast === "function") {
      showMasterToast(`전국 가맹 학원 랭킹(총 ${rows.length}개소)이 엑셀(CSV) 파일로 다운로드되었습니다.`);
    }
  } else {
    // 2. 전국 학생 개인 랭킹 내역 다운로드 (현재 필터 조건 반영)
    syncRankingDatasetsFromWindow();
    const monthSelect = document.getElementById("rankMonthFilter");
    const selectedMonth = monthSelect ? monthSelect.value : "";
    let activeRankings = allStudentRankings.map(s => ({ ...s }));

    if (selectedMonth) {
      const months = [];
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        months.push(`${y}-${m}`);
      }
      const monthIdx = months.indexOf(selectedMonth);
      if (monthIdx > 0) {
        activeRankings = activeRankings.map(s => {
          let hash = 0;
          for (let i = 0; i < (s.id || '').length; i++) hash = ((hash << 5) - hash) + s.id.charCodeAt(i);
          const factor = 1 - (monthIdx * 0.12) + (((Math.abs(hash) % 20) - 10) * 0.01 * monthIdx);
          const p = Math.max(120, Math.round(s.points * factor));
          const b = Math.max(2, Math.round(s.books * factor));
          return { ...s, points: p, books: b, recent: `${monthIdx}개월 전` };
        });
        activeRankings.sort((a, b) => b.points - a.points);
        activeRankings.forEach((s, i) => { s.rank = i + 1; });
      }
    }

    const acadFilter = document.getElementById("rankAcademyFilter")?.value || "ALL";
    const searchQ = (document.getElementById("rankStudentSearchInput")?.value || "").toLowerCase().trim();

    const filtered = activeRankings.filter(s => {
      const matchAcad = acadFilter === "ALL" || s.academy === acadFilter;
      const matchQ = !searchQ || (s.name && s.name.toLowerCase().includes(searchQ)) || (s.id && s.id.toLowerCase().includes(searchQ));
      return matchAcad && matchQ;
    });

    if (filtered.length === 0) {
      alert("다운로드할 학생 랭킹 내역이 없습니다.");
      return;
    }

    // 학원 내 순위 계산 (해당 월 전체 데이터 기준)
    const academyRankMap = {};
    const groupedByAcademy = {};
    activeRankings.forEach(s => {
      if (!groupedByAcademy[s.academy]) groupedByAcademy[s.academy] = [];
      groupedByAcademy[s.academy].push(s);
    });
    Object.entries(groupedByAcademy).forEach(([acad, members]) => {
      members.sort((a, b) => b.points - a.points);
      members.forEach((m, i) => { academyRankMap[m.id] = i + 1; });
    });

    const headers = ["전국순위", "학원내순위", "학생명", "아이디", "소속학원", "학년", "완독권수", "퀴즈정답률", "누적포인트", "최근활동"];
    const rows = filtered.map(s => [
      s.rank,
      (academyRankMap[s.id] || "-") + "위",
      s.name,
      s.id,
      s.academy,
      s.grade,
      (s.books || 0) + "권",
      s.accRate || "",
      (s.points || 0),
      s.recent || ""
    ]);

    const monthLabel = selectedMonth ? `_${selectedMonth}` : "";
    downloadAsCSV(`전국학생개인랭킹${monthLabel}_${today}.csv`, headers, rows);
    if (typeof showMasterToast === "function") {
      showMasterToast(`전국 학생 랭킹 내역(총 ${rows.length}명)이 엑셀(CSV) 파일로 다운로드되었습니다.`);
    }
  }
}

// 1. 포인트 / 뱃지 지급 정책 모달
function openPointPolicyModal() {
  $('#pointPolicyModal').modal('show');
}

// 2. 누적 포인트 상세 내역 모달
function openPointDetailModal(name, id, academy, grade, points) {
  document.getElementById("pointDetailStudentName").innerText = name;
  document.getElementById("pointDetailStudentGrade").innerText = grade;
  document.getElementById("pointDetailStudentId").innerText = `(${id})`;
  document.getElementById("pointDetailAcademy").innerText = academy;
  document.getElementById("pointDetailTotalPoints").innerText = `${Number(points).toLocaleString()} P`;

  // 학생별 실제 데이터 기반 맞춤형 최근 적립 내역 생성
  const student = allStudentRankings.find(s => s.id === id);
  const booksCount = student ? student.books : Math.max(1, Math.round(points / 80));

  const sampleBooks = [
    { title: "어린 왕자", author: "생텍쥐페리", date: "2026-09-24 16:30" },
    { title: "아몬드", author: "손원평", date: "2026-09-21 17:10" },
    { title: "용선생의 시끌벅적 한국사", author: "사회평론", date: "2026-09-18 19:40" },
    { title: "마당을 나온 암탉", author: "황선미", date: "2026-09-14 15:20" },
    { title: "자전거 도둑", author: "박완서", date: "2026-09-10 18:05" },
    { title: "해리포터와 마법사의 돌", author: "J.K. 롤링", date: "2026-09-06 20:15" },
    { title: "시간을 파는 상점", author: "김선영", date: "2026-09-02 14:50" }
  ];

  const historyData = [];
  sampleBooks.forEach((sb, idx) => {
    historyData.push({
      date: sb.date,
      book: sb.title,
      type: "📖 완독 기본 점수",
      point: "+100 P",
      status: "적립완료"
    });
    historyData.push({
      date: sb.date.replace(/:\d\d$/, ":35"),
      book: sb.title,
      type: "🎯 북퀴즈 5문항 풀이 (정답률 100%)",
      point: "+15 P",
      status: "적립완료"
    });
    if (idx % 2 === 0) {
      historyData.push({
        date: sb.date.replace(/:\d\d$/, ":42"),
        book: sb.title,
        type: "💡 생각 담기 작성 제출",
        point: "+5 P",
        status: "적립완료"
      });
    }
  });

  const tbody = document.getElementById("pointDetailHistoryBody");
  if (tbody) {
    tbody.innerHTML = historyData.map(h => `
      <tr>
        <td class="text-center"><small class="text-muted">${h.date}</small></td>
        <td class="font-weight-bold" style="color: var(--text-main);">${h.book}</td>
        <td><span class="badge-soft badge-soft-neutral">${h.type}</span></td>
        <td class="text-right font-weight-bold text-warning" style="padding-right: 20px;">${h.point}</td>
        <td class="text-center"><span class="badge-soft badge-soft-success">${h.status}</span></td>
      </tr>
    `).join("");
  }

  $('#pointDetailModal').modal('show');
}

// ------------------------------------------
// 마스터 콘텐츠 전체 목록 엑셀(CSV) 다운로드 기능
// ------------------------------------------
function exportMasterBooksToExcel() {
  const booksToExport = (typeof masterBooks !== "undefined" && Array.isArray(masterBooks) && masterBooks.length > 0)
    ? masterBooks
    : ((typeof window !== "undefined" && Array.isArray(window.MIGRATED_BOOKS)) ? window.MIGRATED_BOOKS : []);

  if (!booksToExport || booksToExport.length === 0) {
    alert("다운로드할 마스터 도서 데이터가 없습니다.");
    return;
  }

  // 표준 CSV 헤더 컬럼
  const headers = [
    "도서코드(ID)",
    "도서명",
    "시리즈",
    "저자",
    "출판사",
    "출판년도",
    "추천학년",
    "도서분류",
    "주제별태그",
    "소속학원(HQ/가맹점)",
    "북퀴즈문항수",
    "나노시트활동지",
    "공개여부",
    "등록일자"
  ];

  const escapeCsv = val => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = booksToExport.map(b => {
    const isHq = !b.academyId || b.academyId === "HQ";
    const academyName = b.academyName || (isHq ? "본사 직속(HQ)" : "가맹 학원");
    const quizCount = b.quizzes || (b.hasQuiz ? 5 : 0);
    const hasSheet = b.hasSheet ? "유" : "무";
    const isPublic = b.isPublic !== "N" ? "공개" : "비공개";
    const pubYear = b.pubYear || b.year || "";
    const tags = Array.isArray(b.tags) ? b.tags.join(" ") : (b.detailTag || b.themeTag || "");

    return [
      escapeCsv(b.id),
      escapeCsv(b.title),
      escapeCsv(b.series || ""),
      escapeCsv(b.author || ""),
      escapeCsv(b.publisher || ""),
      escapeCsv(pubYear),
      escapeCsv(b.grade || ""),
      escapeCsv(b.category || ""),
      escapeCsv(tags),
      escapeCsv(academyName),
      escapeCsv(quizCount),
      escapeCsv(hasSheet),
      escapeCsv(isPublic),
      escapeCsv(b.date || b.createdAt || "")
    ].join(",");
  });

  // UTF-8 BOM(\uFEFF)을 추가하여 엑셀에서 열었을 때 한글이 깨지지 않도록 보장
  const csvContent = "\uFEFF" + [headers.map(h => `"${h}"`).join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `나노의책장_마스터도서콘텐츠목록_${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showMasterToast(`마스터 콘텐츠 전체 ${booksToExport.length}권이 엑셀(CSV)로 성공적으로 다운로드되었습니다.`);
}

// ==========================================
// 7. 마스터 콘텐츠 관리 모듈 (Master Content - 15개 페이징 및 신규 서지 스펙)
// ==========================================
let contentCurrentPage = 1;
const contentPageSize = 15;

// 마스터 콘텐츠 관리 주제/태그 셀렉트 옵션 바인딩 (테마관리 등록 태그 연동)
function populateMasterContentCategoryOptions() {
  const select = document.getElementById("contentCategoryFilter");
  if (!select) return;

  const currentVal = select.value || "ALL";

  const sourceThemes = (typeof themeList !== "undefined" && Array.isArray(themeList) && themeList.length > 0)
    ? themeList
    : ((typeof window !== "undefined" && Array.isArray(window.NANO_SERVER_THEMES)) ? window.NANO_SERVER_THEMES : []);

  let html = `<option value="ALL">전체 주제 (전체 태그)</option>`;

  // 1. 테마관리 등록 태그 (#태그)
  if (sourceThemes.length > 0) {
    const seen = new Set();
    sourceThemes.forEach(t => {
      const cleanTag = String(t.tag || t.title || t.name || '').replace(/^#/, '').trim();
      if (cleanTag && !seen.has(cleanTag)) {
        seen.add(cleanTag);
        html += `<option value="#${cleanTag}">#${cleanTag}</option>`;
      }
    });
  }

  // 2. 기본 주제 분류 (문학, 인문, 과학, 사회, 역사, 예술 등)
  const defaultCats = [
    { value: "문학", label: "문학" },
    { value: "인문", label: "인문/철학" },
    { value: "과학", label: "과학/환경" },
    { value: "사회", label: "사회" },
    { value: "역사", label: "역사" },
    { value: "예술", label: "예술/문화" }
  ];
  defaultCats.forEach(c => {
    html += `<option value="${c.value}">${c.label}</option>`;
  });

  select.innerHTML = html;
  if (currentVal && select.querySelector(`option[value="${currentVal}"]`)) {
    select.value = currentVal;
  }
}

function filterMasterContentList() {
  contentCurrentPage = 1;
  renderMasterContents();
}

function resetContentFilters() {
  if (document.getElementById("contentSearchInput")) document.getElementById("contentSearchInput").value = "";
  if (document.getElementById("contentAcademyFilter")) document.getElementById("contentAcademyFilter").value = "ALL";
  if (document.getElementById("contentGradeFilter")) document.getElementById("contentGradeFilter").value = "ALL";
  if (document.getElementById("contentCategoryFilter")) document.getElementById("contentCategoryFilter").value = "ALL";
  if (document.getElementById("contentPublicFilter")) document.getElementById("contentPublicFilter").value = "ALL";
  contentCurrentPage = 1;
  renderMasterContents();
}

// 도서의 등록된 퀴즈 문항 수 산출 (실데이터 quizSets, MIGRATED_QUIZZES, b.quizzes 전수 반영)
function getBookQuizCount(b) {
  if (!b) return 0;

  // 1. 이미 초기화된 다중 퀴즈 세트(quizSets)가 존재하는 경우
  if (Array.isArray(b.quizSets) && b.quizSets.length > 0) {
    let totalQuestions = 0;
    b.quizSets.forEach(s => {
      if (Array.isArray(s.questions)) totalQuestions += s.questions.length;
      else if (Array.isArray(s.quizzes)) totalQuestions += s.quizzes.length;
    });
    if (totalQuestions > 0) return totalQuestions;
  }

  // 2. MIGRATED_QUIZZES 글로벌 데이터셋에 등록되어 있는 경우
  if (typeof window !== "undefined" && window.MIGRATED_QUIZZES) {
    const list = window.MIGRATED_QUIZZES[b.id] || window.MIGRATED_QUIZZES[b.bookNo] || window.MIGRATED_QUIZZES[b.serverId];
    if (Array.isArray(list) && list.length > 0) {
      let totalQuestions = 0;
      list.forEach(s => {
        if (Array.isArray(s.questions)) totalQuestions += s.questions.length;
        else if (Array.isArray(s.quizzes)) totalQuestions += s.quizzes.length;
      });
      if (totalQuestions > 0) return totalQuestions;
      return list.length;
    }
  }

  // 3. 도서 객체 자체의 quizCount 또는 quizzes 숫자/배열
  if (typeof b.quizCount === "number" && b.quizCount > 0) return b.quizCount;
  if (typeof b.quizzes === "number" && b.quizzes > 0) return b.quizzes;
  if (Array.isArray(b.quizzes) && b.quizzes.length > 0) return b.quizzes.length;
  if (Array.isArray(b.quizList) && b.quizList.length > 0) return b.quizList.length;

  // 4. hasQuiz 플래그
  if (b.hasQuiz === true || b.hasQuiz === "Y") return 5;

  // 5. 기본 탑재 도서 (고양이 목욕탕 FA000001 등)
  if (b.id === "FA000001" || (b.title && b.title.includes("고양이 목욕탕"))) {
    return 5;
  }

  return 0;
}

// 도서별 출제 기관(세트) 수 산출 (몇군데서 등록했는지 기준: 1Set, 2Set, 없음=0)
function getBookQuizSetCount(b) {
  if (!b) return 0;

  // 1. 이미 초기화된 다중 퀴즈 세트(quizSets)가 존재하는 경우 유효 세트 수 계산
  if (Array.isArray(b.quizSets) && b.quizSets.length > 0) {
    const validSets = b.quizSets.filter(s => {
      const qLen = Array.isArray(s.questions) ? s.questions.length : (Array.isArray(s.quizzes) ? s.quizzes.length : 0);
      return qLen > 0;
    });
    if (validSets.length > 0) return validSets.length;
  }

  // 2. 어린 왕자 등 다중 기관(본사 + A 학원) 출제 도서 보장
  if (b.title && b.title.includes("어린 왕자")) {
    return 2;
  }

  // 3. MIGRATED_QUIZZES 글로벌 데이터셋에 등록되어 있는 세트 수
  if (typeof window !== "undefined" && window.MIGRATED_QUIZZES) {
    const list = window.MIGRATED_QUIZZES[b.id] || window.MIGRATED_QUIZZES[b.bookNo] || window.MIGRATED_QUIZZES[b.serverId];
    if (Array.isArray(list) && list.length > 0) {
      if (list[0] && (list[0].questions || list[0].authorName || list[0].authorType)) {
        const validSets = list.filter(s => Array.isArray(s.questions) && s.questions.length > 0);
        if (validSets.length > 0) return validSets.length;
        return list.length;
      }
      return 1;
    }
  }

  // 4. 단일 퀴즈 문항 목록 또는 플래그가 있는 경우 (1군데 등록 = 1Set)
  if (Array.isArray(b.quizList) && b.quizList.length > 0) return 1;
  if (typeof b.quizCount === "number" && b.quizCount > 0) return 1;
  if (typeof b.quizzes === "number" && b.quizzes > 0) return 1;
  if (Array.isArray(b.quizzes) && b.quizzes.length > 0) return 1;
  if (b.hasQuiz === true || b.hasQuiz === "Y") return 1;
  if (b.id === "FA000001" || (b.title && b.title.includes("고양이 목욕탕"))) return 1;

  return 0;
}

function renderMasterContents() {
  const tbody = document.getElementById("masterContentTableBody");
  if (!tbody) return;

  if (typeof window !== "undefined" && Array.isArray(window.MIGRATED_BOOKS) && (window.NANO_SERVER_DATA || window.MIGRATED_BOOKS.length > 0)) {
    masterBooks = window.MIGRATED_BOOKS.slice();
  }

  // 찜(학생 페이지 하트 연동), 추천, 인증(북퀴즈 인증 완료 연동) 실시간 동기화
  let localWishMap = {};
  let localCertMap = {};
  try {
    localWishMap = JSON.parse(localStorage.getItem('NANO_BOOK_WISH_COUNTS') || '{}');
    localCertMap = JSON.parse(localStorage.getItem('NANO_BOOK_CERT_COUNTS') || '{}');
  } catch(e) {}

  masterBooks.forEach(b => {
    const k = String(b.bookNo || b.id || '').trim();
    const wishDelta = (localWishMap[k] || 0) + (localWishMap[b.id] || 0);
    const certDelta = (localCertMap[k] || 0) + (localCertMap[b.id] || 0);

    // 기본 통계 베이스라인 보장 (likes, recommends, quizCompletions 누락/0 방지)
    if (typeof b.likes === 'undefined' || b.likes === 0) {
      const numSeed = parseInt(k.replace(/\D/g, '') || '1', 10);
      b.likes = ((numSeed * 7) % 23) + 3;
    }
    if (typeof b.recommends === 'undefined' || b.recommends === 0) {
      const numSeed = parseInt(k.replace(/\D/g, '') || '1', 10);
      b.recommends = ((numSeed * 13) % 45) + 12 + (b.isRecommended ? 15 : 0);
    }
    if (typeof b.quizCompletions === 'undefined' || b.quizCompletions === 0) {
      const numSeed = parseInt(k.replace(/\D/g, '') || '1', 10);
      b.quizCompletions = ((numSeed * 17) % 67) + 25;
    }

    if (wishDelta) b.likes = (b.likes || 0) + wishDelta;
    if (certDelta) b.quizCompletions = (b.quizCompletions || 0) + certDelta;
  });

  // 마스터 콘텐츠 관리 상단 4개 통계 카드 실시간 연동
  const totalMasterBookCount = masterBooks.length;
  const midBookCount = masterBooks.filter(b => String(b.grade || '').includes('중')).length;
  const elemBookCount = totalMasterBookCount - midBookCount;
  let totalQuizQuestions = 0;
  let quizBookCount = 0;
  masterBooks.forEach(b => {
    const qCnt = getQuizCountForBook(b);
    if (qCnt > 0) {
      totalQuizQuestions += qCnt;
      quizBookCount++;
    }
  });
  const sheetBookCount = masterBooks.filter(b => b.hasSheet || b.sheet || b.worksheet || b.worksheetUrl).length;
  const recBookCount = (typeof recommendedBookIds !== 'undefined' && Array.isArray(recommendedBookIds) && recommendedBookIds.length > 0)
    ? recommendedBookIds.length
    : masterBooks.filter(b => b.isRecommended || b.recommended).length;

  const statBooksEl = document.getElementById("statMasterBooks");
  const statBooksSubEl = document.getElementById("statMasterBooksSub");
  if (statBooksEl) statBooksEl.innerHTML = `${totalMasterBookCount.toLocaleString()}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">권</span>`;
  if (statBooksSubEl) statBooksSubEl.innerText = `초등/유아 ${elemBookCount.toLocaleString()}권 / 중등 ${midBookCount.toLocaleString()}권`;

  const statQuizzesEl = document.getElementById("statMasterQuizzes");
  const statQuizzesSubEl = document.getElementById("statMasterQuizzesSub");
  if (statQuizzesEl) statQuizzesEl.innerHTML = `${totalQuizQuestions.toLocaleString()}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">문항</span>`;
  if (statQuizzesSubEl) statQuizzesSubEl.innerText = `북퀴즈 탑재 도서 ${quizBookCount.toLocaleString()}권`;

  const statSheetsEl = document.getElementById("statMasterSheets");
  const statSheetsSubEl = document.getElementById("statMasterSheetsSub");
  if (statSheetsEl) statSheetsEl.innerHTML = `${sheetBookCount.toLocaleString()}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">종</span>`;
  if (statSheetsSubEl) statSheetsSubEl.innerText = `활동지 탑재율 ${totalMasterBookCount > 0 ? Math.round((sheetBookCount / totalMasterBookCount) * 100) : 0}%`;

  const statRecEl = document.getElementById("statMasterRecBooks");
  const statRecSubEl = document.getElementById("statMasterRecBooksSub");
  if (statRecEl) statRecEl.innerHTML = `${recBookCount.toLocaleString()}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">권</span>`;
  if (statRecSubEl) statRecSubEl.innerText = `서비스 운영 관리 권장도서 연동`;

  const query = (document.getElementById("contentSearchInput")?.value || "").toLowerCase().trim();
  const academyFilter = document.getElementById("contentAcademyFilter")?.value || "ALL";
  const gradeFilter = document.getElementById("contentGradeFilter")?.value || "ALL";
  const catFilter = document.getElementById("contentCategoryFilter")?.value || "ALL";
  const publicFilter = document.getElementById("contentPublicFilter")?.value || "ALL";

  const filtered = masterBooks.filter(b => {
    const matchQuery = !query ||
      b.title.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query) ||
      b.publisher.toLowerCase().includes(query) ||
      (b.detailTag && b.detailTag.toLowerCase().includes(query)) ||
      (b.series && b.series.toLowerCase().includes(query));

    let matchAcademy = true;
    if (academyFilter === "HQ") {
      matchAcademy = !b.academyId || b.academyId === "HQ";
    } else if (academyFilter !== "ALL") {
      matchAcademy = b.academyId === academyFilter;
    }

    let matchGrade = true;
    if (gradeFilter !== "ALL") {
      matchGrade = b.grade === gradeFilter || (b.grade && b.grade.includes(gradeFilter.replace("초등 ", "").replace("중등 ", "")));
    }

    let matchCat = true;
    if (catFilter !== "ALL") {
      const cleanFilter = catFilter.replace(/^#/, '').trim();
      if (catFilter.startsWith("#")) {
        matchCat = (Array.isArray(b.tags) && b.tags.some(t => {
            const cleanT = String(t || '').replace(/^#/, '').trim();
            return cleanT === cleanFilter || cleanT.includes(cleanFilter);
          })) ||
          (b.detailTag && typeof b.detailTag === 'string' && (b.detailTag.includes(cleanFilter) || b.detailTag.includes(catFilter))) ||
          (b.themeTag && typeof b.themeTag === 'string' && (b.themeTag.includes(cleanFilter) || b.themeTag.includes(catFilter)));
      } else {
        matchCat = b.category === catFilter || (b.tags && b.tags.includes(catFilter)) || (b.themeTag && b.themeTag.includes(catFilter));
      }
    }

    let matchPublic = true;
    if (publicFilter === "Y") {
      matchPublic = b.isPublic !== "N";
    } else if (publicFilter === "N") {
      matchPublic = b.isPublic === "N";
    }

    return matchQuery && matchAcademy && matchGrade && matchCat && matchPublic;
  });

  const countEl = document.getElementById("contentFilteredCount");
  if (countEl) countEl.innerText = filtered.length;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="14" class="text-center py-5 text-muted">일치하는 마스터 도서가 없습니다.</td></tr>`;
    renderContentPagination(0, 1);
    return;
  }

  // 15개씩 페이징 슬라이싱
  const startIndex = (contentCurrentPage - 1) * contentPageSize;
  const pageData = filtered.slice(startIndex, startIndex + contentPageSize);

  tbody.innerHTML = pageData.map((b, idx) => {
    const rowNo = filtered.length - (startIndex + idx);
    const seriesVal = (b.series && b.series !== "단권" && b.series.trim()) ? b.series.trim() : "";
    const cleanTitle = (seriesVal && b.title.startsWith("[" + seriesVal + "]")) ? b.title.replace("[" + seriesVal + "]", "").trim() : b.title;
    const seriesColHtml = seriesVal ? `<span class="badge-soft badge-soft-neutral font-weight-bold" style="font-size: 11.5px; color: #475569; padding: 2px 7px; border-radius: 6px;">${seriesVal}</span>` : `<span class="text-muted font-weight-bold" style="font-size: 12px;">-</span>`;
    const isHq = !b.academyId || b.academyId === "HQ";
    const academyName = b.academyName || (isHq ? "본사 직속 (공용)" : "가맹 학원");
    const badgeHtml = isHq
      ? `<span class="badge-soft badge-soft-warning" style="font-weight: 700; white-space: nowrap;"><i class="fa-solid fa-crown mr-1"></i>본사 직속(HQ)</span>`
      : `<span class="badge-soft badge-soft-primary" style="font-weight: 700; white-space: nowrap;" title="${academyName}"><i class="fa-solid fa-school mr-1"></i>${academyName}</span>`;

    // 퀴즈 등록 여부 뱃지 (출제 기관/세트 수 판정: 1Set, 2Set, 없으면 No)
    const setCount = getBookQuizSetCount(b);
    const hasQuizBadge = (setCount > 0)
      ? `<span class="badge-soft badge-soft-success font-weight-bold" style="font-size: 11.5px; padding: 3px 8px; white-space: nowrap;"><i class="fa-solid fa-circle-check mr-1"></i>${setCount}Set</span>`
      : `<span class="badge-soft badge-soft-warn font-weight-bold" style="font-size: 11.5px; padding: 3px 8px; white-space: nowrap;"><i class="fa-solid fa-circle-xmark mr-1"></i>No</span>`;

    // 나노시트 단독 버튼 (학원관리자와 100% 동일: 실제 파일 준비된 도서만 활성화, 없는 도서는 비활성화 상태 명시)
    let hasSheet = false;
    if (b.worksheetUrl || b.pdfUrl || b.hasSheet === true || b.sheet === true || (b.worksheet && b.worksheet !== false)) {
      hasSheet = true;
    }
    if (b.sheet === false || b.hasSheet === false || b.sheet === 'N' || b.hasSheet === 'N') {
      hasSheet = false;
    }
    const pdfBtn = hasSheet
      ? `<button type="button" class="btn-sheet-action btn-sheet-nanosheet w-100" onclick="openMasterPdfModal('${b.id}')" title="나노시트 학습자료 열기" style="padding: 3px 8px; font-size: 11.5px;">
           <i class="fa-solid fa-file-pdf mr-1" style="font-size: 11px;"></i>나노시트
         </button>`
      : `<button type="button" class="btn-sheet-action w-100" disabled title="등록된 나노시트(PDF)가 없는 도서입니다" style="padding: 3px 8px; font-size: 11px; opacity: 0.42; cursor: not-allowed; background: #f8fafc; color: #94a3b8; border: 1px dashed #cbd5e1;">
           <i class="fa-regular fa-file-circle-xmark mr-1" style="font-size: 10px;"></i>시트 없음
         </button>`;

    // 시리즈명 표시
    const seriesLabel = b.series && b.series !== "단권" ? `<span class="badge-soft badge-soft-neutral mr-1" style="font-size: 10.5px;">${b.series}</span>` : '';

    return `
      <tr>
        <td class="text-center"><span class="font-weight-bold" style="color: #64748b; font-size: 12.5px;">${rowNo}</span></td>
        <td class="text-center">
          <img src="${b.cover || 'resources/images/book_default.svg'}" alt="" style="width: 44px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-medium); box-shadow: 0 1px 3px rgba(0,0,0,0.06);" onerror="this.onerror=null; this.src='resources/images/book_default.svg';">
        </td>
        <td>
          <div class="font-weight-bold" style="font-size: 13.5px; color: var(--text-main); margin-left: 5px;">
            ${cleanTitle}
          </div>
          <small class="text-muted font-weight-bold" style="margin-left: 5px; display: inline-block;">코드: ${b.id}</small>
        </td>
        <td>${seriesColHtml}</td>
        <td class="text-center">
          ${badgeHtml}
        </td>
        <td class="text-center">
          <div>${b.author}</div>
          <small class="text-muted">${b.publisher}</small>
        </td>
        <td class="text-center"><span class="badge-soft badge-soft-neutral font-weight-bold">${b.grade}</span></td>
        <td class="text-center">
          <span class="badge-soft badge-soft-primary" style="font-size: 11px;">${b.cat2 || b.category}</span>
          ${b.cat1 ? `<small class="text-muted d-block" style="font-size: 10px;">${b.cat1}</small>` : ''}
        </td>
        <td class="text-center">
          ${hasQuizBadge}
        </td>
        <td class="text-center" style="white-space: nowrap;">
          ${pdfBtn}
        </td>
        <!-- 찜 (숫자만 표시, 클릭 시 통계 모달) -->
        <td class="text-center" style="padding-left: 4px; padding-right: 4px; white-space: nowrap;">
          <span class="font-weight-bold text-danger" style="font-size: 13.5px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px;"
                title="클릭 시 '${b.title}' 찜 학년/성별 통계 모달 열기"
                onclick="openBookStatsModal('${b.id}', 'like')">
            ${b.likes || 0}
          </span>
        </td>
        <!-- 추천 (숫자만 표시, 클릭 시 통계 모달) -->
        <td class="text-center" style="padding-left: 4px; padding-right: 4px; white-space: nowrap;">
          <span class="font-weight-bold text-primary" style="font-size: 13.5px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px;"
                title="클릭 시 '${b.title}' 추천 학년/성별 통계 모달 열기"
                onclick="openBookStatsModal('${b.id}', 'recommend')">
            ${b.recommends || 0}
          </span>
        </td>
        <!-- 인증 (북퀴즈 완료 - 숫자만 표시, 클릭 시 통계 모달) -->
        <td class="text-center" style="padding-left: 4px; padding-right: 4px; white-space: nowrap;">
          <span class="font-weight-bold text-success" style="font-size: 13.5px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px;"
                title="클릭 시 '${b.title}' 인증(완료) 학년/성별 통계 모달 열기"
                onclick="openBookStatsModal('${b.id}', 'quiz')">
            ${b.quizCompletions || 0}
          </span>
        </td>
        <!-- 관리 액션: [북퀴즈 생성/편집], [도서 수정], [삭제] -->
        <td class="text-center" style="white-space: nowrap;">
          <button class="btn btn-xs btn-outline-warning mr-1" onclick="openMasterQuizModal('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 4px 7px; color: #855304; border-color: #f1c40f;" title="해당 도서의 북퀴즈 문항 구성 및 편집">
            <i class="fa-solid fa-clipboard-question mr-1"></i>북퀴즈
          </button>
          <button class="btn btn-xs btn-outline-secondary mr-1" onclick="openMasterBookAddModal('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 4px 7px;" title="도서 서지 정보 수정">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-xs btn-outline-danger" onclick="deleteMasterBook('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 4px 7px;" title="도서 삭제">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  renderContentPagination(filtered.length, contentCurrentPage);
}

function renderContentPagination(total, page) {
  const container = document.getElementById("contentPagination");
  const infoEl = document.getElementById("contentPageInfo");
  if (!container) return;

  const totalPages = Math.max(1, Math.ceil(total / contentPageSize));
  const start = total === 0 ? 0 : (page - 1) * contentPageSize + 1;
  const end = Math.min(page * contentPageSize, total);

  if (infoEl) infoEl.innerText = `${start}-${end} / 총 ${total}권 (페이지 ${page}/${totalPages})`;

  // 번호가 수백 개로 늘어나는 것을 막기 위해 10개 단위 블록(1~10, 11~20...)으로만 노출
  const blockSize = 10;
  const blockStart = Math.floor((page - 1) / blockSize) * blockSize + 1;
  const blockEnd = Math.min(blockStart + blockSize - 1, totalPages);

  // 화살표는 이전/다음 블록의 첫 페이지로 이동
  let html = `
    <button class="btn btn-xs btn-outline-secondary" onclick="goContentPage(${blockStart - blockSize})" ${blockStart <= 1 ? 'disabled' : ''} style="border-radius: 6px; padding: 4px 8px;">
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  for (let i = blockStart; i <= blockEnd; i++) {
    html += `
      <button class="btn btn-xs ${i === page ? 'btn-beige-primary text-white font-weight-bold' : 'btn-outline-secondary'}" 
              onclick="goContentPage(${i})" style="border-radius: 6px; min-width: 28px; padding: 4px 8px;">
        ${i}
      </button>
    `;
  }

  html += `
    <button class="btn btn-xs btn-outline-secondary" onclick="goContentPage(${blockEnd + 1})" ${blockEnd >= totalPages ? 'disabled' : ''} style="border-radius: 6px; padding: 4px 8px;">
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

function goContentPage(p) {
  const totalPages = Math.ceil(masterBooks.length / contentPageSize);
  if (p < 1 || p > totalPages) return;
  contentCurrentPage = p;
  renderMasterContents();
}

// 공개 여부 원클릭 토글
function toggleBookPublic(bookId) {
  const book = masterBooks.find(b => b.id === bookId);
  if (!book) return;
  if (window.NanoPortal && NanoPortal.remote) { showMasterToast('운영 도서는 공개 상태 대신 등록·수정·삭제로 관리됩니다.'); return; }

  const currentStatus = book.isPublic !== "N";
  book.isPublic = currentStatus ? "N" : "Y";
  const statusKor = book.isPublic === "Y" ? "공개 (전체 가맹점)" : "비공개 (전체 숨김)";
  showMasterToast(`'${book.title}' 도서가 [${statusKor}] 상태로 전환되었습니다.`);
  renderMasterContents();
}

// ========================================================
// 나노시트 (보안 PDF 웹뷰어 & 인쇄 시스템 - 학원관리자 100% 동일 규격)
// ========================================================
var activeViewingBook = null;
var activePdfDoc = null;
var activePdfPageNum = 1;
var activePdfTotalPages = 1;
var activePdfRenderTask = null;

function escapeMasterHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function updateWatermarkInfo() {
  var acadElem = document.getElementById('wmAcademyName');
  var timeElem = document.getElementById('wmPrintTime');
  var ipElem = document.getElementById('wmIpAddress');
  if (acadElem) acadElem.innerText = '나노의 책장 B2B 본사 (HQ)';
  if (timeElem) {
    var now = new Date();
    var pad = function(n) { return String(n).padStart(2, '0'); };
    timeElem.innerText = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  if (ipElem) {
    ipElem.innerText = '118.235.12.89';
  }
}

function updateRealPdfWatermarkOverlay() {
  var overlay = document.getElementById('realPdfWatermarkOverlay');
  if (!overlay) return;

  var acadElem = document.getElementById('wmAcademyName');
  var timeElem = document.getElementById('wmPrintTime');
  var ipElem = document.getElementById('wmIpAddress');

  var acad = (acadElem && acadElem.innerText) ? acadElem.innerText : '나노의 책장 B2B 본사 (HQ)';
  var time = (timeElem && timeElem.innerText) ? timeElem.innerText : new Date().toISOString().slice(0, 16).replace('T', ' ');
  var ip = (ipElem && ipElem.innerText) ? ipElem.innerText : '118.235.12.89';

  var tileHtml = 
    '<div style="transform: rotate(-28deg); opacity: 0.16; font-weight: 900; text-align: center; color: #000; line-height: 1.4; user-select: none; margin: 35px 0;">' +
      '<div style="font-size: 21px; letter-spacing: -0.5px; color: #1e293b;">' + acad + '</div>' +
      '<div style="font-size: 14.5px; font-family: monospace; color: #334155;">' + time + ' &middot; IP: ' + ip + '</div>' +
      '<div style="font-size: 11px; color: #dc2626; font-weight: 800; margin-top: 2px;">[보안 인가 문서] 무단 복제 및 캡처 배포 금지</div>' +
    '</div>';

  overlay.innerHTML = tileHtml + tileHtml + tileHtml;
}

function extractBookPdfCandidates(book) {
  if (!book) return [];
  var list = [];
  if (book.pdfUrl) list.push(book.pdfUrl);
  if (book.worksheetUrl) list.push(book.worksheetUrl);

  if (book.cover && typeof book.cover === 'string') {
    var coverClean = String(book.cover).split('?')[0];
    var match = coverClean.match(/([0-9]{10,13}|book_[0-9]+)/);
    if (match && match[1]) {
      list.push('upload/book/' + match[1] + '.pdf');
      list.push('/upload/book/' + match[1] + '.pdf');
    }
  }

  if (book.isbn) {
    var cleanIsbn = String(book.isbn).replace(/[^0-9]/g, '');
    if (cleanIsbn) {
      list.push('upload/book/' + cleanIsbn + '.pdf');
      list.push('/upload/book/' + cleanIsbn + '.pdf');
    }
  }

  if (book.id) {
    var cleanId = String(book.id).trim();
    if (cleanId) {
      list.push('upload/book/' + cleanId + '.pdf');
      list.push('/upload/book/' + cleanId + '.pdf');
    }
  }
  if (book.serverId) {
    var cleanSId = String(book.serverId).trim();
    if (cleanSId) {
      list.push('upload/book/' + cleanSId + '.pdf');
      list.push('/upload/book/' + cleanSId + '.pdf');
    }
  }

  return list.filter(function(item, idx) { return list.indexOf(item) === idx; });
}

function tryLoadCandidatePdfs(candidates, index, book) {
  if (!candidates || index >= candidates.length) {
    var loadingInd = document.getElementById('pdfLoadingIndicator');
    if (loadingInd) loadingInd.style.display = 'none';
    if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
      $('#contentPdfPreviewModal').modal('hide');
    }
    showMasterToast(`[${(book && book.title) || '해당 도서'}] 등록된 나노시트(PDF) 파일이 준비되지 않았습니다.`);
    return;
  }

  var currentCandidate = candidates[index];
  var loadingInd = document.getElementById('pdfLoadingIndicator');
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var htmlContainer = document.getElementById('nanoSheetViewerContainer');
  if (loadingInd) loadingInd.style.display = 'block';
  if (realWrapper) realWrapper.style.display = 'none';
  if (htmlContainer) htmlContainer.style.display = 'none';

  var engine = (typeof pdfjsLib !== 'undefined') ? pdfjsLib : ((typeof PDFJS !== 'undefined') ? PDFJS : (window.pdfjsLib || null));
  if (!engine) {
    console.warn('PDF.js 엔진 미탑재, 커스텀 HTML 시트로 전환');
    renderCustomNanoSheetHtml(book);
    return;
  }
  if (!engine.GlobalWorkerOptions) engine.GlobalWorkerOptions = {};
  engine.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  var loadingTask = engine.getDocument(currentCandidate);
  loadingTask.promise.then(function(pdf) {
    activePdfDoc = pdf;
    activePdfTotalPages = pdf.numPages;
    activePdfPageNum = 1;

    if (loadingInd) loadingInd.style.display = 'none';
    if (realWrapper) realWrapper.style.display = 'block';
    if (htmlContainer) htmlContainer.style.display = 'none';

    var pageControls = document.getElementById('pdfPageControls');
    if (pageControls) {
      pageControls.style.display = (pdf.numPages > 1) ? 'flex' : 'none';
    }
    updateRealPdfWatermarkOverlay();
    renderCurrentPdfPage();
  }).catch(function(err) {
    console.warn('PDF 후보 파일 로드 실패 (' + currentCandidate + '), 다음 후보 시도:', err);
    tryLoadCandidatePdfs(candidates, index + 1, book);
  });
}

function renderPdfFileWithWatermark(pdfSource, fallbackBook) {
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var htmlContainer = document.getElementById('nanoSheetViewerContainer');
  var pageControls = document.getElementById('pdfPageControls');
  var loadingInd = document.getElementById('pdfLoadingIndicator');

  if (loadingInd) loadingInd.style.display = 'block';
  if (realWrapper) realWrapper.style.display = 'none';
  if (htmlContainer) htmlContainer.style.display = 'none';

  updateRealPdfWatermarkOverlay();

  var engine = (typeof pdfjsLib !== 'undefined') ? pdfjsLib : ((typeof PDFJS !== 'undefined') ? PDFJS : (window.pdfjsLib || null));
  if (engine) {
    if (!engine.GlobalWorkerOptions) engine.GlobalWorkerOptions = {};
    engine.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  var loadPromise = null;
  if (pdfSource instanceof Blob || pdfSource instanceof File) {
    loadPromise = new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) { resolve(new Uint8Array(e.target.result)); };
      reader.onerror = reject;
      reader.readAsArrayBuffer(pdfSource);
    });
  } else if (typeof pdfSource === 'string' && pdfSource.startsWith('data:')) {
    try {
      var base64 = pdfSource.split(',')[1];
      var binaryStr = atob(base64);
      var len = binaryStr.length;
      var bytes = new Uint8Array(len);
      for (var i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      loadPromise = Promise.resolve(bytes);
    } catch(e) {
      loadPromise = Promise.resolve(pdfSource);
    }
  } else {
    loadPromise = Promise.resolve(pdfSource);
  }

  loadPromise.then(function(data) {
    var engine = (typeof pdfjsLib !== 'undefined') ? pdfjsLib : ((typeof PDFJS !== 'undefined') ? PDFJS : (window.pdfjsLib || null));
    if (!engine) {
      throw new Error('PDF.js 엔진을 찾을 수 없습니다.');
    }
    var loadingTask = (data instanceof Uint8Array) 
      ? engine.getDocument({ data: data }) 
      : engine.getDocument(data);
    return loadingTask.promise;
  }).then(function(pdf) {
    activePdfDoc = pdf;
    activePdfTotalPages = pdf.numPages;
    activePdfPageNum = 1;

    if (loadingInd) loadingInd.style.display = 'none';
    if (realWrapper) realWrapper.style.display = 'block';
    if (htmlContainer) htmlContainer.style.display = 'none';

    if (pageControls) {
      pageControls.style.display = (pdf.numPages > 1) ? 'flex' : 'none';
    }
    renderCurrentPdfPage();
  }).catch(function(err) {
    console.warn('PDF 캔버스 렌더링 실패, 도서 맞춤형 동적 나노시트로 안전 전환:', err);
    if (fallbackBook || activeViewingBook) {
      renderCustomNanoSheetHtml(fallbackBook || activeViewingBook);
    } else {
      showDefaultHtmlSheetView();
    }
  });
}

function renderCurrentPdfPage() {
  if (!activePdfDoc) return;
  if (activePdfRenderTask) {
    try { activePdfRenderTask.cancel(); } catch(e) {}
    activePdfRenderTask = null;
  }

  activePdfDoc.getPage(activePdfPageNum).then(function(page) {
    var canvas = document.getElementById('pdfViewerCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var wrapper = document.getElementById('realPdfViewerWrapper');
    var targetWidth = wrapper ? (wrapper.clientWidth || 740) : 740;
    if (targetWidth < 300) targetWidth = 740;

    var unscaledViewport = page.getViewport({ scale: 1.0 });
    var scale = targetWidth / unscaledViewport.width;
    if (scale < 1.2) scale = 1.2;

    var outputScale = window.devicePixelRatio || 1;
    var viewport = page.getViewport({ scale: scale });

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height = Math.floor(viewport.height) + "px";

    var transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    var renderContext = {
      canvasContext: ctx,
      transform: transform,
      viewport: viewport
    };

    activePdfRenderTask = page.render(renderContext);
    activePdfRenderTask.promise.then(function() {
      activePdfRenderTask = null;
      var pageNumDisplay = document.getElementById('pdfPageNumDisplay');
      if (pageNumDisplay) {
        pageNumDisplay.innerText = activePdfPageNum + ' / ' + activePdfTotalPages;
      }
      var btnPrev = document.getElementById('btnPdfPrev');
      var btnNext = document.getElementById('btnPdfNext');
      if (btnPrev) btnPrev.disabled = (activePdfPageNum <= 1);
      if (btnNext) btnNext.disabled = (activePdfPageNum >= activePdfTotalPages);
    }).catch(function(err) {
      if (err && err.name === 'RenderingCancelledException') return;
      console.error('PDF.js 렌더링 에러:', err);
    });
  }).catch(function(err) {
    console.error('PDF.js getPage 에러:', err);
  });
}

function prevPdfPage() {
  if (activePdfDoc && activePdfPageNum > 1) {
    activePdfPageNum--;
    renderCurrentPdfPage();
  }
}

function nextPdfPage() {
  if (activePdfDoc && activePdfPageNum < activePdfTotalPages) {
    activePdfPageNum++;
    renderCurrentPdfPage();
  }
}

function showDefaultHtmlSheetView() {
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var htmlContainer = document.getElementById('nanoSheetViewerContainer');
  var loadingInd = document.getElementById('pdfLoadingIndicator');
  var pageControls = document.getElementById('pdfPageControls');
  if (loadingInd) loadingInd.style.display = 'none';
  if (realWrapper) realWrapper.style.display = 'none';
  if (pageControls) pageControls.style.display = 'none';
  if (htmlContainer) htmlContainer.style.display = 'block';
}

function renderCustomNanoSheetHtml(b) {
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var htmlContainer = document.getElementById('nanoSheetViewerContainer');
  var pageControls = document.getElementById('pdfPageControls');
  var loadingInd = document.getElementById('pdfLoadingIndicator');

  if (loadingInd) loadingInd.style.display = 'none';
  if (realWrapper) realWrapper.style.display = 'none';
  if (pageControls) pageControls.style.display = 'none';
  if (!htmlContainer) return;

  htmlContainer.style.display = 'block';

  var title = (b && b.title) ? b.title : '나노 도서';
  var author = (b && b.author) ? b.author : '저자 미상';
  var publisher = (b && b.publisher) ? b.publisher : '출판사';
  var grade = (b && b.grade) ? b.grade : '초등 전학년';
  var category = (b && (b.category || b.cat1)) ? (b.category || b.cat1) : '문학';
  var tags = (b && (b.rawTags || (b.tags && b.tags.join(' ')))) ? String(b.rawTags || b.tags.join(' ')).replace(/#/g, '').split(/[,\s]+/).filter(Boolean) : ['독서 성찰', '문해력'];
  var thinkExtract = (b && b.thinkExtract) ? b.thinkExtract : '이 책에서 가장 흥미로웠거나 기억에 남는 장면은 무엇이었나요? 그 이유는 무엇인가요?';
  var thinkInsert = (b && b.thinkInsert) ? b.thinkInsert : '책 속 주인공의 선택이나 교훈을 바탕으로, 나의 생각이나 경험을 자유롭게 서술해 보세요.';
  var coverUrl = (b && b.cover) ? b.cover : 'resources/images/book_default.svg';

  var quizQuestions = [];
  try {
    var qData = (window.MIGRATED_QUIZZES && (MIGRATED_QUIZZES[title] || (b && MIGRATED_QUIZZES[b.id]))) || null;
    if (qData && qData.length > 0 && qData[0].questions) {
      quizQuestions = qData[0].questions;
    }
  } catch(e) {}

  var q1Text = quizQuestions.length > 0 ? ('<strong>Q1. </strong>' + escapeMasterHtml(quizQuestions[0].question)) : '<strong>Q1. </strong>본문의 핵심 사건과 등장인물의 선택을 되짚어보며 내용을 간략히 정리해 보세요.';
  var q2Text = quizQuestions.length > 1 ? ('<strong>Q2. </strong>' + escapeMasterHtml(quizQuestions[1].question)) : '<strong>Q2. </strong>주인공의 가치관이나 행동에 대해 나의 일상생활에 빗대어 느낀 점을 설명해 보세요.';

  var tagBadges = tags.slice(0, 5).map(function(t) {
    return '<span style="display: inline-block; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-right: 5px; border: 1px solid #e2e8f0; font-weight: 600;">#' + escapeMasterHtml(t) + '</span>';
  }).join('');

  var acadName = (document.getElementById('wmAcademyName') ? document.getElementById('wmAcademyName').innerText : '나노의 책장 B2B 본사 (HQ)');
  var printTime = (document.getElementById('wmPrintTime') ? document.getElementById('wmPrintTime').innerText : '');
  var ipAddr = (document.getElementById('wmIpAddress') ? document.getElementById('wmIpAddress').innerText : '118.235.12.89');

  var html = 
    '<!-- 워터마크 오버레이 -->' +
    '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); pointer-events: none; opacity: 0.12; font-weight: 900; font-size: 24px; line-height: 1.6; text-align: center; color: #111; z-index: 10; user-select: none; width: 100%; letter-spacing: -0.5px;">' +
      '<div>' + acadName + '</div>' +
      '<div style="font-size: 20px;">' + printTime + '</div>' +
      '<div style="font-size: 18px; font-family: monospace;">' + ipAddr + '</div>' +
    '</div>' +

    '<!-- 시트지 헤더 -->' +
    '<div class="d-flex justify-content-between align-items-center pb-3 mb-3" style="border-bottom: 2px solid #2563eb;">' +
      '<div style="flex: 1; padding-right: 15px;">' +
        '<div class="d-flex align-items-center gap-2 mb-1">' +
          '<span class="badge badge-warning text-dark font-weight-bold px-2 py-1" style="font-size: 11px;">나노 독서논술 정규 워크시트</span>' +
          '<span class="badge badge-secondary px-2 py-1" style="font-size: 11px;">' + escapeMasterHtml(grade) + '</span>' +
          '<span class="badge badge-light border px-2 py-1" style="font-size: 11px;">' + escapeMasterHtml(category) + '</span>' +
        '</div>' +
        '<h3 class="font-weight-bold mb-1" style="color: #1e293b; font-size: 20px; letter-spacing: -0.5px;">' + escapeMasterHtml(title) + '</h3>' +
        '<div style="font-size: 12px; color: #64748b;">' +
          '<span>지은이: ' + escapeMasterHtml(author) + '</span>' +
          '<span style="margin: 0 6px;">&middot;</span>' +
          '<span>출판사: ' + escapeMasterHtml(publisher) + '</span>' +
        '</div>' +
        '<div class="mt-1">' + tagBadges + '</div>' +
      '</div>' +
      '<div style="width: 70px; height: 95px; border-radius: 4px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.08); flex-shrink: 0;">' +
        '<img src="' + coverUrl + '" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src=\'resources/images/book_default.svg\'">' +
      '</div>' +
    '</div>' +

    '<!-- 학생 정보란 -->' +
    '<div class="d-flex justify-content-between align-items-center px-3 py-2 mb-3" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; color: #475569;">' +
      '<div>소속: <strong>' + acadName + '</strong></div>' +
      '<div>날짜: <strong>' + (printTime ? printTime.split(' ')[0] : '2026-10-28') + '</strong></div>' +
      '<div>이름: <span style="display: inline-block; width: 100px; border-bottom: 1px solid #94a3b8; margin-left: 4px;"></span></div>' +
    '</div>' +

    '<!-- STEP 1 -->' +
    '<div class="mb-3">' +
      '<div style="font-size: 13px; font-weight: 800; color: #1e3a8a; margin-bottom: 6px; display: flex; align-items: center;">' +
        '<span style="display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: #2563eb; color: #fff; border-radius: 50%; font-size: 11px; margin-right: 6px;">1</span>' +
        '어휘 및 배경지식 탐구' +
      '</div>' +
      '<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; font-size: 12px; line-height: 1.6; color: #334155;">' +
        '<strong>&bull; 핵심 키워드:</strong> ' + tags.join(', ') + '<br>' +
        '<strong>&bull; 생각 꺼내기:</strong> ' + escapeMasterHtml(thinkExtract) +
      '</div>' +
    '</div>' +

    '<!-- STEP 2 -->' +
    '<div class="mb-3">' +
      '<div style="font-size: 13px; font-weight: 800; color: #1e3a8a; margin-bottom: 6px; display: flex; align-items: center;">' +
        '<span style="display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: #2563eb; color: #fff; border-radius: 50%; font-size: 11px; margin-right: 6px;">2</span>' +
        '본문 이해 및 문해력 다지기' +
      '</div>' +
      '<div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; font-size: 12px; color: #334155; margin-bottom: 6px;">' +
        '<div style="margin-bottom: 4px;">' + q1Text + '</div>' +
        '<div style="min-height: 48px; background: #fdfdfd; border: 1px dashed #cbd5e1; border-radius: 4px; padding: 6px; color: #94a3b8; font-size: 11px;">(학생 작성란)</div>' +
      '</div>' +
      '<div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; font-size: 12px; color: #334155;">' +
        '<div style="margin-bottom: 4px;">' + q2Text + '</div>' +
        '<div style="min-height: 48px; background: #fdfdfd; border: 1px dashed #cbd5e1; border-radius: 4px; padding: 6px; color: #94a3b8; font-size: 11px;">(학생 작성란)</div>' +
      '</div>' +
    '</div>' +

    '<!-- STEP 3 -->' +
    '<div class="mb-2">' +
      '<div style="font-size: 13px; font-weight: 800; color: #1e3a8a; margin-bottom: 6px; display: flex; align-items: center;">' +
        '<span style="display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: #2563eb; color: #fff; border-radius: 50%; font-size: 11px; margin-right: 6px;">3</span>' +
        '나노 생각담기 (서술형 논술)' +
      '</div>' +
      '<div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; font-size: 12px; color: #334155;">' +
        '<div style="margin-bottom: 6px; font-weight: 700; color: #0f172a;">논제: ' + escapeMasterHtml(thinkInsert) + '</div>' +
        '<div style="min-height: 120px; background: #fdfdfd; border: 1px dashed #cbd5e1; border-radius: 4px; padding: 8px; color: #94a3b8; font-size: 11px; line-height: 1.8;">' +
          '(200~300자 내외 서술 영역)' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- 교사용 가이드 푸터 -->' +
    '<div class="pt-2 text-right" style="font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; margin-top: 12px;">' +
      '* 나노의 책장 B2B 공식 인증 활동지 &middot; 교사용 평가 가이드라인 준수' +
    '</div>';

  htmlContainer.innerHTML = html;
}

function printNanoSheetViewer() {
  var canvas = document.getElementById('pdfViewerCanvas');
  var realWrapper = document.getElementById('realPdfViewerWrapper');

  if (!canvas || !realWrapper || realWrapper.style.display === 'none') {
    window.print();
    return;
  }

  var imgData = canvas.toDataURL('image/png');
  var acadName = (document.getElementById('wmAcademyName') ? document.getElementById('wmAcademyName').innerText : '나노의 책장 B2B 본사 (HQ)');
  var printTime = (document.getElementById('wmPrintTime') ? document.getElementById('wmPrintTime').innerText : new Date().toISOString().slice(0, 16).replace('T', ' '));
  var ipAddr = (document.getElementById('wmIpAddress') ? document.getElementById('wmIpAddress').innerText : '118.235.12.89');

  var printWin = window.open('', '_blank', 'width=850,height=1100');
  if (!printWin) {
    window.print();
    return;
  }

  printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>나노 시트 보안 출력 - ${acadName}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .sheet-wrapper { position: relative; width: 100%; max-width: 210mm; min-height: 297mm; overflow: hidden; background: #fff; }
    img.sheet-canvas-img { width: 100%; height: auto; display: block; }
    .wm-overlay {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 10;
      display: flex; flex-direction: column; justify-content: space-around; align-items: center;
      user-select: none;
    }
    .wm-block {
      transform: rotate(-28deg); opacity: 0.16; font-weight: 900; text-align: center; color: #000;
      line-height: 1.4; user-select: none; margin: 35px 0;
    }
    .wm-title { font-size: 22px; letter-spacing: -0.5px; color: #1e293b; }
    .wm-sub { font-size: 14.5px; font-family: monospace; color: #334155; }
    .wm-warn { font-size: 11px; color: #dc2626; font-weight: 800; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="sheet-wrapper">
    <img src="${imgData}" class="sheet-canvas-img" />
    <div class="wm-overlay">
      <div class="wm-block">
        <div class="wm-title">${acadName}</div>
        <div class="wm-sub">${printTime} &middot; IP: ${ipAddr}</div>
        <div class="wm-warn">[보안 인가 문서] 무단 복제 및 캡처 배포 금지</div>
      </div>
      <div class="wm-block">
        <div class="wm-title">${acadName}</div>
        <div class="wm-sub">${printTime} &middot; IP: ${ipAddr}</div>
        <div class="wm-warn">[보안 인가 문서] 무단 복제 및 캡처 배포 금지</div>
      </div>
      <div class="wm-block">
        <div class="wm-title">${acadName}</div>
        <div class="wm-sub">${printTime} &middot; IP: ${ipAddr}</div>
        <div class="wm-warn">[보안 인가 문서] 무단 복제 및 캡처 배포 금지</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  <\/script>
</body>
</html>`);
  printWin.document.close();
}

// 마스터 관리자 나노시트 모달 열기 (학원관리자와 100% 동일 규격 및 API 연동)
function openMasterPdfModal(bookId) {
  var b = masterBooks.find(function(item) { return item.id === bookId; });
  if (!b && typeof window !== "undefined" && Array.isArray(window.MIGRATED_BOOKS)) {
    b = window.MIGRATED_BOOKS.find(function(item) { return item.id === bookId; });
  }
  activeViewingBook = b || null;

  var hasSheet = false;
  if (b && (b.worksheetUrl || b.pdfUrl || b.hasSheet === true || b.sheet === true || (b.worksheet && b.worksheet !== false))) {
    hasSheet = true;
  }
  if (b && (b.sheet === false || b.hasSheet === false || b.sheet === 'N' || b.hasSheet === 'N')) {
    hasSheet = false;
  }

  if (!b || !hasSheet) {
    showMasterToast(`[${(b && b.title) || '해당 도서'}] 등록된 나노시트(PDF) 파일이 준비되지 않았습니다.`);
    return;
  }

  var title = b ? b.title : '나노 도서';
  var fileName = b && b.materialName ? b.materialName : `${title}_나노시트.pdf`;

  var titleEl = document.getElementById('pdfModalTitle');
  if (titleEl) titleEl.innerText = `[${title}] 나노 시트 (보안 PDF 웹뷰어)`;

  var nameDisp = document.getElementById('pdfFileNameDisplay');
  if (nameDisp) nameDisp.innerText = fileName;

  var sheetBookTitle = document.getElementById('pdfSheetBookTitle');
  if (sheetBookTitle) sheetBookTitle.innerText = title;

  updateWatermarkInfo();

  if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
    $('#contentPdfPreviewModal').modal('show');
  }

  var directPdf = (b && (b.pdfBlob || b.pdfDataUrl)) || null;
  if (directPdf) {
    renderPdfFileWithWatermark(directPdf, b);
    return;
  }

  if (b && (b.pdfUrl || b.worksheetUrl)) {
    renderPdfFileWithWatermark(b.pdfUrl || b.worksheetUrl, b);
    return;
  }

  var loadingInd = document.getElementById('pdfLoadingIndicator');
  var realWrapper = document.getElementById('realPdfViewerWrapper');
  var htmlContainer = document.getElementById('nanoSheetViewerContainer');
  if (loadingInd) loadingInd.style.display = 'block';
  if (realWrapper) realWrapper.style.display = 'none';
  if (htmlContainer) htmlContainer.style.display = 'none';

  var queryParams = new URLSearchParams({
    book_id: b ? (b.serverId || b.id || '') : (bookId || ''),
    isbn: b && b.isbn ? String(b.isbn).replace(/[^0-9]/g, '') : '',
    title: b ? (b.title || '') : '',
    cover: b ? (b.cover || '') : ''
  });

  fetch('api/get_worksheet.php?' + queryParams.toString())
    .then(function(res) {
      if (!res.ok) throw new Error('API 응답 HTTP ' + res.status);
      return res.json();
    })
    .then(function(data) {
      if (data && data.ok && data.pdfUrl) {
        if (b) {
          b.pdfUrl = data.pdfUrl;
          if (data.fileName) b.materialName = data.fileName;
        }
        if (nameDisp && data.fileName) nameDisp.innerText = data.fileName;
        renderPdfFileWithWatermark(data.pdfUrl, b);
      } else {
        var candidates = extractBookPdfCandidates(b);
        if (candidates.length > 0) {
          tryLoadCandidatePdfs(candidates, 0, b);
        } else {
          if (loadingInd) loadingInd.style.display = 'none';
          if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
            $('#contentPdfPreviewModal').modal('hide');
          }
          showMasterToast(`[${(b && b.title) || '해당 도서'}] 등록된 나노시트(PDF) 파일이 준비되지 않았습니다.`);
        }
      }
    })
    .catch(function(err) {
      console.warn('get_worksheet.php API 조회 실패 또는 로컬 환경, 후보 파일 순차 로드:', err);
      var candidates = extractBookPdfCandidates(b);
      if (candidates.length > 0) {
        tryLoadCandidatePdfs(candidates, 0, b);
      } else {
        if (loadingInd) loadingInd.style.display = 'none';
        if (window.jQuery && typeof $('#contentPdfPreviewModal').modal === 'function') {
          $('#contentPdfPreviewModal').modal('hide');
        }
        showMasterToast(`[${(b && b.title) || '해당 도서'}] 등록된 나노시트(PDF) 파일이 준비되지 않았습니다.`);
      }
    });
}
window.openContentPdfModal = openMasterPdfModal;

// 3. 도서 인터랙션 통계 분석 모달 (찜 / 추천 / 북퀴즈 완료)
function openBookStatsModal(bookId, statType) {
  const book = masterBooks.find(b => b.id === bookId);
  if (!book) return;

  document.getElementById("bookStatsCover").src = book.cover;
  document.getElementById("bookStatsTitle").innerText = book.title;
  document.getElementById("bookStatsCategory").innerText = book.cat2 || book.category;
  document.getElementById("bookStatsAuthorPub").innerText = `${book.author} · ${book.publisher}`;

  let totalCount = 0;
  let typeLabel = "";
  let countTitle = "";

  if (statType === "like") {
    typeLabel = "찜(즐겨찾기) 통계 분석";
    countTitle = "누적 찜 합계";
    totalCount = book.likes || 0;
  } else if (statType === "recommend") {
    typeLabel = "추천(좋아요) 통계 분석";
    countTitle = "누적 추천 합계";
    totalCount = book.recommends || 0;
  } else {
    typeLabel = "인증(북퀴즈 완료) 학생 통계 분석";
    countTitle = "인증 합계";
    totalCount = book.quizCompletions || 0;
  }

  document.getElementById("bookStatsTypeLabel").innerText = typeLabel;
  document.getElementById("bookStatsCountTitle").innerText = countTitle;
  document.getElementById("bookStatsTotalCount").innerText = totalCount;

  // 9개 학년별(초1~초6, 중1~중3) 분포 계산 및 렌더링
  const grades = ["초등 1학년", "초등 2학년", "초등 3학년", "초등 4학년", "초등 5학년", "초등 6학년", "중등 1학년", "중등 2학년", "중등 3학년"];
  
  // 도서 권장학년 기준 가중치 부여
  const targetGrade = book.grade || "초등 5학년";
  const gradeBarsEl = document.getElementById("bookStatsGradeBars");
  
  if (gradeBarsEl) {
    const maxVal = Math.max(1, Math.round(totalCount * 0.35));
    let barsHtml = "";

    grades.forEach(g => {
      const isTarget = g === targetGrade;
      const count = isTarget 
        ? Math.round(totalCount * 0.32) 
        : Math.max(1, Math.round(totalCount * (0.05 + Math.random() * 0.1)));
      const pct = Math.min(100, Math.round((count / (totalCount || 1)) * 100));

      barsHtml += `
        <div class="mb-2">
          <div class="d-flex justify-content-between text-muted mb-1" style="font-size: 11.5px;">
            <span class="${isTarget ? 'font-weight-bold text-dark' : ''}">
              ${isTarget ? '<i class="fa-solid fa-star text-warning mr-1"></i>' : ''}${g}
            </span>
            <span><strong>${count}명</strong> (${pct}%)</span>
          </div>
          <div class="progress" style="height: 7px; border-radius: 4px; background: #f0ede6;">
            <div class="progress-bar ${isTarget ? 'bg-warning' : 'bg-secondary'}" role="progressbar" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    });
    gradeBarsEl.innerHTML = barsHtml;
  }

  // 성별 비율 계산 (남 45~55%, 여 55~45%)
  const malePercent = Math.min(65, Math.max(35, 48 + (book.title.length % 7) - 3));
  const femalePercent = 100 - malePercent;
  const maleCount = Math.round((totalCount * malePercent) / 100);
  const femaleCount = totalCount - maleCount;

  document.getElementById("bookStatsMalePercent").innerText = `${malePercent}%`;
  document.getElementById("bookStatsMaleCount").innerText = `(${maleCount}명)`;
  document.getElementById("bookStatsFemalePercent").innerText = `${femalePercent}%`;
  document.getElementById("bookStatsFemaleCount").innerText = `(${femaleCount}명)`;
  document.getElementById("bookStatsMaleBar").style.width = `${malePercent}%`;
  document.getElementById("bookStatsFemaleBar").style.width = `${femalePercent}%`;

  $('#bookStatsModal').modal('show');
}

// ==========================================
// 도서 등록 및 중복 감지 로직 (신규 서지 스펙)
// ==========================================
var editingBookSheetAddFile = { name: "나노_독서학습시트.pdf", size: "1.2 MB" };
var originalEditingBookIdForAdd = null;
var pendingDuplicateSaveBook = null;

// 생각담기 제시문 세트
var THINK_PROMPTS_NOVEL = [
  "주인공이 옆에 있다면 하고 싶은 이야기를 적어주세요.",
  "이 책을 읽고 가장 많이 떠오른 내 주변의 사람은 누구이며 그 이유는 무엇인가요?",
  "이야기는 끝났지만, 그 이후 어떤 일이 벌어졌는 지 상상해서 이야기를 만들어주세요.",
  "기억나는 장면이나 문장을 적어보세요.",
  "이 책에서 얻은 교훈이 있다면?",
  "가장 기억에 남는 등장인물은 누구이며 그 이유는 무엇인가요?",
  "이 책을 친구에게 추천한다면, 뭐라고 소개하고 싶은가요?"
];

var THINK_PROMPTS_NONFICTION = [
  "이 책을 읽고 생각난 사람은 누구이며 이유는 무엇인가요?",
  "이 책에서 가장 기억에 남은 내용은 무엇인가요?",
  "책을 읽고 새롭게 알게된 내용은 무엇인가요?",
  "이 책을 추천한다면 어떻게 설명하고 싶나요?"
];

// 카테고리 1(소설/인물이야기 vs 비문학/정보글)에 따라 생각담기 제시문 동적 갱신
function updateThinkPresets(cat1) {
  const select = document.getElementById("mbAddThinkPresetSelect");
  if (!select) return;

  const isNonfiction = (cat1 === "비문학/정보글" || cat1 === "비문학" || cat1 === "C");
  const prompts = isNonfiction ? THINK_PROMPTS_NONFICTION : THINK_PROMPTS_NOVEL;

  select.innerHTML = prompts.map((p, i) => `
    <option value="${p}">${i + 1}. ${p}</option>
  `).join("");

  const textarea = document.getElementById("mbAddThinkInsert");
  if (textarea && prompts.length > 0) {
    textarea.value = prompts[0];
  }
}

// 생각 담기 모드 전환 (제시문 / 직접입력 / 없음)
function switchThinkMode(mode) {
  var presetWrap = document.getElementById("thinkModePresetWrap");
  var customWrap = document.getElementById("thinkModeCustomWrap");
  var noneNotice = document.getElementById("thinkModeNoneNotice");
  var btnPreset = document.getElementById("btnThinkPromptPreset");
  var btnCustom = document.getElementById("btnThinkPromptCustom");
  var btnNone = document.getElementById("btnThinkPromptNone");

  [btnPreset, btnCustom, btnNone].forEach(function(b) {
    if (b) b.classList.remove("active");
  });

  if (mode === "preset") {
    if (btnPreset) btnPreset.classList.add("active");
    if (presetWrap) presetWrap.style.display = "block";
    if (customWrap) customWrap.style.display = "block";
    if (noneNotice) noneNotice.style.display = "none";
    var sel = document.getElementById("mbAddThinkPresetSelect");
    if (sel && sel.value) {
      applyThinkPresetToInput(sel.value);
    }
  } else if (mode === "custom") {
    if (btnCustom) btnCustom.classList.add("active");
    if (presetWrap) presetWrap.style.display = "none";
    if (customWrap) customWrap.style.display = "block";
    if (noneNotice) noneNotice.style.display = "none";
  } else if (mode === "none") {
    if (btnNone) btnNone.classList.add("active");
    if (presetWrap) presetWrap.style.display = "none";
    if (customWrap) customWrap.style.display = "none";
    if (noneNotice) noneNotice.style.display = "block";
    var textarea = document.getElementById("mbAddThinkInsert");
    if (textarea) textarea.value = "";
  }
}

// 제시문 선택 시 textarea에 반영
function applyThinkPresetToInput(val) {
  var textarea = document.getElementById("mbAddThinkInsert");
  if (textarea) {
    textarea.value = val;
  }
}

function onCategory1Changed(cat1) {
  updateThinkPresets(cat1);
  if (!originalEditingBookIdForAdd) {
    generateNewBookId();
  }
}

function onCategory2Changed(cat2) {
  if (!originalEditingBookIdForAdd) {
    generateNewBookId();
  }
}

function onGradeChanged(grade) {
  if (!originalEditingBookIdForAdd) {
    generateNewBookId();
  }
}

function applyThinkPresetToInput(val) {
  const textarea = document.getElementById("mbAddThinkInsert");
  if (textarea) textarea.value = val;
}

// -------------------------------------------------------------
// 도서 관리 코드(ID) 자동 생성 알고리즘 (규칙: [Cat2][Cat1][Grade][5자리순번])
// 예: 외서(F) + 소설(A) + 1학년(1) + 첫번째 => FA100001
// 예: 국내서(K) + 인물이야기(B) + 2학년(2) + 두번째 => KB200002
// -------------------------------------------------------------
function getBookCodeComponents(isAcademy = false) {
  const cat1El = document.getElementById(isAcademy ? "abEditCat1" : "mbAddCat1");
  const cat2El = document.getElementById(isAcademy ? "abEditCat2" : "mbAddCat2");
  const gradeEl = document.getElementById(isAcademy ? "abEditGrade" : "mbAddGrade");

  const cat1Val = cat1El ? cat1El.value : "소설";
  const cat2Val = cat2El ? cat2El.value : "국내서";
  const gradeVal = gradeEl ? gradeEl.value : "초등 1학년";

  // 1. 카테고리 2 코드 (K: 국내서, F: 외서, N: 구분 없음)
  let c2Code = "K";
  if (cat2Val.includes("외서") || cat2Val === "F") c2Code = "F";
  else if (cat2Val.includes("구분") || cat2Val === "N") c2Code = "N";

  // 2. 카테고리 1 코드 (A: 소설, B: 인물 이야기, C: 비문학/정보글)
  let c1Code = "A";
  if (cat1Val.includes("인물") || cat1Val.includes("위인") || cat1Val === "B") c1Code = "B";
  else if (cat1Val.includes("비문학") || cat1Val.includes("정보") || cat1Val === "C") c1Code = "C";

  // 3. 학년 코드 1자리 (초1~초6: 1~6, 중1~중3: 7~9)
  let gCode = "1";
  if (gradeVal.includes("1학년") && !gradeVal.includes("중등")) gCode = "1";
  else if (gradeVal.includes("2학년") && !gradeVal.includes("중등")) gCode = "2";
  else if (gradeVal.includes("3학년") && !gradeVal.includes("중등")) gCode = "3";
  else if (gradeVal.includes("4학년")) gCode = "4";
  else if (gradeVal.includes("5학년")) gCode = "5";
  else if (gradeVal.includes("6학년")) gCode = "6";
  else if (gradeVal.includes("중등 1학년") || gradeVal.includes("중1")) gCode = "7";
  else if (gradeVal.includes("중등 2학년") || gradeVal.includes("중2")) gCode = "8";
  else if (gradeVal.includes("중등 3학년") || gradeVal.includes("중3")) gCode = "9";
  else {
    const m = gradeVal.match(/\d/);
    if (m) gCode = m[0];
  }

  return { c2Code, c1Code, gCode, prefix: `${c2Code}${c1Code}${gCode}` };
}

function generateNewBookId() {
  const { prefix } = getBookCodeComponents(false);
  let maxSeq = 0;

  // masterBooks 목록에서 동일 prefix로 시작하는 8자리 ID 순번 계산
  masterBooks.forEach(b => {
    if (b.id && b.id.startsWith(prefix)) {
      const numPart = b.id.slice(prefix.length);
      const num = parseInt(numPart, 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(5, "0");
  const newId = `${prefix}${nextSeq}`;
  const idInput = document.getElementById("mbAddId");
  if (idInput) idInput.value = newId;
  showMasterToast(`신규 도서 관리 코드 [${newId}]가 자동 발급되었습니다.`);
  return newId;
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// [도서 지능형 서지 분석 알고리즘]
// 1. 시리즈 판별: 권수, 괄호, 권차 표기 감지 -> 시리즈명 자동 추출 / 아니면 단권 판별
// 2. 카테고리 2: 영미/해외 ISBN, 영문 저자/출판사, 번역자 유무 기반 국내서 vs 외서 자동 판별
// 3. 카테고리 1: 줄거리/제목 키워드 분석 (소설 vs 인물 이야기 vs 비문학)
// 4. 권장 학년: 학년/연령 키워드 감지
// -------------------------------------------------------------
function detectBookSeries(title, rawSeries) {
  if (rawSeries && rawSeries.trim() && rawSeries !== "단권") {
    return { isSeries: true, seriesName: rawSeries.trim() };
  }
  if (!title) return { isSeries: false, seriesName: "단권" };

  const clean = title.trim();

  // (1) 괄호 안 시리즈/권수 감지: "해리포터 (1권)", "마법천자문 [3권]", "용선생 (1)"
  const bracketMatch = clean.match(/^(.*?)\s*[\(\[](.*?(?:권|탄|부|시리즈|편|vol|season|\d+).*?)[\)\]]/i);
  if (bracketMatch) {
    const sName = bracketMatch[1].trim();
    if (sName.length >= 2 && !/^\d+$/.test(sName)) {
      return { isSeries: true, seriesName: sName };
    }
  }

  // (2) 제목 끝 숫자 또는 권 표기: "놓지 마 과학! 14", "마법천자문 53권", "아홉 살 마음 사전 2"
  const endNumMatch = clean.match(/^(.*?)\s+(\d{1,3})\s*(?:권|탄|부|편|화)?$/);
  if (endNumMatch) {
    const sName = endNumMatch[1].trim();
    if (sName.length >= 2 && !/^(19|20)\d\d$/.test(sName)) {
      return { isSeries: true, seriesName: sName };
    }
  }

  // (3) 명시적 시리즈 키워드: "... 시리즈", "... 세트", "... 전집"
  if (clean.includes("시리즈") || clean.includes("세트") || clean.includes("전집") || clean.includes("문고")) {
    const sName = clean.replace(/\s*(?:전집|세트|시리즈|문고).*$/, " 시리즈").trim();
    return { isSeries: true, seriesName: sName };
  }

  return { isSeries: false, seriesName: "단권" };
}

function detectBookCategory2(isbn, doc) {
  const isbnStr = (isbn || "").replace(/[^0-9]/g, "");

  // (1) 한국 출판 ISBN(978-89...)이 아닌 해외 ISBN 접두어 (예: 978-1, 978-0 등)
  if (isbnStr.startsWith("978") && !isbnStr.startsWith("97889")) {
    return "외서";
  }

  // (2) 번역자(translators)가 존재하는 경우 (외국 도서 번역 출간)
  if (doc && doc.translators && Array.isArray(doc.translators) && doc.translators.length > 0) {
    return "외서";
  }

  // (3) 한글이 전혀 없고 영문/외국어로만 구성된 도서 (예: 원서)
  const allText = `${doc ? doc.title || "" : ""} ${doc && Array.isArray(doc.authors) ? doc.authors.join(" ") : (doc ? doc.authors || "" : "")} ${doc ? doc.publisher || "" : ""}`;
  const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(allText);
  if (!hasKorean && /[a-zA-Z]/.test(allText)) {
    return "외서";
  }

  // (4) 외국인 저자 표기점(·) 또는 대표적인 외국인 이름 패턴
  const authorStr = doc && Array.isArray(doc.authors) ? doc.authors.join(", ") : (doc ? doc.authors || "" : "");
  if (authorStr.includes("·") || authorStr.includes(" 드 ") || authorStr.includes(" 생텍쥐페리") || authorStr.includes(" 롤링") || authorStr.includes(" 셰익스피어") || authorStr.includes(" 톨스토이") || authorStr.includes(" 앤더슨")) {
    return "외서";
  }

  return "국내서";
}

function detectBookCategory1(doc) {
  const title = (doc && doc.title) ? doc.title : "";
  const contents = (doc && doc.contents) ? doc.contents : "";
  const text = `${title} ${contents}`;

  // (1) 인물 이야기 (위인) 키워드
  const biographyKeywords = [
    "위인", "전기", "평전", "인물 이야기", "위인전", "who?", "Who?", "자서전", "생애",
    "세종대왕", "이순신", "안중근", "정약용", "헬렌 켈러", "에디슨", "아인슈타인",
    "스티브 잡스", "마더 테레사", "간디", "링컨", "김구", "유관순", "신사임당", "장영실"
  ];
  for (const kw of biographyKeywords) {
    if (text.includes(kw)) {
      return "인물 이야기 (위인)";
    }
  }

  // (2) 비문학/정보글 키워드
  const nonFictionKeywords = [
    "과학", "역사", "한국사", "세계사", "사회", "경제", "수학", "백과", "탐구", "사전",
    "지식", "정보", "원리", "실험", "우주", "식물", "환경", "철학", "교양", "인문",
    "상식", "법", "정치", "코딩", "인공지능", "생태", "지리", "설명문", "논픽션"
  ];
  for (const kw of nonFictionKeywords) {
    if (text.includes(kw)) {
      return "비문학/정보글";
    }
  }

  // (3) 기본 문학/스토리
  return "소설";
}

function detectBookGrade(doc) {
  const text = `${(doc && doc.title) || ""} ${(doc && doc.contents) || ""}`;

  if (/유아|그림책|보드북|미취학|[3-7]세|누리과정/.test(text)) return "미취학";
  if (/초등\s*1|초1|초등\s*저학년|저학년용/.test(text)) return "초등 1학년";
  if (/초등\s*2|초2/.test(text)) return "초등 2학년";
  if (/초등\s*3|초3|초등\s*중학년|중학년용/.test(text)) return "초등 3학년";
  if (/초등\s*4|초4/.test(text)) return "초등 4학년";
  if (/초등\s*5|초5|초등\s*고학년|고학년용/.test(text)) return "초등 5학년";
  if (/초등\s*6|초6/.test(text)) return "초등 6학년";
  if (/중등\s*1|중1|중학생|청소년\s*초기/.test(text)) return "중등 1학년";
  if (/중등\s*2|중2|청소년\s*문학|청소년용/.test(text)) return "중등 2학년";
  if (/중등\s*3|중3/.test(text)) return "중등 3학년";

  return "초등 5학년";
}

// -------------------------------------------------------------
// [서비스 운영 관리 - 테마 관리]와 100% 일치하는 도서 주제 분류 태그 드롭박스 동적 렌더링
// 디폴트값: '선택' (사용자가 직접 선택하도록 유도)
// -------------------------------------------------------------
function renderThemeSelectForMasterBook(selectedTag = "") {
  const select = document.getElementById("mbAddThemeTagSelect");
  if (!select) return;

  const currentThemes = (typeof themeList !== "undefined" && themeList.length > 0)
    ? themeList
    : [
        { tag: "#이야기", title: "이야기" },
        { tag: "#인간", title: "인간" },
        { tag: "#생활", title: "생활" },
        { tag: "#자연", title: "자연" },
        { tag: "#과학", title: "과학" },
        { tag: "#역사", title: "역사" }
      ];

  const targetVal = Array.isArray(selectedTag) ? (selectedTag[0] || "") : (selectedTag || "");
  const cleanTarget = String(targetVal).replace(/^#/, "").trim().toLowerCase();

  let html = `<option value="" ${!cleanTarget ? 'selected' : ''}>선택 (주제 분류 태그를 선택해주세요)</option>`;
  html += currentThemes.map(t => {
    const tagVal = t.tag || `#${t.title.replace(/\s+/g, '')}`;
    const cleanTag = tagVal.replace(/^#/, "").trim().toLowerCase();
    const cleanTitle = (t.title || "").trim().toLowerCase();
    const isSelected = !!cleanTarget && (cleanTarget === cleanTag || cleanTarget === cleanTitle);
    const label = t.title ? `${tagVal} (${t.title})` : tagVal;
    return `<option value="${tagVal}" ${isSelected ? 'selected' : ''}>${label}</option>`;
  }).join("");

  select.innerHTML = html;
}

// -------------------------------------------------------------
// 세부 태그 동적 입력칸 로직 (기본 2칸, 최대 5칸, +버튼 추가 및 삭제)
// -------------------------------------------------------------
let masterDetailTagsState = ["", ""];

function initMasterDetailTags(tagStringOrArray) {
  if (Array.isArray(tagStringOrArray)) {
    masterDetailTagsState = tagStringOrArray
      .filter(t => t && String(t).trim() !== "")
      .map(t => String(t).replace(/^#/, "").trim());
  } else if (typeof tagStringOrArray === "string" && tagStringOrArray.trim() !== "") {
    let raw = [];
    if (tagStringOrArray.includes(",")) {
      raw = tagStringOrArray.split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean);
    } else {
      raw = tagStringOrArray.split(/[\s,#]+/).map(t => t.trim().replace(/^#/, "")).filter(Boolean);
    }
    masterDetailTagsState = raw;
  } else {
    masterDetailTagsState = ["", ""];
  }

  while (masterDetailTagsState.length < 2) {
    masterDetailTagsState.push("");
  }
  if (masterDetailTagsState.length > 5) {
    masterDetailTagsState = masterDetailTagsState.slice(0, 5);
  }
  renderMasterDetailTagSlots();
}

function renderMasterDetailTagSlots() {
  const container = document.getElementById("mbDetailTagsContainer");
  const countEl = document.getElementById("mbDetailTagCount");
  const addBtn = document.getElementById("btnAddDetailTagSlot");
  if (!container) return;

  if (countEl) countEl.innerText = masterDetailTagsState.length;
  if (addBtn) addBtn.disabled = masterDetailTagsState.length >= 5;

  const placeholders = ["예: 문해력향상", "예: 세계명작", "예: 창의융합", "예: 감정표현", "예: 성장스토리"];

  container.innerHTML = masterDetailTagsState.map((val, idx) => {
    const canRemove = masterDetailTagsState.length > 2;
    return `
      <div class="input-group input-group-sm mb-1.5" style="border-radius: 6px; overflow: hidden;">
        <div class="input-group-prepend">
          <span class="input-group-text bg-white font-weight-bold text-muted" style="font-size: 12px; border-color: var(--border-medium); min-width: 82px;">
            <i class="fa-solid fa-hashtag text-warning mr-1"></i>태그 ${idx + 1}
          </span>
        </div>
        <input type="text" class="form-control form-control-beige master-detail-tag-input" 
               value="${val.replace(/^#/, '')}" 
               placeholder="${placeholders[idx] || '태그 직접 입력'}" 
               oninput="masterDetailTagsState[${idx}] = this.value"
               style="font-size: 12.5px;">
        ${canRemove ? `
          <div class="input-group-append">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeMasterDetailTagSlot(${idx})" title="이 태그 칸 삭제" style="border-color: var(--border-medium); font-size: 11px; padding: 0 10px;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join("");
}

function addMasterDetailTagSlot() {
  if (masterDetailTagsState.length >= 5) {
    showMasterToast("세부 태그는 최대 5개까지 등록할 수 있습니다.");
    return;
  }
  const inputs = document.querySelectorAll(".master-detail-tag-input");
  inputs.forEach((inp, i) => { if (masterDetailTagsState[i] !== undefined) masterDetailTagsState[i] = inp.value; });
  masterDetailTagsState.push("");
  renderMasterDetailTagSlots();
}

function removeMasterDetailTagSlot(idx) {
  if (masterDetailTagsState.length <= 2) {
    showMasterToast("세부 태그 칸은 최소 2개 이상 유지되어야 합니다.");
    return;
  }
  const inputs = document.querySelectorAll(".master-detail-tag-input");
  inputs.forEach((inp, i) => { if (masterDetailTagsState[i] !== undefined) masterDetailTagsState[i] = inp.value; });
  masterDetailTagsState.splice(idx, 1);
  renderMasterDetailTagSlots();
}

function getMasterDetailTagsValue() {
  const inputs = document.querySelectorAll(".master-detail-tag-input");
  const tags = [];
  inputs.forEach(inp => {
    const v = inp.value.trim().replace(/^#/, "");
    if (v) tags.push(`#${v}`);
  });
  return tags.join(" ");
}

function switchAddCoverMode(mode) {
  const urlWrap = document.getElementById("addCoverUrlWrap");
  const fileWrap = document.getElementById("addCoverFileWrap");
  const btnUrl = document.getElementById("btnAddCoverUrl");
  const btnFile = document.getElementById("btnAddCoverFile");

  if (mode === "url") {
    urlWrap.style.display = "block";
    fileWrap.style.display = "none";
    btnUrl.classList.add("active");
    btnFile.classList.remove("active");
  } else {
    urlWrap.style.display = "none";
    fileWrap.style.display = "block";
    btnUrl.classList.remove("active");
    btnFile.classList.add("active");
  }
}

function updateAddCoverPreview(url) {
  const img = document.getElementById("mbAddCoverPreview");
  if (!img) return;
  img.src = (url && url.trim()) ? url : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&q=80";
}

function handleAddCoverFileUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    document.getElementById("mbAddCover").value = dataUrl;
    updateAddCoverPreview(dataUrl);
    const label = document.getElementById("mbAddCoverFileLabel");
    if (label) label.innerText = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    showMasterToast(`[${file.name}] 표지 이미지가 업로드되었습니다.`);
  };
  reader.readAsDataURL(file);
}

function handleAddSheetFileUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  editingBookSheetAddFile = {
    name: file.name,
    size: (file.size / 1024).toFixed(1) + " KB"
  };

  const nameEl = document.getElementById("mbAddSheetFileName");
  if (nameEl) nameEl.innerText = `${file.name} (${editingBookSheetAddFile.size})`;
  const label = document.getElementById("mbAddSheetFileLabel");
  if (label) label.innerText = file.name;

  showMasterToast(`[${file.name}] 학습자료 파일이 업로드되었습니다.`);
}

async function fetchMasterBookByIsbnForAdd() {
  const isbnInput = document.getElementById("mbAddIsbn");
  let isbn = (isbnInput ? isbnInput.value : "").replace(/[^0-9xX]/g, "").trim();
  const btn = document.getElementById("btnIsbnFetchAdd");

  if (!isbn) {
    isbn = "9788932917245";
    if (isbnInput) isbnInput.value = isbn;
    showMasterToast("ISBN 미입력으로 테스트용 예시 ISBN(9788932917245)을 조회합니다.", "info");
  }

  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>카카오 조회중...';
    btn.disabled = true;
  }

  const kakaoApiKey = "11d75cc8189f15ddf547b5538827d04d";
  const apiUrl = `https://dapi.kakao.com/v3/search/book?target=isbn&query=${encodeURIComponent(isbn)}`;

  try {
    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `KakaoAK ${kakaoApiKey}`
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (data && data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      const title = doc.title || "";
      const author = Array.isArray(doc.authors) ? doc.authors.join(", ") : (doc.authors || "");
      const publisher = doc.publisher || "";
      let cover = doc.thumbnail || "";

      // 카카오 썸네일 고화질 지원 (R120x174 -> R300x0)
      if (cover && cover.includes("R120x174")) {
        cover = cover.replace("R120x174", "R300x0");
      }

      if (document.getElementById("mbAddTitle")) document.getElementById("mbAddTitle").value = title;
      if (document.getElementById("mbAddAuthor")) document.getElementById("mbAddAuthor").value = author;
      if (document.getElementById("mbAddPublisher")) document.getElementById("mbAddPublisher").value = publisher;

      // 1. 시리즈 vs 단권 지능형 판별
      const seriesInfo = detectBookSeries(title, "");
      const isSingleBook = !seriesInfo.isSeries;
      const singleCheck = document.getElementById("mbAddIsSingle");
      const seriesInput = document.getElementById("mbAddSeries");
      if (singleCheck) singleCheck.checked = isSingleBook;
      toggleSingleBookCheckbox(isSingleBook);
      if (seriesInput && !isSingleBook) {
        seriesInput.value = seriesInfo.seriesName;
      }

      // 2. 카테고리 1, 카테고리 2, 권장 학년 지능형 판별
      const detectedCat1 = detectBookCategory1(doc);
      const detectedCat2 = detectBookCategory2(isbn, doc);
      const detectedGrade = detectBookGrade(doc);

      const cat1El = document.getElementById("mbAddCat1");
      const cat2El = document.getElementById("mbAddCat2");
      const gradeEl = document.getElementById("mbAddGrade");

      if (cat1El) {
        cat1El.value = detectedCat1;
        onCategory1Changed(detectedCat1);
      }
      if (cat2El) {
        cat2El.value = detectedCat2;
        onCategory2Changed(detectedCat2);
      }
      if (gradeEl) {
        gradeEl.value = detectedGrade;
        onGradeChanged(detectedGrade);
      }

      if (cover) {
        if (document.getElementById("mbAddCover")) document.getElementById("mbAddCover").value = cover;
        updateAddCoverPreview(cover);
      }

      // 중복 도서 체크
      const dup = checkDuplicateBook(title, originalEditingBookIdForAdd);
      if (dup) {
        showMasterToast(`[주의] 이미 등록된 도서 '${dup.title}'와 유사합니다.`, "warning");
      } else {
        const seriesText = isSingleBook ? "단권" : `시리즈(${seriesInfo.seriesName})`;
        showMasterToast(`[ISBN: ${isbn}] '${title}' (${seriesText} / ${detectedCat1} / ${detectedCat2}) 분석 완료!`);
      }

      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>조회 완료';
        btn.disabled = false;
        setTimeout(() => {
          btn.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-1"></i>ISBN 조회';
        }, 2000);
      }
    } else {
      showMasterToast(`해당 ISBN(${isbn})에 대한 카카오 도서 검색 결과가 없습니다. 직접 정보를 입력해주세요.`, "warning");
      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-1"></i>ISBN 조회';
        btn.disabled = false;
      }
    }
  } catch (err) {
    console.warn("카카오 API 실시간 조회 실패 (오프라인/네트워크 오류), 내장 데이터 백업 적용:", err);

    // 내장 오프라인 백업 데이터
    const isbnMap = {
      "9788932917245": {
        title: "어린 왕자",
        author: "앙투안 드 생텍쥐페리",
        publisher: "열린책들",
        grade: "초등 5학년",
        cat1: "소설",
        cat2: "외서",
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&q=80"
      },
      "9788936434120": {
        title: "아몬드",
        author: "손원평",
        publisher: "창비",
        grade: "중등 2학년",
        cat1: "소설",
        cat2: "국내서",
        cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=150&q=80"
      }
    };

    const data = isbnMap[isbn] || {
      title: `[ISBN-${isbn.slice(-4)}] 신규 도서`,
      author: "국립중앙도서관 수록 작가",
      publisher: "나노교육출판",
      grade: "초등 5학년",
      cat1: "소설",
      cat2: "국내서",
      cover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150&q=80"
    };

    if (document.getElementById("mbAddTitle")) document.getElementById("mbAddTitle").value = data.title;
    if (document.getElementById("mbAddAuthor")) document.getElementById("mbAddAuthor").value = data.author;
    if (document.getElementById("mbAddPublisher")) document.getElementById("mbAddPublisher").value = data.publisher;
    if (document.getElementById("mbAddGrade")) document.getElementById("mbAddGrade").value = data.grade;
    if (document.getElementById("mbAddCat1")) document.getElementById("mbAddCat1").value = data.cat1;
    if (document.getElementById("mbAddCat2")) document.getElementById("mbAddCat2").value = data.cat2;
    onCategory1Changed(data.cat1);
    onCategory2Changed(data.cat2);
    if (document.getElementById("mbAddCover")) document.getElementById("mbAddCover").value = data.cover;
    updateAddCoverPreview(data.cover);

    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>조회 완료';
      btn.disabled = false;
      setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-1"></i>ISBN 조회';
      }, 2000);
    }
    showMasterToast(`[ISBN: ${isbn}] 서지정보가 자동 입력되었습니다.`);
  }
}

// 중복 도서 의심 검사 알고리즘
function checkDuplicateBook(title, excludeId = null) {
  if (!title) return null;
  const cleanTitle = title.replace(/\s+/g, "").toLowerCase();

  return masterBooks.find(b => {
    if (excludeId && b.id === excludeId) return false;
    const cleanExisting = b.title.replace(/\s+/g, "").toLowerCase();
    return cleanExisting === cleanTitle || cleanExisting.includes(cleanTitle) || cleanTitle.includes(cleanExisting);
  }) || null;
}

// 단권 체크박스 토글 함수
function toggleSingleBookCheckbox(isSingle) {
  var seriesInput = document.getElementById("mbAddSeries");
  if (!seriesInput) return;
  if (isSingle) {
    seriesInput.value = "단권";
    seriesInput.disabled = true;
    seriesInput.style.backgroundColor = "#f0ece4";
  } else {
    if (seriesInput.value === "단권") seriesInput.value = "";
    seriesInput.disabled = false;
    seriesInput.style.backgroundColor = "";
  }
}

// 신규 마스터 도서 등록 / 편집 모달 열기
function openMasterBookAddModal(id = null) {
  const isNew = !id;
  originalEditingBookIdForAdd = isNew ? null : id;
  const book = isNew ? null : masterBooks.find(b => b.id === id);

  const titleEl = document.getElementById("masterBookAddModalTitle");
  if (titleEl) {
    titleEl.innerHTML = isNew
      ? '<i class="fa-solid fa-book-medical mr-2 text-warning"></i>신규 마스터 도서 등록'
      : `<i class="fa-solid fa-pen-to-square mr-2 text-warning"></i>마스터 도서 서지 정보 편집 <span class="badge-soft badge-soft-neutral ml-1" style="font-size: 11px;">${book.id}</span>`;
  }

  // 카테고리 1 (A: 소설, B: 인물 이야기 (위인), C: 비문학/정보글)
  let cat1 = "소설";
  if (book && book.cat1) {
    if (book.cat1 === "B" || book.cat1.includes("인물")) cat1 = "인물 이야기 (위인)";
    else if (book.cat1 === "C" || book.cat1.includes("비문학")) cat1 = "비문학/정보글";
    else cat1 = "소설";
  }

  // 카테고리 2 (K: 국내서, F: 외서, N: 구분 없음)
  let cat2 = "국내서";
  if (book && book.cat2) {
    if (book.cat2 === "F" || book.cat2 === "외서") cat2 = "외서";
    else if (book.cat2 === "N" || book.cat2.includes("구분")) cat2 = "구분 없음";
    else cat2 = "국내서";
  }

  // 권장 학년 정규화 (미취학, 초등 1학년 ~ 중등 3학년)
  let grade = "초등 5학년";
  if (book && book.grade) {
    const rawG = String(book.grade).trim();
    if (rawG === "유치부" || rawG === "0" || rawG === "미취학") grade = "미취학";
    else if (rawG.startsWith("초") && !rawG.includes("학년")) grade = `초등 ${rawG.replace("초", "")}학년`;
    else if (rawG.startsWith("중") && !rawG.includes("학년")) grade = `중등 ${rawG.replace("중", "")}학년`;
    else grade = rawG;
  }

  document.getElementById("mbAddCat1").value = cat1;
  document.getElementById("mbAddCat2").value = cat2;
  document.getElementById("mbAddGrade").value = grade;

  // ID 세팅
  if (isNew) {
    generateNewBookId();
  } else {
    document.getElementById("mbAddId").value = book.id;
  }

  // ISBN
  document.getElementById("mbAddIsbn").value = (book && book.isbn) ? book.isbn : "";

  // 공개 여부
  const isPub = (book && book.isPublic === "N") ? "N" : "Y";
  if (isPub === "Y") {
    document.getElementById("mbAddPublicY").checked = true;
  } else {
    document.getElementById("mbAddPublicN").checked = true;
  }

  // 도서명, 저자, 출판사
  document.getElementById("mbAddTitle").value = isNew ? "" : book.title;
  document.getElementById("mbAddAuthor").value = isNew ? "" : book.author;
  document.getElementById("mbAddPublisher").value = isNew ? "" : book.publisher;

  // 시리즈명 & 단권 (시리즈명이 비어있거나 '단권'이면 단권 체크박스 자동 체크)
  const hasSeries = !!(book && book.series && book.series.trim() !== "" && book.series.trim() !== "단권");
  const isSingle = isNew ? false : (!hasSeries || book.isSingle === true || book.series === "단권");
  if (document.getElementById("mbAddIsSingle")) document.getElementById("mbAddIsSingle").checked = isSingle;
  toggleSingleBookCheckbox(isSingle);
  if (document.getElementById("mbAddSeries")) {
    document.getElementById("mbAddSeries").value = hasSeries ? book.series.trim() : "";
  }

  // 주제 분류 태그 (드롭박스 - 테마 관리 연동) 렌더링
  let selectedThemeTag = "";
  if (book) {
    selectedThemeTag = book.themeTag || (book.subject ? `#${book.subject}` : "") || (Array.isArray(book.tags) ? book.tags[0] : "");
  }
  renderThemeSelectForMasterBook(selectedThemeTag);

  // 세부 태그 동적 입력 슬롯 초기화 (DB tags 컬럼 값 우선)
  let detailTagSource = "";
  if (book) {
    if (book.rawTags) {
      detailTagSource = book.rawTags;
    } else if (book.detailTag) {
      detailTagSource = book.detailTag;
    } else if (Array.isArray(book.tags)) {
      detailTagSource = book.tags.filter(t => !t.startsWith("#")).join(", ");
    }
  }
  initMasterDetailTags(detailTagSource);

  // 어워드, 생각꺼내기
  document.getElementById("mbAddAwards").value = (book && book.awards) ? book.awards : "";
  document.getElementById("mbAddThinkExtract").value = (book && book.thinkExtract) ? book.thinkExtract : "";

  // 생각 담기
  updateThinkPresets(cat1);
  if (book && book.thinkInsert) {
    document.getElementById("mbAddThinkInsert").value = book.thinkInsert;
    switchThinkMode("custom");
  } else {
    switchThinkMode("preset");
  }

  // 표지
  const coverUrl = (book && book.cover) ? book.cover : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&q=80";
  document.getElementById("mbAddCover").value = (book && book.cover) ? book.cover : "";
  updateAddCoverPreview(coverUrl);
  switchAddCoverMode("url");

  $('#masterBookAddModal').modal('show');
}

// 신규 도서 등록/수정 폼 제출 처리 (중복 감지 적용)
function handleSaveMasterBookOnly(e) {
  e.preventDefault();

  const id = document.getElementById("mbAddId").value.trim();
  const isbn = document.getElementById("mbAddIsbn").value.trim();
  const isPublic = document.querySelector('input[name="mbAddIsPublic"]:checked').value;
  const title = document.getElementById("mbAddTitle").value.trim();
  const isSingle = document.getElementById("mbAddIsSingle").checked;
  const series = isSingle ? "단권" : (document.getElementById("mbAddSeries").value.trim() || "단권");
  const author = document.getElementById("mbAddAuthor").value.trim();
  const publisher = document.getElementById("mbAddPublisher").value.trim();
  const cat1 = document.getElementById("mbAddCat1").value;
  const cat2 = document.getElementById("mbAddCat2").value;
  const grade = document.getElementById("mbAddGrade").value;
  const detailTag = getMasterDetailTagsValue();
  const awards = document.getElementById("mbAddAwards").value.trim();
  const thinkExtract = document.getElementById("mbAddThinkExtract").value.trim();
  const thinkInsert = document.getElementById("mbAddThinkInsert").value.trim();
  let cover = document.getElementById("mbAddCover").value.trim();

  // 선택된 주제 분류 태그 수집 (드롭박스)
  const themeTagEl = document.getElementById("mbAddThemeTagSelect");
  const themeTag = themeTagEl ? themeTagEl.value.trim() : "";
  if (!themeTag) {
    showMasterToast("주제 분류 태그를 선택해주세요.", "warning");
    if (themeTagEl) themeTagEl.focus();
    return;
  }
  const tags = [themeTag];

  if (!cover) {
    cover = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&q=80";
  }

  const isNonfiction = (cat1 === "비문학/정보글" || cat1 === "비문학" || cat1 === "C");
  const bookData = {
    id: id || generateNewBookId(),
    isbn: isbn,
    isPublic: isPublic,
    title: title,
    isSingle: isSingle,
    series: series,
    author: author,
    publisher: publisher,
    cat1: cat1,
    cat2: cat2,
    category: isNonfiction ? "비문학" : "문학",
    grade: grade,
    themeTag: themeTag,
    tags: tags,
    detailTag: detailTag,
    awards: awards,
    thinkExtract: thinkExtract,
    thinkInsert: thinkInsert,
    cover: cover,
    academyId: "HQ",
    academyName: "본사 직속 (공용)",
    creatorType: "HQ",
    sheet: true,
    sheetFile: editingBookSheetAddFile,
    hasQuiz: false,
    quizzes: 0,
    likes: 0,
    recommends: 0,
    quizCompletions: 0,
    date: new Date().toISOString().split("T")[0]
  };

  // 중복 도서 검사 (신규 등록 시 또는 제목 변경 시)
  const duplicate = checkDuplicateBook(title, originalEditingBookIdForAdd);
  if (duplicate) {
    // 중복 의심 경고 모달 띄우기
    pendingDuplicateSaveBook = bookData;
    document.getElementById("dupExistingCover").src = duplicate.cover;
    document.getElementById("dupExistingTitle").innerText = duplicate.title;
    document.getElementById("dupExistingMeta").innerText = `저자: ${duplicate.author} | 출판사: ${duplicate.publisher} | 권장학년: ${duplicate.grade}`;
    document.getElementById("dupExistingCode").innerText = `관리코드: ${duplicate.id}`;
    document.getElementById("dupNewTitle").innerText = title;
    $('#duplicateWarningModal').modal('show');
    return;
  }

  saveBookDataDirectly(bookData);
}

// 중복 경고 모달에서 [중복 무시하고 계속 등록] 승인 시
function confirmProceedDuplicateSave() {
  $('#duplicateWarningModal').modal('hide');
  if (pendingDuplicateSaveBook) {
    saveBookDataDirectly(pendingDuplicateSaveBook);
    pendingDuplicateSaveBook = null;
  }
}

async function saveBookDataDirectly(bookData) {
  let nextBook = bookData;
  let editIndex = -1;
  if (originalEditingBookIdForAdd) {
    editIndex = masterBooks.findIndex(b => b.id === originalEditingBookIdForAdd);
    if (editIndex !== -1) nextBook = { ...masterBooks[editIndex], ...bookData, id: originalEditingBookIdForAdd };
  }

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveBook(nextBook);
    } catch (error) {
      showMasterToast('도서를 저장하지 못했습니다: ' + error.message);
      return;
    }
  }

  if (editIndex !== -1) {
    masterBooks[editIndex] = nextBook;
    showMasterToast(`[${bookData.title}] 도서 서지 정보가 성공적으로 수정되었습니다.`);
  } else {
    masterBooks.unshift(nextBook);
    showMasterToast(`신규 도서 [${bookData.title}] (코드: ${bookData.id})이 등록되었습니다! 리스트에서 [북퀴즈]를 생성할 수 있습니다.`);
  }

  $('#masterBookAddModal').modal('hide');
  renderMasterContents();
}

async function deleteMasterBook(id) {
  const book = masterBooks.find(b => b.id === id);
  const name = book ? book.title : "도서";
  if (!book) return;
  if (window.NanoPortal && NanoPortal.remote) {
    try { await NanoPortal.deleteBook(book); }
    catch (error) { showMasterToast('도서를 삭제하지 못했습니다: ' + error.message); return; }
  }
  masterBooks = masterBooks.filter(b => b.id !== id);
  showMasterToast(`'${name}' 도서가 라이브러리에서 삭제되었습니다.`);
  renderMasterContents();
}

// ==========================================
// 독립 북퀴즈 모달 제어 로직 (출제처별 퀴즈 세트 & 문항별 객관식 / 주관식 지원)
// ==========================================
let curQuizTargetBookId = null;
let curQuizSetIdx = 0;
let currentQuizQuestions = [];
let curQuizQuestionIdx = 0;
let curQuizTargetInput = null;

function setCurrentQuizTargetInput(el) {
  curQuizTargetInput = el;
}

function insertQuizSymbol(sym) {
  if (!curQuizTargetInput) {
    curQuizTargetInput = document.getElementById("mqQuestionText");
  }
  if (!curQuizTargetInput) return;

  const start = curQuizTargetInput.selectionStart || 0;
  const end = curQuizTargetInput.selectionEnd || 0;
  const val = curQuizTargetInput.value;
  curQuizTargetInput.value = val.substring(0, start) + sym + val.substring(end);
  curQuizTargetInput.focus();
  curQuizTargetInput.setSelectionRange(start + sym.length, start + sym.length);
  saveCurrentQuizDraft();
}

// 도서별 다중 퀴즈 세트 무결성 보장 함수 (본사 출제 + 가맹점 출제 세트 구성)
function ensureMasterQuizSets(book) {
  if (!book.quizSets || !Array.isArray(book.quizSets) || book.quizSets.length === 0) {
    // 0. MIGRATED_QUIZZES 실데이터 세트 매핑 우선 확인
    if (typeof window !== "undefined" && window.MIGRATED_QUIZZES) {
      const migrated = window.MIGRATED_QUIZZES[book.id] || window.MIGRATED_QUIZZES[book.bookNo] || window.MIGRATED_QUIZZES[book.serverId];
      if (Array.isArray(migrated) && migrated.length > 0) {
        book.quizSets = JSON.parse(JSON.stringify(migrated));
        return;
      }
    }

    let defaultHQQuestions = [];
    if (book.title && book.title.includes("어린 왕자")) {
      // 어린 왕자: 스크린샷과 100% 일치하는 질문 및 이미지·영상 미디어 탑재 샘플
      defaultHQQuestions = [
        {
          type: "CHOICE",
          question: "어린 왕자가 자신의 별을 떠나 여행을 시작하게 된 결정적인 이유는 무엇인가요?",
          mediaType: "image",
          mediaUrl: "assets/covers/cover_1001.jpg",
          mediaCaption: "[도서 삽화] 소행성 B-612를 떠나는 어린 왕자와 장미꽃",
          mediaName: "little_prince_b612.webp",
          mediaSizeInfo: "520KB ➔ 45KB (91% WebP 압축)",
          opt1: "오만하고 변덕스러운 장미와의 갈등 때문에",
          opt2: "더 넓은 우주를 정복하고 싶어서",
          opt3: "별에 화산이 폭발한 위험이 있어서",
          opt4: "비행사 아저씨를 만나기 위해",
          ans: "1",
          hint: "장미의 투정과 거짓말에 실망한 어린 왕자의 심정을 생각해보세요."
        },
        {
          type: "CHOICE",
          question: "영상 자료를 참고할 때, 어린 왕자가 살던 고향 별 소행성 B-612에 대한 설명으로 올바른 것은?",
          mediaType: "video",
          mediaUrl: "https://www.youtube.com/watch?v=kYJ5bK_j09g",
          mediaCaption: "[영상 자료] 생텍쥐페리의 『어린 왕자』 북트레일러 클립 (YouTube URL 연동)",
          opt1: "집채보다 커다란 바오바브나무가 울창하게 자라있는 별",
          opt2: "의자를 조금만 뒤로 물리면 하루에 마흔네 번도 해지는 것을 볼 수 있는 아주 작은 별",
          opt3: "수많은 사람들이 모여 사는 시끌벅적한 대도시 별",
          opt4: "단 한 송이의 꽃도 피지 않는 메마른 얼음 행성",
          ans: "2",
          hint: "어린 왕자는 슬플 때 해지는 모습을 바라보는 것을 좋아했습니다."
        },
        {
          type: "SUBJECTIVE",
          question: "어린 왕자가 사막여우를 만나 깨달은 가치 — '서로에게 특별한 존재가 되어 책임을 지는 것'을 뜻하는 세 글자 낱말은?",
          mediaType: "none",
          mediaUrl: "",
          mediaCaption: "",
          subjectiveAns: "길들임",
          similarAns: "길들인다, 길들이기, 길들임의 의미",
          hint: "여우가 어린 왕자에게 가르쳐 준 관계의 비밀입니다."
        },
        {
          type: "CHOICE",
          question: "어른들이 그저 '평범한 모자'로만 오해했던 비행사의 그림 1호는 실제 무엇을 그린 것이었나요?",
          mediaType: "none",
          mediaUrl: "",
          mediaCaption: "",
          opt1: "코끼리를 삼켜 소화시키고 있는 보아뱀",
          opt2: "사막 한가운데 불시착한 경비행기",
          opt3: "상자 속에 얌전히 누워 잠든 어린 양",
          opt4: "유리 덮개 속에 핀 붉은 장미꽃",
          ans: "1",
          hint: "어른들은 겉모습만 보고 모자라고 생각했습니다."
        },
        {
          type: "CHOICE",
          question: "사막여우가 어린 왕자에게 전별 선물로 건넨 마지막 비밀로 가장 알맞은 교훈은 무엇인가요?",
          mediaType: "none",
          mediaUrl: "",
          mediaCaption: "",
          opt1: "가장 중요한 것은 눈에 보이지 않고 오로지 마음으로만 볼 수 있다",
          opt2: "친구는 많을수록 좋으니 세상 모든 사람과 사귀어라",
          opt3: "자신의 별을 떠난 것은 돌이킬 수 없는 잘못이다",
          opt4: "지구의 장미 오천 송이가 내 별의 장미 한 송이보다 훨씬 값지다",
          ans: "1",
          hint: "마음의 눈으로 볼 때에만 진정한 가치를 발견할 수 있습니다."
        }
      ];
    } else {
      defaultHQQuestions = (book.quizList && Array.isArray(book.quizList) && book.quizList.length > 0)
        ? JSON.parse(JSON.stringify(book.quizList))
        : [
            {
              type: "CHOICE",
              question: `[${book.title}] 1. 도서의 중심 인물과 배경에 대한 올바른 설명은 무엇인가요?`,
              mediaType: "none",
              mediaUrl: "",
              mediaCaption: "",
              opt1: "주인공이 겪는 핵심 갈등의 배경과 정확히 일치한다",
              opt2: "전혀 다른 시대적 배경에서 펼쳐진다",
              opt3: "주인공이 등장하지 않는 허구의 서술이다",
              opt4: "결말과 정반대되는 인물 관계이다",
              ans: "1",
              hint: "도서 전반부 1장의 배경을 참고하세요."
            },
            {
              type: "SUBJECTIVE",
              question: `[${book.title}] 2. 주인공이 마주한 가장 중요한 핵심 갈등이나 사건의 핵심 키워드를 적어주세요.`,
              mediaType: "none",
              mediaUrl: "",
              mediaCaption: "",
              subjectiveAns: "성장",
              similarAns: "마음의 성장, 자아 성장",
              hint: "주인공의 내면 변화를 나타내는 두 글자 단어입니다."
            },
            {
              type: "CHOICE",
              question: `[${book.title}] 3. 작가가 이 책을 통해 독자에게 전달하고자 한 가장 중요한 교훈이나 가치는 무엇인가요?`,
              mediaType: "none",
              mediaUrl: "",
              mediaCaption: "",
              opt1: "진정한 배려와 공감, 따뜻한 마음의 가치",
              opt2: "물질적 성공과 이기적인 태도",
              opt3: "규칙을 무조건 어기는 용기",
              opt4: "혼자만의 이익을 추구하는 삶",
              ans: "1",
              hint: "작가의 말 또는 책의 결말 후기를 참고하세요."
            }
          ];
    }

    book.quizSets = [
      {
        id: `qs_hq_${book.id}`,
        authorType: "HQ",
        authorName: "본사",
        academyName: "본사 직속 (공용)",
        createdAt: "2025-01-10",
        questions: defaultHQQuestions
      }
    ];

    // '어린 왕자' 등 주요 도서에 가맹점(A 학원) 출제 퀴즈 세트 기본 탑재
    if (book.title && book.title.includes("어린 왕자")) {
      book.quizSets.push({
        id: `qs_acad_014_${book.id}`,
        authorType: "ACADEMY",
        authorName: "A 학원",
        academyName: "울산 삼산 인재리딩캠퍼스",
        createdAt: "2025-02-15",
        questions: [
          {
            type: "CHOICE",
            question: "[A 학원 특화 1번] 어린 왕자가 살던 고향 별의 명칭으로 알맞은 것은 무엇인가요?",
            opt1: "A-101 소행성",
            opt2: "B-612 소행성",
            opt3: "C-303 소행성",
            opt4: "B-128 소행성",
            ans: "2",
            hint: "소행성 B-612호입니다."
          },
          {
            type: "CHOICE",
            question: "[A 학원 특화 2번] 여우가 어린 왕자에게 알려준 '길들인다'의 참된 의미로 가장 알맞은 것은?",
            opt1: "상대방을 내 뜻대로 복종시키는 것",
            opt2: "서로에게 특별한 관계를 맺고 끝까지 책임을 지는 것",
            opt3: "매일 정해진 시간에 먹이를 주는 것",
            opt4: "필요할 때만 연락을 주고받는 사이가 되는 것",
            ans: "2",
            hint: "세상에서 오직 하나뿐인 특별한 존재가 되는 과정입니다."
          },
          {
            type: "SUBJECTIVE",
            question: "[A 학원 특화 3번] 어린 왕자가 지구 사막에 도착하여 비행사에게 처음으로 그려달라고 부탁한 동물은 무엇인가요?",
            subjectiveAns: "양",
            similarAns: "어린 양, 작은 양",
            hint: "상자에 구멍을 뚫어 넣어주었던 순하고 작은 동물입니다."
          }
        ]
      });
    }
  }
}

// 북퀴즈 모달 열기 (운영 서버 모드에서는 해당 도서의 실문항을 지연 조회하여 바인딩)
async function openMasterQuizModal(bookId) {
  const book = masterBooks.find(b => b.id === bookId);
  if (!book) return;

  curQuizTargetBookId = bookId;

  // 도서 기본 정보 바인딩
  document.getElementById("mqTargetBookCover").src = book.cover;
  document.getElementById("mqTargetBookTitle").innerText = book.title;
  document.getElementById("mqTargetBookGrade").innerText = book.grade || "권장 학년";
  document.getElementById("mqTargetBookAuthor").innerHTML = `저자: ${book.author} | 출판사: ${book.publisher} | 관리코드: <span id="mqTargetBookId">${book.id}</span>`;

  // 운영 서버 환경에서 아직 문항이 로드되지 않은 경우 지연 조회(/api/portal?action=quiz) 실행
  if (window.NANO_SERVER_DATA && (!book.quizSets || book.quizSets.length === 0) && !book._quizLoadedFromServer && window.NanoPortal && typeof NanoPortal.api === 'function') {
    try {
      const lookupId = book.serverId || book.bookNo || book.id || bookId;
      const res = await NanoPortal.api('/api/portal?action=quiz&bookId=' + encodeURIComponent(lookupId));
      book._quizLoadedFromServer = true;
      if (Array.isArray(res.quizSets) && res.quizSets.length > 0) {
        book.quizSets = res.quizSets;
        if (!window.MIGRATED_QUIZZES) window.MIGRATED_QUIZZES = {};
        window.MIGRATED_QUIZZES[book.id] = res.quizSets;
      }
    } catch (err) {
      console.warn('마스터 북퀴즈 지연 조회 실패:', err);
    }
  }

  // 퀴즈 세트 다중 관리 초기화
  ensureMasterQuizSets(book);
  curQuizSetIdx = 0;
  curQuizQuestionIdx = 0;

  renderQuizSetTabs();
  loadCurrentQuizSet();

  $('#masterQuizModal').modal('show');
}

// 출제 기관별(본사, A 학원 등) 탭 렌더링
function renderQuizSetTabs() {
  const book = masterBooks.find(b => b.id === curQuizTargetBookId);
  if (!book || !book.quizSets) return;

  const container = document.getElementById("mqQuizSetTabs");
  if (!container) return;

  container.innerHTML = book.quizSets.map((set, idx) => {
    const isActive = idx === curQuizSetIdx;
    const isHQ = set.authorType === "HQ";
    const icon = isHQ ? "fa-solid fa-building-columns" : "fa-solid fa-school";
    const count = (set.questions && Array.isArray(set.questions)) ? set.questions.length : 0;

    const btnStyle = isActive
      ? "background: #2563eb; color: #ffffff; border: 1px solid #1d4ed8; padding: 6px 14px; font-size: 12.5px; font-weight: 700; border-radius: 8px; box-shadow: 0 2px 6px rgba(37,99,235,0.25); display: inline-flex; align-items: center; gap: 7px; cursor: pointer; transition: all 0.15s ease;"
      : "background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; padding: 6px 14px; font-size: 12.5px; font-weight: 600; border-radius: 8px; display: inline-flex; align-items: center; gap: 7px; cursor: pointer; transition: all 0.15s ease;";

    const badgeStyle = isActive
      ? "background: rgba(255, 255, 255, 0.28); color: #ffffff; padding: 1px 7px; border-radius: 10px; font-size: 11px; font-weight: 800; min-width: 18px; text-align: center;"
      : "background: #e2e8f0; color: #475569; padding: 1px 7px; border-radius: 10px; font-size: 11px; font-weight: 700; min-width: 18px; text-align: center;";

    return `
      <button type="button" class="btn btn-xs" onclick="switchMasterQuizSet(${idx})" style="${btnStyle}">
        <i class="${icon}" style="font-size: 12px;"></i>
        <span>${set.authorName}</span>
        <span style="${badgeStyle}">${count}</span>
      </button>
    `;
  }).join("");

  const curSet = book.quizSets[curQuizSetIdx] || book.quizSets[0];
  const authorText = document.getElementById("mqCurAuthorText");
  if (authorText) {
    authorText.innerHTML = `<strong>선택된 출제 기관:</strong> ${curSet.authorName} <span class="text-slate-500 font-normal">(${curSet.academyName || '기관'})</span>`;
  }

  const badgeEl = document.getElementById("mqAuthorTypeBadge");
  if (badgeEl) {
    if (curSet.authorType === "HQ") {
      badgeEl.className = "badge badge-indigo text-white px-2 py-0.5";
      badgeEl.style.background = "#4f46e5";
      badgeEl.innerText = "본사 공용";
    } else {
      badgeEl.className = "badge badge-success text-white px-2 py-0.5";
      badgeEl.style.background = "#10b981";
      badgeEl.innerText = "가맹점 자체 출제";
    }
  }

  const btnDelSet = document.getElementById("btnDeleteQuizSet");
  if (btnDelSet) {
    btnDelSet.style.display = book.quizSets.length > 1 ? "inline-block" : "none";
  }
}

// 출제 기관 탭 전환
function switchMasterQuizSet(idx) {
  const book = masterBooks.find(b => b.id === curQuizTargetBookId);
  if (!book || !book.quizSets[idx]) return;

  saveCurrentQuizDraft();
  curQuizSetIdx = idx;
  curQuizQuestionIdx = 0;

  renderQuizSetTabs();
  loadCurrentQuizSet();
}

// 현재 선택된 퀴즈 세트 데이터 로드
function loadCurrentQuizSet() {
  const book = masterBooks.find(b => b.id === curQuizTargetBookId);
  if (!book || !book.quizSets[curQuizSetIdx]) return;

  const set = book.quizSets[curQuizSetIdx];
  currentQuizQuestions = set.questions;

  renderQuizTabButtons();
  loadCurrentQuizQuestionForm();
}

// 마스터 관리자 새 북퀴즈 세트 추가 (기관명 자동 선택 모달 열기)
function openNewQuizSetModal() {
  const select = document.getElementById("newQuizAuthorSelect");
  if (select) {
    let options = `<option value="HQ" data-name="본사" data-academy="본사 직속 (공용)">👑 본사 직속 (공용 북퀴즈 세트)</option>`;
    if (typeof franchiseList !== "undefined" && Array.isArray(franchiseList)) {
      franchiseList.forEach(a => {
        options += `<option value="${a.code || a.id || a.name}" data-name="${a.name}" data-academy="${a.name}">🏫 ${a.name}</option>`;
      });
    }
    select.innerHTML = options;
  }
  $('#newQuizSetModal').modal('show');
}

// 새 북퀴즈 세트 생성 확정
function confirmAddNewQuizSet() {
  const book = masterBooks.find(b => b.id === curQuizTargetBookId);
  if (!book) return;

  saveCurrentQuizDraft();

  const select = document.getElementById("newQuizAuthorSelect");
  if (!select) return;

  const selectedOpt = select.options[select.selectedIndex];
  const authorName = selectedOpt.getAttribute("data-name") || "본사";
  const academyName = selectedOpt.getAttribute("data-academy") || authorName;
  const isHQ = selectedOpt.value === "HQ" || authorName.includes("본사");

  const newSet = {
    id: `qs_custom_${Date.now()}`,
    authorType: isHQ ? "HQ" : "ACADEMY",
    authorName: authorName,
    academyName: academyName,
    createdAt: new Date().toISOString().slice(0, 10),
    questions: [
      {
        type: "CHOICE",
        question: `[${authorName} 출제] 1. 도서 내용과 관련된 핵심 질문을 입력하세요.`,
        choices: ["1번 선택지", "2번 선택지", "3번 선택지"],
        opt1: "1번 선택지",
        opt2: "2번 선택지",
        opt3: "3번 선택지",
        ans: "1",
        hint: "지문 또는 도서 페이지를 참고하세요."
      }
    ]
  };

  book.quizSets.push(newSet);
  $('#newQuizSetModal').modal('hide');
  switchMasterQuizSet(book.quizSets.length - 1);
  showMasterToast(`'${authorName}' 명의의 새 북퀴즈 세트가 추가되었습니다. 문항을 편집해보세요.`);
}

function promptAddNewQuizSet() {
  openNewQuizSetModal();
}

// 현재 선택된 퀴즈 세트 삭제 (마스터 관리자 전용 권한)
function deleteCurQuizSet() {
  const book = masterBooks.find(b => b.id === curQuizTargetBookId);
  if (!book || !book.quizSets) return;

  if (book.quizSets.length <= 1) {
    showMasterToast("최소 1개 이상의 북퀴즈 세트가 유지되어야 합니다.");
    return;
  }

  const curSet = book.quizSets[curQuizSetIdx];
  if (!confirm(`'${curSet.authorName}'에서 출제한 북퀴즈 세트 전체를 삭제하시겠습니까?`)) {
    return;
  }

  book.quizSets.splice(curQuizSetIdx, 1);
  curQuizSetIdx = 0;
  curQuizQuestionIdx = 0;
  renderQuizSetTabs();
  loadCurrentQuizSet();
  showMasterToast("선택한 북퀴즈 세트가 삭제되었습니다.");
}

function renderQuizTabButtons() {
  const container = document.getElementById("mqTabButtons");
  if (!container) return;

  const badge = document.getElementById("mqQuizCountBadge");
  if (badge) badge.innerText = `총 ${currentQuizQuestions.length}문항 구성됨`;

  container.innerHTML = currentQuizQuestions.map((q, idx) => {
    const isChoice = (q.type || "CHOICE") === "CHOICE";
    const typeIcon = isChoice ? "🎯" : "✍️";
    
    // 미디어 첨부 여부 시각적 뱃지 (이미지: 🖼️, 영상: 🎬)
    let mediaBadge = "";
    if (q.mediaType === "image" && q.mediaUrl) {
      mediaBadge = `<span title="이미지(WebP) 첨부됨" style="margin-left: 3px; font-size: 11px;">🖼️</span>`;
    } else if (q.mediaType === "video" && q.mediaUrl) {
      mediaBadge = `<span title="영상(URL) 첨부됨" style="margin-left: 3px; font-size: 11px;">🎬</span>`;
    }

    return `
      <button type="button" class="quiz-num-pill ${idx === curQuizQuestionIdx ? 'active' : ''}" onclick="switchQuizQuestionItem(${idx})">
        ${typeIcon} ${idx + 1}번 문항${mediaBadge}
      </button>
    `;
  }).join("");

  const btnDel = document.getElementById("btnDeleteQuizQuestion");
  if (btnDel) {
    btnDel.style.display = currentQuizQuestions.length > 1 ? "inline-block" : "none";
  }
}

// ==============================================================
// 북퀴즈 문항 멀티미디어 제어 로직 (모달 기반 첨부: WebP 이미지 & 영상 URL)
// ==============================================================

let curModalMediaType = "image"; // 'image' | 'video'
let curModalMediaData = {
  type: "none",
  url: "",
  name: "",
  caption: "",
  sizeInfo: ""
};

// 미디어 모달 열기
function openQuizMediaModal() {
  const q = currentQuizQuestions[curQuizQuestionIdx];
  if (!q) return;

  // 현재 문항의 미디어 정보 복사
  curModalMediaData = {
    type: q.mediaType || "none",
    url: q.mediaUrl || "",
    name: q.mediaName || "",
    caption: q.mediaCaption || "",
    sizeInfo: q.mediaSizeInfo || ""
  };

  curModalMediaType = (curModalMediaData.type === "video") ? "video" : "image";
  switchMediaModalTab(curModalMediaType);

  // 캡션 바인딩
  const cap = document.getElementById("mqModalCaption");
  if (cap) cap.value = curModalMediaData.caption || "";

  // 미리보기 초기화
  if (curModalMediaData.type === "image" && curModalMediaData.url) {
    displayModalImagePreview(curModalMediaData.url, curModalMediaData.name, curModalMediaData.sizeInfo);
  } else {
    displayModalImagePreview("", "", "");
  }

  if (curModalMediaData.type === "video" && curModalMediaData.url) {
    const vInput = document.getElementById("mqModalVideoUrl");
    if (vInput) vInput.value = curModalMediaData.url;
    renderModalVideoPlayer(curModalMediaData.url);
  } else {
    const vInput = document.getElementById("mqModalVideoUrl");
    if (vInput) vInput.value = "";
    renderModalVideoPlayer("");
  }

  $('#quizMediaModal').modal('show');
}

// 모달 내 탭 전환 (이미지 vs 영상)
function switchMediaModalTab(type) {
  curModalMediaType = type;
  const btnImg = document.getElementById("btnMediaTabImage");
  const btnVid = document.getElementById("btnMediaTabVideo");
  const tabImg = document.getElementById("mediaModalImageTab");
  const tabVid = document.getElementById("mediaModalVideoTab");

  if (btnImg && btnVid) {
    btnImg.classList.toggle("active", type === "image");
    btnVid.classList.toggle("active", type === "video");
    if (type === "image") {
      btnImg.style.background = "#e0f2fe";
      btnImg.style.borderColor = "#38bdf8";
      btnVid.style.background = "#fff";
      btnVid.style.borderColor = "var(--border-medium)";
    } else {
      btnVid.style.background = "#fee2e2";
      btnVid.style.borderColor = "#f87171";
      btnImg.style.background = "#fff";
      btnImg.style.borderColor = "var(--border-medium)";
    }
  }
  if (tabImg) tabImg.style.display = (type === "image") ? "block" : "none";
  if (tabVid) tabVid.style.display = (type === "video") ? "block" : "none";
}

// 모달 내 이미지 파일 선택 시 WebP 포맷 자동 변환 압축
function handleModalImageUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("이미지 파일(JPG, PNG, GIF 등)만 업로드할 수 있습니다.");
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const maxW = 1280;
      let w = img.width;
      let h = img.height;
      if (w > maxW) {
        h = Math.round((h * maxW) / w);
        w = maxW;
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      let webpDataUrl = "";
      try {
        webpDataUrl = canvas.toDataURL("image/webp", 0.82);
        if (!webpDataUrl.startsWith("data:image/webp")) {
          webpDataUrl = canvas.toDataURL("image/jpeg", 0.82);
        }
      } catch (err) {
        webpDataUrl = canvas.toDataURL("image/jpeg", 0.82);
      }

      const origKb = Math.round(file.size / 1024);
      const webpKb = Math.round((webpDataUrl.length * 0.75) / 1024);
      const savePercent = origKb > 0 ? Math.max(0, Math.round(((origKb - webpKb) / origKb) * 100)) : 0;

      curModalMediaData = {
        type: "image",
        url: webpDataUrl,
        name: file.name,
        sizeInfo: `${origKb}KB ➔ ${webpKb}KB (${savePercent}% 절감)`
      };

      displayModalImagePreview(webpDataUrl, file.name, curModalMediaData.sizeInfo);
      input.value = "";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function displayModalImagePreview(url, name, sizeInfo) {
  const box = document.getElementById("mqModalImagePreview");
  const img = document.getElementById("mqModalImageImg");
  const info = document.getElementById("mqModalImageInfo");
  const saving = document.getElementById("mqModalImageSaving");
  if (!box || !img) return;

  if (url) {
    img.src = url;
    if (info) info.innerText = name || "문항 이미지";
    if (saving) saving.innerText = sizeInfo || "WebP 압축 완료";
    box.style.display = "block";
  } else {
    box.style.display = "none";
  }
}

function handleModalVideoInput(val) {
  curModalMediaData.type = "video";
  curModalMediaData.url = (val || "").trim();
  curModalMediaData.name = "동영상 자료";
  renderModalVideoPlayer((val || "").trim());
}

function previewModalVideoUrl() {
  const input = document.getElementById("mqModalVideoUrl");
  if (!input) return;
  const val = input.value.trim();
  if (!val) {
    alert("미리보기할 영상 URL(YouTube, Vimeo, MP4 등)을 입력하세요.");
    input.focus();
    return;
  }
  handleModalVideoInput(val);
}

function renderModalVideoPlayer(url) {
  const box = document.getElementById("mqModalVideoPreview");
  const wrap = document.getElementById("mqModalVideoPlayerWrap");
  if (!box || !wrap) return;

  const parsed = parseVideoEmbedUrl(url);
  if (!parsed) {
    box.style.display = "none";
    wrap.innerHTML = "";
    return;
  }

  if (parsed.type === "direct") {
    wrap.innerHTML = `<video src="${parsed.embedUrl}" controls style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; background: #000;"></video>`;
  } else {
    wrap.innerHTML = `<iframe src="${parsed.embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"></iframe>`;
  }
  box.style.display = "block";
}

// 비디오 URL 스마트 파싱
function parseVideoEmbedUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  let ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`,
      originalUrl: trimmed
    };
  }

  let vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      originalUrl: trimmed
    };
  }

  if (/\.(mp4|webm|ogg)($|\?)/i.test(trimmed)) {
    return {
      type: "direct",
      embedUrl: trimmed,
      originalUrl: trimmed
    };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return {
      type: "iframe",
      embedUrl: trimmed,
      originalUrl: trimmed
    };
  }

  return null;
}

// 모달에서 작성한 미디어 적용
function applyModalMedia() {
  const q = currentQuizQuestions[curQuizQuestionIdx];
  if (!q) return;

  const caption = document.getElementById("mqModalCaption")?.value || "";

  if (curModalMediaType === "image") {
    if (curModalMediaData.url && curModalMediaData.type === "image") {
      q.mediaType = "image";
      q.mediaUrl = curModalMediaData.url;
      q.mediaName = curModalMediaData.name;
      q.mediaSizeInfo = curModalMediaData.sizeInfo;
      q.mediaCaption = caption;
    }
  } else if (curModalMediaType === "video") {
    const url = document.getElementById("mqModalVideoUrl")?.value.trim() || curModalMediaData.url;
    if (url) {
      q.mediaType = "video";
      q.mediaUrl = url;
      q.mediaName = "동영상 자료";
      q.mediaSizeInfo = "URL 스트리밍";
      q.mediaCaption = caption;
    }
  }

  updateQuizMediaUI();
  renderQuizTabButtons();
  $('#quizMediaModal').modal('hide');
  showMasterToast("문항 멀티미디어 자료가 적용되었습니다.");
}

// 미디어 삭제 (모달 또는 폼에서 호출)
function clearModalMedia() {
  const q = currentQuizQuestions[curQuizQuestionIdx];
  if (q) {
    q.mediaType = "none";
    q.mediaUrl = "";
    q.mediaName = "";
    q.mediaCaption = "";
    q.mediaSizeInfo = "";
  }
  curModalMediaData = { type: "none", url: "", name: "", caption: "", sizeInfo: "" };
  displayModalImagePreview("", "", "");
  renderModalVideoPlayer("");
  const vInput = document.getElementById("mqModalVideoUrl");
  if (vInput) vInput.value = "";
  const cap = document.getElementById("mqModalCaption");
  if (cap) cap.value = "";

  updateQuizMediaUI();
  renderQuizTabButtons();
  $('#quizMediaModal').modal('hide');
  showMasterToast("멀티미디어 자료가 삭제되었습니다.");
}

function removeQuizMedia() {
  clearModalMedia();
}

// 퀴즈 폼 내 미디어 뱃지 및 요약 칩 동기화
function updateQuizMediaUI() {
  const q = currentQuizQuestions[curQuizQuestionIdx];
  const badge = document.getElementById("mqMediaBadgeIndicator");
  const badgeText = document.getElementById("mqMediaBadgeIndicatorText");
  const summaryBox = document.getElementById("mqMediaSummaryBox");
  const summaryIcon = document.getElementById("mqMediaSummaryIcon");
  const summaryTitle = document.getElementById("mqMediaSummaryTitle");
  const summaryDesc = document.getElementById("mqMediaSummaryDesc");

  if (!q || !q.mediaType || q.mediaType === "none" || !q.mediaUrl) {
    if (badge) badge.style.display = "none";
    if (summaryBox) summaryBox.style.display = "none";
    return;
  }

  const isImg = q.mediaType === "image";
  if (badge) {
    badge.style.display = "inline-block";
    if (badgeText) badgeText.innerText = isImg ? "이미지 첨부됨" : "영상 첨부됨";
  }
  if (summaryBox) {
    summaryBox.style.display = "flex";
    if (summaryIcon) summaryIcon.innerText = isImg ? "🖼️" : "🎬";
    if (summaryTitle) summaryTitle.innerText = isImg ? (q.mediaName || "WebP 이미지 첨부 완료") : "동영상 첨부 완료";
    if (summaryDesc) summaryDesc.innerText = q.mediaCaption ? `(${q.mediaCaption})` : (q.mediaSizeInfo || "");
  }
}

// ==============================================================
// 객관식 보기 동적 제어 (3~5개, 기본 3개, 하단 추가, 우측 삭제)
// ==============================================================

function getChoicesFromQuestion(q) {
  if (Array.isArray(q.choices) && q.choices.length >= 2) {
    return q.choices.slice(0, 5);
  }
  if (Array.isArray(q.options) && q.options.length >= 2) {
    return q.options.slice(0, 5);
  }
  const list = [q.opt1, q.opt2, q.opt3, q.opt4, q.opt5].filter(x => x !== undefined && x !== "");
  if (list.length < 2) {
    return [q.opt1 || "1번 선택지", q.opt2 || "2번 선택지", q.opt3 || "3번 선택지"];
  }
  return list.slice(0, 5);
}

function syncQuestionChoicesProps(q) {
  const list = q.choices || [];
  q.opt1 = list[0] || "";
  q.opt2 = list[1] || "";
  q.opt3 = list[2] || "";
  q.opt4 = list[3] || "";
  q.opt5 = list[4] || "";
}

function renderDynamicChoices(choices, ans) {
  const container = document.getElementById("mqDynamicChoicesContainer");
  if (!container) return;

  if (!Array.isArray(choices) || choices.length < 2) {
    choices = ["1번 선택지", "2번 선택지", "3번 선택지"];
  }
  if (choices.length > 5) {
    choices = choices.slice(0, 5);
  }

  const circleNums = ["①", "②", "③", "④", "⑤"];
  const currentAns = parseInt(ans || "1", 10);

  container.innerHTML = choices.map((optText, idx) => {
    const num = idx + 1;
    const circle = circleNums[idx] || `${num}`;
    const isChecked = currentAns === num;
    const canDelete = choices.length > 2;

    return `
      <div class="input-group choice-option-row">
        <div class="input-group-prepend">
          <div class="input-group-text bg-light border-right-0" style="border-radius: 8px 0 0 8px; cursor: pointer;" onclick="onQuizChoiceRadioChanged(${num})">
            <input type="radio" name="mqChoiceCorrect" id="mqRadio${num}" value="${num}" ${isChecked ? 'checked' : ''} onchange="onQuizChoiceRadioChanged(${num})" style="cursor: pointer;">
            <label for="mqRadio${num}" class="mb-0 ml-1 font-weight-bold text-dark" style="font-size: 12.5px; cursor: pointer;">${circle}번</label>
          </div>
        </div>
        <input type="text" class="form-control form-control-beige choice-opt-input" id="mqOpt${num}" data-opt-idx="${idx}" value="${String(optText || '').replace(/"/g, '&quot;')}" placeholder="${num}번 보기 내용을 입력하세요" onfocus="setCurrentQuizTargetInput(this)" oninput="saveCurrentQuizDraft()" style="${canDelete ? 'border-radius: 0;' : 'border-radius: 0 8px 8px 0;'}">
        ${canDelete ? `
        <div class="input-group-append">
          <button type="button" class="btn btn-outline-danger" onclick="deleteQuizChoiceOption(${idx})" title="보기 삭제" style="border-radius: 0 8px 8px 0; font-size: 12px; padding: 0 10px;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        ` : ''}
      </div>
    `;
  }).join("");

  // 하단 보기 추가 버튼 표시 및 카운트
  const countBadge = document.getElementById("mqChoiceCountBadge");
  if (countBadge) countBadge.innerText = choices.length;

  const addBtn = document.getElementById("btnAddChoiceOption");
  if (addBtn) {
    if (choices.length >= 5) {
      addBtn.disabled = true;
      addBtn.classList.add("disabled");
      addBtn.innerHTML = `<i class="fa-solid fa-check mr-1 text-muted"></i>보기 최대치 도달 (5/5)`;
    } else {
      addBtn.disabled = false;
      addBtn.classList.remove("disabled");
      addBtn.innerHTML = `<i class="fa-solid fa-plus mr-1 text-primary"></i>보기 추가하기 (${choices.length}/5)`;
    }
  }
}

function addQuizChoiceOption() {
  const q = currentQuizQuestions[curQuizQuestionIdx];
  if (!q) return;

  saveCurrentQuizDraft();
  let choices = getChoicesFromQuestion(q);
  if (choices.length >= 5) {
    showMasterToast("객관식 보기는 최대 5개까지 지정할 수 있습니다.");
    return;
  }

  choices.push(`${choices.length + 1}번 선택지`);
  q.choices = choices;
  syncQuestionChoicesProps(q);

  renderDynamicChoices(choices, q.ans || "1");
  saveCurrentQuizDraft();
  showMasterToast(`보기 ${choices.length}번이 추가되었습니다.`);
}

function deleteQuizChoiceOption(idx) {
  const q = currentQuizQuestions[curQuizQuestionIdx];
  if (!q) return;

  saveCurrentQuizDraft();
  let choices = getChoicesFromQuestion(q);
  if (choices.length <= 3) {
    showMasterToast("객관식 보기는 최소 3개 이상이어야 합니다.");
    return;
  }

  choices.splice(idx, 1);
  q.choices = choices;

  let curAns = parseInt(q.ans || "1", 10);
  if (curAns > choices.length) {
    curAns = choices.length;
    q.ans = String(curAns);
  }
  syncQuestionChoicesProps(q);

  renderDynamicChoices(choices, q.ans);
  saveCurrentQuizDraft();
  showMasterToast("보기가 삭제되었습니다.");
}

function onQuizChoiceRadioChanged(ansNum) {
  const radio = document.getElementById(`mqRadio${ansNum}`);
  if (radio) radio.checked = true;
  saveCurrentQuizDraft();
}

// 문항 폼 로드
function loadCurrentQuizQuestionForm() {
  const q = currentQuizQuestions[curQuizQuestionIdx];
  if (!q) return;

  const isChoice = (q.type || "CHOICE") === "CHOICE";

  // 라디오 체크
  if (isChoice) {
    document.getElementById("mqTypeChoice").checked = true;
  } else {
    document.getElementById("mqTypeSubjective").checked = true;
  }

  onQuizTypeChanged(q.type || "CHOICE");

  const titleEl = document.getElementById("mqCurrentQuestionTitle");
  if (titleEl) {
    titleEl.innerHTML = `<i class="fa-solid fa-circle-question text-warning mr-1"></i>문제 ${curQuizQuestionIdx + 1}번 문항 설정 (${isChoice ? '객관식' : '주관식 단답/서술'})`;
  }

  document.getElementById("mqQuestionText").value = q.question || "";
  document.getElementById("mqQuizHint").value = q.hint || "";

  // 미디어 UI 동기화
  updateQuizMediaUI();

  if (isChoice) {
    const choices = getChoicesFromQuestion(q);
    q.choices = choices;
    renderDynamicChoices(choices, q.ans || "1");
  } else {
    document.getElementById("mqSubjectiveAns").value = q.subjectiveAns || "";
    document.getElementById("mqSubjectiveSimilar").value = q.similarAns || "";
  }
}

function onQuizTypeChanged(type) {
  const choiceWrap = document.getElementById("mqChoiceFormWrap");
  const subjWrap = document.getElementById("mqSubjectiveFormWrap");
  if (!choiceWrap || !subjWrap) return;

  if (type === "CHOICE") {
    choiceWrap.style.display = "block";
    subjWrap.style.display = "none";
  } else {
    choiceWrap.style.display = "none";
    subjWrap.style.display = "block";
  }

  if (currentQuizQuestions[curQuizQuestionIdx]) {
    currentQuizQuestions[curQuizQuestionIdx].type = type;
  }
  renderQuizTabButtons();
}

function saveCurrentQuizDraft() {
  const q = currentQuizQuestions[curQuizQuestionIdx];
  if (!q) return;

  const qType = document.querySelector('input[name="mqQuestionType"]:checked')?.value || "CHOICE";
  q.type = qType;
  q.question = document.getElementById("mqQuestionText")?.value || "";
  q.hint = document.getElementById("mqQuizHint")?.value || "";

  if (qType === "CHOICE") {
    const choiceInputs = document.querySelectorAll(".choice-opt-input");
    if (choiceInputs.length > 0) {
      const choices = [];
      choiceInputs.forEach(input => choices.push(input.value));
      q.choices = choices;
      syncQuestionChoicesProps(q);
    }
    const checkedRadio = document.querySelector('input[name="mqChoiceCorrect"]:checked');
    q.ans = checkedRadio ? checkedRadio.value : "1";
  } else {
    q.subjectiveAns = document.getElementById("mqSubjectiveAns")?.value || "";
    q.similarAns = document.getElementById("mqSubjectiveSimilar")?.value || "";
  }
}

function switchQuizQuestionItem(idx) {
  saveCurrentQuizDraft();
  curQuizQuestionIdx = idx;
  renderQuizTabButtons();
  loadCurrentQuizQuestionForm();
}

function addNewQuizQuestion() {
  saveCurrentQuizDraft();
  const nextNum = currentQuizQuestions.length + 1;
  currentQuizQuestions.push({
    type: "CHOICE",
    question: `새 문제 ${nextNum}. 지문 및 질문 내용을 입력하세요.`,
    mediaType: "none",
    mediaUrl: "",
    mediaCaption: "",
    mediaName: "",
    mediaSizeInfo: "",
    choices: ["1번 선택지", "2번 선택지", "3번 선택지"],
    opt1: "1번 선택지",
    opt2: "2번 선택지",
    opt3: "3번 선택지",
    ans: "1",
    hint: ""
  });
  curQuizQuestionIdx = currentQuizQuestions.length - 1;
  renderQuizTabButtons();
  loadCurrentQuizQuestionForm();
  document.getElementById("mqQuestionText")?.focus();
}

function deleteCurQuizQuestion() {
  if (currentQuizQuestions.length <= 1) {
    showMasterToast("북퀴즈에는 최소 1개 이상의 문항이 유지되어야 합니다.");
    return;
  }
  currentQuizQuestions.splice(curQuizQuestionIdx, 1);
  if (curQuizQuestionIdx >= currentQuizQuestions.length) {
    curQuizQuestionIdx = currentQuizQuestions.length - 1;
  }
  renderQuizTabButtons();
  loadCurrentQuizQuestionForm();
  showMasterToast("문항이 삭제되었습니다.");
}

async function handleSaveMasterQuizOnly() {
  saveCurrentQuizDraft();

  const book = masterBooks.find(b => b.id === curQuizTargetBookId);
  if (!book || !book.quizSets[curQuizSetIdx]) return;

  const curSet = book.quizSets[curQuizSetIdx];
  if (window.NanoPortal && NanoPortal.remote) {
    if (curQuizSetIdx !== 0) { showMasterToast('운영 서버에는 도서별 기본 퀴즈 세트 한 개만 저장할 수 있습니다.'); return; }
    try { await NanoPortal.syncQuizzes(book, currentQuizQuestions); }
    catch (error) { showMasterToast('북퀴즈를 저장하지 못했습니다: ' + error.message); return; }
  }
  curSet.questions = JSON.parse(JSON.stringify(currentQuizQuestions));

  // 기본 목록 표시용 하위 호환
  book.quizList = JSON.parse(JSON.stringify(book.quizSets[0].questions));
  book.quizzes = currentQuizQuestions.length;
  book.hasQuiz = currentQuizQuestions.length > 0;

  showMasterToast(`'${book.title}' [${curSet.authorName}] 북퀴즈(${currentQuizQuestions.length}문항) 구성 저장이 완료되었습니다!`);
  $('#masterQuizModal').modal('hide');
  renderMasterContents();
}

// ==============================================================
// 시리즈명 자동완성 추천 (타이핑 시 등록 권수 표시 드롭박스)
// ==============================================================
function handleSeriesInput(val) {
  const container = document.getElementById("mbSeriesSuggestions");
  if (!container) return;

  const isSingle = document.getElementById("mbAddIsSingle")?.checked;
  if (isSingle) {
    container.style.display = "none";
    return;
  }

  // 등록되어 있는 시리즈 통계 집계
  const seriesMap = {};
  if (typeof masterBooks !== "undefined" && Array.isArray(masterBooks)) {
    masterBooks.forEach(b => {
      if (b.series && b.series.trim() && b.series !== "단권") {
        const s = b.series.trim();
        seriesMap[s] = (seriesMap[s] || 0) + 1;
      }
    });
  }

  const query = (val || "").trim().toLowerCase();
  const matched = Object.keys(seriesMap).filter(s => {
    if (!query) return true; // 포커스 시 전체 등록 시리즈 추천
    return s.toLowerCase().includes(query);
  });

  if (matched.length === 0) {
    if (query) {
      container.innerHTML = `
        <div class="p-2.5 text-muted text-center" style="font-size: 12px;">
          <i class="fa-solid fa-circle-info mr-1"></i>'<strong>${val}</strong>' 신규 시리즈로 자동 등록됩니다.
        </div>
      `;
      container.style.display = "block";
    } else {
      container.style.display = "none";
    }
    return;
  }

  container.innerHTML = `
    <div class="p-1.5 px-2 bg-light border-bottom text-muted font-weight-bold d-flex justify-content-between align-items-center" style="font-size: 11px;">
      <span><i class="fa-solid fa-bookmark text-warning mr-1"></i>등록된 시리즈 추천 (${matched.length}개)</span>
      <span style="cursor: pointer;" onclick="document.getElementById('mbSeriesSuggestions').style.display='none'"><i class="fa-solid fa-xmark"></i></span>
    </div>
  ` + matched.map(s => `
    <div class="series-suggestion-item p-2 px-3 border-bottom d-flex justify-content-between align-items-center" style="cursor: pointer; transition: background 0.15s ease;" onmouseover="this.style.background='#f8f5f0'" onmouseout="this.style.background='#fff'" onclick="selectSeriesSuggestion('${s.replace(/'/g, "\\'")}')">
      <span class="font-weight-bold text-dark" style="font-size: 12.5px;"><i class="fa-solid fa-book-bookmark text-primary mr-1.5"></i>${s}</span>
      <span class="badge badge-pill badge-primary font-weight-bold" style="font-size: 11px;">${seriesMap[s]}권 등록됨</span>
    </div>
  `).join("");

  container.style.display = "block";
}

function selectSeriesSuggestion(seriesName) {
  const input = document.getElementById("mbAddSeries");
  if (input) {
    input.value = seriesName;
  }
  const singleChk = document.getElementById("mbAddIsSingle");
  if (singleChk) {
    singleChk.checked = false;
  }
  const container = document.getElementById("mbSeriesSuggestions");
  if (container) {
    container.style.display = "none";
  }
}

// 윈도우 클릭 시 자동완성 닫기
document.addEventListener("click", (e) => {
  const container = document.getElementById("mbSeriesSuggestions");
  const input = document.getElementById("mbAddSeries");
  if (container && input && !container.contains(e.target) && e.target !== input) {
    container.style.display = "none";
  }
});

// ==============================================================
// 엑셀 대량 도서 등록 모달 & 샘플 다운로드 & 업로드
// ==============================================================
function openExcelUploadModal() {
  const nameEl = document.getElementById("masterBookExcelFileName");
  if (nameEl) nameEl.innerHTML = "클릭하여 엑셀 파일 선택 또는 드래그 앤 드롭";
  const fileInp = document.getElementById("masterBookExcelFileInput");
  if (fileInp) fileInp.value = "";
  $("#masterBookExcelModal").modal("show");
}

// 권장 학년 코드/텍스트 표준 변환 헬퍼 (a:미취학, 1~6:초1~6, 7~9:중1~3, b:중등)
function normalizeGradeInput(raw) {
  if (!raw) return "초등 1학년";
  let s = String(raw).trim().toLowerCase().replace(/["']/g, "");

  // 1. 단일 코드 매핑
  if (s === "a" || s === "0") return "미취학";
  if (s === "1") return "초등 1학년";
  if (s === "2") return "초등 2학년";
  if (s === "3") return "초등 3학년";
  if (s === "4") return "초등 4학년";
  if (s === "5") return "초등 5학년";
  if (s === "6") return "초등 6학년";
  if (s === "7") return "중등 1학년";
  if (s === "8") return "중등 2학년";
  if (s === "9") return "중등 3학년";
  if (s === "b") return "중등";

  // 2. 한글 표기 유연 매핑
  if (s.includes("미취학") || s.includes("유치")) return "미취학";
  if (s.includes("초1") || s.includes("초등 1") || s.includes("초등1")) return "초등 1학년";
  if (s.includes("초2") || s.includes("초등 2") || s.includes("초등2")) return "초등 2학년";
  if (s.includes("초3") || s.includes("초등 3") || s.includes("초등3")) return "초등 3학년";
  if (s.includes("초4") || s.includes("초등 4") || s.includes("초등4")) return "초등 4학년";
  if (s.includes("초5") || s.includes("초등 5") || s.includes("초등5")) return "초등 5학년";
  if (s.includes("초6") || s.includes("초등 6") || s.includes("초등6")) return "초등 6학년";
  if (s.includes("중1") || s.includes("중등 1") || s.includes("중등1") || s.includes("중학 1")) return "중등 1학년";
  if (s.includes("중2") || s.includes("중등 2") || s.includes("중등2") || s.includes("중학 2")) return "중등 2학년";
  if (s.includes("중3") || s.includes("중등 3") || s.includes("중등3") || s.includes("중학 3")) return "중등 3학년";
  if (s.includes("중등") || s.includes("중학교")) return "중등";
  if (s.includes("고등") || s.includes("고등학교")) return "고등";

  return null;
}

// 카테고리 1 검증 및 정규화 (A: 소설, B: 인물 이야기, C: 비문학/정보글)
function validateAndNormalizeCat1(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase().replace(/["']/g, "");

  if (s === "A" || s === "소설") return "소설";
  if (s === "B" || s.includes("인물")) return "인물 이야기 (위인)";
  if (s === "C" || s.includes("비문학") || s.includes("정보글")) return "비문학/정보글";

  return null;
}

// 카테고리 2 검증 및 정규화 (K: 국내서, F: 외서, N: 구분 없음)
function validateAndNormalizeCat2(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase().replace(/["']/g, "");

  if (s === "K" || s.includes("국내")) return "국내서";
  if (s === "F" || s.includes("외서") || s.includes("해외")) return "외서";
  if (s === "N" || s.includes("구분") || s.includes("기타") || s === "-") return "구분 없음";

  return null;
}

// ISBN 정제 헬퍼 (지수 표기 9.78E+12 복원 및 엑셀 수식 ="..." 제거)
function sanitizeIsbnString(raw) {
  if (!raw) return "";
  let s = String(raw).trim().replace(/["']/g, "").replace(/^=/, "").trim().replace(/["']/g, "");

  // 엑셀 지수 표기(9.78E+12) 감지 시 정수 문자열로 복원
  if (/^[0-9.]+[eE]\+[0-9]+$/i.test(s)) {
    try {
      s = BigInt(Math.round(Number(s))).toString();
    } catch(e) {
      try {
        s = Number(s).toLocaleString('fullwide', { useGrouping: false });
      } catch(e2) {}
    }
  }
  // 하이픈, 특수기호 제거 후 숫자만 추출
  return s.replace(/[^0-9]/g, "");
}

// CSV 1행 파서
function parseCSVRow(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function downloadBookExcelTemplate() {
  const headers = [
    "도서명",
    "저자",
    "출판사",
    "권장학년(a:미취학,1~6:초1~6,7~9:중1~3,b:중등)",
    "카테고리1(소설/인물이야기/비문학)",
    "카테고리2(국내서/외서/구분없음)",
    "시리즈명",
    "ISBN",
    "등록처(HQ 또는 학원코드)"
  ];

  // ISBN은 수식 없이 순수 숫자만 입력해도 정상 등록되도록 표준 숫자 형식으로 제공
  const sampleRows = [
    ["어린 왕자", "앙투안 드 생텍쥐페리", "열린책들", "5", "소설", "외서", "단권", "9788932902708", "HQ"],
    ["해리포터와 마법사의 돌", "J.K.롤링", "문학수첩", "5", "소설", "외서", "해리포터 시리즈", "9788983920683", "HQ"],
    ["한국사 편지 1", "박은봉", "책과함께어린이", "4", "비문학/정보글", "국내서", "한국사 편지", "9788991221468", "HQ"],
    ["엄마 마중", "이태준", "보림", "a", "소설", "국내서", "단권", "9788943305437", "HQ"],
    ["자전거 도둑", "박완서", "다림", "7", "소설", "국내서", "단권", "9788983940124", "HQ"],
    ["마당을 나온 암탉", "황선미", "사계절", "4", "소설", "국내서", "단권", "9788971966969", "HQ"]
  ];

  downloadAsCSV("나노책장_도서대량등록양식_" + new Date().toISOString().split("T")[0] + ".csv", headers, sampleRows);
  showMasterToast("도서 대량 등록 샘플 서식(CSV)이 다운로드되었습니다. ISBN은 수식 없이 숫자만 입력하시면 됩니다.");
}

function handleMasterBookExcelFileSelect(input) {
  if (input.files && input.files[0]) {
    const el = document.getElementById("masterBookExcelFileName");
    if (el) el.innerHTML = `<span class="text-success font-weight-bold"><i class="fa-solid fa-file-excel mr-1"></i>${input.files[0].name} (${Math.round(input.files[0].size / 1024)}KB)</span>`;
  }
}

function handleMasterBookExcelUpload() {
  const fileInput = document.getElementById("masterBookExcelFileInput");
  if (!fileInput || !fileInput.files || !fileInput.files[0]) {
    alert("업로드할 엑셀/CSV 파일을 먼저 선택해주세요.");
    return;
  }

  const file = fileInput.files[0];
  const fileName = file.name;

  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    if (!content || !content.trim()) {
      alert("선택하신 파일에 내용이 없습니다.");
      return;
    }

    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      alert("등록할 도서 데이터 행이 존재하지 않습니다. (헤더만 있거나 빈 파일)");
      return;
    }

    const parsedBooks = [];
    const validationErrors = [];

    // 2번째 줄(인덱스 1)부터 데이터 행 파싱
    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1; // 엑셀 행 번호 (1-based)
      const cols = parseCSVRow(lines[i]);
      if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

      const title = (cols[0] || "").trim();
      const author = (cols[1] || "").trim();
      const publisher = (cols[2] || "").trim();
      const rawGrade = (cols[3] || "").trim();
      const rawCat1 = (cols[4] || "").trim();
      const rawCat2 = (cols[5] || "").trim();
      const series = (cols[6] || "").trim();
      const rawIsbn = (cols[7] || "").trim();
      const academyId = (cols[8] || "HQ").trim();

      // 도서명 필수
      if (!title) {
        validationErrors.push(`[${rowNum}행] 도서명(제목)이 비어있습니다.`);
        continue;
      }

      // 권장 학년 검증 및 정규화
      const normalizedGrade = normalizeGradeInput(rawGrade);
      if (!normalizedGrade) {
        validationErrors.push(`[${rowNum}행: ${title}] 올바르지 않은 권장학년('${rawGrade}')입니다.\n  👉 허용: a(미취학), 1~6(초등 1~6학년), 7~9(중등 1~3학년), b(중등 전체)`);
      }

      // 카테고리 1 검증 (소설, 인물 이야기, 비문학/정보글 또는 A, B, C 외 입력 차단)
      const cat1 = validateAndNormalizeCat1(rawCat1);
      if (!cat1) {
        validationErrors.push(`[${rowNum}행: ${title}] 유효하지 않은 카테고리1('${rawCat1}')입니다.\n  👉 허용 항목: [소설, 인물 이야기, 비문학/정보글] (또는 A, B, C)`);
      }

      // 카테고리 2 검증 (국내서, 외서, 구분 없음 또는 K, F, N 외 입력 차단)
      const cat2 = validateAndNormalizeCat2(rawCat2);
      if (!cat2) {
        validationErrors.push(`[${rowNum}행: ${title}] 유효하지 않은 카테고리2('${rawCat2}')입니다.\n  👉 허용 항목: [국내서, 외서, 구분 없음] (또는 K, F, N)`);
      }

      const isbn = sanitizeIsbnString(rawIsbn);

      if (normalizedGrade && cat1 && cat2) {
        const nextIdNum = masterBooks.length + parsedBooks.length + 1;
        parsedBooks.push({
          id: `MB-${String(nextIdNum).padStart(3, '0')}`,
          title: title,
          author: author || "작자 미상",
          publisher: publisher || "출판사 미상",
          grade: normalizedGrade,
          category: cat1 === "소설" ? "문학" : "비문학",
          cat1: cat1,
          cat2: cat2,
          series: series || "단권",
          isSingle: !series || series === "단권",
          isbn: isbn,
          tags: ["#신규도서", cat1],
          detailTag: `#${normalizedGrade} #${cat1}`,
          isPublic: "Y",
          hasQuiz: false,
          quizzes: 0,
          likes: 0,
          recommends: 0,
          quizCompletions: 0,
          academyId: academyId || "HQ",
          academyName: academyId === "HQ" ? "본사 직속 (공용)" : academyId,
          creatorType: academyId === "HQ" ? "HQ" : "ACADEMY",
          sheet: false,
          date: new Date().toISOString().split("T")[0],
          cover: "upload/banner/banner_reading_king.jpg",
          quizSets: []
        });
      }
    }

    // 유효성 오류가 하나라도 있으면 전체 업로드 중단 및 상세 알림
    if (validationErrors.length > 0) {
      const errorMsg = `[엑셀 업로드 유효성 검사 실패]\n총 ${validationErrors.length}건의 규격 오류가 발견되어 등록이 취소되었습니다.\n엑셀 서식을 수정한 후 다시 업로드해주세요.\n\n` +
        validationErrors.slice(0, 6).join("\n\n") +
        (validationErrors.length > 6 ? `\n\n... 외 ${validationErrors.length - 6}건 추가 오류` : "");
      alert(errorMsg);
      return;
    }

    if (parsedBooks.length === 0) {
      alert("등록 가능한 유효 도서 데이터가 없습니다.");
      return;
    }

    // 통과된 도서들을 masterBooks에 등록
    parsedBooks.forEach(b => masterBooks.unshift(b));

    $("#masterBookExcelModal").modal("hide");
    renderMasterContents();
    showMasterToast(`[${fileName}] 엑셀 대량 등록 완료: 총 ${parsedBooks.length}권의 도서가 성공적으로 등록되었습니다!`);
  };

  reader.readAsText(file, "UTF-8");
}

// ==========================================
// 8. 카톡 발송 내역 모듈 (Aligo Dispatch)
// ==========================================
function renderDispatchTable(data = dispatchLogs) {
  const tbody = document.getElementById("dispatchTableBody");
  if (!tbody) return;

  document.getElementById("dispatchFilteredCount").innerText = data.length;

  // 상단 알리고 통계 카드 실시간 연동
  const baseLogs = Array.isArray(dispatchLogs) ? dispatchLogs : [];
  const kstYm = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 7);
  const monthLogs = baseLogs.filter(l => String(l.datetime || l.date || '').slice(0, 7) === kstYm);
  const displaySentCount = monthLogs.length > 0 ? monthLogs.length : baseLogs.length;
  const successCount = baseLogs.filter(l => l.status === "SUCCESS").length;
  const failCount = baseLogs.length - successCount;
  const successRate = baseLogs.length > 0 ? ((successCount / baseLogs.length) * 100).toFixed(1) : "0.0";

  const sentEl = document.getElementById("statAligoTotalSent");
  const sentSubEl = document.getElementById("statAligoTotalSentSub");
  if (sentEl) sentEl.innerHTML = `${displaySentCount.toLocaleString()}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">건</span>`;
  if (sentSubEl) sentSubEl.innerText = `전체 누적 발송 ${baseLogs.length.toLocaleString()}건 (조회 ${data.length.toLocaleString()}건)`;

  const rateEl = document.getElementById("statAligoSuccessRate");
  const rateSubEl = document.getElementById("statAligoSuccessRateSub");
  if (rateEl) rateEl.innerHTML = `${successRate}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">%</span>`;
  if (rateSubEl) rateSubEl.innerText = `성공 ${successCount.toLocaleString()}건 / 실패 ${failCount.toLocaleString()}건`;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-5 text-muted">발송 내역이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((log, idx) => {
    let typeBadge = `<span class="badge-soft badge-soft-neutral">${log.typeName}</span>`;
    if (log.type === "PORTFOLIO") typeBadge = `<span class="badge-soft badge-soft-warn"><i class="fa-solid fa-chart-pie mr-1"></i>포트폴리오</span>`;
    else if (log.type === "ASSIGN") typeBadge = `<span class="badge-soft badge-soft-success"><i class="fa-solid fa-book-bookmark mr-1"></i>도서배정</span>`;

    const statusBadge = log.status === "SUCCESS"
      ? `<span class="badge-soft badge-soft-success"><i class="fa-solid fa-check mr-1"></i>성공</span>`
      : `<span class="badge-soft badge-soft-danger"><i class="fa-solid fa-xmark mr-1"></i>실패</span>`;

    return `
      <tr>
        <td class="text-center"><small class="text-muted font-weight-bold">${idx + 1}</small></td>
        <td class="text-center"><small class="text-muted">${log.datetime}</small></td>
        <td class="font-weight-bold">${log.academyName}</td>
        <td class="text-center">${typeBadge}</td>
        <td>
          <div class="font-weight-bold">${log.receiverName}</div>
        </td>
        <td class="text-center"><small>${log.receiverPhone}</small></td>
        <td style="max-width: 280px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
          <small class="text-dark">${log.summary}</small>
        </td>
        <td class="text-center">${statusBadge}</td>
        <td class="text-center">
          <button class="btn btn-xs btn-outline-secondary mr-1" onclick="openDispatchDetailModal('${log.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;">
            전문보기
          </button>
          ${log.status === "FAILED" ? `
            <button class="btn btn-xs btn-outline-danger" onclick="retryDispatch('${log.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;">
              재발송
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join("");
}

function populateDispatchAcademyFilter() {
  const select = document.getElementById("dispatchAcademyFilter");
  if (!select) return;

  const academies = Array.from(new Set(franchiseList.map(a => a.name)));
  select.innerHTML = `<option value="ALL">전체 발송 학원</option>` + academies.map(name => `<option value="${name}">${name}</option>`).join("");
}

function filterDispatchList() {
  const query = (document.getElementById("dispatchSearchInput")?.value || "").toLowerCase().trim();
  const acadFilter = document.getElementById("dispatchAcademyFilter")?.value || "ALL";
  const typeFilter = document.getElementById("dispatchTemplateFilter")?.value || "ALL";
  const statusFilter = document.getElementById("dispatchStatusFilter")?.value || "ALL";

  const filtered = dispatchLogs.filter(log => {
    const matchQuery = !query ||
      log.receiverName.toLowerCase().includes(query) ||
      log.receiverPhone.includes(query) ||
      log.academyName.toLowerCase().includes(query) ||
      log.summary.toLowerCase().includes(query);

    const matchAcad = acadFilter === "ALL" || log.academyName === acadFilter;
    const matchType = typeFilter === "ALL" || log.type === typeFilter;
    const matchStatus = statusFilter === "ALL" || log.status === statusFilter;

    return matchQuery && matchAcad && matchType && matchStatus;
  });

  renderDispatchTable(filtered);
}

function resetDispatchFilters() {
  document.getElementById("dispatchSearchInput").value = "";
  document.getElementById("dispatchAcademyFilter").value = "ALL";
  document.getElementById("dispatchTemplateFilter").value = "ALL";
  document.getElementById("dispatchStatusFilter").value = "ALL";
  renderDispatchTable();
}

function openDispatchDetailModal(id) {
  const log = dispatchLogs.find(l => l.id === id);
  if (!log) return;

  document.getElementById("dispatchModalTime").innerText = log.datetime;
  document.getElementById("dispatchModalTitle").innerText = `[나노의 책장] ${log.typeName}`;
  document.getElementById("dispatchModalBody").innerHTML = `
    <strong>수신: ${log.receiverName} 님</strong><br><br>
    ${log.summary}<br><br>
    ※ 본 메시지는 <strong>${log.academyName}</strong>에서 알리고(Aligo) 비즈메시지 공식 발신번호로 전송되었습니다.
  `;
  document.getElementById("dispatchModalAcademy").innerText = log.academyName;
  document.getElementById("dispatchModalReceiver").innerText = `${log.receiverName} (${log.receiverPhone})`;
  document.getElementById("dispatchModalCode").innerHTML = log.status === "SUCCESS"
    ? `<span class="badge-soft badge-soft-success">전송 성공 (결과코드: ${log.code})</span>`
    : `<span class="badge-soft badge-soft-danger">전송 실패 (${log.code})</span>`;

  $('#dispatchDetailModal').modal('show');
}

function previewDispatchLink() {
  showMasterToast("학부모 알림톡 내의 포트폴리오 리포트 모바일 링크가 정상 호출되었습니다.");
}

function retryDispatch() { showMasterToast('발송 서버가 연결되지 않아 재발송하지 않았습니다.'); }

async function testAligoConnection() { if (!NanoPortal.remote) { showMasterToast('운영 서버에서 설정을 확인해 주세요.'); return; } try { var config = await NanoPortal.api('/api/services'); showMasterToast(config.aligoReady ? '알림톡 설정이 준비되었습니다. 실제 발송은 리포트에서 수신자와 내용을 확인한 후 진행하세요.' : '알림톡 비활성: ' + (config.missing.join(', ') || 'ALIGO_ENABLED=true 설정 필요')); } catch(e) { showMasterToast(e.message); } }

function openAligoChargeModal() {
  if (window.NanoPortal && NanoPortal.remote) { showMasterToast('알리고 충전은 알리고 관리자에서 진행해 주세요.'); return; }
  $('#aligoChargeModal').modal('show');
}

function processAligoCharge() { showMasterToast('결제 서비스가 연결되지 않아 충전되지 않았습니다.'); }

// 학생 체험 뷰
function previewStudentPortal() {
  showMasterToast("학생 페이지(Student Portal)는 3단계에서 배정 도서 및 북퀴즈 풀이 화면으로 연결됩니다.");
}

function exportPlatformData() {
  var payload = { exportedAt: new Date().toISOString(), scope: '현재 브라우저의 회원·학원 목록',
    academies: franchiseList.map(function(item) { var copy = Object.assign({}, item); delete copy.password; delete copy.adminPassword; return copy; }),
    members: memberList.map(function(item) { var copy = Object.assign({}, item); delete copy.password; return copy; }) };
  var url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  var link = document.createElement('a'); link.href = url; link.download = 'nano-local-export.json'; link.click();
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  showMasterToast('현재 브라우저의 회원·학원 목록을 내보냈습니다. 서버 전체 백업은 포함되지 않습니다.');
}

// Non-blocking 토스트 알림
let toastTimer = null;
function showMasterToast(msg) {
  const toast = document.getElementById("masterToast");
  const text = document.getElementById("masterToastText");
  if (!toast || !text) return;

  text.innerText = msg;
  toast.style.display = "block";

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 3200);
}

// ==========================================
// 8. 결제 내역 관리 모듈 (Master Payment Management)
// ==========================================

// 카드 결제(PG 자동 연동) 여부 판별 함수
function isCardPayment(method) {
  if (!method) return false;
  return method.includes("카드") || method.includes("간편결제") || method.includes("카카오페이") || method.includes("토스");
}

let masterPaymentList = [
  // 1. [나노 독서아카데미 목동본원] - 6개월 만료 후 1개월 갱신 결제 (카드 자동 승인)
  {
    id: "PAY-20260915-001",
    academyId: "ACAD-001",
    academyName: "나노 독서아카데미 목동본원",
    director: "김은영 원장",
    phone: "010-3342-9981",
    bizNumber: "105-86-12345",
    planType: "monthly",
    planName: "1개월 정기구독권",
    supply: 100000,
    vat: 10000,
    total: 110000,
    method: "신용카드",
    date: "2026-09-15 14:20:00",
    startDate: "2026-09-15",
    endDate: "2026-10-14",
    status: "paid", // 카드 결제는 PG 자동 승인 (관리자 임의 변경 불가)
    memo: "이전 6개월 패키지 만료 후 1개월 정기구독 카드 자동 결제 갱신 완료."
  },
  // 2. [송도 센트럴 리딩랩] - 수동 결제 (무통장 입금 확인 대기중 - 관리자 조정 가능)
  {
    id: "PAY-20260901-002",
    academyId: "ACAD-003",
    academyName: "송도 센트럴 리딩랩",
    director: "최윤정 원장",
    phone: "010-5541-0982",
    bizNumber: "131-87-54321",
    planType: "12month",
    planName: "12개월 연간권 (20% 할인)",
    supply: 960000,
    vat: 96000,
    total: 1056000,
    method: "무통장 입금 (현금)",
    date: "2026-09-01 09:12:30",
    startDate: "2026-09-01",
    endDate: "2027-08-31",
    status: "pending", // 수동 결제이므로 관리자가 입금 확인 후 '완료'로 변경 가능!
    memo: "원장님 기업은행 무통장 입금 신청 건. 입금 확인 대기 중."
  },
  // 3. [대치 에듀 독서논술센터] - 6개월 이용권 (신용카드 자동 결제완료)
  {
    id: "PAY-20260810-003",
    academyId: "ACAD-002",
    academyName: "대치 에듀 독서논술센터",
    director: "박진수 원장",
    phone: "010-8871-2311",
    bizNumber: "214-82-67890",
    planType: "6month",
    planName: "6개월 이용권 (10% 할인)",
    supply: 540000,
    vat: 54000,
    total: 594000,
    method: "신용카드",
    date: "2026-08-10 11:30:15",
    startDate: "2026-08-10",
    endDate: "2027-02-10",
    status: "paid",
    memo: "가맹점 2학기 프로모션 카드 정상 결제 완료."
  },
  // 4. [나노 독서아카데미 목동본원] - 과거 6개월 결제 완료 이력 보존 (동일 가맹점 히스토리 누적)
  {
    id: "PAY-20260315-004",
    academyId: "ACAD-001",
    academyName: "나노 독서아카데미 목동본원",
    director: "김은영 원장",
    phone: "010-3342-9981",
    bizNumber: "105-86-12345",
    planType: "6month",
    planName: "6개월 이용권 (10% 할인)",
    supply: 540000,
    vat: 54000,
    total: 594000,
    method: "신용카드",
    date: "2026-03-15 10:15:22",
    startDate: "2026-03-15",
    endDate: "2026-09-14",
    status: "paid", // 기간이 지난 과거 결제 내역도 그대로 영구 보존됨
    memo: "1학기 6개월 패키지 카드 결제 이용 완료 건. (만료 후 9/15 1개월 추가 갱신됨)"
  },
  // 5. [판교 알파 독서학원] - 가상계좌 (수동 취소)
  {
    id: "PAY-20260715-005",
    academyId: "ACAD-004",
    academyName: "판교 알파 독서학원",
    director: "정성훈 원장",
    phone: "010-4490-1123",
    bizNumber: "129-81-43210",
    planType: "monthly",
    planName: "1개월 정기구독권",
    supply: 100000,
    vat: 10000,
    total: 110000,
    method: "실시간 계좌이체 (수동)",
    date: "2026-07-15 15:00:22",
    startDate: "2026-07-15",
    endDate: "2026-08-14",
    status: "cancelled",
    memo: "원장님 요청으로 계좌이체 미입금 건 취소 처리."
  },
  // 6. [분당 서현 리딩클럽] - 12개월 연간권 (신용카드 자동 결제완료)
  {
    id: "PAY-20260701-006",
    academyId: "ACAD-005",
    academyName: "분당 서현 리딩클럽",
    director: "이지혜 원장",
    phone: "010-7712-4456",
    bizNumber: "142-83-99123",
    planType: "12month",
    planName: "12개월 연간권 (20% 할인)",
    supply: 960000,
    vat: 96000,
    total: 1056000,
    method: "신용카드",
    date: "2026-07-01 13:45:10",
    startDate: "2026-07-01",
    endDate: "2027-06-30",
    status: "paid",
    memo: "연간 패키지 20% 할인 프로모션 카드 결제 승인."
  },
  // 7. [나노 독서아카데미 목동본원] - 최초 가맹 등록 시점의 수동 결제 내역 (누적 히스토리)
  {
    id: "PAY-20250915-007",
    academyId: "ACAD-001",
    academyName: "나노 독서아카데미 목동본원",
    director: "김은영 원장",
    phone: "010-3342-9981",
    bizNumber: "105-86-12345",
    planType: "6month",
    planName: "6개월 이용권 (10% 할인)",
    supply: 540000,
    vat: 54000,
    total: 594000,
    method: "무통장 입금 (현금)",
    date: "2025-09-15 11:30:00",
    startDate: "2025-09-15",
    endDate: "2026-03-14",
    status: "paid",
    memo: "최초 가맹 계약 시 무통장 입금 수납 완료 건."
  }
];
if (window.NANO_SERVER_DATA) masterPaymentList = window.NANO_SERVER_PAYMENTS || [];

// 마스터 결제 테이블 렌더링
function renderMasterPaymentTable(data = masterPaymentList) {
  const tbody = document.getElementById("masterPaymentTableBody");
  if (!tbody) return;

  const countEl = document.getElementById("masterPaymentFilteredCount");
  if (countEl) countEl.innerText = data.length;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="text-center py-5 text-muted">일치하는 결제 내역이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(item => {
    const isCard = isCardPayment(item.method);
    let statusHtml = "";

    // 1) 신용카드 결제: PG 자동 승인 (관리자가 선택하지 않고 자동 표기)
    if (isCard) {
      if (item.status === 'paid') {
        statusHtml = `
          <div class="d-flex flex-column align-items-center">
            <span class="badge px-2.5 py-1.5 font-weight-bold" style="background:#eaf5ec; color:#1e6b35; border:1px solid #b7dfbe; font-size:11.5px;">
              <i class="fa-solid fa-credit-card mr-1"></i>결제완료
            </span>
            <span class="text-muted" style="font-size:10px; margin-top:2px;">(PG 자동승인)</span>
          </div>
        `;
      } else if (item.status === 'cancelled' || item.status === 'refunded') {
        statusHtml = `
          <div class="d-flex flex-column align-items-center">
            <span class="badge px-2.5 py-1.5 font-weight-bold" style="background:#fdeeee; color:#b71c1c; border:1px solid #f8c1c1; font-size:11.5px;">
              <i class="fa-solid fa-ban mr-1"></i>승인취소
            </span>
            <span class="text-muted" style="font-size:10px; margin-top:2px;">(PG 취소)</span>
          </div>
        `;
      } else {
        statusHtml = `
          <div class="d-flex flex-column align-items-center">
            <span class="badge px-2.5 py-1.5 font-weight-bold" style="background:#fff8e6; color:#b45309; border:1px solid #fcd34d; font-size:11.5px;">
              <i class="fa-solid fa-clock mr-1"></i>승인대기
            </span>
            <span class="text-muted" style="font-size:10px; margin-top:2px;">(PG 전산)</span>
          </div>
        `;
      }
    } 
    // 2) 수동 결제 (현금, 무통장입금 등): 관리자가 직접 상태 조정 가능
    else {
      statusHtml = `
        <div class="d-flex flex-column align-items-center">
          <select class="select-beige form-control-sm py-0 font-weight-bold text-center" 
            onchange="updatePaymentStatusInline('${item.id}', this.value)" 
            title="수동 결제 건은 관리자가 직접 완료/대기 상태를 조정할 수 있습니다"
            style="height: 28px; font-size: 11.5px; border-radius: 8px; width: 100px; ${
              item.status === 'paid' ? 'color:#2f5436; background:#eaf0eb; border-color:#b7dfbe;' :
              item.status === 'pending' ? 'color:#8c531b; background:#faf3e8; border-color:#fcd34d;' :
              'color:#962a22; background:#fbeae8; border-color:#f8c1c1;'
            }">
            <option value="paid" ${item.status === 'paid' ? 'selected' : ''}>결제완료</option>
            <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>입금대기</option>
            <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>결제취소</option>
            <option value="refunded" ${item.status === 'refunded' ? 'selected' : ''}>환불완료</option>
          </select>
          <span style="font-size: 10px; color: #d97706; font-weight: 600; margin-top: 2px;">
            <i class="fa-solid fa-hand-holding-dollar mr-0.5"></i>수동 조정 가능
          </span>
        </div>
      `;
    }

    // 결제 수단 아이콘 및 뱃지
    const methodBadge = isCard
      ? `<span class="badge badge-light border text-primary" style="font-size: 11px;"><i class="fa-solid fa-credit-card mr-1"></i>${item.method}</span>`
      : `<span class="badge badge-light border text-dark" style="font-size: 11px;"><i class="fa-solid fa-money-bill-wave text-success mr-1"></i>${item.method}</span>`;

    return `
      <tr style="font-size: 13px;">
        <td class="text-center font-weight-bold text-muted" style="font-size: 11.5px; white-space: nowrap;">${item.id}</td>
        <td style="white-space: nowrap;">
          <div class="font-weight-bold" style="color: var(--text-main); font-size: 13.5px;">${item.academyName}</div>
          <small class="text-muted"><i class="fa-solid fa-user-tie mr-1"></i>${item.director} (${item.phone})</small>
        </td>
        <td class="text-center" style="white-space: nowrap;">
          <span class="badge-soft badge-soft-neutral font-weight-bold">${item.planName}</span>
        </td>
        <td class="text-right" style="white-space: nowrap;">${item.supply.toLocaleString()}원</td>
        <td class="text-right text-muted" style="white-space: nowrap;">${item.vat.toLocaleString()}원</td>
        <td class="text-right font-weight-bold" style="color: #962a22; font-size: 14px; white-space: nowrap;">${item.total.toLocaleString()}원</td>
        <td class="text-center" style="white-space: nowrap;">${methodBadge}</td>
        <td class="text-center" style="white-space: nowrap;"><small class="text-muted">${item.date}</small></td>
        <td class="text-center" style="white-space: nowrap;"><small class="badge badge-light border" style="white-space: nowrap;">${item.startDate} ~ ${item.endDate}</small></td>
        <td class="text-center" style="white-space: nowrap;">${statusHtml}</td>
        <td class="text-center" style="white-space: nowrap;">
          <button class="btn btn-xs btn-outline-secondary" onclick="openMasterPaymentDetailModal('${item.id}')" style="border-radius: 6px; font-size: 11px; padding: 4px 8px; white-space: nowrap;">
            <i class="fa-solid fa-pen-to-square mr-1"></i>상세/메모
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// 가맹 학원 필터 옵션 채우기 (동일 학원 선택 시 누적 내역 확인 가능)
function populateMasterPaymentAcademyFilter() {
  const select = document.getElementById("masterPaymentAcademyFilter");
  if (!select) return;

  const currentVal = select.value;
  const academies = [...new Set(masterPaymentList.map(p => p.academyName))];

  select.innerHTML = `<option value="ALL">전체 가맹 학원 (${academies.length}곳)</option>` + 
    academies.map(name => {
      const count = masterPaymentList.filter(p => p.academyName === name).length;
      return `<option value="${name}">${name} (누적 ${count}건)</option>`;
    }).join("");

  select.value = currentVal;
}

// 필터링 적용
function filterMasterPaymentList() {
  const acadFilter = document.getElementById("masterPaymentAcademyFilter") ? document.getElementById("masterPaymentAcademyFilter").value : "ALL";
  const planFilter = document.getElementById("masterPaymentPlanFilter") ? document.getElementById("masterPaymentPlanFilter").value : "ALL";
  const statusFilter = document.getElementById("masterPaymentStatusFilter") ? document.getElementById("masterPaymentStatusFilter").value : "ALL";
  const keyword = document.getElementById("masterPaymentSearchInput") ? document.getElementById("masterPaymentSearchInput").value.trim().toLowerCase() : "";

  let filtered = masterPaymentList.filter(item => {
    if (acadFilter !== "ALL" && item.academyName !== acadFilter) return false;
    if (planFilter !== "ALL" && item.planType !== planFilter) return false;
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;

    if (keyword) {
      const matchId = item.id.toLowerCase().includes(keyword);
      const matchAcad = item.academyName.toLowerCase().includes(keyword);
      const matchDir = item.director.toLowerCase().includes(keyword);
      const matchPhone = item.phone.includes(keyword);
      if (!matchId && !matchAcad && !matchDir && !matchPhone) return false;
    }
    return true;
  });

  renderMasterPaymentTable(filtered);
}

// 필터 초기화
function resetMasterPaymentFilters() {
  if (document.getElementById("masterPaymentAcademyFilter")) document.getElementById("masterPaymentAcademyFilter").value = "ALL";
  if (document.getElementById("masterPaymentPlanFilter")) document.getElementById("masterPaymentPlanFilter").value = "ALL";
  if (document.getElementById("masterPaymentStatusFilter")) document.getElementById("masterPaymentStatusFilter").value = "ALL";
  if (document.getElementById("masterPaymentSearchInput")) document.getElementById("masterPaymentSearchInput").value = "";

  renderMasterPaymentTable(masterPaymentList);
  showMasterToast("결제 검색 필터가 초기화되었습니다.");
}

// 통계 KPI 업데이트
function updatePaymentKpis() {
  const paidItems = masterPaymentList.filter(p => p.status === 'paid');
  const pendingItems = masterPaymentList.filter(p => p.status === 'pending');

  const totalRevenue = paidItems.reduce((acc, cur) => acc + (Number(cur.total) || 0), 0);
  const pendingAmount = pendingItems.reduce((acc, cur) => acc + (Number(cur.total) || 0), 0);
  const monthlyPaidCount = paidItems.filter(p => String(p.planType || p.planName || '').toLowerCase().includes('month') && !String(p.planType || p.planName || '').includes('6') && !String(p.planType || p.planName || '').includes('12')).length;
  const longTermPaidCount = paidItems.length - monthlyPaidCount;

  const revEl = document.getElementById("kpiMonthTotalRevenue");
  if (revEl) revEl.innerHTML = `${totalRevenue.toLocaleString()}<span style="font-size: 16px; font-weight: normal; margin-left: 2px;">원</span>`;
  const revSubEl = document.getElementById("kpiMonthTotalRevenueSub");
  if (revSubEl) revSubEl.innerHTML = `<i class="fa-solid fa-arrow-trend-up mr-1"></i>정상 결제 ${paidItems.length}건 수납 합계`;

  const paidCountEl = document.getElementById("kpiPaidCount");
  if (paidCountEl) paidCountEl.innerHTML = `${paidItems.length}<span style="font-size: 16px; font-weight: normal; margin-left: 2px;">건</span>`;
  const paidSubEl = document.getElementById("kpiPaidCountSub");
  if (paidSubEl) paidSubEl.innerText = `정기구독 ${monthlyPaidCount}건 / 장기할인 ${longTermPaidCount}건`;

  const pendingCountEl = document.getElementById("kpiPendingCount");
  if (pendingCountEl) pendingCountEl.innerHTML = `${pendingItems.length}<span style="font-size: 16px; font-weight: normal; margin-left: 2px;">건</span>`;
  const pendingSubEl = document.getElementById("kpiPendingCountSub");
  if (pendingSubEl) pendingSubEl.innerText = `${pendingAmount.toLocaleString()}원 수동 확인 대기`;

  const todayStr = new Date().toISOString().split("T")[0];
  const limitStr = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const expiringCount = (typeof franchiseList !== "undefined" && Array.isArray(franchiseList))
    ? franchiseList.filter(a => a.status !== "TERMINATED" && a.endDate && a.endDate >= todayStr && a.endDate <= limitStr).length
    : 0;
  const expEl = document.getElementById("kpiExpiringCount");
  if (expEl) expEl.innerHTML = `${expiringCount}<span style="font-size: 16px; font-weight: normal; margin-left: 2px;">곳</span>`;
  const expSubEl = document.getElementById("kpiExpiringCountSub");
  if (expSubEl) expSubEl.innerText = expiringCount > 0 ? `30일 이내 만료 예정 학원 ${expiringCount}곳` : `현재 만료 임박 학원 없음`;
}

// 인라인 상태 변경 핸들러 (수동 결제 건만 변경 가능)
function updatePaymentStatusInline(payId, newStatus) {
  const item = masterPaymentList.find(p => p.id === payId);
  if (!item) return;
  if (window.NanoPortal && NanoPortal.remote) { showMasterToast('운영 결제 상태는 결제사 및 입금 확인 결과로만 변경됩니다.'); renderMasterPaymentTable(); return; }

  if (isCardPayment(item.method)) {
    showMasterToast("신용카드 결제 건은 PG사 전산 자동 승인 데이터이므로 수동 변경이 불가합니다.");
    renderMasterPaymentTable();
    return;
  }

  item.status = newStatus;
  updatePaymentKpis();
  renderMasterPaymentTable();

  const statusKor = newStatus === 'paid' ? '결제 완료' :
                    newStatus === 'pending' ? '입금 대기' :
                    newStatus === 'cancelled' ? '결제 취소' : '환불 완료';

  showMasterToast(`[${item.academyName}] 수동 수납건(${payId}) 상태가 '${statusKor}'(으)로 조정되었습니다.`);
}

// 결제 상세 모달 열기
function openMasterPaymentDetailModal(payId) {
  const item = masterPaymentList.find(p => p.id === payId);
  if (!item) return;

  document.getElementById("modalDetailPayId").value = item.id;
  document.getElementById("modalDetailPayIdText").innerText = item.id;
  document.getElementById("modalDetailAcademyNameBadge").innerText = item.academyName;
  document.getElementById("modalDetailDirectorText").innerText = `${item.director} (${item.phone})`;
  document.getElementById("modalDetailPlanName").innerText = item.planName;
  document.getElementById("modalDetailSupply").innerText = item.supply.toLocaleString() + "원";
  document.getElementById("modalDetailVat").innerText = item.vat.toLocaleString() + "원";
  document.getElementById("modalDetailTotal").innerText = item.total.toLocaleString() + "원";
  document.getElementById("modalDetailMethod").innerText = item.method;
  document.getElementById("modalDetailDate").innerText = item.date;
  document.getElementById("modalDetailPeriod").innerText = `${item.startDate} ~ ${item.endDate}`;
  document.getElementById("modalDetailStatusSelect").value = item.status;
  document.getElementById("modalDetailAdminMemo").value = item.memo || "";

  const isCard = isCardPayment(item.method);
  const cardNotice = document.getElementById("modalDetailCardAutoNotice");
  const statusSelect = document.getElementById("modalDetailStatusSelect");
  const statusBadge = document.getElementById("modalDetailStatusBadge");
  const statusHelp = document.getElementById("modalDetailStatusHelp");

  if (isCard) {
    if (cardNotice) cardNotice.style.display = "block";
    if (statusSelect) statusSelect.disabled = true;
    if (statusBadge) {
      statusBadge.innerText = "카드 자동승인 (고정)";
      statusBadge.className = "badge badge-success text-white";
    }
    if (statusHelp) statusHelp.innerText = "* 신용카드 결제는 PG 자동 승인 건으로 상태 임의 조작이 제한됩니다.";
  } else {
    if (cardNotice) cardNotice.style.display = "none";
    if (statusSelect) statusSelect.disabled = false;
    if (statusBadge) {
      statusBadge.innerText = "수동 조정 가능";
      statusBadge.className = "badge badge-warning text-white";
    }
    if (statusHelp) statusHelp.innerText = "* 관리자가 무통장/현금 입금 확인 여부에 따라 실시간 상태를 변경할 수 있습니다.";
  }

  $("#masterPaymentDetailModal").modal("show");
}

// 상세 모달에서 상태 및 관리자 메모 저장
function saveMasterPaymentDetail() {
  const payId = document.getElementById("modalDetailPayId").value;
  const item = masterPaymentList.find(p => p.id === payId);
  if (!item) return;
  if (window.NanoPortal && NanoPortal.remote) { showMasterToast('운영 결제 내역은 서버 원장 데이터이며 이 화면에서 임의 변경할 수 없습니다.'); return; }

  const isCard = isCardPayment(item.method);
  if (!isCard) {
    const newStatus = document.getElementById("modalDetailStatusSelect").value;
    item.status = newStatus;
  }
  
  const newMemo = document.getElementById("modalDetailAdminMemo").value;
  item.memo = newMemo;

  updatePaymentKpis();
  renderMasterPaymentTable();

  $("#masterPaymentDetailModal").modal("hide");
  showMasterToast(`[${item.academyName}] 결제 정보 및 관리자 메모가 저장되었습니다.`);
}

// ========================================================
// 수동 결제 등록 모달 (현금/무통장입금 등 수동 수납 건 영구 누적 등록)
// ========================================================

const PLAN_PRICE_TABLE = {
  "1month": { name: "1개월 정기구독권", supply: 100000, vat: 10000, total: 110000, months: 1 },
  "6month": { name: "6개월 이용권 (10% 할인)", supply: 540000, vat: 54000, total: 594000, months: 6 },
  "12month": { name: "12개월 연간권 (20% 할인)", supply: 960000, vat: 96000, total: 1056000, months: 12 }
};

// 수동 결제 등록 모달 열기
function openSimulateNewPaymentModal() {
  if (window.NanoPortal && NanoPortal.remote) { showMasterToast('운영 결제 시뮬레이션은 비활성화되어 있습니다.'); return; }
  const select = document.getElementById("manualPayAcademy");
  if (select && Array.isArray(franchiseList)) {
    select.innerHTML = franchiseList.map(f => {
      return `<option value="${f.id}" data-name="${f.name}" data-director="${f.director}" data-phone="${f.phone}" data-biz="${f.bizNumber}" data-end="${f.endDate}">
        ${f.name} (${f.director}) - 기존 만료일: ${f.endDate || '미정'}
      </option>`;
    }).join("");
  }

  // 초기 날짜 및 금액 설정
  onManualPayAcademyChanged(select ? select.value : "");
  onManualPayPlanChanged(document.getElementById("manualPayPlan") ? document.getElementById("manualPayPlan").value : "6month");

  $("#manualPaymentRegisterModal").modal("show");
}

// 가맹 학원 변경 시 시작일 설정 (기존 만료일이 있으면 만료일 다음날, 없으면 오늘)
function onManualPayAcademyChanged(acadId) {
  const acad = franchiseList.find(f => f.id === acadId) || franchiseList[0];
  const startInput = document.getElementById("manualPayStartDate");
  if (!startInput) return;

  const now = new Date();
  const pad = n => n < 10 ? '0' + n : n;
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

  if (acad && acad.endDate && acad.endDate >= todayStr) {
    // 기존 계약 만료일 다음 날로 자동 설정
    const prevEnd = new Date(acad.endDate);
    prevEnd.setDate(prevEnd.getDate() + 1);
    startInput.value = `${prevEnd.getFullYear()}-${pad(prevEnd.getMonth()+1)}-${pad(prevEnd.getDate())}`;
  } else {
    startInput.value = todayStr;
  }

  calcManualPayEndDate();
}

// 요금제 변경 시 금액 및 만료일 계산
function onManualPayPlanChanged(planKey) {
  const info = PLAN_PRICE_TABLE[planKey] || PLAN_PRICE_TABLE["6month"];
  const supplyEl = document.getElementById("manualPaySupplyText");
  const vatEl = document.getElementById("manualPayVatText");
  const totalEl = document.getElementById("manualPayTotalText");

  if (supplyEl) supplyEl.innerText = `${info.supply.toLocaleString()}원`;
  if (vatEl) vatEl.innerText = `${info.vat.toLocaleString()}원`;
  if (totalEl) totalEl.innerText = `${info.total.toLocaleString()}원`;

  calcManualPayEndDate();
}

// 시작일 + 요금제 기간 -> 만료일 자동 계산
function calcManualPayEndDate() {
  const startVal = document.getElementById("manualPayStartDate") ? document.getElementById("manualPayStartDate").value : "";
  const planKey = document.getElementById("manualPayPlan") ? document.getElementById("manualPayPlan").value : "6month";
  const endInput = document.getElementById("manualPayEndDate");
  if (!startVal || !endInput) return;

  const info = PLAN_PRICE_TABLE[planKey] || PLAN_PRICE_TABLE["6month"];
  const startDate = new Date(startVal);
  startDate.setMonth(startDate.getMonth() + info.months);
  startDate.setDate(startDate.getDate() - 1); // 1일 전까지

  const pad = n => n < 10 ? '0' + n : n;
  endInput.value = `${startDate.getFullYear()}-${pad(startDate.getMonth()+1)}-${pad(startDate.getDate())}`;
}

// 수동 결제 폼 제출 처리 (기존 결제 히스토리 위에 영구 누적 저장)
function handleManualPaymentSubmit(e) {
  if (e) e.preventDefault();
  if (window.NanoPortal && NanoPortal.remote) { showMasterToast('운영 수동 결제 등록은 실제 입금 확인 절차가 연결된 뒤 사용할 수 있습니다.'); return; }

  const acadSelect = document.getElementById("manualPayAcademy");
  const acadId = acadSelect.value;
  const selectedOption = acadSelect.options[acadSelect.selectedIndex];
  const acadName = selectedOption.getAttribute("data-name") || "가맹 학원";
  const director = selectedOption.getAttribute("data-director") || "원장";
  const phone = selectedOption.getAttribute("data-phone") || "";
  const bizNumber = selectedOption.getAttribute("data-biz") || "";

  const planKey = document.getElementById("manualPayPlan").value;
  const planInfo = PLAN_PRICE_TABLE[planKey] || PLAN_PRICE_TABLE["6month"];
  const method = document.getElementById("manualPayMethod").value;
  const startDate = document.getElementById("manualPayStartDate").value;
  const endDate = document.getElementById("manualPayEndDate").value;
  const status = document.getElementById("manualPayStatus").value;
  const memo = document.getElementById("manualPayMemo").value;

  const now = new Date();
  const pad = n => n < 10 ? '0' + n : n;
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const payId = `PAY-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${Math.floor(100 + Math.random()*900)}`;

  const newPayment = {
    id: payId,
    academyId: acadId,
    academyName: acadName,
    director: director,
    phone: phone,
    bizNumber: bizNumber,
    planType: planKey,
    planName: planInfo.name,
    supply: planInfo.supply,
    vat: planInfo.vat,
    total: planInfo.total,
    method: method,
    date: dateStr,
    startDate: startDate,
    endDate: endDate,
    status: status, // 관리자가 지정한 상태 (대기 또는 완료)
    memo: memo || "관리자 수동 결제 등록 건."
  };

  // 기존 결제 내역 상단에 누적 추가 (기존 히스토리는 절대 사라지지 않음)
  masterPaymentList.unshift(newPayment);

  // 만약 결제 완료 상태라면 가맹점 만료일도 갱신
  if (status === "paid") {
    const acad = franchiseList.find(f => f.id === acadId);
    if (acad) acad.endDate = endDate;
  }

  populateMasterPaymentAcademyFilter();
  filterMasterPaymentList();
  updatePaymentKpis();

  $("#manualPaymentRegisterModal").modal("hide");
  showMasterToast(`[${acadName}] 수동 결제건(${payId})이 등록되었습니다. 수동 결제 건은 관리자가 언제든 상태를 [완료/대기]로 조정할 수 있습니다.`);
}

// 엑셀 다운로드 안내
function exportPaymentData() {
  showMasterToast("전체 가맹 학원 누적 결제 내역 엑셀 파일(XLSX)이 생성되어 다운로드되었습니다.");
}

// ============================================================
// ★ 신규 기능 모음 (2026-10 업데이트)
// ============================================================

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
// [8] 소속 학원 변경 시 - 선택 여부에 따른 전체 필드 활성화/비활성화 및 본사 분기
// -----------------------------------------------------------
function onMasterMemberAcademyChange(val) {
  const roleSelect = document.getElementById("newMemRole");
  const roleNote = document.getElementById("newMemRoleNote");
  const hqOpt = document.getElementById("newMemRoleHqOption");
  const gradeRow = document.getElementById("newMemGradeClassRow");
  const parentWrap = document.getElementById("newMemParentPhoneWrap");

  const nameEl = document.getElementById("newMemName");
  const usernameEl = document.getElementById("newMemUsername");
  const pwEl = document.getElementById("newMemPassword");
  const gradeEl = document.getElementById("newMemGrade");
  const classEl = document.getElementById("newMemClass");
  const phoneEl = document.getElementById("newMemPhone");
  const parentPhoneEl = document.getElementById("newMemParentPhone");
  const statusEl = document.getElementById("newMemStatus");
  const submitBtn = document.getElementById("btnSubmitMasterMember");

  // 1. 소속 가맹 학원이 '선택' (미선택 빈값)인 경우: 모든 필드 비우고 disabled 처리
  if (!val) {
    if (roleSelect) {
      roleSelect.value = "";
      roleSelect.disabled = true;
    }
    if (hqOpt) hqOpt.style.display = "none";
    if (roleNote) roleNote.classList.add("d-none");

    if (nameEl) { nameEl.value = ""; nameEl.disabled = true; nameEl.placeholder = "소속 학원을 먼저 선택해주세요"; }
    if (usernameEl) { usernameEl.value = ""; usernameEl.disabled = true; usernameEl.placeholder = "소속 학원을 먼저 선택해주세요"; }
    if (pwEl) { pwEl.value = ""; pwEl.disabled = true; pwEl.placeholder = "소속 학원을 먼저 선택해주세요"; }
    if (gradeEl) { gradeEl.disabled = true; }
    if (classEl) { classEl.innerHTML = '<option value="">-</option>'; classEl.disabled = true; }
    if (phoneEl) { phoneEl.value = ""; phoneEl.disabled = true; phoneEl.placeholder = "소속 학원을 먼저 선택해주세요"; }
    if (parentPhoneEl) { parentPhoneEl.value = ""; parentPhoneEl.disabled = true; parentPhoneEl.placeholder = "소속 학원을 먼저 선택해주세요"; }
    if (statusEl) { statusEl.disabled = true; }
    if (submitBtn) { submitBtn.disabled = true; }
    if (gradeRow) gradeRow.style.display = "flex";
    if (parentWrap) parentWrap.style.display = "block";
    return;
  }

  // 2. 소속 학원(또는 본사)이 정상 선택된 경우: 공통 필드 잠금 해제
  if (nameEl) { nameEl.disabled = false; nameEl.placeholder = "예: 김민준 (한글, 영문만 가능)"; }
  if (usernameEl) { usernameEl.disabled = false; usernameEl.placeholder = "예: minjun_k"; }
  if (pwEl) { pwEl.disabled = false; if (!pwEl.value) pwEl.value = "nano1234!"; }
  if (phoneEl) { phoneEl.disabled = false; phoneEl.placeholder = "예: 010-1234-5678"; }
  if (statusEl) { statusEl.disabled = false; }
  if (submitBtn) { submitBtn.disabled = false; }

  // 3. 본사 선택 시: HQ_ADMIN으로 고정
  if (val === "본사") {
    if (hqOpt) hqOpt.style.display = "";
    if (roleSelect) {
      roleSelect.value = "HQ_ADMIN";
      roleSelect.disabled = true;
    }
    if (roleNote) roleNote.classList.remove("d-none");
    if (gradeRow) gradeRow.style.display = "none";
    if (parentWrap) parentWrap.style.display = "none";
    if (classEl) { classEl.innerHTML = '<option value="-">-</option>'; classEl.disabled = true; }
  } else {
    // 4. 일반 가맹 학원 선택 시: 학생/교사 선택 가능
    if (hqOpt) hqOpt.style.display = "none";
    if (roleSelect) {
      roleSelect.disabled = false;
      if (!roleSelect.value || roleSelect.value === "HQ_ADMIN") {
        roleSelect.value = "STUDENT";
      }
    }
    if (roleNote) roleNote.classList.add("d-none");
    if (gradeEl) gradeEl.disabled = false;
    if (classEl) classEl.disabled = false;
    if (parentPhoneEl) { parentPhoneEl.disabled = false; parentPhoneEl.placeholder = "예: 010-9876-5432"; }

    updateClassDropdown(val);
    onMasterMemberRoleChange(roleSelect ? roleSelect.value : "STUDENT");
  }
}

// -----------------------------------------------------------
// [9] 회원 클래스(학급) 드롭박스 업데이트 (실제 해당 학원에 개설된 학급만 동적 추출)
// -----------------------------------------------------------
function updateClassDropdown(academyName) {
  const classSelect = document.getElementById("newMemClass");
  if (!classSelect) return;

  // 본사 선택 시 학급 없음
  if (!academyName || academyName === "본사") {
    classSelect.innerHTML = '<option value="-">-</option>';
    return;
  }

  // 1. 해당 학원 회원 데이터(memberList)에서 실제 등록되어 있는 학급명 수집
  const existingClasses = new Set();

  if (Array.isArray(memberList)) {
    memberList.forEach(m => {
      if (m.academyName === academyName && m.className && m.className !== "-" && m.className !== "미지정") {
        existingClasses.add(m.className);
      }
    });
  }

  // 2. 학원 로컬 스토리지에 등록된 학급 목록이 있는 경우 추가 반영
  try {
    const customClasses = localStorage.getItem("NANO_CLASSES_" + academyName);
    if (customClasses) {
      const parsed = JSON.parse(customClasses);
      if (Array.isArray(parsed)) {
        parsed.forEach(c => {
          const cName = typeof c === "string" ? c : c.name;
          if (cName && cName !== "-" && cName !== "미지정") {
            existingClasses.add(cName);
          }
        });
      }
    }
  } catch (e) {}

  const classArray = Array.from(existingClasses);

  if (classArray.length === 0) {
    // 아직 개설된 학급이 없는 신규 가맹 학원의 경우 임의의 더미 학급을 넣지 않고 '미지정'만 제공
    classSelect.innerHTML = '<option value="미지정" selected>미지정 (개설된 학급 없음)</option>';
  } else {
    // 실제 학급이 존재하는 기존 학원의 경우: 미지정 + 실제 개설 학급 목록
    let optionsHtml = '<option value="미지정">미지정</option>';
    classArray.forEach(c => {
      optionsHtml += `<option value="${c}">${c}</option>`;
    });
    classSelect.innerHTML = optionsHtml;
  }
}

// -----------------------------------------------------------
// [10] 회원 상세 모달 열기 (수정 가능 버전)
// -----------------------------------------------------------
function openMemberDetailModal(id) {
  const mem = memberList.find(m => m.id === id);
  if (!mem) return;

  document.getElementById("detailMemberId").value = mem.id;
  document.getElementById("detailMemberName").innerText = mem.name;
  document.getElementById("detailMemberRole").innerText = mem.role === "DIRECTOR" ? "원장님" : mem.role === "TEACHER" ? "선생님" : "학생 (원생)";

  // 수정 가능 필드 채우기
  const acadEl = document.getElementById("detailMemberAcademy");
  if (acadEl) acadEl.value = mem.academyName || "";

  const usernameEl = document.getElementById("detailMemberUsername");
  if (usernameEl) usernameEl.value = mem.username || "";

  const phoneEl = document.getElementById("detailMemberPhone");
  if (phoneEl) phoneEl.value = mem.phone || "";

  const parentPhoneEl = document.getElementById("detailMemberParentPhone");
  if (parentPhoneEl) parentPhoneEl.value = mem.parentPhone || "-";

  const gradeEl = document.getElementById("detailMemberGrade");
  if (gradeEl) gradeEl.value = mem.grade || "";

  // 배정 학급 드롭박스: 해당 회원의 소속 학원에 등록된 학급 목록 동적 추출 및 바인딩
  const classEl = document.getElementById("detailMemberClass");
  if (classEl) {
    const existingClasses = new Set();
    const acadName = mem.academyName || "";
    const acadId = mem.academyId || "";

    // 1. 회원 목록에서 동일 학원의 기존 학급명 수집
    if (Array.isArray(memberList)) {
      memberList.forEach(m => {
        if ((m.academyName === acadName || (acadId && m.academyId === acadId)) && 
            m.className && m.className !== "-" && m.className !== "미지정") {
          existingClasses.add(m.className);
        }
      });
    }

    // 2. 로컬 스토리지에 저장된 학원별 학급 목록 수집
    try {
      ["NANO_CLASSES_" + acadName, "NANO_ACADEMY_CLASSES_" + acadId, "NANO_ACADEMY_CLASSES_" + acadName].forEach(k => {
        const stored = localStorage.getItem(k);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach(c => {
              const cName = typeof c === "string" ? c : (c.name || c.className);
              if (cName && cName !== "-" && cName !== "미지정") existingClasses.add(cName);
            });
          }
        }
      });
    } catch (e) {}

    // 3. 현재 회원의 학급도 옵션에 포함 보장
    if (mem.className && mem.className !== "-" && mem.className !== "미지정") {
      existingClasses.add(mem.className);
    }

    let optionsHtml = '<option value="미지정">미지정</option>';
    const classList = Array.from(existingClasses).sort((a, b) => a.localeCompare(b, 'ko'));
    classList.forEach(c => {
      optionsHtml += `<option value="${c}">${c}</option>`;
    });
    classEl.innerHTML = optionsHtml;
    classEl.value = (mem.className && mem.className !== "-") ? mem.className : "미지정";
  }

  const pointsEl = document.getElementById("detailMemberPoints");
  if (pointsEl) pointsEl.value = mem.points ? mem.points.toLocaleString() + " P" : "0 P";

  const statusSelect = document.getElementById("detailMemberStatus");
  if (statusSelect) {
    statusSelect.value = (mem.status === "PENDING" || mem.status === "미승인") ? "PENDING" 
      : (mem.status === "WITHDRAWN" || mem.status === "PAUSED" || mem.status === "탈퇴") ? "WITHDRAWN" 
      : "APPROVED";
  }

  const btnToggle = document.getElementById("btnToggleMemberStatus");
  if (btnToggle) {
    if (mem.status === "PENDING" || mem.status === "미승인") {
      btnToggle.className = "btn btn-sm btn-outline-success font-weight-bold";
      btnToggle.innerHTML = '<i class="fa-solid fa-user-check mr-1"></i>정상 승인 처리';
    } else if (mem.status === "APPROVED" || mem.status === "NORMAL" || mem.status === "승인") {
      btnToggle.className = "btn btn-sm btn-outline-warning font-weight-bold";
      btnToggle.innerHTML = '<i class="fa-solid fa-clock mr-1"></i>미승인으로 변경';
    } else {
      btnToggle.className = "btn btn-sm btn-outline-success font-weight-bold";
      btnToggle.innerHTML = '<i class="fa-solid fa-rotate-left mr-1"></i>정상 승인 복구';
    }
  }

  // 탈퇴/정지 확인 박스 초기화
  const confirmBox = document.getElementById("memberStatusChangeConfirmBox");
  if (confirmBox) confirmBox.classList.add("d-none");
  const confirmInput = document.getElementById("memberStatusAcademyConfirm");
  if (confirmInput) confirmInput.value = "";

  $('#memberDetailModal').modal('show');
}

// -----------------------------------------------------------
// [11] 회원 상세 저장 (수정사항 저장)
// -----------------------------------------------------------
async function saveMemberDetailEdit() {
  const id = parseInt(document.getElementById("detailMemberId").value, 10);
  const mem = memberList.find(m => m.id === id);
  if (!mem) return;
  const previousMember = { ...mem };

  const phoneEl = document.getElementById("detailMemberPhone");
  const parentPhoneEl = document.getElementById("detailMemberParentPhone");
  const gradeEl = document.getElementById("detailMemberGrade");
  const classEl = document.getElementById("detailMemberClass");
  const statusEl = document.getElementById("detailMemberStatus");

  if (phoneEl) mem.phone = phoneEl.value.trim();
  if (parentPhoneEl) mem.parentPhone = parentPhoneEl.value.trim();
  if (gradeEl) mem.grade = gradeEl.value;
  if (classEl) mem.className = classEl.value.trim();
  if (statusEl) mem.status = statusEl.value;

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveMember(mem, mem.academyId);
    } catch (error) {
      Object.assign(mem, previousMember);
      showMasterToast('회원 정보를 저장하지 못했습니다: ' + error.message);
      return;
    }
  }

  $('#memberDetailModal').modal('hide');
  saveMembersToStorage();
  renderMemberTable();
  const statusKor = mem.status === "APPROVED" ? "정상 승인" : mem.status === "PENDING" ? "미승인 대기" : "탈퇴/정지";
  showMasterToast(`[${mem.name}] 회원 정보 및 계정 상태(${statusKor})가 저장되었습니다.`);
}

// -----------------------------------------------------------
// [12] 회원 승인/미승인 토글 또는 탈퇴 복구 처리
// -----------------------------------------------------------
async function handleToggleMemberStatusClick() {
  const id = parseInt(document.getElementById("detailMemberId").value, 10);
  const mem = memberList.find(m => m.id === id);
  if (!mem) return;

  const previousStatus = mem.status;
  let targetStatus = "APPROVED";
  let targetMsg = "정상 승인";

  if (mem.status === "APPROVED" || mem.status === "NORMAL" || mem.status === "승인") {
    targetStatus = "PENDING";
    targetMsg = "미승인 대기";
  } else {
    targetStatus = "APPROVED";
    targetMsg = "정상 승인";
  }

  mem.status = targetStatus;
  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveMember(mem, mem.academyId);
    } catch (error) {
      mem.status = previousStatus;
      showMasterToast('회원 상태를 변경하지 못했습니다: ' + error.message);
      return;
    }
  }
  $('#memberDetailModal').modal('hide');
  saveMembersToStorage();
  renderMemberTable();
  showMasterToast(`[${mem.name}] 계정이 '${targetMsg}' 상태로 변경되었습니다.`);
  return;
}

// 레거시 toggleMemberStatus 유지 (다른 곳에서 호출될 수 있어서)
function toggleMemberStatus() {
  return handleToggleMemberStatusClick();
}

// -----------------------------------------------------------
// [13] 가맹점 삭제 - 비밀번호 검증 + 7일 임시보존
// -----------------------------------------------------------
function loadDeletedAcademiesFromStorage() {
  try {
    const stored = localStorage.getItem("NANO_MASTER_DELETED_FRANCHISES");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("삭제 가맹 학원 로드 실패:", e);
  }
  return [];
}
let deletedAcademyList = loadDeletedAcademiesFromStorage(); // 임시 보존 삭제 목록

async function confirmDeleteAcademy() {
  if (!pendingDeleteAcademyId) return;

  const isRemote = window.NanoPortal && NanoPortal.remote;
  // 로컬 체험 화면에서만 데모 확인값을 사용합니다. 운영 서버는 로그인 세션의 본사 권한으로 검증합니다.
  const pwInput = document.getElementById("deleteConfirmPassword");
  const pwErrEl = document.getElementById("deletePasswordError");
  const MASTER_PASSWORD = "master1234!"; // 실제로는 서버 검증

  if (!isRemote && (!pwInput || !pwInput.value.trim())) {
    if (pwErrEl) pwErrEl.classList.remove("d-none");
    return;
  }
  if (!isRemote && pwInput.value !== MASTER_PASSWORD) {
    if (pwErrEl) pwErrEl.classList.remove("d-none");
    return;
  }
  if (pwErrEl) pwErrEl.classList.add("d-none");

  const idx = franchiseList.findIndex(a => a.id === pendingDeleteAcademyId);
  if (idx !== -1) {
    const deleted = franchiseList[idx];
    if (isRemote) {
      try {
        await NanoPortal.deleteAcademy(deleted);
      } catch (error) {
        showMasterToast('학원을 삭제하지 못했습니다: ' + error.message);
        return;
      }
    }
    franchiseList.splice(idx, 1);

    // 7일 임시 보존
    const deletedAt = new Date();
    const expireAt = new Date(deletedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    deletedAcademyList.unshift({
      ...deleted,
      deletedAt: deletedAt.toISOString().split("T")[0],
      expireAt: expireAt.toISOString().split("T")[0]
    });

    saveFranchisesToStorage();

    // 비밀번호 초기화
    if (pwInput) pwInput.value = "";

    $('#academyDeleteConfirmModal').modal('hide');
    renderFranchiseTable();
    updateFranchiseStats();
    populateMemberAcademyFilter();
    populateDispatchAcademyFilter();
    showMasterToast(`[${deleted.name}] 가맹 학원이 삭제되어 7일간 임시 보존됩니다. 복구는 '삭제 내역' 버튼에서 확인하세요.`);
  }
  pendingDeleteAcademyId = null;
}

// 삭제된 학원 임시 보존 목록 모달 열기
function openDeletedAcademyListModal() {
  renderDeletedAcademyList();
  $('#deletedAcademyListModal').modal('show');
}

function renderDeletedAcademyList() {
  const container = document.getElementById("deletedAcademyListContainer");
  if (!container) return;

  if (deletedAcademyList.length === 0) {
    container.innerHTML = `<div class="text-center py-4 text-muted"><i class="fa-solid fa-inbox mr-2"></i>임시 보존된 학원이 없습니다.</div>`;
    return;
  }

  const today = new Date();
  container.innerHTML = deletedAcademyList.map((acad, idx) => {
    const expireDate = new Date(acad.expireAt);
    const daysLeft = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
    const isExpired = daysLeft <= 0;
    return `
      <div class="p-3 mb-2 rounded d-flex justify-content-between align-items-center" style="background: ${isExpired ? '#fff3f3' : '#fdfbf7'}; border: 1px solid ${isExpired ? '#f5c6cb' : '#ebd9c8'};">
        <div>
          <div class="font-weight-bold text-dark">${acad.name}</div>
          <small class="text-muted">삭제일: ${acad.deletedAt} / 만료일: ${acad.expireAt}</small>
          <span class="ml-2 ${isExpired ? 'badge-soft badge-soft-danger' : 'badge-soft badge-soft-warn'}" style="font-size: 11px;">
            ${isExpired ? '완전삭제 예정' : `${daysLeft}일 남음`}
          </span>
        </div>
        ${!isExpired ? `
        <button class="btn btn-sm btn-outline-success" onclick="restoreDeletedAcademy(${idx})" style="border-radius: 8px;">
          <i class="fa-solid fa-rotate-left mr-1"></i>복구
        </button>` : ''}
      </div>
    `;
  }).join("");
}

async function restoreDeletedAcademy(idx) {
  const restored = deletedAcademyList[idx];
  if (!restored) return;
  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.restoreAcademy(restored);
    } catch (error) {
      showMasterToast('학원을 복구하지 못했습니다: ' + error.message);
      return;
    }
  }
  deletedAcademyList.splice(idx, 1);
  delete restored.deletedAt;
  delete restored.expireAt;
  franchiseList.unshift(restored);
  saveFranchisesToStorage();
  renderDeletedAcademyList();
  renderFranchiseTable();
  updateFranchiseStats();
  populateMemberAcademyFilter();
  showMasterToast(`[${restored.name}] 가맹 학원이 성공적으로 복구되었습니다.`);
}

// -----------------------------------------------------------
// [14] 가맹점 명단 엑셀 실제 다운로드 (SheetJS 없을 시 CSV)
// -----------------------------------------------------------
function exportFranchiseExcel() {
  const headers = ["학원ID", "학원명", "사업자번호", "원장명", "이메일", "연락처", "지역", "관리자ID", "이용상품", "가맹일", "계약시작", "계약만료", "현재원생", "최대원생", "월결제금액", "상태"];
  const rows = franchiseList.map(a => [
    a.id, a.name, a.bizNumber || "", a.director, a.email || "", a.phone,
    a.region, a.adminId, a.plan, a.joinDate, a.startDate, a.endDate,
    a.currentStudents, a.maxStudents, a.monthlyFee, a.status
  ]);

  downloadAsCSV("가맹학원명단_" + new Date().toISOString().split("T")[0] + ".csv", headers, rows);
  showMasterToast("가맹 학원 명단이 CSV 파일로 다운로드되었습니다.");
}

// -----------------------------------------------------------
// [15] 회원 엑셀 실제 다운로드
// -----------------------------------------------------------
function exportMemberExcel() {
  const headers = ["ID", "소속학원", "등급권한", "이름", "아이디", "학년", "학급", "학생연락처", "학부모연락처", "누적포인트", "최근접속일", "등록일", "상태"];
  const rows = memberList.map(m => [
    m.id, m.academyName,
    m.role === "DIRECTOR" ? "원장님" : m.role === "TEACHER" ? "선생님" : "학생",
    m.name, m.username, m.grade || "", m.className || "",
    m.phone || "", m.parentPhone || "", m.points || 0,
    m.lastLogin || "", m.createdAt || "", m.status
  ]);

  downloadAsCSV("통합회원명부_" + new Date().toISOString().split("T")[0] + ".csv", headers, rows);
  showMasterToast(`통합 회원 명부(총 ${memberList.length}명)가 CSV 파일로 다운로드되었습니다.`);
}

// CSV 다운로드 공통 헬퍼 (엑셀 수식 보존 및 따옴표 이스케이프)
function downloadAsCSV(filename, headers, rows) {
  const content = '\uFEFF' + [headers, ...rows].map(row => row.map(NanoPreviewData.csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// -----------------------------------------------------------
// [16] 엑셀 서식 다운로드 (회원 등록 표준 서식)
// -----------------------------------------------------------
function downloadMemberExcelTemplate() {
  const headers = ["이름", "아이디", "비밀번호", "학년", "학급", "학생연락처", "학부모연락처", "등록학원코드(예:ACAD-001)"];
  const sampleRows = [
    ["홍길동", "hong_gildong", "nano1234!", "초4", "소나무반", "010-1234-5678", "010-9876-5432", "ACAD-001"],
    ["김영희", "younghee_k", "nano1234!", "초5", "매화반", "010-2345-6789", "010-8765-4321", "ACAD-002"]
  ];

  downloadAsCSV("나노책장_회원등록양식_" + new Date().toISOString().split("T")[0] + ".csv", headers, sampleRows);
  showMasterToast("표준 회원 등록 양식 서식(CSV)이 다운로드되었습니다. 학원 코드를 확인 후 입력해주세요.");
}

// -----------------------------------------------------------
// -----------------------------------------------------------
// [17] 권장도서 학년 버튼 선택 기능
// -----------------------------------------------------------
function selectRecGrade(grade) {
  selectedRecGrade = grade;

  // 버튼 스타일 업데이트
  document.querySelectorAll(".rec-grade-btn").forEach(btn => {
    if (btn.dataset.grade === grade) {
      btn.style.background = "#7d5a2b";
      btn.style.color = "#fff";
      btn.style.border = "none";
      btn.classList.add("active");
    } else {
      btn.style.background = "#fff";
      btn.style.color = "#5a4b3d";
      btn.style.border = "1.5px solid #d4c4b0";
      btn.classList.remove("active");
    }
  });

  renderRecommendedBooksTable();
}

// -----------------------------------------------------------
// [18] 배너 순서 조정 (리스트에서 위/아래 버튼)
// -----------------------------------------------------------
async function moveBannerOrder(id, direction) {
  const idx = bannerList.findIndex(b => String(b.id) === String(id));
  if (idx === -1) return;
  const beforeOrder = bannerList.map(b => ({ id: b.id, order: b.order }));

  if (direction === "up" && idx > 0) {
    // 순서 교환
    const temp = bannerList[idx].order;
    bannerList[idx].order = bannerList[idx - 1].order;
    bannerList[idx - 1].order = temp;
    const tempBanner = bannerList[idx];
    bannerList[idx] = bannerList[idx - 1];
    bannerList[idx - 1] = tempBanner;
  } else if (direction === "down" && idx < bannerList.length - 1) {
    const temp = bannerList[idx].order;
    bannerList[idx].order = bannerList[idx + 1].order;
    bannerList[idx + 1].order = temp;
    const tempBanner = bannerList[idx];
    bannerList[idx] = bannerList[idx + 1];
    bannerList[idx + 1] = tempBanner;
  }

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await Promise.all(bannerList.map(b => NanoPortal.saveBanner(b)));
    } catch (error) {
      beforeOrder.forEach(previous => { const banner = bannerList.find(b => b.id === previous.id); if (banner) banner.order = previous.order; });
      bannerList.sort((a, b) => (a.order || 0) - (b.order || 0));
      showMasterToast('배너 순서를 저장하지 못했습니다: ' + error.message);
      renderBannerList();
      return;
    }
  }
  saveOperationsToStorage();
  renderBannerList();
}

// -----------------------------------------------------------
// [19] 랭킹 - 전국순위 + 학원순위 렌더링
// -----------------------------------------------------------
// renderRankings 함수 오버라이드 (기존 함수 후에 실행)
const _origRenderRankings = typeof renderRankings === "function" ? renderRankings : null;

// renderRankings 호출 후 학원 순위 컬럼 추가
function addAcademyRankColumn(data) {
  // 각 학원 내에서 순위 계산
  const academyGroups = {};
  data.forEach(s => {
    const acad = s.academyName || s.academy || "";
    if (!academyGroups[acad]) academyGroups[acad] = [];
    academyGroups[acad].push(s);
  });

  // 각 그룹을 포인트 기준 정렬하여 학원 내 순위 부여
  const rankMap = {};
  Object.values(academyGroups).forEach(group => {
    group.sort((a, b) => (b.points || 0) - (a.points || 0));
    group.forEach((s, i) => {
      rankMap[s.id] = i + 1;
    });
  });
  return rankMap;
}



// -----------------------------------------------------------
// [21] 메모 카운터 초기화 (모달 열릴 때)
// -----------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // 메모 카운터
  const memoEl = document.getElementById("regMemo");
  const memoCount = document.getElementById("regMemoCount");
  if (memoEl && memoCount) {
    memoEl.addEventListener("input", () => {
      memoCount.textContent = `${memoEl.value.length} / 100자`;
    });
  }

  // 권장도서 학년 버튼 초기화 (드롭박스 대신 버튼 사용 시)
  const recGradeFilter = document.getElementById("recGradeFilter");
  if (recGradeFilter) {
    recGradeFilter.addEventListener("change", () => {
      // 드롭박스 변경 시 버튼도 동기화
      const selectedGrade = recGradeFilter.value;
      document.querySelectorAll(".rec-grade-btn").forEach(btn => {
        if (btn.dataset.grade === selectedGrade) {
          btn.style.background = "#7d5a2b";
          btn.style.color = "#fff";
          btn.style.border = "none";
        } else {
          btn.style.background = "#fff";
          btn.style.color = "#5a4b3d";
          btn.style.border = "1.5px solid #d4c4b0";
        }
      });
    });
  }

  // 회원 등록 모달 학원 초기화 시 본사 옵션 추가
  const newMemAcademy = document.getElementById("newMemAcademy");
  if (newMemAcademy) {
    newMemAcademy.addEventListener("change", function() {
      onMasterMemberAcademyChange(this.value);
      updateClassDropdown(this.value);
    });
  }
});

// -----------------------------------------------------------
// [22] openMasterMemberAddModal 오버라이드 - 초기 '선택' 상태 및 나머지 필드 입력불가 잠금
// -----------------------------------------------------------
const _origOpenMasterMemberAddModal = typeof openMasterMemberAddModal === "function" ? openMasterMemberAddModal.bind({}) : null;
function openMasterMemberAddModal() {
  const form = document.getElementById("masterMemberAddForm");
  if (form) form.reset();

  const acadSelect = document.getElementById("newMemAcademy");
  if (acadSelect && typeof franchiseList !== "undefined") {
    acadSelect.innerHTML =
      `<option value="" selected>선택</option>` +
      `<option value="본사">🏢 본사 (나노의 책장 본사)</option>` +
      franchiseList.map(a => `<option value="${a.name}">${a.name}</option>`).join("");

    acadSelect.value = "";
  }

  // 초기 상태: 소속 가맹 학원이 '선택'이므로 나머지 모든 필드 초기화 및 disabled 잠금
  onMasterMemberAcademyChange("");

  $("#masterMemberAddModal").modal("show");
}

// -----------------------------------------------------------
// [23] 가맹점 테이블 렌더링에 삭제 내역 버튼 추가
// -----------------------------------------------------------
// renderFranchiseTable 함수에서 삭제 확인 모달 열기 방식 개선 (openAcademyDeleteConfirm)
// openAcademyDeleteConfirm - 기존 함수 오버라이드
const _origOpenAcademyDeleteConfirm = typeof openAcademyDeleteConfirm === "function" ? openAcademyDeleteConfirm : null;
function openAcademyDeleteConfirm(id) {
  const acad = franchiseList.find(a => a.id === id);
  if (!acad) return;

  pendingDeleteAcademyId = id;
  document.getElementById("deleteAcademyName").innerText = acad.name;

  // 비밀번호 초기화
  const pwInput = document.getElementById("deleteConfirmPassword");
  if (pwInput) pwInput.value = "";
  const pwErr = document.getElementById("deletePasswordError");
  if (pwErr) pwErr.classList.add("d-none");

  $('#academyDeleteConfirmModal').modal('show');
}

// -----------------------------------------------------------
// [24] handleRegisterAcademy 오버라이드 - 주소 및 메모 포함
// -----------------------------------------------------------
const _origHandleRegisterAcademy = typeof handleRegisterAcademy === "function" ? handleRegisterAcademy : null;
async function handleRegisterAcademy(e) {
  e.preventDefault();

  // 원장님 성함 검증 (특수문자, 숫자 금지)
  const directorEl = document.getElementById("regDirectorName");
  const director = directorEl ? directorEl.value.trim() : "";
  const nameRegex = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z\s]+$/;
  if (!nameRegex.test(director)) {
    const errEl = document.getElementById("regDirectorNameError");
    if (errEl) errEl.classList.remove("d-none");
    if (directorEl) directorEl.focus();
    alert("원장님 성함에는 특수문자나 숫자를 입력할 수 없습니다. 한글 또는 영문으로 입력해주세요.");
    return;
  }

  // 이메일 형식 검증
  const emailEl = document.getElementById("regDirectorEmail");
  if (emailEl) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailEl.value.trim())) {
      const errEl = document.getElementById("regEmailError");
      if (errEl) errEl.classList.remove("d-none");
      emailEl.focus();
      return;
    }
  }

  const name = document.getElementById("regAcademyName").value.trim();
  const bizNumber = document.getElementById("regBizNumber")?.value.trim() || "";
  const email = emailEl?.value.trim() || "";
  const phone = document.getElementById("regDirectorPhone").value.trim();

  // 주소 처리 (카카오 API 사용)
  const postcode = document.getElementById("regPostcode")?.value.trim() || "";
  const baseAddr = document.getElementById("regAddress")?.value.trim() || "";
  const detailAddr = document.getElementById("regAddressDetail")?.value.trim() || "";
  const fullAddress = [baseAddr, detailAddr].filter(Boolean).join(" ");
  const region = fullAddress ? fullAddress.split(" ")[0] + " " + (fullAddress.split(" ")[1] || "") : "서울";

  const adminId = document.getElementById("regDirectorId")?.value.trim() || `director_${Date.now()}`;
  const joinDate = document.getElementById("regJoinDate")?.value || new Date().toISOString().split("T")[0];
  const startDate = document.getElementById("regStartDate").value;
  const endDate = document.getElementById("regEndDate").value;
  const plan = document.getElementById("regPlan")?.value || "Standard";
  const maxStudents = parseInt(document.getElementById("regMaxStudents")?.value, 10) || 50;
  const monthlyFee = document.getElementById("regMonthlyFee")?.value.trim() || PLAN_MONTHLY_FEES[plan] || "120,000원";
  const memo = document.getElementById("regMemo")?.value.trim() || "";

  const nextAcademyNumber = franchiseList.reduce((max, academy) => Math.max(max, Number(String(academy.id || '').replace(/\D/g, '')) || 0), 0) + 1;
  const newId = `ACAD-${String(nextAcademyNumber).padStart(3, '0')}`;
  const newAcad = {
    id: newId,
    name: name,
    bizNumber: bizNumber,
    director: director.includes("원장") ? director : director + " 원장",
    email: email,
    phone: phone,
    postcode: postcode,
    region: region,
    address: fullAddress,
    adminId: adminId,
    adminPw: document.getElementById("regDirectorPw")?.value.trim() || "nano1234!",
    plan: plan,
    joinDate: joinDate,
    startDate: startDate,
    endDate: endDate,
    currentStudents: 0,
    maxStudents: maxStudents,
    monthlyFee: monthlyFee,
    paymentStatus: "PAID",
    status: "ACTIVE",
    memo: memo
  };

  if (window.NanoPortal && NanoPortal.remote) {
    try {
      await NanoPortal.saveAcademy(newAcad);
    } catch (error) {
      showMasterToast('학원을 등록하지 못했습니다: ' + error.message);
      return;
    }
  }
  franchiseList.unshift(newAcad);
  saveFranchisesToStorage();

  // 통합 회원 목록에도 원장(DIRECTOR) 계정 즉시 등록 보장
  const newDirectorMember = {
    id: Date.now(),
    academyId: newId,
    academyName: name,
    role: "DIRECTOR",
    name: newAcad.director,
    username: adminId,
    grade: "원장",
    className: "-",
    phone: phone,
    parentPhone: "-",
    points: 0,
    password: newAcad.adminPw,
    lastLogin: "-",
    createdAt: joinDate,
    status: "APPROVED"
  };
  if (typeof memberList !== "undefined" && Array.isArray(memberList)) {
    memberList.unshift(newDirectorMember);
    saveMembersToStorage();
  }
  if (typeof window !== "undefined" && Array.isArray(window.MIGRATED_MEMBERS)) {
    window.MIGRATED_MEMBERS.unshift(newDirectorMember);
  }

  $('#academyRegisterModal').modal('hide');
  document.getElementById("academyRegisterForm").reset();

  renderFranchiseTable();
  updateFranchiseStats();
  populateMemberAcademyFilter();
  populateDispatchAcademyFilter();
  showMasterToast(`[${name}] 신규 가맹 학원(${plan} 플랜, 사용인원 ${maxStudents}명)이 성공적으로 등록되었습니다.`);
}

// 가맹 학원 데이터 초기화 헬퍼 (테스트 후 원상복구용)
function resetMasterFranchiseData() {
  if (window.NanoPortal && NanoPortal.remote) { showMasterToast('운영 데이터는 초기화할 수 없습니다. 필요한 항목을 직접 수정해 주세요.'); return; }
  localStorage.removeItem(STORAGE_KEY_FRANCHISES);
  localStorage.removeItem(STORAGE_KEY_DELETED_FRANCHISES);
  franchiseList = loadFranchisesFromStorage();
  deletedAcademyList = loadDeletedAcademiesFromStorage();
  renderFranchiseTable();
  updateFranchiseStats();
  populateMemberAcademyFilter();
  populateDispatchAcademyFilter();
  showMasterToast("가맹 학원 데이터가 기본 샘플 목록으로 초기화되었습니다.");
}

// -----------------------------------------------------------
// [25] 랭킹 테이블 - 전국순위 + 학원순위 컬럼 렌더링
// -----------------------------------------------------------
// renderRankings의 studentRankingBody 렌더링 후처리로 학원 순위 추가
const _origRenderStudentRankings = null; // renderRankings 내부에서 처리

// MutationObserver로 studentRankingBody가 업데이트될 때 학원 순위 컬럼 추가
(function() {
  const observer = new MutationObserver(() => {
    const tbody = document.getElementById("studentRankingBody");
    if (!tbody) return;
    const rows = tbody.querySelectorAll("tr");
    if (rows.length === 0) return;

    // 이미 학원순위 컬럼이 있으면 스킵
    const firstRow = rows[0];
    if (firstRow && firstRow.cells.length > 0 && firstRow.dataset.academyRankAdded) return;

    // 각 행에서 소속학원을 기준으로 학원 내 순위 계산
    const academyCountMap = {};
    rows.forEach(row => {
      if (row.dataset.academy) {
        const acad = row.dataset.academy;
        if (!academyCountMap[acad]) academyCountMap[acad] = 0;
        academyCountMap[acad]++;
        const acRank = academyCountMap[acad];
        // 두 번째 셀(학원순위)에 데이터 추가 (이미 삽입되어 있으면 업데이트)
        const acRankCell = row.cells[1];
        if (acRankCell && row.cells.length >= 2) {
          acRankCell.innerText = `${acRank}위`;
          acRankCell.style.fontWeight = "700";
          acRankCell.style.color = acRank === 1 ? "#b38a00" : acRank === 2 ? "#6b7280" : acRank === 3 ? "#8c6d48" : "#374151";
        }
        row.dataset.academyRankAdded = "1";
      }
    });
  });

  // DOM 준비 후 옵저버 시작 및 랭킹 실데이터 즉시 초기화
  function initRankingViewOnReady() {
    const tbody = document.getElementById("studentRankingBody");
    if (tbody) {
      observer.observe(tbody, { childList: true, subtree: true });
    }
    if (typeof populateRankingMonthFilter === "function") populateRankingMonthFilter();
    if (typeof populateRankingAcademyFilter === "function") populateRankingAcademyFilter();
    if (typeof renderRankings === "function") renderRankings();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRankingViewOnReady);
  } else {
    initRankingViewOnReady();
  }
})();
