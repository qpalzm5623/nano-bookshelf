/**
 * 나노의 책장 - B2B 마스터 관리자(Master Admin) 포털 로직
 * 6대 핵심 모듈: 가맹점 관리, 통합 회원 관리, 운영 관리, 랭킹 시스템, 마스터 콘텐츠 관리, 카톡 발송 내역
 */

// ==========================================
// 1. 상태 및 샘플 데이터셋 (State & Datasets)
// ==========================================

// 1-1. 가맹 학원 데이터 (B2B Franchises)
let franchiseList = [
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

// 1-2. 통합 회원 데이터 (Universal Members)
let memberList = [
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

// 1-4. 추천 도서 큐레이션 테마 및 주제별 태그 관리 (도서 ID 매핑 연동)
let themeList = [
  {
    id: 1,
    title: "이달의 나노 북클럽",
    tag: "#이달의나노북클럽",
    subTag: "#초등필독 #문해력향상 #창의독서",
    desc: "생각하는 힘과 문해력을 키워주는 9월 필수 추천 도서 세트",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80",
    bookIds: ["MB-001", "MB-003", "MB-004", "MB-007", "MB-011", "MB-014"],
    active: "Y",
    createdAt: "2026-09-01"
  },
  {
    id: 2,
    title: "초등 교과연계 역사 탐구",
    tag: "#교과연계한국사",
    subTag: "#역사탐구 #인물스토리 #초등5~6학년",
    desc: "한국사 흐름을 재미있는 이야기와 인물로 풀어낸 필독 도서",
    image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&q=80",
    bookIds: ["MB-009", "MB-010", "MB-004", "MB-006"],
    active: "Y",
    createdAt: "2026-09-02"
  },
  {
    id: 3,
    title: "미래를 여는 과학 & 환경",
    tag: "#미래과학환경",
    subTag: "#창의융합 #AI시대 #기후환경탐구",
    desc: "기후 변화와 인공지능 시대를 이해하는 흥미진진 과학책",
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=80",
    bookIds: ["MB-005", "MB-008", "MB-012", "MB-016"],
    active: "Y",
    createdAt: "2026-09-04"
  },
  {
    id: 4,
    title: "마음을 키우는 인문 문학 여행",
    tag: "#인문문학여행",
    subTag: "#자아성찰 #공감과소통 #중등필독",
    desc: "자아 정체성과 타인에 대한 공감을 넓히는 명작 문학선",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80",
    bookIds: ["MB-001", "MB-002", "MB-006", "MB-015"],
    active: "Y",
    createdAt: "2026-09-06"
  }
];

// 로컬스토리지 동기화 헬퍼 함수
function saveOperationsToStorage() {
  try {
    localStorage.setItem("NANO_MASTER_BANNERS", JSON.stringify(bannerList));
    localStorage.setItem("NANO_MASTER_THEMES", JSON.stringify(themeList));
  } catch (e) {
    console.warn("로컬스토리지 저장 중 오류:", e);
  }
}

function loadOperationsFromStorage() {
  try {
    const b = localStorage.getItem("NANO_MASTER_BANNERS");
    if (b) {
      const parsed = JSON.parse(b);
      if (Array.isArray(parsed) && parsed.length > 0) bannerList = parsed;
    }
    const t = localStorage.getItem("NANO_MASTER_THEMES");
    if (t) {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed) && parsed.length > 0) themeList = parsed;
    }
  } catch (e) {
    console.warn("로컬스토리지 불러오기 중 오류:", e);
  }
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

// ==========================================
// 2. 초기화 및 네비게이션 (Init & Tabs)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  renderFranchiseTable();
  renderMemberTable();
  initMemberAcademyDropdown();
  populateMemberAcademyFilter();
  renderBannerList();
  renderThemeTable();
  renderRankings();
  renderMasterContents();
  renderDispatchTable();
  populateDispatchAcademyFilter();
  renderMasterPaymentTable();
  populateMasterPaymentAcademyFilter();
  updatePaymentKpis();
});

// 마스터 대메뉴 탭 전환
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

  if (tabName === "payment") {
    renderMasterPaymentTable();
    updatePaymentKpis();
  } else if (tabName === "operations") {
    renderBannerList();
    renderThemeTable();
  } else if (tabName === "ranking") {
    renderRankings();
  } else if (tabName === "contents") {
    renderMasterContents();
  }
}

// 운영 관리 서브탭 전환
function switchOpSubTab(subName) {
  const subs = ["banners", "themes", "notices"];
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
}

// ==========================================
// 3. 가맹점 관리 모듈 (Franchise Management)
// ==========================================

// 상품별 월 표준 결제 금액 매핑
const PLAN_MONTHLY_FEES = {
  "Basic": "220,000원",
  "Standard": "330,000원",
  "Premium": "440,000원",
  "Royal": "550,000원",
  "VIP": "770,000원"
};

// 이용 상품별 품격 있는 뱃지 스타일 헬퍼
function getPlanBadge(plan) {
  switch (plan) {
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

// 가맹점 테이블 렌더링 (최근 가맹일/가입일 기준 최신순 정렬 + 11개 컬럼)
function renderFranchiseTable(data = franchiseList) {
  const tbody = document.getElementById("franchiseTableBody");
  if (!tbody) return;

  // 최근 가맹일(가입일 joinDate || startDate) 기준 내림차순(최신순) 정렬
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.joinDate || a.startDate || 0);
    const dateB = new Date(b.joinDate || b.startDate || 0);
    return dateB - dateA;
  });

  document.getElementById("franchiseFilteredCount").innerText = sortedData.length;

  if (sortedData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="text-center py-5 text-muted">일치하는 가맹 학원 정보가 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = sortedData.map((acad, idx) => {
    // 슬롯(사용인원) 사용률 계산
    const maxStd = acad.maxStudents || 50;
    const curStd = acad.currentStudents || 0;
    const slotRate = Math.round((curStd / maxStd) * 100);
    let progressClass = "";
    if (slotRate >= 95) progressClass = "danger";
    else if (slotRate >= 80) progressClass = "warn";

    // 가맹 상태 뱃지
    let statusBadge = `<span class="badge-soft badge-soft-success"><i class="fa-solid fa-circle-check"></i> 정상 운영</span>`;
    if (acad.status === "EXPIRING") {
      statusBadge = `<span class="badge-soft badge-soft-warn"><i class="fa-solid fa-clock"></i> 만료 임박</span>`;
    } else if (acad.status === "PAUSED") {
      statusBadge = `<span class="badge-soft badge-soft-danger"><i class="fa-solid fa-pause"></i> 일시 정지</span>`;
    } else if (acad.status === "TERMINATED") {
      statusBadge = `<span class="badge-soft badge-soft-neutral"><i class="fa-solid fa-xmark"></i> 계약 해지</span>`;
    }

    // 결제 완납/미납 표시
    const paymentBadge = acad.paymentStatus === "PAID" 
      ? `<span class="badge-soft badge-soft-success" style="font-size: 10px; padding: 2px 6px;">완납</span>`
      : `<span class="badge-soft badge-soft-danger" style="font-size: 10px; padding: 2px 6px;">미납</span>`;

    // 가입일 표시
    const joinDateText = acad.joinDate || acad.startDate || "-";

    // 이용 상품명 뱃지
    const planBadge = getPlanBadge(acad.plan || "Standard");

    // 관리자 ID
    const adminIdText = acad.adminId || `admin_${acad.id.toLowerCase().replace('-', '_')}`;

    // 월 결제 금액
    const feeText = acad.monthlyFee || PLAN_MONTHLY_FEES[acad.plan] || "330,000원";

    return `
      <tr>
        <!-- 1. 번호 -->
        <td class="text-center font-weight-bold text-muted" style="font-size: 12.5px;">${idx + 1}</td>
        <!-- 2. 이용 상품명 -->
        <td class="text-center">${planBadge}</td>
        <!-- 3. 가맹 학원명 -->
        <td>
          <div class="font-weight-bold" style="font-size: 13.5px; color: var(--text-main);">${acad.name}</div>
          <small class="text-muted"><i class="fa-solid fa-location-dot mr-1"></i>${acad.region || '전국'} · 사업자: ${acad.bizNumber || '-'}</small>
        </td>
        <!-- 4. 관리자 ID -->
        <td class="text-center">
          <span class="badge-soft badge-soft-neutral" style="font-family: monospace; font-size: 11.5px; font-weight: 700; color: #495057;">${adminIdText}</span>
        </td>
        <!-- 5. 원장명 / 연락처 -->
        <td class="text-center">
          <div class="font-weight-bold" style="font-size: 13px;">${acad.director}</div>
          <small class="text-muted d-block">${acad.phone}</small>
          ${acad.email ? `<small class="text-muted" style="font-size: 11px; opacity: 0.85;"><i class="fa-regular fa-envelope mr-1"></i>${acad.email}</small>` : ''}
        </td>
        <!-- 6. 가입일 -->
        <td class="text-center font-weight-bold" style="font-size: 12.5px; color: #5a4b3d;">
          ${joinDateText}
        </td>
        <!-- 7. 계약 기간 -->
        <td class="text-center">
          <div style="font-size: 12px;">${acad.startDate} ~ ${acad.endDate}</div>
          <small class="text-muted">${getDDayText(acad.endDate)}</small>
        </td>
        <!-- 8. 원생 수 / 계약 슬롯 (사용인원) -->
        <td>
          <div class="d-flex justify-content-between align-items-center mb-1" style="font-size: 12px;">
            <span class="font-weight-bold">${curStd}명 <small class="text-muted">/ ${maxStd}명</small></span>
            <span class="text-muted font-weight-bold">${slotRate}%</span>
          </div>
          <div class="slot-progress-wrap">
            <div class="slot-progress-fill ${progressClass}" style="width: ${Math.min(slotRate, 100)}%;"></div>
          </div>
        </td>
        <!-- 9. 가맹 상태 -->
        <td class="text-center">${statusBadge}</td>
        <!-- 10. 월 결제 금액 -->
        <td class="text-center">
          <div class="font-weight-bold" style="font-size: 13px; color: var(--text-main);">${feeText}</div>
          <div class="mt-1">${paymentBadge}</div>
        </td>
        <!-- 11. 관리 -->
        <td class="text-center">
          <button class="btn btn-xs btn-outline-secondary mr-1" onclick="openAcademyEditModal('${acad.id}')" title="학원 정보 및 계약/상품 수정" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-xs btn-outline-danger" onclick="openAcademyDeleteConfirm('${acad.id}')" title="가맹 해지/삭제" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
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
  const query = (document.getElementById("franchiseSearchInput")?.value || "").toLowerCase().trim();
  const statusFilter = document.getElementById("franchiseStatusFilter")?.value || "ALL";
  const planFilter = document.getElementById("franchisePlanFilter")?.value || "ALL";
  const startDateFilter = document.getElementById("franchiseStartDateFilter")?.value || "";
  const endDateFilter = document.getElementById("franchiseEndDateFilter")?.value || "";

  const filtered = franchiseList.filter(item => {
    const itemJoinDate = item.joinDate || item.startDate || "";

    const matchQuery = !query || 
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.director && item.director.toLowerCase().includes(query)) ||
      (item.region && item.region.toLowerCase().includes(query)) ||
      (item.bizNumber && item.bizNumber.includes(query)) ||
      (item.adminId && item.adminId.toLowerCase().includes(query)) ||
      (item.email && item.email.toLowerCase().includes(query));

    const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchPlan = planFilter === "ALL" || (item.plan || "Standard") === planFilter;

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

// 신규 학원 등록 제출 처리 (이메일, 이용상품, 사용인원 반영 및 요율 자동 매핑)
function handleRegisterAcademy(e) {
  e.preventDefault();
  const name = document.getElementById("regAcademyName").value.trim();
  const bizNumber = document.getElementById("regBizNumber")?.value.trim() || "";
  const director = document.getElementById("regDirectorName").value.trim();
  const email = document.getElementById("regDirectorEmail")?.value.trim() || "";
  const phone = document.getElementById("regDirectorPhone").value.trim();
  const region = document.getElementById("regRegion")?.value.trim() || "신규 등록 지역";
  const address = document.getElementById("regAddress")?.value.trim() || "";
  const adminId = document.getElementById("regDirectorId")?.value.trim() || `director_${Date.now()}`;
  const startDate = document.getElementById("regStartDate").value;
  const endDate = document.getElementById("regEndDate").value;
  const plan = document.getElementById("regPlan")?.value || "Standard";
  const maxStudents = parseInt(document.getElementById("regMaxStudents")?.value, 10) || 50;
  const monthlyFee = PLAN_MONTHLY_FEES[plan] || "330,000원";

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
    plan: plan,
    joinDate: startDate,
    startDate: startDate,
    endDate: endDate,
    currentStudents: 0,
    maxStudents: maxStudents,
    monthlyFee: monthlyFee,
    paymentStatus: "PAID",
    status: "ACTIVE"
  };

  franchiseList.unshift(newAcad);
  $('#academyRegisterModal').modal('hide');
  document.getElementById("academyRegisterForm").reset();

  renderFranchiseTable();
  updateFranchiseStats();
  populateMemberAcademyFilter();
  populateDispatchAcademyFilter();
  showMasterToast(`[${name}] 신규 가맹 학원(${plan} 플랜, 사용인원 ${maxStudents}명)이 성공적으로 등록되었습니다.`);
}

// 학원 수정 모달 열기 (이메일, 이용상품, 사용인원 등 바인딩)
function openAcademyEditModal(id) {
  const acad = franchiseList.find(a => a.id === id);
  if (!acad) return;

  document.getElementById("editAcademyId").value = acad.id;
  const badge = document.getElementById("editAcademyIdBadge");
  if (badge) badge.innerText = `${acad.id} (${acad.adminId || ''})`;

  document.getElementById("editAcademyName").value = acad.name || "";
  document.getElementById("editBizNumber").value = acad.bizNumber || "";
  document.getElementById("editDirectorName").value = acad.director || "";
  if (document.getElementById("editDirectorEmail")) {
    document.getElementById("editDirectorEmail").value = acad.email || "";
  }
  document.getElementById("editDirectorPhone").value = acad.phone || "";
  document.getElementById("editRegion").value = acad.region || "";
  document.getElementById("editEndDate").value = acad.endDate || "";
  if (document.getElementById("editPlan")) {
    document.getElementById("editPlan").value = acad.plan || "Standard";
  }
  if (document.getElementById("editMaxStudents")) {
    document.getElementById("editMaxStudents").value = acad.maxStudents || 50;
  }
  document.getElementById("editStatus").value = acad.status || "ACTIVE";

  $('#academyEditModal').modal('show');
}

// 학원 수정 내용 저장 (이메일, 이용상품, 사용인원 저장 및 월 결제금액 자동 동기화)
function saveAcademyEdit(e) {
  if (e) e.preventDefault();
  const id = document.getElementById("editAcademyId").value;
  const acad = franchiseList.find(a => a.id === id);
  if (!acad) return;

  const oldName = acad.name;
  const newName = document.getElementById("editAcademyName").value.trim() || oldName;

  acad.name = newName;
  acad.bizNumber = document.getElementById("editBizNumber").value.trim();
  acad.director = document.getElementById("editDirectorName").value.trim();
  if (document.getElementById("editDirectorEmail")) {
    acad.email = document.getElementById("editDirectorEmail").value.trim();
  }
  acad.phone = document.getElementById("editDirectorPhone").value.trim();
  acad.region = document.getElementById("editRegion").value.trim();
  acad.endDate = document.getElementById("editEndDate").value;
  if (document.getElementById("editPlan")) {
    acad.plan = document.getElementById("editPlan").value;
    acad.monthlyFee = PLAN_MONTHLY_FEES[acad.plan] || acad.monthlyFee;
  }
  if (document.getElementById("editMaxStudents")) {
    acad.maxStudents = parseInt(document.getElementById("editMaxStudents").value, 10) || acad.maxStudents;
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
    populateMemberAcademyFilter();
    populateDispatchAcademyFilter();
  }

  $('#academyEditModal').modal('hide');
  renderFranchiseTable();
  updateFranchiseStats();
  showMasterToast(`[${acad.name}] 가맹 학원 정보 및 계약/상품 설정이 갱신되었습니다.`);
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

function confirmDeleteAcademy() {
  if (!pendingDeleteAcademyId) return;
  const idx = franchiseList.findIndex(a => a.id === pendingDeleteAcademyId);
  if (idx !== -1) {
    const deleted = franchiseList.splice(idx, 1)[0];
    $('#academyDeleteConfirmModal').modal('hide');
    renderFranchiseTable();
    updateFranchiseStats();
    showMasterToast(`[${deleted.name}] 가맹 계약이 해지 및 삭제되었습니다.`);
  }
}

function updateFranchiseStats() {
  const total = franchiseList.length;
  const activeCount = franchiseList.filter(a => a.status === "ACTIVE").length;
  const currentSlots = franchiseList.reduce((acc, cur) => acc + cur.currentStudents, 0);
  const maxSlots = franchiseList.reduce((acc, cur) => acc + cur.maxStudents, 0);

  if (document.getElementById("statFranchiseTotal")) {
    document.getElementById("statFranchiseTotal").innerHTML = `${total}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">개소</span>`;
  }
  if (document.getElementById("statFranchiseSlots")) {
    document.getElementById("statFranchiseSlots").innerHTML = `${currentSlots} <span style="font-size: 15px; font-weight: 600; color: var(--text-muted);">/ ${maxSlots}명</span>`;
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

// 통합 회원 테이블 렌더링 (13개 분리 컬럼 + 최근접속일 2줄)
function renderMemberTable(data = memberList) {
  const tbody = document.getElementById("memberTableBody");
  if (!tbody) return;

  document.getElementById("memberFilteredCount").innerText = data.length;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="13" class="text-center py-5 text-muted">검색 조건과 일치하는 회원이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((mem, idx) => {
    // 1. 등급 권한 뱃지
    let roleBadge = `<span class="badge-soft badge-soft-neutral">학생</span>`;
    if (mem.role === "DIRECTOR") {
      roleBadge = `<span class="badge-soft badge-soft-master"><i class="fa-solid fa-user-tie mr-1"></i>원장님</span>`;
    } else if (mem.role === "TEACHER") {
      roleBadge = `<span class="badge-soft badge-soft-warn"><i class="fa-solid fa-chalkboard-user mr-1"></i>선생님</span>`;
    }

    // 2. 계정 상태 뱃지 (APPROVED, PENDING, WITHDRAWN)
    let statusBadge = `<span class="badge-soft badge-soft-success"><i class="fa-solid fa-check mr-1"></i>승인</span>`;
    if (mem.status === "PENDING") {
      statusBadge = `<span class="badge-soft badge-soft-warn"><i class="fa-solid fa-clock mr-1"></i>미승인</span>`;
    } else if (mem.status === "WITHDRAWN" || mem.status === "PAUSED") {
      statusBadge = `<span class="badge-soft badge-soft-neutral"><i class="fa-solid fa-user-xmark mr-1"></i>탈퇴</span>`;
    }

    // 3. 최근 접속일 2줄 나누기 (yyyy-mm-dd \n (hh:mm))
    let loginDateHtml = "-";
    if (mem.lastLogin && mem.lastLogin.includes(" ")) {
      const parts = mem.lastLogin.split(" ");
      loginDateHtml = `
        <div style="font-size: 12.5px; font-weight: 600; color: #4b5563;">${parts[0]}</div>
        <small class="text-muted" style="font-size: 11px;">(${parts[1]})</small>
      `;
    } else if (mem.lastLogin) {
      loginDateHtml = `<div style="font-size: 12.5px; color: #4b5563;">${mem.lastLogin}</div>`;
    }

    // 4. 등록일 (yyyy-mm-dd)
    const createdAtHtml = `<span style="font-size: 12px; color: #6b7280;">${mem.createdAt || '2025-03-01'}</span>`;

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
        <td class="text-center font-weight-bold text-muted" style="font-size: 12.5px;">${idx + 1}</td>
        <!-- 2. 소속 학원 -->
        <td class="font-weight-bold" style="font-size: 13px; color: var(--text-main);">${mem.academyName}</td>
        <!-- 3. 등급 권한 -->
        <td class="text-center">${roleBadge}</td>
        <!-- 4. 이름 (아이디) -->
        <td>
          <span class="font-weight-bold text-dark" style="font-size: 13.5px;">${mem.name}</span>
          <small class="text-muted font-weight-bold">(${mem.username})</small>
        </td>
        <!-- 5. 학년 -->
        <td class="text-center font-weight-bold" style="font-size: 12.5px; color: #374151;">${gradeText}</td>
        <!-- 6. 학급 -->
        <td class="text-center">${classBadge}</td>
        <!-- 7. 학생 연락처 -->
        <td class="text-center" style="font-size: 12px; color: #4b5563;">${studentPhone}</td>
        <!-- 8. 학부모 연락처 -->
        <td class="text-center" style="font-size: 12px; color: #6b7280;">${parentPhone}</td>
        <!-- 9. 누적 포인트 -->
        <td class="text-center font-weight-bold text-warning" style="font-size: 13px;">${mem.points > 0 ? mem.points.toLocaleString() + ' P' : '-'}</td>
        <!-- 10. 최근 접속일 (2줄) -->
        <td class="text-center">${loginDateHtml}</td>
        <!-- 11. 등록일 -->
        <td class="text-center">${createdAtHtml}</td>
        <!-- 12. 계정 상태 -->
        <td class="text-center">${statusBadge}</td>
        <!-- 13. 관리 (아이콘 버튼) -->
        <td class="text-center">
          <button class="btn btn-xs btn-outline-secondary" onclick="openMemberDetailModal(${mem.id})" title="회원 상세 및 상태 관리" style="border-radius: 6px; font-size: 12px; padding: 4px 8px;">
            <i class="fa-solid fa-user-gear"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// 회원 필터링 (학원, 등급 권한, 상태 3종, 통합검색어)
function filterMemberList() {
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
  renderMemberTable();
  showMasterToast(`[${mem.name}] 회원의 상태가 [${mem.status === "APPROVED" ? "승인" : "탈퇴"}]로 변경되었습니다.`);
}

function resetSingleMemberPassword() {
  const id = parseInt(document.getElementById("detailMemberId").value, 10);
  const mem = memberList.find(m => m.id === id);
  if (!mem) return;

  $('#memberDetailModal').modal('hide');
  showMasterToast(`[${mem.name}] 회원의 휴대폰(${mem.phone})으로 임시 비밀번호가 발송되었습니다.`);
}

function bulkResetPassword() {
  showMasterToast("선택된 회원 계정들에 대한 보안 임시 비밀번호가 일괄 발송되었습니다.");
}

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
    document.getElementById("excelFileNameText").innerHTML = `<span class="text-success font-weight-bold"><i class="fa-solid fa-file-excel mr-1"></i>${input.files[0].name}</span>`;
  }
}

function handleMemberExcelUpload() {
  const targetAcad = document.getElementById("excelTargetAcademy").value;
  const fileInp = document.getElementById("memberExcelFileInput");
  if (!fileInp.files || !fileInp.files[0]) {
    showMasterToast("등록할 엑셀 파일을 먼저 선택해주세요.");
    return;
  }

  const acadObj = franchiseList.find(a => a.name === targetAcad);
  const acadId = acadObj ? acadObj.id : "ACAD-001";
  const today = new Date().toISOString().split("T")[0];

  // 엑셀 일괄 업로드 시뮬레이션 데이터 2건 추가
  const sample1 = {
    id: Date.now() + 1,
    academyId: acadId,
    academyName: targetAcad,
    role: "STUDENT",
    name: "한예슬",
    username: "yeseul_h",
    grade: "초4",
    className: "매화반",
    phone: "010-3311-2244",
    parentPhone: "010-8899-7766",
    points: 0,
    lastLogin: `${today} 10:00`,
    createdAt: today,
    status: "APPROVED"
  };
  const sample2 = {
    id: Date.now() + 2,
    academyId: acadId,
    academyName: targetAcad,
    role: "STUDENT",
    name: "문지호",
    username: "jiho_m",
    grade: "초5",
    className: "소나무반",
    phone: "010-4422-5566",
    parentPhone: "010-1100-2299",
    points: 0,
    lastLogin: `${today} 10:00`,
    createdAt: today,
    status: "APPROVED"
  };

  memberList.unshift(sample1, sample2);
  $("#memberExcelModal").modal("hide");
  renderMemberTable();
  showMasterToast(`[${targetAcad}] 엑셀 일괄 등록 완료: 2명의 원생이 성공적으로 등록되었습니다.`);
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
    acadSelect.innerHTML = franchiseList.map(a => `<option value="${a.name}">${a.name}</option>`).join("");
    if (currentSelectedAcademy !== "ALL") {
      acadSelect.value = currentSelectedAcademy;
    }
  }
  onMasterMemberRoleChange("STUDENT");
  $("#masterMemberAddModal").modal("show");
}

// 마스터 회원 등록 제출
function handleMasterMemberRegister(e) {
  e.preventDefault();
  const academyName = document.getElementById("newMemAcademy").value;
  const role = document.getElementById("newMemRole").value;
  const name = document.getElementById("newMemName").value.trim();
  const username = document.getElementById("newMemUsername").value.trim();
  const grade = role === "STUDENT" ? document.getElementById("newMemGrade").value : (role === "DIRECTOR" ? "원장" : "교사");
  const className = role === "STUDENT" ? (document.getElementById("newMemClass").value.trim() || "미지정") : "-";
  const phone = document.getElementById("newMemPhone").value.trim();
  const parentPhone = role === "STUDENT" ? (document.getElementById("newMemParentPhone").value.trim() || "-") : "-";
  const status = document.getElementById("newMemStatus").value;

  const acadObj = franchiseList.find(a => a.name === academyName);
  const academyId = acadObj ? acadObj.id : "ACAD-001";

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
    grade: grade,
    className: className,
    phone: phone,
    parentPhone: parentPhone,
    points: 0,
    lastLogin: lastLogin,
    createdAt: today,
    status: status
  };

  memberList.unshift(newMember);
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

function renderBannerList() {
  const container = document.getElementById("bannerListContainer");
  if (!container) return;

  const activeCount = bannerList.filter(b => b.active === "Y").length;
  const countEl = document.getElementById("bannerCount");
  if (countEl) countEl.innerText = activeCount;

  container.innerHTML = bannerList.map((b) => {
    const bookCount = b.bookIds ? b.bookIds.length : 0;
    const clicks = typeof b.clicks === "number" ? b.clicks.toLocaleString() : (b.clicks || "0");
    const regDate = b.createdAt || "2026-09-01";

    return `
    <div class="banner-preview-box">
      <div style="font-size: 18px; font-weight: 900; color: var(--text-soft); width: 32px; text-align: center;">
        #${b.order}
      </div>
      <div class="banner-img-thumb" onclick="previewBannerImage('${b.imageUrl || ''}', '${b.title}')" title="배너 이미지 크게 보기 (클릭)" style="background: ${b.bgTheme || 'linear-gradient(135deg, #7a6348, #4a3b32)'}; cursor: pointer;">
        ${b.imageUrl ? `
          <img src="${b.imageUrl}" alt="${b.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="banner-thumb-hover-overlay">
            <i class="fa-solid fa-magnifying-glass-plus text-white" style="font-size: 20px;"></i>
          </div>
          <div class="d-none w-100 h-100 align-items-center justify-content-center text-white" style="background: ${b.bgTheme};">
            <i class="fa-solid fa-image" style="font-size: 24px; opacity: 0.8;"></i>
          </div>
        ` : `
          <div class="d-flex w-100 h-100 align-items-center justify-content-center text-white">
            <i class="fa-solid fa-image" style="font-size: 24px; opacity: 0.8;"></i>
          </div>
        `}
      </div>
      <div class="flex-grow-1" style="min-width: 0;">
        <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
          <span class="badge-soft ${b.active === 'Y' ? 'badge-soft-success' : 'badge-soft-neutral'}">
            ${b.active === 'Y' ? '노출중' : '숨김'}
          </span>
          <strong style="font-size: 15px; color: var(--text-main);">${b.title}</strong>
        </div>
        <div class="text-muted text-truncate mb-2" style="font-size: 13px;">${b.sub || '서브 설명 없음'}</div>
        <div class="d-flex align-items-center gap-3 text-muted" style="font-size: 12px;">
          <span><i class="fa-regular fa-calendar-check mr-1 text-primary"></i>등록일: <strong>${regDate}</strong></span>
          <span><i class="fa-solid fa-arrow-pointer mr-1 text-success"></i>클릭수: <strong>${clicks}회</strong></span>
          <span><i class="fa-solid fa-book-bookmark mr-1 text-warning"></i>연결 도서: <strong>${bookCount}권</strong></span>
        </div>
      </div>
      <div class="d-flex align-items-center gap-2 flex-shrink-0">
        <button class="btn btn-sm btn-outline-primary font-weight-bold" onclick="openBannerModal(${b.id})" style="border-radius: 8px;">
          <i class="fa-solid fa-pen mr-1"></i>편집
        </button>
        <button class="btn btn-sm btn-outline-secondary" onclick="toggleBannerActive(${b.id})" style="border-radius: 8px;">
          ${b.active === 'Y' ? '숨김 전환' : '노출 전환'}
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteBanner(${b.id})" style="border-radius: 8px;">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `;
  }).join("");
}

function previewBannerImage(url, title) {
  if (!url) {
    showMasterToast("등록된 배너 이미지가 없습니다. (단색 테마 그라데이션 적용)");
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
  if (!box || !img) return;

  if (val) {
    img.style.display = "block";
    img.src = val;
  } else {
    img.style.display = "none";
    box.innerHTML = '<span class="text-muted" style="font-size:12px;"><i class="fa-solid fa-palette mr-1"></i>단색/그라데이션 테마가 적용됩니다.</span>';
  }
}

function handleBannerFileUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("배너 이미지 크기는 최대 5MB를 초과할 수 없습니다.");
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    curBannerUploadedImgData = evt.target.result;
    updateBannerModalPreview(curBannerUploadedImgData);
    showMasterToast("배너 이미지가 성공적으로 업로드되었습니다.");
  };
  reader.readAsDataURL(file);
}

function handleBannerPresetChange(val) {
  curBannerUploadedImgData = "";
  const fileInput = document.getElementById("bannerImageFile");
  if (fileInput) fileInput.value = "";
  updateBannerModalPreview(val);
}

function openBannerModal(bannerId) {
  curBannerUploadedImgData = "";
  const fileInput = document.getElementById("bannerImageFile");
  if (fileInput) fileInput.value = "";

  const modalHeader = document.getElementById("bannerModalHeaderTitle");
  const editIdInput = document.getElementById("bannerEditId");
  const titleInput = document.getElementById("bannerTitle");
  const subInput = document.getElementById("bannerSub");
  const imgSelect = document.getElementById("bannerImageUrl");
  const bgSelect = document.getElementById("bannerBgTheme");
  const orderInput = document.getElementById("bannerOrder");
  const activeSelect = document.getElementById("bannerActive");

  if (bannerId) {
    const target = bannerList.find(b => b.id === bannerId);
    if (!target) return;

    if (modalHeader) modalHeader.innerHTML = `<i class="fa-solid fa-pen mr-2 text-warning"></i>홈 메인 롤링 배너 편집`;
    if (editIdInput) editIdInput.value = target.id;
    if (titleInput) titleInput.value = target.title;
    if (subInput) subInput.value = target.sub || "";
    if (bgSelect) bgSelect.value = target.bgTheme || "linear-gradient(135deg, #7a6348, #4a3b32)";
    if (orderInput) orderInput.value = target.order || 1;
    if (activeSelect) activeSelect.value = target.active || "Y";

    if (imgSelect) {
      imgSelect.value = target.imageUrl || "";
    }
    updateBannerModalPreview(target.imageUrl);

    curBannerBooks = target.bookIds ? [...target.bookIds] : [];
  } else {
    if (modalHeader) modalHeader.innerHTML = `<i class="fa-solid fa-plus mr-2 text-warning"></i>신규 홈 메인 롤링 배너 등록`;
    if (editIdInput) editIdInput.value = "";
    if (titleInput) titleInput.value = "";
    if (subInput) subInput.value = "";
    if (orderInput) orderInput.value = bannerList.length + 1;
    if (activeSelect) activeSelect.value = "Y";
    if (bgSelect) bgSelect.value = "linear-gradient(135deg, #7a6348, #4a3b32)";

    if (imgSelect) {
      imgSelect.value = "upload/banner/banner_reading_king.jpg";
    }
    updateBannerModalPreview(imgSelect ? imgSelect.value : "");

    curBannerBooks = [];
  }

  const sInput = document.getElementById("bmSearchInput");
  const cSelect = document.getElementById("bmCategorySelect");
  if (sInput) sInput.value = "";
  if (cSelect) cSelect.value = "";

  renderBmMappedBooks();
  renderBmAvailableBooks();

  $('#bannerEditModal').modal('show');
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
    <div class="d-flex align-items-center justify-content-between p-2 mb-2 bg-white rounded border shadow-2xs">
      <div class="d-flex align-items-center gap-2" style="min-width: 0; flex: 1;">
        <span class="badge-soft badge-soft-neutral" style="font-size: 10.5px; width: 20px; text-align: center;">${idx + 1}</span>
        <div style="width: 30px; height: 40px; border-radius: 4px; overflow: hidden; background: #eee; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          ${b.cover ? `<img src="${b.cover}" alt="${b.title}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fa-solid fa-book text-muted"></i>`}
        </div>
        <div style="min-width: 0; flex: 1;">
          <div class="text-truncate font-weight-bold" style="font-size: 12.5px; color: var(--text-main);">${b.title}</div>
          <div class="text-truncate text-muted" style="font-size: 11px;">${b.author} · ${b.publisher}</div>
        </div>
      </div>
      <button type="button" class="btn btn-xs btn-outline-danger ml-2" onclick="removeBookFromCurBanner('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 2px 7px;">
        <i class="fa-solid fa-xmark mr-1"></i>제외
      </button>
    </div>
  `).join("");
}

function renderBmAvailableBooks() {
  const container = document.getElementById("bmAvailableListContainer");
  if (!container) return;

  const keyword = (document.getElementById("bmSearchInput") ? document.getElementById("bmSearchInput").value : "").trim().toLowerCase();
  const category = (document.getElementById("bmCategorySelect") ? document.getElementById("bmCategorySelect").value : "").trim();

  let filtered = masterBooks.filter(b => {
    const matchKw = !keyword || b.title.toLowerCase().includes(keyword) || b.author.toLowerCase().includes(keyword) || b.publisher.toLowerCase().includes(keyword);
    const matchCat = !category || b.category === category;
    return matchKw && matchCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted">
        <i class="fa-solid fa-magnifying-glass mb-2" style="font-size: 24px; opacity: 0.35;"></i>
        <div style="font-size: 12.5px;">일치하는 마스터 도서가 없습니다.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(b => {
    const isAdded = curBannerBooks.includes(b.id);
    return `
      <div class="d-flex align-items-center justify-content-between p-2 mb-2 bg-white rounded border">
        <div class="d-flex align-items-center gap-2" style="min-width: 0; flex: 1;">
          <div style="width: 30px; height: 40px; border-radius: 4px; overflow: hidden; background: #eee; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
            ${b.cover ? `<img src="${b.cover}" alt="${b.title}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fa-solid fa-book text-muted"></i>`}
          </div>
          <div style="min-width: 0; flex: 1;">
            <div class="text-truncate font-weight-bold" style="font-size: 12.5px; color: var(--text-main);">${b.title}</div>
            <div class="text-truncate text-muted" style="font-size: 11px;">${b.author} · ${b.publisher} · <span class="badge-soft badge-soft-neutral" style="font-size: 10px; padding: 1px 4px;">${b.category}</span></div>
          </div>
        </div>
        ${isAdded ? `
          <button type="button" class="btn btn-xs btn-secondary ml-2" disabled style="border-radius: 6px; font-size: 11px; padding: 3px 8px; opacity: 0.7;">
            <i class="fa-solid fa-check mr-1"></i>추가됨
          </button>
        ` : `
          <button type="button" class="btn btn-xs btn-outline-primary ml-2 font-weight-bold" onclick="addBookToCurBanner('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 3px 8px;">
            <i class="fa-solid fa-plus mr-1"></i>추가
          </button>
        `}
      </div>
    `;
  }).join("");
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

function handleSaveBanner(e) {
  e.preventDefault();
  const editId = document.getElementById("bannerEditId").value;
  const title = document.getElementById("bannerTitle").value.trim();
  const sub = document.getElementById("bannerSub").value.trim();
  const presetUrl = document.getElementById("bannerImageUrl") ? document.getElementById("bannerImageUrl").value : "";
  const imageUrl = curBannerUploadedImgData || presetUrl;
  const bgTheme = document.getElementById("bannerBgTheme").value;
  const order = parseInt(document.getElementById("bannerOrder").value, 10) || 1;
  const active = document.getElementById("bannerActive").value;

  if (editId) {
    const target = bannerList.find(b => b.id === parseInt(editId, 10));
    if (target) {
      target.title = title;
      target.sub = sub;
      target.imageUrl = imageUrl;
      target.bgTheme = bgTheme;
      target.order = order;
      target.active = active;
      target.bookIds = [...curBannerBooks];
      showMasterToast(`'${title}' 배너 정보가 수정되었습니다.`);
    }
  } else {
    const todayStr = new Date().toISOString().split("T")[0];
    const newBanner = {
      id: Date.now(),
      title: title,
      sub: sub,
      imageUrl: imageUrl,
      bgTheme: bgTheme,
      order: order,
      active: active,
      clicks: 0,
      createdAt: todayStr,
      bookIds: [...curBannerBooks]
    };
    bannerList.push(newBanner);
    showMasterToast(`'${title}' 신규 메인 배너가 등록되었습니다.`);
  }

  saveOperationsToStorage();
  $('#bannerEditModal').modal('hide');
  renderBannerList();
}

function toggleBannerActive(id) {
  const b = bannerList.find(item => item.id === id);
  if (!b) return;
  b.active = b.active === "Y" ? "N" : "Y";
  saveOperationsToStorage();
  renderBannerList();
  showMasterToast(`배너 노출 상태가 [${b.active === "Y" ? "노출" : "숨김"}]으로 변경되었습니다.`);
}

function deleteBanner(id) {
  const b = bannerList.find(item => item.id === id);
  const name = b ? b.title : "선택 배너";
  if (confirm(`'${name}' 배너를 정말 삭제하시겠습니까?`)) {
    bannerList = bannerList.filter(item => item.id !== id);
    saveOperationsToStorage();
    renderBannerList();
    showMasterToast("배너가 삭제되었습니다.");
  }
}

// --- [5-B] 테마 관리 (도서 큐레이션 테마 및 태그 관리) ---
let curThemeUploadedImgData = "";

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
    const bookCount = t.bookIds ? t.bookIds.length : 0;
    const imgUrl = t.image || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80";

    return `
      <tr>
        <td style="font-weight: 700; color: var(--text-soft);">${idx + 1}</td>
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
        <td>
          <button type="button" class="btn btn-xs btn-outline-success font-weight-bold" onclick="openThemeBooksModal(${t.id})" style="border-radius: 12px; font-size: 12px; padding: 4px 10px;" title="매핑된 도서 목록 보기 및 추가/제외">
            <i class="fa-solid fa-book-open mr-1"></i>${bookCount}권
          </button>
        </td>
        <td>
          <div style="width: 60px; height: 42px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-medium); cursor: pointer; margin: 0 auto; background: #f0ece5;" onclick="previewBannerImage('${imgUrl}', '${t.tag} 대표 이미지')" title="이미지 크게 보기 (클릭)">
            <img src="${imgUrl}" alt="${t.tag}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='upload/banner/banner_reading_king.jpg'">
          </div>
        </td>
        <td>
          <button type="button" class="btn btn-xs ${t.active === 'Y' ? 'btn-success' : 'btn-secondary'}" onclick="toggleThemeActive(${t.id})" style="border-radius: 14px; font-size: 11.5px; padding: 3px 10px;">
            ${t.active === 'Y' ? '노출 (Y)' : '숨김 (N)'}
          </button>
        </td>
        <td>
          <div class="d-flex align-items-center justify-content-center gap-1">
            <button class="btn btn-xs btn-outline-secondary" onclick="openThemeModal(${t.id})" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;" title="태그 정보 수정">
              <i class="fa-solid fa-pen mr-1"></i>편집
            </button>
            <button class="btn btn-xs btn-outline-primary font-weight-bold" onclick="openThemeBooksModal(${t.id})" style="border-radius: 6px; font-size: 11.5px; padding: 4px 9px;" title="도서 목록 편집">
              <i class="fa-solid fa-book mr-1"></i>도서 매핑
            </button>
            <button class="btn btn-xs btn-outline-danger" onclick="deleteTheme(${t.id})" style="border-radius: 6px; font-size: 11.5px; padding: 4px 7px;" title="태그 삭제">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
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
    <div style="position: relative; height: 120px; overflow: hidden; background: #e5e0d8;">
      <img src="${finalImg}" alt="${tagVal}" style="width: 100%; height: 100%; object-fit: cover;">
      <span class="badge" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.65); color: #fff; font-size: 10.5px; border-radius: 4px; padding: 2px 6px;">
        ${activeVal === 'Y' ? '노출' : '숨김'}
      </span>
    </div>
    <div style="padding: 12px;">
      <div class="badge-soft badge-soft-warning font-weight-bold mb-1" style="font-size: 12px; display: inline-block;">${tagVal}</div>
      <div class="text-muted text-truncate mb-2" style="font-size: 11px; font-weight: 600;">${subTagVal}</div>
      <p class="text-secondary mb-2" style="font-size: 11.5px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
        ${descVal}
      </p>
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
    const target = themeList.find(item => item.id === themeId);
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

function handleSaveTheme(e) {
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

  if (editId) {
    const target = themeList.find(item => item.id === parseInt(editId, 10));
    if (target) {
      target.title = formattedTag.replace("#", "");
      target.tag = formattedTag;
      target.subTag = subTag;
      target.desc = desc;
      target.image = finalImage;
      target.active = active;
      showMasterToast(`'${formattedTag}' 태그 정보가 수정되었습니다.`);
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
    showMasterToast(`'${formattedTag}' 신규 태그가 등록되었습니다.`);
  }

  saveOperationsToStorage();
  $('#themeEditModal').modal('hide');
  renderThemeTable();
}

function toggleThemeActive(id) {
  const t = themeList.find(item => item.id === id);
  if (!t) return;
  t.active = t.active === "Y" ? "N" : "Y";
  saveOperationsToStorage();
  renderThemeTable();
  showMasterToast(`[${t.tag}] 노출 상태가 [${t.active === "Y" ? "노출" : "숨김"}]으로 변경되었습니다.`);
}

function deleteTheme(themeId) {
  const target = themeList.find(item => item.id === themeId);
  if (!target) return;

  if (confirm(`'${target.tag}' 태그를 정말 삭제하시겠습니까?\n매핑된 도서 연결 정보도 함께 해제됩니다.`)) {
    themeList = themeList.filter(item => item.id !== themeId);
    saveOperationsToStorage();
    renderThemeTable();
    showMasterToast("태그가 삭제되었습니다.");
  }
}

// 4. 테마별 도서 목록 편집 모달 열기
function openThemeBooksModal(themeId) {
  const theme = themeList.find(t => t.id === themeId);
  if (!theme) return;
  curThemeBooksThemeId = themeId;

  if (!theme.bookIds) theme.bookIds = [];

  document.getElementById("tbmCurrentThemeId").value = theme.id;
  document.getElementById("tbmHeaderTitle").innerHTML = `<i class="fa-solid fa-bookmark mr-2 text-warning"></i>${theme.title} - 도서 매핑 관리`;
  document.getElementById("tbmInfoTitle").innerText = theme.title;
  document.getElementById("tbmInfoTag").innerText = theme.tag;
  document.getElementById("tbmInfoDesc").innerText = theme.desc || "테마 안내글";
  document.getElementById("tbmMappingCount").innerText = theme.bookIds.length;
  document.getElementById("tbmLeftCount").innerText = theme.bookIds.length;
  document.getElementById("tbmSearchInput").value = "";
  document.getElementById("tbmCategorySelect").value = "";

  renderTbmMappedBooks();
  renderTbmAvailableBooks();

  $('#themeBooksModal').modal('show');
}

// 5. 현재 테마 매핑 도서 목록 렌더링 (좌측)
function renderTbmMappedBooks() {
  const container = document.getElementById("tbmMappedListContainer");
  const theme = themeList.find(t => t.id === curThemeBooksThemeId);
  if (!container || !theme) return;

  const count = theme.bookIds ? theme.bookIds.length : 0;
  document.getElementById("tbmMappingCount").innerText = count;
  document.getElementById("tbmLeftCount").innerText = count;

  if (!theme.bookIds || theme.bookIds.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="fa-solid fa-book-open mb-2" style="font-size: 32px; opacity: 0.4;"></i>
        <p class="mb-1" style="font-size: 13.5px; font-weight: 600;">매핑된 도서가 없습니다.</p>
        <small style="font-size: 11.5px;">우측 라이브러리에서 추천할 도서의 [+ 추가] 버튼을 눌러주세요.</small>
      </div>
    `;
    return;
  }

  const mappedBooks = theme.bookIds.map(id => masterBooks.find(b => b.id === id)).filter(Boolean);

  container.innerHTML = mappedBooks.map((b, idx) => `
    <div class="d-flex align-items-center justify-content-between p-2 mb-2 bg-white rounded border" style="transition: all 0.15s;">
      <div class="d-flex align-items-center gap-2" style="min-width: 0; flex: 1;">
        <span class="badge-soft badge-soft-neutral" style="font-size: 11px; width: 22px; text-align: center; padding: 2px 0;">${idx + 1}</span>
        <div style="width: 34px; height: 46px; border-radius: 4px; overflow: hidden; background: #eee; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          ${b.cover ? `<img src="${b.cover}" alt="${b.title}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fa-solid fa-book text-muted"></i>`}
        </div>
        <div style="min-width: 0; flex: 1;">
          <div class="text-truncate font-weight-bold" style="font-size: 13px; color: var(--text-main);" title="${b.title}">${b.title}</div>
          <div class="text-truncate text-muted" style="font-size: 11px;">${b.author} · ${b.publisher}</div>
          <span class="badge-soft badge-soft-neutral" style="font-size: 10px; padding: 1px 6px;">${b.grade}</span>
        </div>
      </div>
      <button class="btn btn-xs btn-outline-danger ml-2" onclick="removeBookFromCurTheme('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 4px 8px; flex-shrink: 0;" title="테마에서 제외">
        <i class="fa-solid fa-xmark mr-1"></i>제외
      </button>
    </div>
  `).join("");
}

// 6. 마스터 도서 풀 검색/필터 및 추가 목록 렌더링 (우측)
function renderTbmAvailableBooks() {
  const container = document.getElementById("tbmAvailableListContainer");
  const theme = themeList.find(t => t.id === curThemeBooksThemeId);
  if (!container || !theme) return;

  const keyword = (document.getElementById("tbmSearchInput").value || "").trim().toLowerCase();
  const category = (document.getElementById("tbmCategorySelect").value || "").trim();

  let filtered = masterBooks.filter(b => {
    const matchKw = !keyword || b.title.toLowerCase().includes(keyword) || b.author.toLowerCase().includes(keyword) || b.publisher.toLowerCase().includes(keyword);
    const matchCat = !category || b.category === category;
    return matchKw && matchCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="fa-solid fa-magnifying-glass mb-2" style="font-size: 28px; opacity: 0.4;"></i>
        <p class="mb-0" style="font-size: 13px;">일치하는 마스터 도서가 없습니다.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(b => {
    const isMapped = theme.bookIds && theme.bookIds.includes(b.id);
    return `
      <div class="d-flex align-items-center justify-content-between p-2 mb-2 bg-white rounded border" style="transition: all 0.15s;">
        <div class="d-flex align-items-center gap-2" style="min-width: 0; flex: 1;">
          <div style="width: 34px; height: 46px; border-radius: 4px; overflow: hidden; background: #eee; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
            ${b.cover ? `<img src="${b.cover}" alt="${b.title}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fa-solid fa-book text-muted"></i>`}
          </div>
          <div style="min-width: 0; flex: 1;">
            <div class="d-flex align-items-center gap-1">
              <span class="badge-soft badge-soft-neutral" style="font-size: 10px; padding: 1px 5px;">${b.category}</span>
              <span class="text-truncate font-weight-bold" style="font-size: 13px; color: var(--text-main);" title="${b.title}">${b.title}</span>
            </div>
            <div class="text-truncate text-muted" style="font-size: 11px;">${b.author} · ${b.publisher} (${b.grade})</div>
          </div>
        </div>
        <div class="ml-2 flex-shrink-0">
          ${isMapped ? `
            <span class="badge badge-light text-success border px-2 py-1 font-weight-bold" style="font-size: 11px;">
              <i class="fa-solid fa-check mr-1"></i>매핑됨
            </span>
          ` : `
            <button class="btn btn-sm btn-outline-primary" onclick="addBookToCurTheme('${b.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 3px 10px; font-weight: 700;">
              <i class="fa-solid fa-plus mr-1"></i>추가
            </button>
          `}
        </div>
      </div>
    `;
  }).join("");
}

// 7. 현재 테마에 도서 추가
function addBookToCurTheme(bookId) {
  const theme = themeList.find(t => t.id === curThemeBooksThemeId);
  const book = masterBooks.find(b => b.id === bookId);
  if (!theme || !book) return;

  if (!theme.bookIds) theme.bookIds = [];
  if (theme.bookIds.includes(bookId)) return;

  theme.bookIds.push(bookId);
  renderTbmMappedBooks();
  renderTbmAvailableBooks();
  renderThemeTable();
  saveOperationsToStorage();
  showMasterToast(`'${book.title}' 도서가 테마에 추가되었습니다.`);
}

// 8. 현재 테마에서 도서 제외
function removeBookFromCurTheme(bookId) {
  const theme = themeList.find(t => t.id === curThemeBooksThemeId);
  const book = masterBooks.find(b => b.id === bookId);
  if (!theme) return;

  theme.bookIds = (theme.bookIds || []).filter(id => id !== bookId);
  renderTbmMappedBooks();
  renderTbmAvailableBooks();
  renderThemeTable();
  saveOperationsToStorage();
  showMasterToast(`'${book ? book.title : bookId}' 도서가 테마에서 제외되었습니다.`);
}

function openNoticeModal() {
  showMasterToast("전체 시스템 공지사항 작성 기능이 활성화되었습니다.");
}

// ==========================================
// 6. 전국 랭킹 시스템 모듈 (Ranking System)
// ==========================================
let rankingCurrentPage = 1;
const rankingPageSize = 20;

// 전국 학생 개인 랭킹 목데이터셋 (52명 이상 전체 랭킹)
let allStudentRankings = [
  { rank: 1, name: "김태윤", id: "taeyun_k", academy: "나노 독서아카데미 목동본원", grade: "초등 6학년", books: 42, accRate: "98%", points: 4850, recent: "오늘 08:30" },
  { rank: 2, name: "이서현", id: "seohyun_l", academy: "대치 에듀 독서논술센터", grade: "초등 5학년", books: 39, accRate: "96%", points: 4520, recent: "어제 21:05" },
  { rank: 3, name: "박지우", id: "jiwoo_p", academy: "송도 센트럴 리딩랩", grade: "초등 6학년", books: 36, accRate: "95%", points: 4210, recent: "어제 22:40" },
  { rank: 4, name: "이민우", id: "minwoo_l", academy: "나노 독서아카데미 목동본원", grade: "초등 5학년", books: 34, accRate: "94%", points: 3920, recent: "어제 19:15" },
  { rank: 5, name: "장민재", id: "minjae_j", academy: "대치 에듀 독서논술센터", grade: "중등 1학년", books: 32, accRate: "92%", points: 3890, recent: "2일 전" },
  { rank: 6, name: "박소율", id: "soyul_p", academy: "나노 독서아카데미 목동본원", grade: "초등 4학년", books: 30, accRate: "95%", points: 3640, recent: "2일 전" },
  { rank: 7, name: "최준호", id: "junho_c", academy: "분당 서현 리딩클럽", grade: "초등 5학년", books: 28, accRate: "91%", points: 3410, recent: "3일 전" },
  { rank: 8, name: "정예원", id: "yewon_j", academy: "판교 알파 독서학원", grade: "초등 4학년", books: 27, accRate: "93%", points: 3290, recent: "오늘 09:12" },
  { rank: 9, name: "윤하은", id: "haeun_y", academy: "송도 센트럴 리딩랩", grade: "초등 3학년", books: 26, accRate: "90%", points: 3150, recent: "어제 18:20" },
  { rank: 10, name: "강도윤", id: "doyun_k", academy: "대치 에듀 독서논술센터", grade: "초등 6학년", books: 25, accRate: "94%", points: 3080, recent: "오늘 10:05" },
  { rank: 11, name: "조수아", id: "sua_c", academy: "나노 독서아카데미 목동본원", grade: "초등 4학년", books: 24, accRate: "89%", points: 2950, recent: "3일 전" },
  { rank: 12, name: "서진우", id: "jinwoo_s", academy: "판교 알파 독서학원", grade: "중등 2학년", books: 23, accRate: "92%", points: 2880, recent: "어제 16:45" },
  { rank: 13, name: "배서윤", id: "seoyun_b", academy: "분당 서현 리딩클럽", grade: "초등 5학년", books: 22, accRate: "91%", points: 2790, recent: "어제 20:10" },
  { rank: 14, name: "한시우", id: "siwoo_h", academy: "나노 독서아카데미 목동본원", grade: "초등 3학년", books: 21, accRate: "93%", points: 2680, recent: "4일 전" },
  { rank: 15, name: "송지안", id: "jian_s", academy: "송도 센트럴 리딩랩", grade: "초등 6학년", books: 20, accRate: "88%", points: 2590, recent: "어제 14:30" },
  { rank: 16, name: "문건우", id: "gunwoo_m", academy: "대치 에듀 독서논술센터", grade: "중등 1학년", books: 20, accRate: "90%", points: 2510, recent: "오늘 08:50" },
  { rank: 17, name: "노유나", id: "yuna_n", academy: "판교 알파 독서학원", grade: "초등 4학년", books: 19, accRate: "91%", points: 2440, recent: "5일 전" },
  { rank: 18, name: "유재원", id: "jaewon_y", academy: "분당 서현 리딩클럽", grade: "초등 5학년", books: 19, accRate: "87%", points: 2380, recent: "어제 19:40" },
  { rank: 19, name: "권채원", id: "chaewon_k", academy: "나노 독서아카데미 목동본원", grade: "초등 2학년", books: 18, accRate: "95%", points: 2310, recent: "오늘 09:30" },
  { rank: 20, name: "안도현", id: "dohyun_a", academy: "대치 에듀 독서논술센터", grade: "초등 6학년", books: 18, accRate: "89%", points: 2260, recent: "2일 전" },
  { rank: 21, name: "오지훈", id: "jihoon_o", academy: "송도 센트럴 리딩랩", grade: "초등 5학년", books: 17, accRate: "88%", points: 2190, recent: "3일 전" },
  { rank: 22, name: "백서연", id: "seoyeon_b", academy: "나노 독서아카데미 목동본원", grade: "초등 4학년", books: 17, accRate: "90%", points: 2140, recent: "어제 17:15" },
  { rank: 23, name: "신우진", id: "woojin_s", academy: "판교 알파 독서학원", grade: "중등 2학년", books: 16, accRate: "86%", points: 2070, recent: "오늘 07:45" },
  { rank: 24, name: "고은채", id: "eunchae_k", academy: "분당 서현 리딩클럽", grade: "초등 3학년", books: 16, accRate: "92%", points: 2010, recent: "4일 전" },
  { rank: 25, name: "양현우", id: "hyunwoo_y", academy: "대치 에듀 독서논술센터", grade: "초등 5학년", books: 15, accRate: "89%", points: 1950, recent: "2일 전" },
  { rank: 26, name: "손아린", id: "arin_s", academy: "송도 센트럴 리딩랩", grade: "초등 4학년", books: 15, accRate: "87%", points: 1890, recent: "3일 전" },
  { rank: 27, name: "류민재", id: "minjae_r", academy: "나노 독서아카데미 목동본원", grade: "초등 6학년", books: 14, accRate: "91%", points: 1830, recent: "어제 22:00" },
  { rank: 28, name: "주은서", id: "eunseo_j", academy: "판교 알파 독서학원", grade: "초등 2학년", books: 14, accRate: "93%", points: 1780, recent: "오늘 10:20" },
  { rank: 29, name: "하승우", id: "seungwoo_h", academy: "분당 서현 리딩클럽", grade: "중등 1학년", books: 13, accRate: "85%", points: 1720, recent: "5일 전" },
  { rank: 30, name: "천예린", id: "yerin_c", academy: "대치 에듀 독서논술센터", grade: "초등 5학년", books: 13, accRate: "88%", points: 1670, recent: "어제 15:50" },
  { rank: 31, name: "방준혁", id: "junhyuk_b", academy: "나노 독서아카데미 목동본원", grade: "초등 4학년", books: 12, accRate: "90%", points: 1610, recent: "3일 전" },
  { rank: 32, name: "심지민", id: "jimin_s", academy: "송도 센트럴 리딩랩", grade: "초등 3학년", books: 12, accRate: "86%", points: 1560, recent: "오늘 08:15" },
  { rank: 33, name: "남유진", id: "yoojin_n", academy: "판교 알파 독서학원", grade: "초등 6학년", books: 11, accRate: "89%", points: 1500, recent: "2일 전" },
  { rank: 34, name: "도재혁", id: "jaehyuk_d", academy: "분당 서현 리딩클럽", grade: "중등 2학년", books: 11, accRate: "84%", points: 1450, recent: "4일 전" },
  { rank: 35, name: "성하율", id: "hayul_s", academy: "대치 에듀 독서논술센터", grade: "초등 1학년", books: 10, accRate: "95%", points: 1400, recent: "어제 18:00" },
  { rank: 36, name: "모지호", id: "jiho_m", academy: "나노 독서아카데미 목동본원", grade: "초등 5학년", books: 10, accRate: "87%", points: 1350, recent: "오늘 09:40" },
  { rank: 37, name: "우채린", id: "chaerin_w", academy: "송도 센트럴 리딩랩", grade: "초등 4학년", books: 10, accRate: "88%", points: 1300, recent: "3일 전" },
  { rank: 38, name: "탁준영", id: "junyoung_t", academy: "판교 알파 독서학원", grade: "초등 3학년", books: 9, accRate: "85%", points: 1250, recent: "2일 전" },
  { rank: 39, name: "채다온", id: "daon_c", academy: "분당 서현 리딩클럽", grade: "초등 2학년", books: 9, accRate: "91%", points: 1200, recent: "어제 20:45" },
  { rank: 40, name: "라원우", id: "wonwoo_r", academy: "대치 에듀 독서논술센터", grade: "초등 6학년", books: 9, accRate: "86%", points: 1160, recent: "5일 전" },
  { rank: 41, name: "피예준", id: "yejun_p", academy: "나노 독서아카데미 목동본원", grade: "초등 5학년", books: 8, accRate: "88%", points: 1110, recent: "어제 16:20" },
  { rank: 42, name: "설지안", id: "jian_s2", academy: "송도 센트럴 리딩랩", grade: "초등 4학년", books: 8, accRate: "84%", points: 1070, recent: "오늘 08:55" },
  { rank: 43, name: "변승현", id: "seunghyun_b", academy: "판교 알파 독서학원", grade: "중등 1학년", books: 8, accRate: "85%", points: 1030, recent: "3일 전" },
  { rank: 44, name: "진서하", id: "seoha_j", academy: "분당 서현 리딩클럽", grade: "초등 3학년", books: 7, accRate: "89%", points: 980, recent: "2일 전" },
  { rank: 45, name: "엄태민", id: "taemin_e", academy: "대치 에듀 독서논술센터", grade: "초등 5학년", books: 7, accRate: "83%", points: 940, recent: "4일 전" },
  { rank: 46, name: "표주원", id: "juwon_p", academy: "나노 독서아카데미 목동본원", grade: "초등 2학년", books: 7, accRate: "92%", points: 900, recent: "어제 19:10" },
  { rank: 47, name: "경다은", id: "daeun_k", academy: "송도 센트럴 리딩랩", grade: "초등 6학년", books: 6, accRate: "86%", points: 860, recent: "오늘 09:00" },
  { rank: 48, name: "제갈민", id: "min_j", academy: "판교 알파 독서학원", grade: "초등 4학년", books: 6, accRate: "82%", points: 820, recent: "5일 전" },
  { rank: 49, name: "길현우", id: "hyunwoo_g", academy: "분당 서현 리딩클럽", grade: "초등 5학년", books: 6, accRate: "85%", points: 780, recent: "2일 전" },
  { rank: 50, name: "복서진", id: "seojin_b", academy: "대치 에듀 독서논술센터", grade: "초등 3학년", books: 5, accRate: "88%", points: 740, recent: "3일 전" },
  { rank: 51, name: "원도윤", id: "doyun_w", academy: "나노 독서아카데미 목동본원", grade: "초등 1학년", books: 5, accRate: "90%", points: 700, recent: "어제 14:00" },
  { rank: 52, name: "사공민", id: "min_s", academy: "송도 센트럴 리딩랩", grade: "중등 1학년", books: 5, accRate: "81%", points: 660, recent: "4일 전" }
];

// 가맹 학원 랭킹 데이터
let academyRankingData = [
  { rank: 1, name: "대치 에듀 독서논술센터", region: "서울 강남구", students: 92, avgBooks: "21.4권", participation: "95.6%", points: 398500, badge: "최우수 가맹점" },
  { rank: 2, name: "나노 독서아카데미 목동본원", region: "서울 양천구", students: 48, avgBooks: "23.8권", participation: "98.2%", points: 232800, badge: "우수 가맹점" },
  { rank: 3, name: "분당 서현 리딩클럽", region: "경기 성남시", students: 68, avgBooks: "18.2권", participation: "91.0%", points: 214500, badge: "우수 가맹점" },
  { rank: 4, name: "송도 센트럴 리딩랩", region: "인천 연수구", students: 41, avgBooks: "19.5권", participation: "92.7%", points: 172600, badge: "일반 가맹점" },
  { rank: 5, name: "판교 알파 독서학원", region: "경기 성남시", students: 29, avgBooks: "17.1권", participation: "88.4%", points: 124300, badge: "일반 가맹점" }
];

function switchRankingType(type) {
  const btnStudent = document.getElementById("btn-rank-student");
  const btnAcademy = document.getElementById("btn-rank-academy");
  const tableStudent = document.getElementById("table-ranking-student");
  const tableAcademy = document.getElementById("table-ranking-academy");
  const filterBar = document.getElementById("rankingFilterBar");
  const paginationWrap = document.getElementById("rankingPaginationWrap");

  if (type === "student") {
    btnStudent.classList.add("active");
    btnAcademy.classList.remove("active");
    tableStudent.style.display = "";
    tableAcademy.style.display = "none";
    if (filterBar) filterBar.style.display = "flex";
    if (paginationWrap) paginationWrap.style.display = "flex";
  } else {
    btnStudent.classList.remove("active");
    btnAcademy.classList.add("active");
    tableStudent.style.display = "none";
    tableAcademy.style.display = "";
    if (filterBar) filterBar.style.display = "none";
    if (paginationWrap) paginationWrap.style.display = "none";
  }
}

function filterStudentRankings() {
  rankingCurrentPage = 1;
  renderRankings();
}

function resetRankingFilters() {
  if (document.getElementById("rankAcademyFilter")) document.getElementById("rankAcademyFilter").value = "ALL";
  if (document.getElementById("rankStudentSearchInput")) document.getElementById("rankStudentSearchInput").value = "";
  rankingCurrentPage = 1;
  renderRankings();
}

function renderRankings() {
  const acadFilter = document.getElementById("rankAcademyFilter")?.value || "ALL";
  const searchQ = (document.getElementById("rankStudentSearchInput")?.value || "").toLowerCase().trim();

  const filtered = allStudentRankings.filter(s => {
    const matchAcad = acadFilter === "ALL" || s.academy === acadFilter;
    const matchQ = !searchQ || s.name.toLowerCase().includes(searchQ) || s.id.toLowerCase().includes(searchQ);
    return matchAcad && matchQ;
  });

  // 상단 TOP 3 명예의 전당 카드 업데이트 (전체 원본 기준)
  if (allStudentRankings.length >= 3) {
    const top1 = allStudentRankings[0];
    const top2 = allStudentRankings[1];
    const top3 = allStudentRankings[2];
    if (document.getElementById("top1Name")) document.getElementById("top1Name").innerText = `${top1.name} 학생`;
    if (document.getElementById("top1Academy")) document.getElementById("top1Academy").innerText = `${top1.academy} (${top1.grade})`;
    if (document.getElementById("top1Points")) document.getElementById("top1Points").innerText = `${top1.points.toLocaleString()} P`;

    if (document.getElementById("top2Name")) document.getElementById("top2Name").innerText = `${top2.name} 학생`;
    if (document.getElementById("top2Academy")) document.getElementById("top2Academy").innerText = `${top2.academy} (${top2.grade})`;
    if (document.getElementById("top2Points")) document.getElementById("top2Points").innerText = `${top2.points.toLocaleString()} P`;

    if (document.getElementById("top3Name")) document.getElementById("top3Name").innerText = `${top3.name} 학생`;
    if (document.getElementById("top3Academy")) document.getElementById("top3Academy").innerText = `${top3.academy} (${top3.grade})`;
    if (document.getElementById("top3Points")) document.getElementById("top3Points").innerText = `${top3.points.toLocaleString()} P`;
  }

  // 총 카운트 바인딩
  const totalCountEl = document.getElementById("rankTotalCount");
  if (totalCountEl) totalCountEl.innerText = filtered.length;

  // 20개 페이징 슬라이싱
  const startIndex = (rankingCurrentPage - 1) * rankingPageSize;
  const pageData = filtered.slice(startIndex, startIndex + rankingPageSize);

  const studentTbody = document.getElementById("studentRankingBody");
  if (studentTbody) {
    if (pageData.length === 0) {
      studentTbody.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted">일치하는 학생 랭킹 내역이 없습니다.</td></tr>`;
    } else {
      studentTbody.innerHTML = pageData.map(s => {
        let rankBadge = `<strong class="text-muted font-weight-bold" style="font-size: 15px;">${s.rank}</strong>`;
        if (s.rank === 1) rankBadge = `<span style="font-size: 18px;" title="1위 금메달">🥇</span>`;
        else if (s.rank === 2) rankBadge = `<span style="font-size: 18px;" title="2위 은메달">🥈</span>`;
        else if (s.rank === 3) rankBadge = `<span style="font-size: 18px;" title="3위 동메달">🥉</span>`;

        return `
          <tr>
            <td class="text-center">${rankBadge}</td>
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

  // 페이징 네비게이션 렌더링
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

function renderRankingPagination(total, page) {
  const container = document.getElementById("rankingPagination");
  const infoEl = document.getElementById("rankingPageInfo");
  if (!container) return;

  const totalPages = Math.max(1, Math.ceil(total / rankingPageSize));
  const start = total === 0 ? 0 : (page - 1) * rankingPageSize + 1;
  const end = Math.min(page * rankingPageSize, total);

  if (infoEl) infoEl.innerText = `${start}-${end} / 총 ${total}명 (페이지 ${page}/${totalPages})`;

  let html = `
    <button class="btn btn-xs btn-outline-secondary" onclick="goRankingPage(${page - 1})" ${page <= 1 ? 'disabled' : ''} style="border-radius: 6px; padding: 4px 8px;">
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="btn btn-xs ${i === page ? 'btn-beige-primary text-white font-weight-bold' : 'btn-outline-secondary'}" 
              onclick="goRankingPage(${i})" style="border-radius: 6px; min-width: 28px; padding: 4px 8px;">
        ${i}
      </button>
    `;
  }

  html += `
    <button class="btn btn-xs btn-outline-secondary" onclick="goRankingPage(${page + 1})" ${page >= totalPages ? 'disabled' : ''} style="border-radius: 6px; padding: 4px 8px;">
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

function goRankingPage(p) {
  const totalPages = Math.ceil(allStudentRankings.length / rankingPageSize);
  if (p < 1 || p > totalPages) return;
  rankingCurrentPage = p;
  renderRankings();
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

  // 학생별 현실감 있는 상세 적립 내역 생성
  const historyData = [
    { date: "2026-09-17 08:30", book: "어린 왕자", type: "📖 완독 기본 점수", point: "+100 P", status: "적립완료" },
    { date: "2026-09-17 08:35", book: "어린 왕자", type: "🎯 객관식 문제 정답 (3문항)", point: "+9 P", status: "적립완료" },
    { date: "2026-09-17 08:38", book: "어린 왕자", type: "✍️ 주관식 문제 정답 (2문항)", point: "+6 P", status: "적립완료" },
    { date: "2026-09-17 08:42", book: "어린 왕자", type: "💡 생각 담기 작성 제출", point: "+5 P", status: "적립완료" },
    { date: "2026-09-17 08:43", book: "어린 왕자", type: "🌟 퀴즈 만점 보너스 가산점", point: "+20 P", status: "적립완료" },
    { date: "2026-09-14 17:10", book: "아몬드", type: "📖 완독 기본 점수", point: "+100 P", status: "적립완료" },
    { date: "2026-09-14 17:15", book: "아몬드", type: "🎯 객관식 문제 정답 (3문항)", point: "+9 P", status: "적립완료" },
    { date: "2026-09-14 17:20", book: "아몬드", type: "💡 생각 담기 작성 제출", point: "+5 P", status: "적립완료" },
    { date: "2026-09-10 19:40", book: "용선생의 시끌벅적 한국사", type: "📖 완독 기본 점수", point: "+100 P", status: "적립완료" }
  ];

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

// ==========================================
// 7. 마스터 콘텐츠 관리 모듈 (Master Content - 15개 페이징 및 신규 서지 스펙)
// ==========================================
let contentCurrentPage = 1;
const contentPageSize = 15;

function filterMasterContentList() {
  contentCurrentPage = 1;
  renderMasterContents();
}

function resetContentFilters() {
  if (document.getElementById("contentSearchInput")) document.getElementById("contentSearchInput").value = "";
  if (document.getElementById("contentAcademyFilter")) document.getElementById("contentAcademyFilter").value = "ALL";
  if (document.getElementById("contentGradeFilter")) document.getElementById("contentGradeFilter").value = "ALL";
  if (document.getElementById("contentCategoryFilter")) document.getElementById("contentCategoryFilter").value = "ALL";
  contentCurrentPage = 1;
  renderMasterContents();
}

function renderMasterContents() {
  const tbody = document.getElementById("masterContentTableBody");
  if (!tbody) return;

  const query = (document.getElementById("contentSearchInput")?.value || "").toLowerCase().trim();
  const academyFilter = document.getElementById("contentAcademyFilter")?.value || "ALL";
  const gradeFilter = document.getElementById("contentGradeFilter")?.value || "ALL";
  const catFilter = document.getElementById("contentCategoryFilter")?.value || "ALL";

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
      if (catFilter.startsWith("#")) {
        matchCat = (b.tags && b.tags.includes(catFilter)) || (b.detailTag && b.detailTag.includes(catFilter));
      } else {
        matchCat = b.category === catFilter || (b.tags && b.tags.includes(catFilter));
      }
    }

    return matchQuery && matchAcademy && matchGrade && matchCat;
  });

  const countEl = document.getElementById("contentFilteredCount");
  if (countEl) countEl.innerText = filtered.length;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" class="text-center py-5 text-muted">일치하는 마스터 도서가 없습니다.</td></tr>`;
    renderContentPagination(0, 1);
    return;
  }

  // 15개씩 페이징 슬라이싱
  const startIndex = (contentCurrentPage - 1) * contentPageSize;
  const pageData = filtered.slice(startIndex, startIndex + contentPageSize);

  tbody.innerHTML = pageData.map(b => {
    const isHq = !b.academyId || b.academyId === "HQ";
    const academyName = b.academyName || (isHq ? "본사 직속 (공용)" : "가맹 학원");
    const badgeHtml = isHq
      ? `<span class="badge-soft badge-soft-warning" style="font-weight: 700; white-space: nowrap;"><i class="fa-solid fa-crown mr-1"></i>본사 직속(HQ)</span>`
      : `<span class="badge-soft badge-soft-primary" style="font-weight: 700; white-space: nowrap;" title="${academyName}"><i class="fa-solid fa-school mr-1"></i>${academyName}</span>`;

    // 퀴즈 등록 여부 뱃지
    const hasQuizBadge = (b.hasQuiz || (b.quizzes && b.quizzes > 0))
      ? `<span class="badge-soft badge-soft-success font-weight-bold"><i class="fa-solid fa-circle-check mr-1"></i>${b.quizzes || 5}문항 완료</span>`
      : `<span class="badge-soft badge-soft-warn font-weight-bold"><i class="fa-solid fa-circle-exclamation mr-1"></i>퀴즈 미등록</span>`;

    // 공개 여부 토글 뱃지
    const isPublic = b.isPublic !== "N";
    const publicBadge = isPublic
      ? `<button class="btn btn-xs btn-outline-success font-weight-bold" onclick="toggleBookPublic('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 2px 8px;" title="클릭하여 비공개로 전환"><i class="fa-solid fa-eye mr-1"></i>공개</button>`
      : `<button class="btn btn-xs btn-outline-secondary font-weight-bold text-muted" onclick="toggleBookPublic('${b.id}')" style="border-radius: 6px; font-size: 11px; padding: 2px 8px;" title="클릭하여 가맹점 공개로 전환"><i class="fa-solid fa-eye-slash mr-1"></i>비공개</button>`;

    // 시리즈명 표시
    const seriesLabel = b.series && b.series !== "단권" ? `<span class="badge-soft badge-soft-neutral mr-1" style="font-size: 10.5px;">${b.series}</span>` : '';

    return `
      <tr>
        <td class="text-center">
          <img src="${b.cover}" alt="${b.title}" style="width: 44px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-medium);">
        </td>
        <td>
          <div class="font-weight-bold" style="font-size: 13.5px; color: var(--text-main);">
            ${seriesLabel}${b.title}
          </div>
          <small class="text-muted font-weight-bold">코드: ${b.id}</small>
        </td>
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
        <td class="text-center">
          ${publicBadge}
        </td>
        <!-- 찜 (숫자만 표시, 클릭 시 통계 모달) -->
        <td class="text-center">
          <span class="font-weight-bold text-danger" style="font-size: 13.5px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px;"
                title="클릭 시 '${b.title}' 찜 학년/성별 통계 모달 열기"
                onclick="openBookStatsModal('${b.id}', 'like')">
            ${b.likes || 0}
          </span>
        </td>
        <!-- 추천 (숫자만 표시, 클릭 시 통계 모달) -->
        <td class="text-center">
          <span class="font-weight-bold text-primary" style="font-size: 13.5px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px;"
                title="클릭 시 '${b.title}' 추천 학년/성별 통계 모달 열기"
                onclick="openBookStatsModal('${b.id}', 'recommend')">
            ${b.recommends || 0}
          </span>
        </td>
        <!-- 북퀴즈 완료 (숫자만 표시, 클릭 시 통계 모달) -->
        <td class="text-center">
          <span class="font-weight-bold text-success" style="font-size: 13.5px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px;"
                title="클릭 시 '${b.title}' 북퀴즈 완료 학년/성별 통계 모달 열기"
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

  let html = `
    <button class="btn btn-xs btn-outline-secondary" onclick="goContentPage(${page - 1})" ${page <= 1 ? 'disabled' : ''} style="border-radius: 6px; padding: 4px 8px;">
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="btn btn-xs ${i === page ? 'btn-beige-primary text-white font-weight-bold' : 'btn-outline-secondary'}" 
              onclick="goContentPage(${i})" style="border-radius: 6px; min-width: 28px; padding: 4px 8px;">
        ${i}
      </button>
    `;
  }

  html += `
    <button class="btn btn-xs btn-outline-secondary" onclick="goContentPage(${page + 1})" ${page >= totalPages ? 'disabled' : ''} style="border-radius: 6px; padding: 4px 8px;">
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

  const currentStatus = book.isPublic !== "N";
  book.isPublic = currentStatus ? "N" : "Y";
  const statusKor = book.isPublic === "Y" ? "공개 (전체 가맹점)" : "비공개 (전체 숨김)";
  showMasterToast(`'${book.title}' 도서가 [${statusKor}] 상태로 전환되었습니다.`);
  renderMasterContents();
}

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
    typeLabel = "북퀴즈 완료 학생 통계 분석";
    countTitle = "북퀴즈 완료 합계";
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
let editingBookSheetAddFile = { name: "나노_독서학습시트.pdf", size: "1.2 MB" };
let originalEditingBookIdForAdd = null;
let pendingDuplicateSaveBook = null;

// 생각담기 제시문 세트
const THINK_PROMPTS_NOVEL = [
  "주인공이 옆에 있다면 하고 싶은 이야기를 적어주세요.",
  "이 책을 읽고 가장 많이 떠오른 내 주변의 사람은 누구이며 그 이유는 무엇인가요?",
  "이야기는 끝났지만, 그 이후 어떤 일이 벌어졌는 지 상상해서 이야기를 만들어주세요.",
  "기억나는 장면이나 문장을 적어보세요.",
  "이 책에서 얻은 교훈이 있다면?",
  "가장 기억에 남는 등장인물은 누구이며 그 이유는 무엇인가요?",
  "이 책을 친구에게 추천한다면, 뭐라고 소개하고 싶은가요?"
];

const THINK_PROMPTS_NONFICTION = [
  "이 책을 읽고 생각난 사람은 누구이며 이유는 무엇인가요?",
  "이 책에서 가장 기억에 남은 내용은 무엇인가요?",
  "책을 읽고 새롭게 알게된 내용은 무엇인가요?",
  "이 책을 추천한다면 어떻게 설명하고 싶나요?"
];

function updateThinkPresets(cat2) {
  const select = document.getElementById("mbAddThinkPresetSelect");
  if (!select) return;

  const isNonfiction = cat2 === "비문학";
  const prompts = isNonfiction ? THINK_PROMPTS_NONFICTION : THINK_PROMPTS_NOVEL;

  select.innerHTML = prompts.map((p, i) => `
    <option value="${p}">${i + 1}. ${p}</option>
  `).join("");

  // 기본적으로 첫 번째 제시문을 textarea에 채움
  const textarea = document.getElementById("mbAddThinkInsert");
  if (textarea && prompts.length > 0) {
    textarea.value = prompts[0];
  }
}

function onCategory2Changed(cat2) {
  updateThinkPresets(cat2);
}

function applyThinkPresetToInput(val) {
  const textarea = document.getElementById("mbAddThinkInsert");
  if (textarea) textarea.value = val;
}

function switchThinkMode(mode) {
  const btnPreset = document.getElementById("btnThinkPromptPreset");
  const btnCustom = document.getElementById("btnThinkPromptCustom");
  const btnNone = document.getElementById("btnThinkPromptNone");
  const presetWrap = document.getElementById("thinkModePresetWrap");
  const customWrap = document.getElementById("thinkModeCustomWrap");
  const noneNotice = document.getElementById("thinkModeNoneNotice");

  btnPreset.classList.remove("active");
  btnCustom.classList.remove("active");
  btnNone.classList.remove("active");

  if (mode === "preset") {
    btnPreset.classList.add("active");
    presetWrap.style.display = "block";
    customWrap.style.display = "block";
    noneNotice.style.display = "none";
    const select = document.getElementById("mbAddThinkPresetSelect");
    if (select) applyThinkPresetToInput(select.value);
  } else if (mode === "custom") {
    btnCustom.classList.add("active");
    presetWrap.style.display = "none";
    customWrap.style.display = "block";
    noneNotice.style.display = "none";
  } else {
    btnNone.classList.add("active");
    presetWrap.style.display = "none";
    customWrap.style.display = "none";
    noneNotice.style.display = "block";
    const textarea = document.getElementById("mbAddThinkInsert");
    if (textarea) textarea.value = "";
  }
}

function toggleSingleBookCheckbox(isSingle) {
  const seriesInput = document.getElementById("mbAddSeries");
  if (seriesInput) {
    seriesInput.disabled = isSingle;
    if (isSingle) {
      seriesInput.value = "";
      seriesInput.placeholder = "단권으로 지정되었습니다.";
    } else {
      seriesInput.placeholder = "예: 해리포터 시리즈, 한국사 편지";
    }
  }
}

function generateNewBookId() {
  let maxNum = 0;
  masterBooks.forEach(b => {
    if (b.id && b.id.startsWith("MB-")) {
      const num = parseInt(b.id.replace("MB-", ""), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });
  const newNum = String(maxNum + 1).padStart(3, "0");
  const newId = `MB-${newNum}`;
  const idInput = document.getElementById("mbAddId");
  if (idInput) idInput.value = newId;
  showMasterToast(`신규 도서 관리 코드 [${newId}]가 자동 발급되었습니다.`);
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

function fetchMasterBookByIsbnForAdd() {
  const isbnInput = document.getElementById("mbAddIsbn");
  let isbn = (isbnInput ? isbnInput.value : "").replace(/-/g, "").trim();
  const btn = document.getElementById("btnIsbnFetchAdd");

  if (!isbn) {
    isbn = "9788932917245";
    if (isbnInput) isbnInput.value = isbn;
  }

  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>조회중...';
    btn.disabled = true;
  }

  setTimeout(() => {
    const isbnMap = {
      "9788932917245": {
        title: "어린 왕자",
        author: "앙투안 드 생텍쥐페리",
        publisher: "열린책들",
        grade: "초등 5학년",
        cat1: "외서",
        cat2: "소설",
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&q=80"
      },
      "9788936434120": {
        title: "아몬드",
        author: "손원평",
        publisher: "창비",
        grade: "중등 2학년",
        cat1: "국내서",
        cat2: "소설",
        cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=150&q=80"
      }
    };

    const data = isbnMap[isbn] || {
      title: `[ISBN-${isbn.slice(-4)}] 신규 도서`,
      author: "국립중앙도서관 수록 작가",
      publisher: "나노교육출판",
      grade: "초등 5학년",
      cat1: "국내서",
      cat2: "소설",
      cover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150&q=80"
    };

    document.getElementById("mbAddTitle").value = data.title;
    document.getElementById("mbAddAuthor").value = data.author;
    document.getElementById("mbAddPublisher").value = data.publisher;
    document.getElementById("mbAddGrade").value = data.grade;
    document.getElementById("mbAddCat1").value = data.cat1;
    document.getElementById("mbAddCat2").value = data.cat2;
    onCategory2Changed(data.cat2);
    document.getElementById("mbAddCover").value = data.cover;
    updateAddCoverPreview(data.cover);

    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>조회 완료';
      btn.disabled = false;
      setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-1"></i>ISBN 조회';
      }, 2000);
    }
    showMasterToast(`[ISBN: ${isbn}] 서지정보가 자동 입력되었습니다.`);
  }, 400);
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

  // 시리즈명 & 단권
  const isSingle = isNew ? false : (book.isSingle || book.series === "단권");
  document.getElementById("mbAddIsSingle").checked = isSingle;
  toggleSingleBookCheckbox(isSingle);
  document.getElementById("mbAddSeries").value = (book && book.series && book.series !== "단권") ? book.series : "";

  // 카테고리 1, 카테고리 2
  const cat1 = (book && book.cat1) ? book.cat1 : "국내서";
  const cat2 = (book && book.cat2) ? book.cat2 : "소설";
  document.getElementById("mbAddCat1").value = cat1;
  document.getElementById("mbAddCat2").value = cat2;

  // 권장 학년 (초1~중3)
  document.getElementById("mbAddGrade").value = (book && book.grade) ? book.grade : "초등 5학년";

  // 세부 태그, 어워드, 생각꺼내기
  document.getElementById("mbAddDetailTag").value = (book && book.detailTag) ? book.detailTag : "";
  document.getElementById("mbAddAwards").value = (book && book.awards) ? book.awards : "";
  document.getElementById("mbAddThinkExtract").value = (book && book.thinkExtract) ? book.thinkExtract : "";

  // 생각 담기
  updateThinkPresets(cat2);
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
  const detailTag = document.getElementById("mbAddDetailTag").value.trim();
  const awards = document.getElementById("mbAddAwards").value.trim();
  const thinkExtract = document.getElementById("mbAddThinkExtract").value.trim();
  const thinkInsert = document.getElementById("mbAddThinkInsert").value.trim();
  let cover = document.getElementById("mbAddCover").value.trim();

  // 선택된 주제 태그들 수집
  const tagCheckboxes = document.querySelectorAll('input[name="mbAddTags"]:checked');
  const tags = Array.from(tagCheckboxes).map(cb => cb.value);

  if (!cover) {
    cover = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&q=80";
  }

  const bookData = {
    id: id || `MB-00${masterBooks.length + 1}`,
    isbn: isbn,
    isPublic: isPublic,
    title: title,
    isSingle: isSingle,
    series: series,
    author: author,
    publisher: publisher,
    cat1: cat1,
    cat2: cat2,
    category: cat2 === "비문학" ? "과학" : "문학",
    grade: grade,
    tags: tags.length > 0 ? tags : ["문학"],
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

function saveBookDataDirectly(bookData) {
  if (originalEditingBookIdForAdd) {
    // 수정 모드
    const idx = masterBooks.findIndex(b => b.id === originalEditingBookIdForAdd);
    if (idx !== -1) {
      masterBooks[idx] = { ...masterBooks[idx], ...bookData, id: originalEditingBookIdForAdd };
    }
    showMasterToast(`[${bookData.title}] 도서 서지 정보가 성공적으로 수정되었습니다.`);
  } else {
    // 신규 등록 모드
    masterBooks.unshift(bookData);
    showMasterToast(`신규 도서 [${bookData.title}] (코드: ${bookData.id})이 등록되었습니다! 리스트에서 [북퀴즈]를 생성할 수 있습니다.`);
  }

  $('#masterBookAddModal').modal('hide');
  renderMasterContents();
}

function deleteMasterBook(id) {
  const book = masterBooks.find(b => b.id === id);
  const name = book ? book.title : "도서";
  masterBooks = masterBooks.filter(b => b.id !== id);
  showMasterToast(`'${name}' 도서가 라이브러리에서 삭제되었습니다.`);
  renderMasterContents();
}

// ==========================================
// 독립 북퀴즈 모달 제어 로직 (문항별 객관식 / 주관식 지원)
// ==========================================
let curQuizTargetBookId = null;
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

// 북퀴즈 모달 열기
function openMasterQuizModal(bookId) {
  const book = masterBooks.find(b => b.id === bookId);
  if (!book) return;

  curQuizTargetBookId = bookId;

  // 도서 기본 정보 바인딩
  document.getElementById("mqTargetBookCover").src = book.cover;
  document.getElementById("mqTargetBookTitle").innerText = book.title;
  document.getElementById("mqTargetBookGrade").innerText = book.grade || "권장 학년";
  document.getElementById("mqTargetBookAuthor").innerHTML = `저자: ${book.author} | 출판사: ${book.publisher} | 관리코드: <span id="mqTargetBookId">${book.id}</span>`;

  // 기존 퀴즈 문항 로드 (없으면 기본 세트 생성)
  if (book.quizList && Array.isArray(book.quizList) && book.quizList.length > 0) {
    currentQuizQuestions = JSON.parse(JSON.stringify(book.quizList));
  } else {
    currentQuizQuestions = [
      {
        type: "CHOICE",
        question: `[${book.title}] 1. 도서의 중심 인물과 배경에 대한 올바른 설명은 무엇인가요?`,
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
        subjectiveAns: "성장",
        similarAns: "마음의 성장, 자아 성장",
        hint: "주인공의 내면 변화를 나타내는 두 글자 단어입니다."
      },
      {
        type: "CHOICE",
        question: `[${book.title}] 3. 작가가 이 책을 통해 독자에게 전달하고자 한 가장 중요한 교훈이나 가치는 무엇인가요?`,
        opt1: "진정한 배려와 공감, 따뜻한 마음의 가치",
        opt2: "물질적 성공과 이기적인 태도",
        opt3: "규칙을 무조건 어기는 용기",
        opt4: "혼자만의 이익을 추구하는 삶",
        ans: "1",
        hint: "작가의 말 또는 책의 결말 후기를 참고하세요."
      }
    ];
  }

  curQuizQuestionIdx = 0;
  renderQuizTabButtons();
  loadCurrentQuizQuestionForm();

  $('#masterQuizModal').modal('show');
}

function renderQuizTabButtons() {
  const container = document.getElementById("mqTabButtons");
  if (!container) return;

  const badge = document.getElementById("mqQuizCountBadge");
  if (badge) badge.innerText = `총 ${currentQuizQuestions.length}문항 구성됨`;

  container.innerHTML = currentQuizQuestions.map((q, idx) => {
    const isChoice = (q.type || "CHOICE") === "CHOICE";
    const typeIcon = isChoice ? "🎯" : "✍️";
    return `
      <button type="button" class="quiz-num-pill ${idx === curQuizQuestionIdx ? 'active' : ''}" onclick="switchQuizQuestionItem(${idx})">
        ${typeIcon} ${idx + 1}번 문항
      </button>
    `;
  }).join("");

  const btnDel = document.getElementById("btnDeleteQuizQuestion");
  if (btnDel) {
    btnDel.style.display = currentQuizQuestions.length > 1 ? "inline-block" : "none";
  }
}

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
    titleEl.innerHTML = `<i class="fa-solid fa-circle-question text-warning mr-1"></i>문제 ${curQuizQuestionIdx + 1}번 문항 설정 (${isChoice ? '4지선다 객관식' : '주관식 단답/서술'})`;
  }

  document.getElementById("mqQuestionText").value = q.question || "";
  document.getElementById("mqQuizHint").value = q.hint || "";

  if (isChoice) {
    document.getElementById("mqOpt1").value = q.opt1 || "";
    document.getElementById("mqOpt2").value = q.opt2 || "";
    document.getElementById("mqOpt3").value = q.opt3 || "";
    document.getElementById("mqOpt4").value = q.opt4 || "";

    const ansVal = q.ans || "1";
    const radio = document.querySelector(`input[name="mqChoiceCorrect"][value="${ansVal}"]`);
    if (radio) radio.checked = true;
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
    q.opt1 = document.getElementById("mqOpt1")?.value || "";
    q.opt2 = document.getElementById("mqOpt2")?.value || "";
    q.opt3 = document.getElementById("mqOpt3")?.value || "";
    q.opt4 = document.getElementById("mqOpt4")?.value || "";
    q.ans = document.querySelector('input[name="mqChoiceCorrect"]:checked')?.value || "1";
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
    opt1: "1번 선택지",
    opt2: "2번 선택지",
    opt3: "3번 선택지",
    opt4: "4번 선택지",
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

function handleSaveMasterQuizOnly() {
  saveCurrentQuizDraft();

  const book = masterBooks.find(b => b.id === curQuizTargetBookId);
  if (!book) return;

  book.quizList = JSON.parse(JSON.stringify(currentQuizQuestions));
  book.quizzes = currentQuizQuestions.length;
  book.hasQuiz = currentQuizQuestions.length > 0;

  showMasterToast(`'${book.title}' 도서의 북퀴즈(${currentQuizQuestions.length}문항) 구성이 완료되었습니다!`);
  $('#masterQuizModal').modal('hide');
  renderMasterContents();
}

function openExcelUploadModal() {
  showMasterToast("엑셀 대량 도서 등록 템플릿(CI3 quiz-excel-pop 규격) 모달이 호출되었습니다.");
}

// ==========================================
// 8. 카톡 발송 내역 모듈 (Aligo Dispatch)
// ==========================================
function renderDispatchTable(data = dispatchLogs) {
  const tbody = document.getElementById("dispatchTableBody");
  if (!tbody) return;

  document.getElementById("dispatchFilteredCount").innerText = data.length;

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

function retryDispatch(id) {
  const log = dispatchLogs.find(l => l.id === id);
  if (!log) return;

  log.status = "SUCCESS";
  log.code = "0000 (재전송 성공)";
  log.datetime = new Date().toISOString().replace("T", " ").substring(0, 19);

  renderDispatchTable();
  showMasterToast(`[${log.receiverName}] 님에게 알림톡이 성공적으로 재전송되었습니다.`);
}

function testAligoConnection() {
  showMasterToast("알리고(Aligo) SMS/알림톡 API 서버와 200 OK 응답을 확인했습니다.");
}

function openAligoChargeModal() {
  $('#aligoChargeModal').modal('show');
}

function processAligoCharge() {
  const amount = parseInt(document.getElementById("chargeAmountSelect").value, 10);
  aligoCash += amount;

  const formatted = aligoCash.toLocaleString() + "원";
  document.getElementById("sidebarAligoCash").innerText = formatted;
  document.getElementById("statAligoCash").innerHTML = `${aligoCash.toLocaleString()}<span style="font-size: 14px; font-weight: 600; margin-left: 2px;">원</span>`;

  $('#aligoChargeModal').modal('hide');
  showMasterToast(`알리고 캐시 ${amount.toLocaleString()}원이 성공적으로 충전되었습니다.`);
}

// 학생 체험 뷰
function previewStudentPortal() {
  showMasterToast("학생 페이지(Student Portal)는 3단계에서 배정 도서 및 북퀴즈 풀이 화면으로 연결됩니다.");
}

function exportPlatformData() {
  showMasterToast("플랫폼 전체 가맹점 및 콘텐츠 백업 데이터 아카이브가 생성되었습니다.");
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

let masterPaymentList = [
  {
    id: "PAY-20260916-001",
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
    method: "신용카드 (모의신청)",
    date: "2026-09-16 14:20:00",
    startDate: "2026-09-16",
    endDate: "2027-03-16",
    status: "pending", // pending | paid | cancelled | refunded
    memo: "원장님 웹페이지 결제 신청 건. 계약 연장 수동 승인 대기 중."
  },
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
    method: "실시간 계좌이체",
    date: "2026-09-01 09:12:30",
    startDate: "2026-09-01",
    endDate: "2027-08-31",
    status: "paid",
    memo: "2026-09-01 연간 VIP 라이선스 승인 완료."
  },
  {
    id: "PAY-20260820-003",
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
    date: "2026-08-20 10:15:22",
    startDate: "2026-08-20",
    endDate: "2026-09-19",
    status: "paid",
    memo: "정기구독 8월분 정상 자동 승인. 만료 D-3 알림 발송."
  },
  {
    id: "PAY-20260810-004",
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
    memo: "가맹점 1학기 특별 할인 적용 승인."
  },
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
    method: "가상계좌",
    date: "2026-07-15 15:00:22",
    startDate: "2026-07-15",
    endDate: "2026-08-14",
    status: "cancelled",
    memo: "원장님 요청으로 계좌이체 재신청 건 취소 처리."
  },
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
    memo: "연간 패키지 20% 할인 프로모션 적용."
  }
];

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
    // 인라인 상태 셀렉트
    const statusSelect = `
      <select class="select-beige form-control-sm py-0 font-weight-bold text-center" 
        onchange="updatePaymentStatusInline('${item.id}', this.value)" 
        style="height: 30px; font-size: 11.5px; border-radius: 8px; ${
          item.status === 'paid' ? 'color:#2f5436; background:#eaf0eb;' :
          item.status === 'pending' ? 'color:#8c531b; background:#faf3e8;' :
          'color:#962a22; background:#fbeae8;'
        }">
        <option value="paid" ${item.status === 'paid' ? 'selected' : ''}>완료</option>
        <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>대기</option>
        <option value="cancelled" ${item.status === 'cancelled' ? 'selected' : ''}>취소</option>
        <option value="refunded" ${item.status === 'refunded' ? 'selected' : ''}>환불</option>
      </select>
    `;

    return `
      <tr style="font-size: 13px;">
        <td class="text-center font-weight-bold text-muted" style="font-size: 11.5px;">${item.id}</td>
        <td>
          <div class="font-weight-bold" style="color: var(--text-main); font-size: 13.5px;">${item.academyName}</div>
          <small class="text-muted"><i class="fa-solid fa-user-tie mr-1"></i>${item.director} (${item.phone})</small>
        </td>
        <td>
          <span class="badge-soft badge-soft-neutral font-weight-bold">${item.planName}</span>
        </td>
        <td class="text-right">${item.supply.toLocaleString()}원</td>
        <td class="text-right text-muted">${item.vat.toLocaleString()}원</td>
        <td class="text-right font-weight-bold" style="color: #962a22; font-size: 14px;">${item.total.toLocaleString()}원</td>
        <td class="text-center"><small class="text-muted">${item.method}</small></td>
        <td class="text-center"><small class="text-muted">${item.date}</small></td>
        <td class="text-center"><small class="badge badge-light border">${item.startDate} ~ ${item.endDate}</small></td>
        <td class="text-center">${statusSelect}</td>
        <td class="text-center">
          <button class="btn btn-xs btn-outline-secondary" onclick="openMasterPaymentDetailModal('${item.id}')" style="border-radius: 6px; font-size: 11px; padding: 4px 8px;">
            <i class="fa-solid fa-pen-to-square mr-1"></i>상세/메모
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// 가맹 학원 필터 옵션 채우기
function populateMasterPaymentAcademyFilter() {
  const select = document.getElementById("masterPaymentAcademyFilter");
  if (!select) return;

  const currentVal = select.value;
  const academies = [...new Set(masterPaymentList.map(p => p.academyName))];

  select.innerHTML = `<option value="ALL">전체 가맹 학원</option>` + 
    academies.map(name => `<option value="${name}">${name}</option>`).join("");

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

  const totalRevenue = paidItems.reduce((acc, cur) => acc + cur.total, 0);

  const revEl = document.getElementById("kpiMonthTotalRevenue");
  if (revEl) revEl.innerHTML = `${totalRevenue.toLocaleString()}<span style="font-size: 16px; font-weight: normal; margin-left: 2px;">원</span>`;

  const paidCountEl = document.getElementById("kpiPaidCount");
  if (paidCountEl) paidCountEl.innerHTML = `${paidItems.length}<span style="font-size: 16px; font-weight: normal; margin-left: 2px;">건</span>`;

  const pendingCountEl = document.getElementById("kpiPendingCount");
  if (pendingCountEl) pendingCountEl.innerHTML = `${pendingItems.length}<span style="font-size: 16px; font-weight: normal; margin-left: 2px;">건</span>`;
}

// 인라인 상태 변경 핸들러
function updatePaymentStatusInline(payId, newStatus) {
  const item = masterPaymentList.find(p => p.id === payId);
  if (!item) return;

  const oldStatus = item.status;
  item.status = newStatus;

  updatePaymentKpis();
  renderMasterPaymentTable();

  const statusKor = newStatus === 'paid' ? '결제 완료' :
                    newStatus === 'pending' ? '결제 대기' :
                    newStatus === 'cancelled' ? '결제 취소' : '환불 완료';

  showMasterToast(`[${item.academyName}] 결제건(${payId}) 상태가 '${statusKor}'(으)로 변경되었습니다.`);
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

  $("#masterPaymentDetailModal").modal("show");
}

// 상세 모달에서 상태 및 관리자 메모 저장
function saveMasterPaymentDetail() {
  const payId = document.getElementById("modalDetailPayId").value;
  const item = masterPaymentList.find(p => p.id === payId);
  if (!item) return;

  const newStatus = document.getElementById("modalDetailStatusSelect").value;
  const newMemo = document.getElementById("modalDetailAdminMemo").value;

  item.status = newStatus;
  item.memo = newMemo;

  updatePaymentKpis();
  renderMasterPaymentTable();

  $("#masterPaymentDetailModal").modal("hide");
  showMasterToast(`[${item.academyName}] 결제 정보 및 관리자 메모가 저장되었습니다.`);
}

// 수동 결제 등록 모의창
function openSimulateNewPaymentModal() {
  const acad = franchiseList[0];
  if (!acad) return;

  const now = new Date();
  const pad = n => n < 10 ? '0' + n : n;
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const startDate = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const endObj = new Date(now);
  endObj.setMonth(endObj.getMonth() + 6);
  const endDate = `${endObj.getFullYear()}-${pad(endObj.getMonth()+1)}-${pad(endObj.getDate())}`;

  const newPayment = {
    id: `PAY-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${Math.floor(100 + Math.random()*900)}`,
    academyId: acad.id,
    academyName: acad.name,
    director: acad.director,
    phone: acad.phone,
    bizNumber: acad.bizNumber,
    planType: "6month",
    planName: "6개월 이용권 (10% 할인)",
    supply: 540000,
    vat: 54000,
    total: 594000,
    method: "가상계좌 (수동 수납)",
    date: dateStr,
    startDate: startDate,
    endDate: endDate,
    status: "paid",
    memo: "본사 관리자 수동 수납 등록 건."
  };

  masterPaymentList.unshift(newPayment);
  updatePaymentKpis();
  renderMasterPaymentTable();
  showMasterToast(`새 수납 결제건(${newPayment.id})이 등록되었습니다.`);
}

// 엑셀 다운로드 안내
function exportPaymentData() {
  showMasterToast("전체 가맹 학원 결제 내역 엑셀 파일(XLSX)이 생성되어 다운로드되었습니다.");
}

