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
    phone: "010-3342-9981",
    region: "서울 양천구",
    startDate: "2025-03-01",
    endDate: "2026-12-31",
    currentStudents: 48,
    maxStudents: 50,
    monthlyFee: "330,000원",
    paymentStatus: "PAID", // PAID | UNPAID
    status: "ACTIVE"       // ACTIVE | EXPIRING | PAUSED | TERMINATED
  },
  {
    id: "ACAD-002",
    name: "대치 에듀 독서논술센터",
    bizNumber: "214-82-67890",
    director: "박진수 원장",
    phone: "010-8871-2311",
    region: "서울 강남구",
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
    phone: "010-5541-0982",
    region: "인천 연수구",
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
    phone: "010-4490-1123",
    region: "경기 성남시",
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
    phone: "010-7712-4456",
    region: "경기 성남시",
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
    phone: "010-6632-7789",
    region: "부산 해운대구",
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
    phone: "010-9923-5561",
    region: "광주 남구",
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
    phone: "010-2213-9900",
    region: "대전 서구",
    startDate: "2024-11-01",
    endDate: "2025-10-31",
    currentStudents: 18,
    maxStudents: 50,
    monthlyFee: "330,000원",
    paymentStatus: "PAID",
    status: "PAUSED"
  }
];

// 1-2. 통합 회원 데이터 (Universal Members)
let memberList = [
  { id: 101, academyId: "ACAD-001", academyName: "나노 독서아카데미 목동본원", role: "DIRECTOR", name: "김은영", username: "director_mokdong", grade: "원장", phone: "010-3342-9981", points: 0, lastLogin: "2026-09-09 08:45", status: "NORMAL" },
  { id: 102, academyId: "ACAD-001", academyName: "나노 독서아카데미 목동본원", role: "TEACHER", name: "송지민", username: "teacher_song", grade: "초등전담", phone: "010-5512-8871", points: 0, lastLogin: "2026-09-09 09:10", status: "NORMAL" },
  { id: 103, academyId: "ACAD-001", academyName: "나노 독서아카데미 목동본원", role: "STUDENT", name: "김태윤", username: "taeyoon_k", grade: "초6 (소나무반)", phone: "010-2211-9981", points: 4850, lastLogin: "2026-09-08 20:30", status: "NORMAL" },
  { id: 104, academyId: "ACAD-001", academyName: "나노 독서아카데미 목동본원", role: "STUDENT", name: "이민우", username: "minwoo_lee", grade: "초5 (매화반)", phone: "010-3388-1122", points: 3920, lastLogin: "2026-09-08 19:15", status: "NORMAL" },
  { id: 105, academyId: "ACAD-001", academyName: "나노 독서아카데미 목동본원", role: "STUDENT", name: "박소율", username: "soyul_p", grade: "초4 (난초반)", phone: "010-7788-9900", points: 3640, lastLogin: "2026-09-07 18:40", status: "NORMAL" },
  
  { id: 201, academyId: "ACAD-002", academyName: "대치 에듀 독서논술센터", role: "DIRECTOR", name: "박진수", username: "director_daechi", grade: "원장", phone: "010-8871-2311", points: 0, lastLogin: "2026-09-08 22:10", status: "NORMAL" },
  { id: 202, academyId: "ACAD-002", academyName: "대치 에듀 독서논술센터", role: "TEACHER", name: "정다은", username: "teacher_jung", grade: "중등전담", phone: "010-6622-1134", points: 0, lastLogin: "2026-09-09 08:30", status: "NORMAL" },
  { id: 203, academyId: "ACAD-002", academyName: "대치 에듀 독서논술센터", role: "STUDENT", name: "이서현", username: "seohyun_l", grade: "초5 (심화반)", phone: "010-4499-1122", points: 4520, lastLogin: "2026-09-08 21:05", status: "NORMAL" },
  { id: 204, academyId: "ACAD-002", academyName: "대치 에듀 독서논술센터", role: "STUDENT", name: "장민재", username: "minjae_j", grade: "중1 (논술A)", phone: "010-1122-3344", points: 3890, lastLogin: "2026-09-07 19:20", status: "NORMAL" },
  
  { id: 301, academyId: "ACAD-003", academyName: "송도 센트럴 리딩랩", role: "DIRECTOR", name: "최윤정", username: "director_songdo", grade: "원장", phone: "010-5541-0982", points: 0, lastLogin: "2026-09-08 17:50", status: "NORMAL" },
  { id: 302, academyId: "ACAD-003", academyName: "송도 센트럴 리딩랩", role: "STUDENT", name: "박지우", username: "jiwoo_p", grade: "초6 (마스터반)", phone: "010-9988-7766", points: 4210, lastLogin: "2026-09-08 22:40", status: "NORMAL" },
  { id: 303, academyId: "ACAD-003", academyName: "송도 센트럴 리딩랩", role: "STUDENT", name: "강도현", username: "dohyun_k", grade: "초3 (기초반)", phone: "010-3344-5566", points: 2150, lastLogin: "2026-08-25 15:10", status: "PAUSED" }
];

// 1-3. 운영 관리 배너 데이터 (Rolling Banners)
let bannerList = [
  {
    id: 1,
    title: "9월 나노 독서왕 챌린지 🏆",
    sub: "이번 달 3권 이상 완독하고 골드 뱃지를 획득하세요!",
    imageUrl: "upload/banner/banner_reading_king.jpg",
    bgTheme: "linear-gradient(135deg, #7a6348, #4a3b32)",
    order: 1,
    active: "Y"
  },
  {
    id: 2,
    title: "상상력 쑥쑥! 나노 시트 개편 🌿",
    sub: "새로워진 독서 생각담기 양식으로 내 생각을 표현해보세요.",
    imageUrl: "upload/banner/banner_nanosheet.jpg",
    bgTheme: "linear-gradient(135deg, #4b6b55, #2f5436)",
    order: 2,
    active: "Y"
  },
  {
    id: 3,
    title: "전국 학생 랭킹 실시간 집계 오픈 🌟",
    sub: "내가 속한 학원의 친구들과 전국 친구들의 독서 포인트를 확인해요.",
    imageUrl: "upload/banner/banner_ranking.jpg",
    bgTheme: "linear-gradient(135deg, #8c6d48, #d4a373)",
    order: 3,
    active: "Y"
  }
];

// 1-4. 추천 도서 큐레이션 테마 (도서 ID 매핑 연동)
let themeList = [
  {
    id: 1,
    title: "이달의 나노 북클럽",
    tag: "초등 전학년",
    desc: "생각하는 힘과 문해력을 키워주는 9월 필수 도서 세트",
    bookIds: ["MB-001", "MB-003", "MB-004", "MB-007", "MB-011", "MB-014"],
    active: "Y"
  },
  {
    id: 2,
    title: "초등 교과연계 역사 탐구",
    tag: "초등 5~6학년",
    desc: "한국사 흐름을 재미있는 이야기와 인물로 풀어낸 필독 도서",
    bookIds: ["MB-009", "MB-010", "MB-004", "MB-006"],
    active: "Y"
  },
  {
    id: 3,
    title: "미래를 여는 과학 & 환경",
    tag: "초등 3~6학년",
    desc: "기후 변화와 인공지능 시대를 이해하는 흥미진진 과학책",
    bookIds: ["MB-005", "MB-008", "MB-012", "MB-016"],
    active: "Y"
  },
  {
    id: 4,
    title: "마음을 키우는 인문 문학 여행",
    tag: "중등 전학년",
    desc: "자아 정체성과 타인에 대한 공감을 넓히는 명작 문학선",
    bookIds: ["MB-001", "MB-002", "MB-006", "MB-015"],
    active: "Y"
  }
];

// 1-5. 마스터 콘텐츠 도서 라이브러리 풀 (Central Books Pool & Academy Created Books)
let masterBooks = [
  { id: "MB-001", title: "어린 왕자", author: "앙투안 드 생텍쥐페리", publisher: "열린책들", grade: "초등 5~6학년", category: "문학", academyId: "HQ", academyName: "본사 직속 (공용)", creatorType: "HQ", quizzes: 5, sheet: true, date: "2025-01-10", cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&q=80" },
  { id: "MB-002", title: "아몬드", author: "손원평", publisher: "창비", grade: "중등 1~3학년", category: "문학", academyId: "HQ", academyName: "본사 직속 (공용)", creatorType: "HQ", quizzes: 5, sheet: true, date: "2025-01-15", cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=150&q=80" },
  { id: "MB-003", title: "마당을 나온 암탉", author: "황선미", publisher: "사계절", grade: "초등 3~4학년", category: "문학", academyId: "HQ", academyName: "본사 직속 (공용)", creatorType: "HQ", quizzes: 5, sheet: true, date: "2025-02-01", cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=150&q=80" },
  { id: "MB-004", title: "자전거 도둑", author: "박완서", publisher: "다림", grade: "초등 5~6학년", category: "문학", academyId: "ACAD-001", academyName: "나노 목동본원", creatorType: "ACADEMY", quizzes: 5, sheet: true, date: "2025-02-10", cover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150&q=80" },
  { id: "MB-005", title: "지구의 마지막 환경 수업", author: "남성현", publisher: "동아시아", grade: "초등 5~6학년", category: "과학", academyId: "ACAD-002", academyName: "대치 에듀센터", creatorType: "ACADEMY", quizzes: 5, sheet: true, date: "2025-03-05", cover: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=150&q=80" },
  { id: "MB-006", title: "정의란 무엇인가 (주니어)", author: "마이클 샌델", publisher: "와이즈베리", grade: "중등 1~3학년", category: "사회", academyId: "HQ", academyName: "본사 직속 (공용)", creatorType: "HQ", quizzes: 5, sheet: true, date: "2025-04-12", cover: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=150&q=80" },
  { id: "MB-007", title: "만복이네 떡집", author: "김리리", publisher: "비룡소", grade: "초등 1~2학년", category: "문학", academyId: "ACAD-003", academyName: "송도 센트럴랩", creatorType: "ACADEMY", quizzes: 5, sheet: true, date: "2025-05-20", cover: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=150&q=80" },
  { id: "MB-008", title: "십 대를 위한 과학 읽기", author: "정재승 외", publisher: "동아엠앤비", grade: "중등 1~3학년", category: "과학", academyId: "HQ", academyName: "본사 직속 (공용)", creatorType: "HQ", quizzes: 5, sheet: true, date: "2025-06-18", cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=150&q=80" },
  { id: "MB-009", title: "한국사 편지 (1권)", author: "박은봉", publisher: "웅진주니어", grade: "초등 5~6학년", category: "역사", academyId: "ACAD-004", academyName: "판교 알파학원", creatorType: "ACADEMY", quizzes: 5, sheet: true, date: "2025-07-02", cover: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=150&q=80" },
  { id: "MB-010", title: "용선생의 시끌벅적 한국사", author: "금현경 외", publisher: "사회평론", grade: "초등 5~6학년", category: "역사", academyId: "ACAD-001", academyName: "나노 목동본원", creatorType: "ACADEMY", quizzes: 5, sheet: true, date: "2025-07-15", cover: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=150&q=80" },
  { id: "MB-011", title: "이상한 과자 가게 전천당", author: "히로시마 레이코", publisher: "길벗스쿨", grade: "초등 3~4학년", category: "문학", academyId: "ACAD-002", academyName: "대치 에듀센터", creatorType: "ACADEMY", quizzes: 5, sheet: true, date: "2025-08-01", cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150&q=80" },
  { id: "MB-012", title: "수학도둑 (심화편)", author: "송도수", publisher: "서울문화사", grade: "초등 3~4학년", category: "과학", academyId: "HQ", academyName: "본사 직속 (공용)", creatorType: "HQ", quizzes: 5, sheet: true, date: "2025-08-10", cover: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=150&q=80" },
  { id: "MB-013", title: "마법천자문", author: "시리얼", publisher: "아울북", grade: "초등 1~2학년", category: "문학", academyId: "HQ", academyName: "본사 직속 (공용)", creatorType: "HQ", quizzes: 5, sheet: true, date: "2025-08-20", cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=150&q=80" },
  { id: "MB-014", title: "푸른 사자 와니니", author: "이현", publisher: "창비", grade: "초등 5~6학년", category: "문학", academyId: "ACAD-003", academyName: "송도 센트럴랩", creatorType: "ACADEMY", quizzes: 5, sheet: true, date: "2025-09-01", cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=150&q=80" },
  { id: "MB-015", title: "시간을 파는 상점", author: "김선영", publisher: "자음과모음", grade: "중등 1~3학년", category: "문학", academyId: "ACAD-004", academyName: "판교 알파학원", creatorType: "ACADEMY", quizzes: 5, sheet: true, date: "2025-09-05", cover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150&q=80" },
  { id: "MB-016", title: "코스모스 (주니어 에디션)", author: "칼 세이건", publisher: "사이언스북스", grade: "중등 1~3학년", category: "과학", academyId: "HQ", academyName: "본사 직속 (공용)", creatorType: "HQ", quizzes: 5, sheet: true, date: "2025-09-10", cover: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=150&q=80" }
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
  populateMemberAcademyFilter();
  renderBannerList();
  renderThemeCards();
  renderRankings();
  renderMasterContents();
  renderDispatchTable();
  populateDispatchAcademyFilter();
});

// 마스터 대메뉴 탭 전환
function switchMasterTab(tabName) {
  const tabs = ["franchise", "members", "operations", "ranking", "contents", "dispatch"];
  
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
}

// ==========================================
// 3. 가맹점 관리 모듈 (Franchise Management)
// ==========================================
function renderFranchiseTable(data = franchiseList) {
  const tbody = document.getElementById("franchiseTableBody");
  if (!tbody) return;

  document.getElementById("franchiseFilteredCount").innerText = data.length;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-5 text-muted">일치하는 가맹 학원 정보가 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(acad => {
    // 슬롯 사용률 계산
    const slotRate = Math.round((acad.currentStudents / acad.maxStudents) * 100);
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

    // 결제 상태 뱃지
    const paymentBadge = acad.paymentStatus === "PAID" 
      ? `<span class="badge-soft badge-soft-success">완납</span>`
      : `<span class="badge-soft badge-soft-danger">미납</span>`;

    return `
      <tr>
        <td class="text-center"><small class="text-muted font-weight-bold">${acad.id}</small></td>
        <td>
          <div class="font-weight-bold" style="font-size: 14px; color: var(--text-main);">${acad.name}</div>
          <small class="text-muted"><i class="fa-solid fa-location-dot mr-1"></i>${acad.region} · 사업자: ${acad.bizNumber}</small>
        </td>
        <td class="text-center">
          <div class="font-weight-bold">${acad.director}</div>
          <small class="text-muted">${acad.phone}</small>
        </td>
        <td class="text-center">
          <div style="font-size: 12.5px;">${acad.startDate} ~ ${acad.endDate}</div>
          <small class="text-muted">${getDDayText(acad.endDate)}</small>
        </td>
        <td>
          <div class="d-flex justify-content-between align-items-center mb-1" style="font-size: 12px;">
            <span class="font-weight-bold">${acad.currentStudents}명 <small class="text-muted">/ ${acad.maxStudents}명</small></span>
            <span class="text-muted font-weight-bold">${slotRate}%</span>
          </div>
          <div class="slot-progress-wrap">
            <div class="slot-progress-fill ${progressClass}" style="width: ${Math.min(slotRate, 100)}%;"></div>
          </div>
        </td>
        <td class="text-center font-weight-bold" style="font-size: 13px;">${acad.monthlyFee}</td>
        <td class="text-center">${paymentBadge}</td>
        <td class="text-center">${statusBadge}</td>
        <td class="text-center">
          <button class="btn btn-xs btn-outline-secondary mr-1" onclick="openAcademyEditModal('${acad.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-xs btn-outline-danger" onclick="openAcademyDeleteConfirm('${acad.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;">
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

// 가맹점 필터링
function filterFranchiseList() {
  const query = (document.getElementById("franchiseSearchInput")?.value || "").toLowerCase().trim();
  const statusFilter = document.getElementById("franchiseStatusFilter")?.value || "ALL";
  const paymentFilter = document.getElementById("franchisePaymentFilter")?.value || "ALL";

  const filtered = franchiseList.filter(item => {
    const matchQuery = !query || 
      item.name.toLowerCase().includes(query) ||
      item.director.toLowerCase().includes(query) ||
      item.region.toLowerCase().includes(query) ||
      item.bizNumber.includes(query);

    const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchPayment = paymentFilter === "ALL" || item.paymentStatus === paymentFilter;

    return matchQuery && matchStatus && matchPayment;
  });

  renderFranchiseTable(filtered);
}

function resetFranchiseFilters() {
  document.getElementById("franchiseSearchInput").value = "";
  document.getElementById("franchiseStatusFilter").value = "ALL";
  document.getElementById("franchisePaymentFilter").value = "ALL";
  renderFranchiseTable();
}

// 신규 학원 등록 모달 열기
function openAcademyRegisterModal() {
  const today = new Date().toISOString().split("T")[0];
  const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0];
  document.getElementById("regStartDate").value = today;
  document.getElementById("regEndDate").value = nextYear;
  $('#academyRegisterModal').modal('show');
}

// 신규 학원 등록 제출 처리
function handleRegisterAcademy(e) {
  e.preventDefault();
  const name = document.getElementById("regAcademyName").value.trim();
  const bizNumber = document.getElementById("regBizNumber").value.trim();
  const director = document.getElementById("regDirectorName").value.trim();
  const phone = document.getElementById("regDirectorPhone").value.trim();
  const startDate = document.getElementById("regStartDate").value;
  const endDate = document.getElementById("regEndDate").value;
  const maxStudents = parseInt(document.getElementById("regMaxStudents").value, 10);
  const monthlyFee = document.getElementById("regMonthlyFee").value.trim();

  const newId = `ACAD-00${franchiseList.length + 1}`;
  const newAcad = {
    id: newId,
    name: name,
    bizNumber: bizNumber,
    director: director + " 원장",
    phone: phone,
    region: "신규 등록 지역",
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
  showMasterToast(`[${name}] 신규 가맹 학원이 성공적으로 등록되었습니다.`);
}

// 학원 수정 모달 열기
function openAcademyEditModal(id) {
  const acad = franchiseList.find(a => a.id === id);
  if (!acad) return;

  document.getElementById("editAcademyId").value = acad.id;
  const badge = document.getElementById("editAcademyIdBadge");
  if (badge) badge.innerText = acad.id;

  document.getElementById("editAcademyName").value = acad.name || "";
  document.getElementById("editBizNumber").value = acad.bizNumber || "";
  document.getElementById("editDirectorName").value = acad.director || "";
  document.getElementById("editDirectorPhone").value = acad.phone || "";
  document.getElementById("editRegion").value = acad.region || "";
  document.getElementById("editEndDate").value = acad.endDate || "";
  document.getElementById("editMaxStudents").value = acad.maxStudents || 50;
  document.getElementById("editMonthlyFee").value = acad.monthlyFee || "330,000원";
  document.getElementById("editPaymentStatus").value = acad.paymentStatus || "PAID";
  document.getElementById("editStatus").value = acad.status || "ACTIVE";

  $('#academyEditModal').modal('show');
}

// 학원 수정 내용 저장
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
  acad.phone = document.getElementById("editDirectorPhone").value.trim();
  acad.region = document.getElementById("editRegion").value.trim();
  acad.endDate = document.getElementById("editEndDate").value;
  acad.maxStudents = parseInt(document.getElementById("editMaxStudents").value, 10) || acad.maxStudents;
  acad.monthlyFee = document.getElementById("editMonthlyFee").value.trim() || acad.monthlyFee;
  acad.paymentStatus = document.getElementById("editPaymentStatus").value;
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
  showMasterToast(`[${acad.name}] 가맹 학원 정보 및 계약 설정이 갱신되었습니다.`);
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
function renderMemberTable(data = memberList) {
  const tbody = document.getElementById("memberTableBody");
  if (!tbody) return;

  document.getElementById("memberFilteredCount").innerText = data.length;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-5 text-muted">검색 조건과 일치하는 회원이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((mem, idx) => {
    let roleBadge = `<span class="badge-soft badge-soft-neutral">학생</span>`;
    if (mem.role === "DIRECTOR") {
      roleBadge = `<span class="badge-soft badge-soft-master"><i class="fa-solid fa-user-tie"></i> 원장님</span>`;
    } else if (mem.role === "TEACHER") {
      roleBadge = `<span class="badge-soft badge-soft-warn"><i class="fa-solid fa-chalkboard-user"></i> 선생님</span>`;
    }

    const statusBadge = mem.status === "NORMAL"
      ? `<span class="badge-soft badge-soft-success">정상</span>`
      : `<span class="badge-soft badge-soft-danger">이용정지</span>`;

    return `
      <tr>
        <td class="text-center"><small class="text-muted font-weight-bold">${idx + 1}</small></td>
        <td class="font-weight-bold" style="font-size: 13.5px;">${mem.academyName}</td>
        <td class="text-center">${roleBadge}</td>
        <td>
          <span class="font-weight-bold text-dark">${mem.name}</span>
          <small class="text-muted">(${mem.username})</small>
        </td>
        <td class="text-center">${mem.grade}</td>
        <td class="text-center">${mem.phone}</td>
        <td class="text-center font-weight-bold text-warning">${mem.points > 0 ? mem.points.toLocaleString() + ' P' : '-'}</td>
        <td class="text-center"><small class="text-muted">${mem.lastLogin}</small></td>
        <td class="text-center">${statusBadge}</td>
        <td class="text-center">
          <button class="btn btn-xs btn-outline-secondary" onclick="openMemberDetailModal(${mem.id})" style="border-radius: 6px; font-size: 11.5px; padding: 4px 10px;">
            상세 관리
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function populateMemberAcademyFilter() {
  const select = document.getElementById("memberAcademyFilter");
  if (!select) return;

  const academies = Array.from(new Set(franchiseList.map(a => a.name)));
  select.innerHTML = `<option value="ALL">전체 학원</option>` + academies.map(name => `<option value="${name}">${name}</option>`).join("");
}

function filterMemberList() {
  const query = (document.getElementById("memberSearchInput")?.value || "").toLowerCase().trim();
  const acadFilter = document.getElementById("memberAcademyFilter")?.value || "ALL";
  const roleFilter = document.getElementById("memberRoleFilter")?.value || "ALL";
  const statusFilter = document.getElementById("memberStatusFilter")?.value || "ALL";

  const filtered = memberList.filter(m => {
    const matchQuery = !query ||
      m.name.toLowerCase().includes(query) ||
      m.username.toLowerCase().includes(query) ||
      m.academyName.toLowerCase().includes(query) ||
      m.phone.includes(query);

    const matchAcad = acadFilter === "ALL" || m.academyName === acadFilter;
    const matchRole = roleFilter === "ALL" || m.role === roleFilter;
    const matchStatus = statusFilter === "ALL" || m.status === statusFilter;

    return matchQuery && matchAcad && matchRole && matchStatus;
  });

  renderMemberTable(filtered);
}

function resetMemberFilters() {
  document.getElementById("memberSearchInput").value = "";
  document.getElementById("memberAcademyFilter").value = "ALL";
  document.getElementById("memberRoleFilter").value = "ALL";
  document.getElementById("memberStatusFilter").value = "ALL";
  renderMemberTable();
}

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

  const statusBadge = mem.status === "NORMAL"
    ? `<span class="badge-soft badge-soft-success">정상 계정</span>`
    : `<span class="badge-soft badge-soft-danger">이용 정지</span>`;
  document.getElementById("detailMemberStatusBadge").innerHTML = statusBadge;

  const btnToggle = document.getElementById("btnToggleMemberStatus");
  if (mem.status === "NORMAL") {
    btnToggle.className = "btn btn-sm btn-outline-danger mr-1";
    btnToggle.innerText = "이용 정지";
  } else {
    btnToggle.className = "btn btn-sm btn-outline-success mr-1";
    btnToggle.innerText = "정지 해제 (정상화)";
  }

  $('#memberDetailModal').modal('show');
}

function toggleMemberStatus() {
  const id = parseInt(document.getElementById("detailMemberId").value, 10);
  const mem = memberList.find(m => m.id === id);
  if (!mem) return;

  mem.status = mem.status === "NORMAL" ? "PAUSED" : "NORMAL";
  $('#memberDetailModal').modal('hide');
  renderMemberTable();
  showMasterToast(`[${mem.name}] 회원의 상태가 [${mem.status === "NORMAL" ? "정상" : "이용정지"}]로 변경되었습니다.`);
}

function resetSingleMemberPassword() {
  const id = parseInt(document.getElementById("detailMemberId").value, 10);
  const mem = memberList.find(m => m.id === id);
  if (!mem) return;

  $('#memberDetailModal').modal('hide');
  showMasterToast(`[${mem.name}] 회원의 휴대폰(${mem.phone})으로 임시 비밀번호가 발송되었습니다.`);
}

function bulkResetPassword() {
  showMasterToast("선택된 회원 계정들에 대한 보안 임시 비밀번호가 생성되었습니다.");
}

// ==========================================
// 5. 서비스 운영 관리 모듈 (Operations)
// ==========================================
function renderBannerList() {
  const container = document.getElementById("bannerListContainer");
  if (!container) return;

  document.getElementById("bannerCount").innerText = bannerList.filter(b => b.active === "Y").length;

  container.innerHTML = bannerList.map((b, idx) => `
    <div class="banner-preview-box">
      <div style="font-size: 18px; font-weight: 900; color: var(--text-soft); width: 32px; text-align: center;">
        #${b.order}
      </div>
      <div class="banner-img-thumb" onclick="previewBannerImage('${b.imageUrl || ''}', '${b.title}')" title="배너 이미지 크게 보기 (클릭)" style="background: ${b.bgTheme}; cursor: pointer;">
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
      <div class="flex-grow-1">
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge-soft ${b.active === 'Y' ? 'badge-soft-success' : 'badge-soft-neutral'}">
            ${b.active === 'Y' ? '노출중' : '숨김'}
          </span>
          <strong style="font-size: 15px; color: var(--text-main);">${b.title}</strong>
        </div>
        <div class="text-muted" style="font-size: 13px;">${b.sub}</div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-sm btn-outline-secondary" onclick="previewBannerImage('${b.imageUrl || ''}', '${b.title}')" style="border-radius: 8px;">
          <i class="fa-solid fa-eye mr-1"></i>미리보기
        </button>
        <button class="btn btn-sm btn-outline-secondary" onclick="toggleBannerActive(${b.id})" style="border-radius: 8px;">
          ${b.active === 'Y' ? '숨김 전환' : '노출 전환'}
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteBanner(${b.id})" style="border-radius: 8px;">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join("");
}

function previewBannerImage(url, title) {
  if (!url) {
    showMasterToast("등록된 배너 이미지가 없습니다. (테마 그라데이션 적용됨)");
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

function openBannerModal() {
  document.getElementById("bannerEditId").value = "";
  document.getElementById("bannerTitle").value = "";
  document.getElementById("bannerSub").value = "";
  document.getElementById("bannerOrder").value = bannerList.length + 1;
  document.getElementById("bannerActive").value = "Y";
  const imgSelect = document.getElementById("bannerImageUrl");
  if (imgSelect) {
    imgSelect.value = "upload/banner/banner_reading_king.jpg";
    updateBannerModalPreview(imgSelect.value);
  }
  $('#bannerEditModal').modal('show');
}

function handleSaveBanner(e) {
  e.preventDefault();
  const title = document.getElementById("bannerTitle").value.trim();
  const sub = document.getElementById("bannerSub").value.trim();
  const imageUrl = document.getElementById("bannerImageUrl") ? document.getElementById("bannerImageUrl").value : "";
  const bgTheme = document.getElementById("bannerBgTheme").value;
  const order = parseInt(document.getElementById("bannerOrder").value, 10);
  const active = document.getElementById("bannerActive").value;

  const newBanner = {
    id: Date.now(),
    title: title,
    sub: sub,
    imageUrl: imageUrl,
    bgTheme: bgTheme,
    order: order,
    active: active
  };

  bannerList.push(newBanner);
  $('#bannerEditModal').modal('hide');
  renderBannerList();
  showMasterToast("학생 페이지 메인 롤링 배너가 등록되었습니다.");
}

function toggleBannerActive(id) {
  const b = bannerList.find(item => item.id === id);
  if (!b) return;
  b.active = b.active === "Y" ? "N" : "Y";
  renderBannerList();
  showMasterToast(`배너 노출 상태가 [${b.active === "Y" ? "노출" : "숨김"}]으로 변경되었습니다.`);
}

function deleteBanner(id) {
  bannerList = bannerList.filter(b => b.id !== id);
  renderBannerList();
  showMasterToast("배너가 삭제되었습니다.");
}

// ==========================================
// 도서 큐레이션 테마 모듈 (Curated Themes)
// ==========================================
let curThemeBooksThemeId = null;

function renderThemeCards() {
  const container = document.getElementById("themeCardContainer");
  if (!container) return;

  container.innerHTML = themeList.map(t => {
    const bookCount = t.bookIds ? t.bookIds.length : (t.bookCount || 0);
    return `
    <div class="col-md-6 mb-3">
      <div class="simple-card p-3 h-100 d-flex flex-column justify-content-between shadow-sm" style="border-radius: 12px; transition: transform 0.2s, box-shadow 0.2s;">
        <div>
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge-soft badge-soft-neutral font-weight-bold">${t.tag}</span>
            <div class="d-flex align-items-center gap-1">
              <span class="badge-soft badge-soft-success">매핑 도서 ${bookCount}권</span>
              <span class="badge-soft ${t.active === 'Y' ? 'badge-soft-success' : 'badge-soft-neutral'}">
                ${t.active === 'Y' ? '노출중' : '숨김'}
              </span>
            </div>
          </div>
          <h6 class="font-weight-bold text-dark mb-1" style="font-size: 15px;">${t.title}</h6>
          <p class="text-muted mb-3" style="font-size: 12.5px; line-height: 1.5;">${t.desc || '테마 설명이 없습니다.'}</p>
        </div>
        <div class="d-flex justify-content-between align-items-center pt-2 border-top">
          <div>
            ${t.active === 'Y'
              ? `<small class="text-muted"><i class="fa-solid fa-check text-success mr-1"></i>학생 홈 테마 노출중</small>`
              : `<small class="text-muted"><i class="fa-solid fa-eye-slash text-secondary mr-1"></i>학생 홈 숨김 처리됨</small>`}
          </div>
          <div class="d-flex align-items-center gap-1">
            <button class="btn btn-xs btn-outline-secondary" onclick="openThemeModal(${t.id})" style="border-radius: 6px; font-size: 11.5px; padding: 4px 9px;" title="테마 정보 수정">
              <i class="fa-solid fa-pen mr-1"></i>수정
            </button>
            <button class="btn btn-xs btn-outline-primary font-weight-bold" onclick="openThemeBooksModal(${t.id})" style="border-radius: 6px; font-size: 11.5px; padding: 4px 11px;">
              <i class="fa-solid fa-book mr-1"></i>도서 목록 편집
            </button>
            <button class="btn btn-xs btn-outline-danger" onclick="deleteTheme(${t.id})" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;" title="테마 삭제">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  }).join("");
}

// 1. 테마 생성 / 수정 모달 열기
function openThemeModal(themeId) {
  const modalHeader = document.getElementById("themeModalHeaderTitle");
  const editIdInput = document.getElementById("themeEditId");
  const titleInput = document.getElementById("themeTitle");
  const tagSelect = document.getElementById("themeTag");
  const descInput = document.getElementById("themeDesc");
  const activeSelect = document.getElementById("themeActive");

  if (themeId) {
    const target = themeList.find(item => item.id === themeId);
    if (!target) return;
    if (modalHeader) modalHeader.innerHTML = `<i class="fa-solid fa-pen mr-2 text-warning"></i>도서 큐레이션 테마 수정`;
    if (editIdInput) editIdInput.value = target.id;
    if (titleInput) titleInput.value = target.title;
    if (tagSelect) tagSelect.value = target.tag;
    if (descInput) descInput.value = target.desc || "";
    if (activeSelect) activeSelect.value = target.active || "Y";
  } else {
    if (modalHeader) modalHeader.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles mr-2 text-warning"></i>신규 도서 큐레이션 테마 생성`;
    if (editIdInput) editIdInput.value = "";
    if (titleInput) titleInput.value = "";
    if (tagSelect) tagSelect.value = "초등 전학년";
    if (descInput) descInput.value = "";
    if (activeSelect) activeSelect.value = "Y";
  }

  $('#themeEditModal').modal('show');
}

// 2. 테마 저장 핸들러 (생성 & 수정)
function handleSaveTheme(e) {
  e.preventDefault();
  const editId = document.getElementById("themeEditId").value;
  const title = document.getElementById("themeTitle").value.trim();
  const tag = document.getElementById("themeTag").value;
  const desc = document.getElementById("themeDesc").value.trim();
  const active = document.getElementById("themeActive").value;

  if (editId) {
    const target = themeList.find(item => item.id === parseInt(editId, 10));
    if (target) {
      target.title = title;
      target.tag = tag;
      target.desc = desc;
      target.active = active;
      showMasterToast(`'${title}' 테마 정보가 수정되었습니다.`);
    }
  } else {
    const newTheme = {
      id: Date.now(),
      title: title,
      tag: tag,
      desc: desc,
      bookIds: [],
      active: active
    };
    themeList.push(newTheme);
    showMasterToast(`'${title}' 신규 큐레이션 테마가 생성되었습니다.`);
  }

  $('#themeEditModal').modal('hide');
  renderThemeCards();
}

// 3. 테마 삭제
function deleteTheme(themeId) {
  const target = themeList.find(item => item.id === themeId);
  if (!target) return;

  if (confirm(`'${target.title}' 테마를 정말 삭제하시겠습니까?\n매핑된 도서 연결 정보도 함께 해제됩니다.`)) {
    themeList = themeList.filter(item => item.id !== themeId);
    renderThemeCards();
    showMasterToast("큐레이션 테마가 삭제되었습니다.");
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
  renderThemeCards();
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
  renderThemeCards();
  showMasterToast(`'${book ? book.title : bookId}' 도서가 테마에서 제외되었습니다.`);
}

function openNoticeModal() {
  showMasterToast("전체 시스템 공지사항 작성 기능이 활성화되었습니다.");
}

// ==========================================
// 6. 전국 랭킹 시스템 모듈 (Ranking System)
// ==========================================
function switchRankingType(type) {
  const btnStudent = document.getElementById("btn-rank-student");
  const btnAcademy = document.getElementById("btn-rank-academy");
  const tableStudent = document.getElementById("table-ranking-student");
  const tableAcademy = document.getElementById("table-ranking-academy");

  if (type === "student") {
    btnStudent.classList.add("active");
    btnAcademy.classList.remove("active");
    tableStudent.style.display = "";
    tableAcademy.style.display = "none";
  } else {
    btnStudent.classList.remove("active");
    btnAcademy.classList.add("active");
    tableStudent.style.display = "none";
    tableAcademy.style.display = "";
  }
}

function renderRankings() {
  // 학생 랭킹
  const studentRankingData = [
    { rank: 1, name: "김태윤", academy: "나노 독서아카데미 목동본원", grade: "초6", books: 42, accRate: "98%", points: 4850, recent: "오늘 08:30" },
    { rank: 2, name: "이서현", academy: "대치 에듀 독서논술센터", grade: "초5", books: 39, accRate: "96%", points: 4520, recent: "어제 21:05" },
    { rank: 3, name: "박지우", academy: "송도 센트럴 리딩랩", grade: "초6", books: 36, accRate: "95%", points: 4210, recent: "어제 22:40" },
    { rank: 4, name: "이민우", academy: "나노 독서아카데미 목동본원", grade: "초5", books: 34, accRate: "94%", points: 3920, recent: "어제 19:15" },
    { rank: 5, name: "장민재", academy: "대치 에듀 독서논술센터", grade: "중1", books: 32, accRate: "92%", points: 3890, recent: "2일 전" },
    { rank: 6, name: "박소율", academy: "나노 독서아카데미 목동본원", grade: "초4", books: 30, accRate: "95%", points: 3640, recent: "2일 전" },
    { rank: 7, name: "최준호", academy: "분당 서현 리딩클럽", grade: "초5", books: 28, accRate: "91%", points: 3410, recent: "3일 전" },
    { rank: 8, name: "정예원", academy: "판교 알파 독서학원", grade: "초4", books: 27, accRate: "93%", points: 3290, recent: "오늘 09:12" }
  ];

  const studentTbody = document.getElementById("studentRankingBody");
  if (studentTbody) {
    studentTbody.innerHTML = studentRankingData.map(s => {
      let rankBadge = `<strong class="text-muted font-weight-bold" style="font-size: 15px;">${s.rank}</strong>`;
      if (s.rank === 1) rankBadge = `<span style="font-size: 18px;">🥇</span>`;
      else if (s.rank === 2) rankBadge = `<span style="font-size: 18px;">🥈</span>`;
      else if (s.rank === 3) rankBadge = `<span style="font-size: 18px;">🥉</span>`;

      return `
        <tr>
          <td class="text-center">${rankBadge}</td>
          <td class="font-weight-bold" style="font-size: 14px; color: var(--text-main);">${s.name}</td>
          <td>${s.academy}</td>
          <td class="text-center">${s.grade}</td>
          <td class="text-center font-weight-bold">${s.books}권</td>
          <td class="text-center text-success font-weight-bold">${s.accRate}</td>
          <td class="text-right font-weight-bold text-warning" style="font-size: 14.5px; padding-right: 24px;">${s.points.toLocaleString()} P</td>
          <td class="text-center"><small class="text-muted">${s.recent}</small></td>
        </tr>
      `;
    }).join("");
  }

  // 학원 랭킹
  const academyRankingData = [
    { rank: 1, name: "대치 에듀 독서논술센터", region: "서울 강남구", students: 92, avgBooks: "21.4권", participation: "95.6%", points: 398500, badge: "최우수 가맹점" },
    { rank: 2, name: "나노 독서아카데미 목동본원", region: "서울 양천구", students: 48, avgBooks: "23.8권", participation: "98.2%", points: 232800, badge: "우수 가맹점" },
    { rank: 3, name: "분당 서현 리딩클럽", region: "경기 성남시", students: 68, avgBooks: "18.2권", participation: "91.0%", points: 214500, badge: "우수 가맹점" },
    { rank: 4, name: "송도 센트럴 리딩랩", region: "인천 연수구", students: 41, avgBooks: "19.5권", participation: "92.7%", points: 172600, badge: "일반 가맹점" }
  ];

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

function openPointPolicyModal() {
  showMasterToast("포인트 지급 정책: 완독 100P, 퀴즈만점 50P, 나노생각담기 30P로 설정되어 있습니다.");
}

// ==========================================
// 7. 마스터 콘텐츠 관리 모듈 (Master Content)
// ==========================================
function renderMasterContents(data = masterBooks) {
  const tbody = document.getElementById("masterContentTableBody");
  if (!tbody) return;

  document.getElementById("contentFilteredCount").innerText = data.length;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-5 text-muted">일치하는 마스터 도서가 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(b => {
    const isHq = !b.academyId || b.academyId === "HQ";
    const academyName = b.academyName || (isHq ? "본사 직속 (공용)" : "가맹 학원");
    const badgeHtml = isHq
      ? `<span class="badge-soft badge-soft-warning" style="font-weight: 700; white-space: nowrap;"><i class="fa-solid fa-crown mr-1"></i>본사 직속(HQ)</span>`
      : `<span class="badge-soft badge-soft-primary" style="font-weight: 700; white-space: nowrap;" title="${academyName}"><i class="fa-solid fa-school mr-1"></i>${academyName}</span>`;

    return `
    <tr>
      <td class="text-center">
        <img src="${b.cover}" alt="${b.title}" style="width: 44px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-medium);">
      </td>
      <td>
        <div class="font-weight-bold" style="font-size: 14px; color: var(--text-main);">${b.title}</div>
        <small class="text-muted">코드: ${b.id}</small>
      </td>
      <td class="text-center">
        ${badgeHtml}
      </td>
      <td class="text-center">
        <div>${b.author}</div>
        <small class="text-muted">${b.publisher}</small>
      </td>
      <td class="text-center"><span class="badge-soft badge-soft-neutral">${b.grade}</span></td>
      <td class="text-center font-weight-bold">${b.category}</td>
      <td class="text-center">
        <span class="badge-soft badge-soft-success">
          <i class="fa-solid fa-circle-check mr-1"></i>${b.quizzes}/5문항 완료
        </span>
      </td>
      <td class="text-center">
        <button class="btn btn-xs btn-outline-secondary" onclick="showMasterToast('${b.title} 나노 시트 PDF를 다운로드합니다.')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;">
          <i class="fa-solid fa-file-pdf text-danger mr-1"></i>PDF
        </button>
      </td>
      <td class="text-center"><small class="text-muted">${b.date}</small></td>
      <td class="text-center">
        <button class="btn btn-xs btn-outline-secondary mr-1" onclick="openMasterBookEditModal('${b.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;">
          <i class="fa-solid fa-pen-to-square mr-1"></i>편집
        </button>
        <button class="btn btn-xs btn-outline-danger" onclick="deleteMasterBook('${b.id}')" style="border-radius: 6px; font-size: 11.5px; padding: 4px 8px;">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `;
  }).join("");
}

function filterMasterContentList() {
  const query = (document.getElementById("contentSearchInput")?.value || "").toLowerCase().trim();
  const academyFilter = document.getElementById("contentAcademyFilter")?.value || "ALL";
  const gradeFilter = document.getElementById("contentGradeFilter")?.value || "ALL";
  const catFilter = document.getElementById("contentCategoryFilter")?.value || "ALL";

  const filtered = masterBooks.filter(b => {
    const matchQuery = !query ||
      b.title.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query) ||
      b.publisher.toLowerCase().includes(query) ||
      (b.academyName && b.academyName.toLowerCase().includes(query));

    let matchAcademy = true;
    if (academyFilter === "HQ") {
      matchAcademy = !b.academyId || b.academyId === "HQ";
    } else if (academyFilter !== "ALL") {
      matchAcademy = b.academyId === academyFilter;
    }

    let matchGrade = true;
    if (gradeFilter === "E_LOW") matchGrade = b.grade.includes("1~2학년");
    else if (gradeFilter === "E_MID") matchGrade = b.grade.includes("3~4학년");
    else if (gradeFilter === "E_HIGH") matchGrade = b.grade.includes("5~6학년");
    else if (gradeFilter === "MIDDLE") matchGrade = b.grade.includes("중등");

    const matchCat = catFilter === "ALL" || b.category === catFilter;

    return matchQuery && matchAcademy && matchGrade && matchCat;
  });

  renderMasterContents(filtered);
}

function resetContentFilters() {
  if (document.getElementById("contentSearchInput")) document.getElementById("contentSearchInput").value = "";
  if (document.getElementById("contentAcademyFilter")) document.getElementById("contentAcademyFilter").value = "ALL";
  if (document.getElementById("contentGradeFilter")) document.getElementById("contentGradeFilter").value = "ALL";
  if (document.getElementById("contentCategoryFilter")) document.getElementById("contentCategoryFilter").value = "ALL";
  renderMasterContents(masterBooks);
}

// ==========================================
// 마스터 도서 및 북퀴즈 모달 제어 로직 (고도화)
// ==========================================
let editingBookQuizzes = [];
let currentEditingQuizIdx = 0;
let curMasterQuizInput = null;
let editingBookSheetFile = { name: "나노_독서학습시트.pdf", size: "1.2 MB" };
let originalEditingBookId = null;

// 국어 특수문자 입력 대상 타겟 설정
function setCurMasterQuizInput(el) {
  curMasterQuizInput = el;
}

// 국어 특수기호 원클릭 삽입
function insertMasterQuizSym(sym) {
  if (!curMasterQuizInput) {
    curMasterQuizInput = document.getElementById("mbQuizQuestion");
  }
  if (!curMasterQuizInput) return;

  const start = curMasterQuizInput.selectionStart || 0;
  const end = curMasterQuizInput.selectionEnd || 0;
  const val = curMasterQuizInput.value;
  curMasterQuizInput.value = val.substring(0, start) + sym + val.substring(end);
  curMasterQuizInput.focus();
  curMasterQuizInput.setSelectionRange(start + sym.length, start + sym.length);
  saveCurrentMasterQuizInput();
}

// 표지 등록 모드 전환 (URL 입력 vs 로컬 파일 업로드)
function switchCoverMode(mode) {
  const urlWrap = document.getElementById("coverModeUrlWrap");
  const fileWrap = document.getElementById("coverModeFileWrap");
  const btnUrl = document.getElementById("btnCoverModeUrl");
  const btnFile = document.getElementById("btnCoverModeFile");

  if (!urlWrap || !fileWrap || !btnUrl || !btnFile) return;

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

// 표지 로컬 이미지 파일 선택 처리
function handleCoverFileUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    document.getElementById("mbEditCover").value = dataUrl;
    updateCoverPreview(dataUrl);
    const label = document.getElementById("mbCoverFileLabel");
    if (label) label.innerText = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    showMasterToast(`[${file.name}] 표지 이미지가 파일로 등록되었습니다.`);
  };
  reader.readAsDataURL(file);
}

// 나노 학습시트 / 지도안 파일 선택 처리
function handleSheetFileUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  editingBookSheetFile = {
    name: file.name,
    size: (file.size / 1024).toFixed(1) + " KB"
  };

  const nameEl = document.getElementById("mbSheetFileName");
  if (nameEl) nameEl.innerText = `${file.name} (${editingBookSheetFile.size})`;
  const label = document.getElementById("mbSheetFileLabel");
  if (label) label.innerText = file.name;

  showMasterToast(`[${file.name}] 학습자료 파일이 업로드되었습니다.`);
}

// ISBN 자동 조회 (알라딘 & 국립중앙도서관 서지정보 시뮬레이션)
function fetchMasterBookByIsbn() {
  const isbnInput = document.getElementById("mbEditIsbn");
  let isbn = (isbnInput ? isbnInput.value : "").replace(/-/g, "").trim();
  const btn = document.getElementById("btnIsbnFetch");

  if (!isbn) {
    isbn = "9788932917245";
    if (isbnInput) isbnInput.value = isbn;
  }

  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>조회중...';
    btn.disabled = true;
  }

  setTimeout(() => {
    // ISBN별 프리셋 데이터
    const isbnMap = {
      "9788932917245": {
        title: "어린 왕자 (완역본)",
        author: "앙투안 드 생텍쥐페리",
        publisher: "열린책들",
        grade: "초등 5~6학년",
        category: "문학",
        cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&q=80"
      },
      "9788936434120": {
        title: "아몬드",
        author: "손원평",
        publisher: "창비",
        grade: "중등 1~3학년",
        category: "문학",
        cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=150&q=80"
      },
      "9788949110010": {
        title: "만복이네 떡집",
        author: "김리리",
        publisher: "비룡소",
        grade: "초등 1~2학년",
        category: "문학",
        cover: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=150&q=80"
      },
      "9788936433673": {
        title: "마당을 나온 암탉",
        author: "황선미",
        publisher: "사계절",
        grade: "초등 3~4학년",
        category: "문학",
        cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=150&q=80"
      }
    };

    const bookData = isbnMap[isbn] || {
      title: `[ISBN-${isbn.slice(-4)}] 서지정보 자동수집 도서`,
      author: "국립중앙도서관 수록 작가",
      publisher: "교육출판사",
      grade: "초등 5~6학년",
      category: "문학",
      cover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150&q=80"
    };

    document.getElementById("mbEditTitle").value = bookData.title;
    document.getElementById("mbEditAuthor").value = bookData.author;
    document.getElementById("mbEditPublisher").value = bookData.publisher;
    document.getElementById("mbEditGrade").value = bookData.grade;
    document.getElementById("mbEditCategory").value = bookData.category;
    document.getElementById("mbEditCover").value = bookData.cover;
    updateCoverPreview(bookData.cover);

    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>조회 완료';
      btn.disabled = false;
      setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-magnifying-glass mr-1"></i>ISBN 조회';
      }, 2000);
    }

    showMasterToast(`[ISBN: ${isbn}] 서지정보 및 표지 이미지가 자동 완성되었습니다.`);
  }, 400);
}

// 퀴즈 기본 생성 (신규 시 기본 3문항 세팅)
function getInitialBookQuizList(book) {
  if (book && book.quizList && Array.isArray(book.quizList) && book.quizList.length > 0) {
    return JSON.parse(JSON.stringify(book.quizList));
  }
  const title = book ? book.title : "도서";
  return [
    {
      question: `[${title}] 1. 도서의 중심 인물과 배경에 대한 올바른 설명은 무엇인가요?`,
      opt1: "주인공이 겪는 주된 이야기 배경과 정확히 일치한다",
      opt2: "전혀 다른 시대적 배경에서 펼쳐진다",
      opt3: "주인공이 등장하지 않는 허구의 서술이다",
      opt4: "결말과 정반대되는 인물 관계이다",
      ans: "1",
      hint: "도서 전반부 1장의 배경을 참고하세요."
    },
    {
      question: `[${title}] 2. 주인공이 마주한 가장 핵심적인 사건 또는 갈등은 무엇인가요?`,
      opt1: "스스로의 한계를 극복하고 타인과 소통하는 과정",
      opt2: "단순한 오해로 인한 사소한 다툼",
      opt3: "모든 것을 포기하고 도망치는 무책임한 선택",
      opt4: "아무런 사건 없이 평화로운 일상",
      ans: "1",
      hint: "도서 중반부의 핵심 갈등 요소를 파악하세요."
    },
    {
      question: `[${title}] 3. 작가가 이 책을 통해 전달하고자 한 가장 중요한 교훈이나 가치는?`,
      opt1: "진정한 배려와 공감, 따뜻한 마음의 가치",
      opt2: "물질적 성공과 이기적인 태도",
      opt3: "규칙을 무조건 어기는 용기",
      opt4: "혼자만의 이익을 추구하는 삶",
      ans: "1",
      hint: "작가의 말 또는 책의 결말 후기를 참고하세요."
    }
  ];
}

// 도서 수정/등록 모달 열기
function openMasterBookEditModal(id) {
  const isNew = !id;
  const book = isNew ? null : masterBooks.find(b => b.id === id);
  originalEditingBookId = isNew ? null : book.id;

  // 1. 도서 코드(ID) 직접 입력 설정 가능
  const defaultId = isNew ? `MB-00${masterBooks.length + 1}` : book.id;
  document.getElementById("mbEditId").value = defaultId;

  // 2. 모달 제목
  const titleEl = document.getElementById("masterBookModalTitle");
  if (titleEl) {
    titleEl.innerHTML = isNew
      ? '<i class="fa-solid fa-plus mr-2 text-warning"></i>신규 마스터 도서 등록'
      : `<i class="fa-solid fa-pen-to-square mr-2 text-warning"></i>마스터 도서 및 북퀴즈 편집 <span class="badge-soft badge-soft-neutral ml-1" style="font-size: 11px;">${book.id}</span>`;
  }

  // 3. ISBN 바인딩
  const isbnInput = document.getElementById("mbEditIsbn");
  if (isbnInput) {
    isbnInput.value = (book && book.isbn) ? book.isbn : (isNew ? "9788932917245" : "");
  }

  // 4. 도서 메타데이터 바인딩
  document.getElementById("mbEditTitle").value = isNew ? "" : book.title;
  document.getElementById("mbEditAuthor").value = isNew ? "" : book.author;
  document.getElementById("mbEditPublisher").value = isNew ? "" : book.publisher;
  document.getElementById("mbEditGrade").value = isNew ? "초등 5~6학년" : book.grade;
  document.getElementById("mbEditCategory").value = isNew ? "문학" : book.category;
  
  const acadSelect = document.getElementById("mbEditAcademy");
  if (acadSelect) {
    acadSelect.value = (book && book.academyId) ? book.academyId : "HQ";
  }
  
  const coverUrl = isNew
    ? "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&q=80"
    : (book.cover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&q=80");
  document.getElementById("mbEditCover").value = isNew ? "" : (book.cover || "");
  updateCoverPreview(coverUrl);

  // 표지 모드 초기화
  switchCoverMode("url");

  // 학습자료 파일 정보 설정
  editingBookSheetFile = (book && book.sheetFile) ? book.sheetFile : {
    name: `${book ? book.title : '신규도서'}_나노학습시트.pdf`,
    size: "1.2 MB"
  };
  const sheetNameEl = document.getElementById("mbSheetFileName");
  if (sheetNameEl) sheetNameEl.innerText = editingBookSheetFile.name;

  document.getElementById("mbEditSheet").checked = isNew ? true : (book.sheet !== false);

  // 5. 퀴즈 데이터 세팅 (신규 시 기본 3문항)
  editingBookQuizzes = getInitialBookQuizList(book);
  currentEditingQuizIdx = 0;

  // 도서 기본 정보 탭으로 시작
  switchMasterBookEditTab("info");
  renderMasterQuizTabs();
  loadMasterQuizForm();

  $('#masterBookEditModal').modal('show');
}

function openMasterBookAddModal() {
  openMasterBookEditModal(null);
}

function previewMasterQuiz(id) {
  openMasterBookEditModal(id);
}

function switchMasterBookEditTab(tab) {
  const btnInfo = document.getElementById("btnTabBookInfo");
  const btnQuiz = document.getElementById("btnTabQuizInfo");
  const secInfo = document.getElementById("sectionBookInfo");
  const secQuiz = document.getElementById("sectionQuizInfo");

  if (!btnInfo || !btnQuiz || !secInfo || !secQuiz) return;

  if (tab === "info") {
    saveCurrentMasterQuizInput();
    btnInfo.classList.add("active");
    btnQuiz.classList.remove("active");
    secInfo.style.display = "block";
    secQuiz.style.display = "none";
  } else {
    btnInfo.classList.remove("active");
    btnQuiz.classList.add("active");
    secInfo.style.display = "none";
    secQuiz.style.display = "block";
    renderMasterQuizTabs();
    loadMasterQuizForm();
  }
}

function updateCoverPreview(url) {
  const img = document.getElementById("mbEditCoverPreview");
  if (!img) return;
  if (!url || url.trim() === "") {
    img.src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&q=80";
  } else {
    img.src = url;
  }
}

function renderMasterQuizTabs() {
  const container = document.getElementById("mbQuizTabButtons");
  if (!container) return;

  const countBadge = document.getElementById("mbEditQuizCount");
  if (countBadge) countBadge.innerText = editingBookQuizzes.length;

  container.innerHTML = editingBookQuizzes.map((q, idx) => `
    <button type="button" class="quiz-num-pill ${idx === currentEditingQuizIdx ? 'active' : ''}" onclick="switchMasterQuizItem(${idx})">
      ${idx + 1}번 문항
    </button>
  `).join("");

  const btnDel = document.getElementById("btnDeleteMasterQuiz");
  if (btnDel) {
    btnDel.style.display = editingBookQuizzes.length > 1 ? "inline-block" : "none";
  }
}

function loadMasterQuizForm() {
  const q = editingBookQuizzes[currentEditingQuizIdx];
  if (!q) return;

  const titleEl = document.getElementById("mbCurrentQuizTitle");
  if (titleEl) {
    titleEl.innerHTML = `<i class="fa-solid fa-circle-question text-warning mr-1"></i>문제 ${currentEditingQuizIdx + 1}번 문항 편집`;
  }
  document.getElementById("mbQuizQuestion").value = q.question || "";
  document.getElementById("mbOpt1").value = q.opt1 || "";
  document.getElementById("mbOpt2").value = q.opt2 || "";
  document.getElementById("mbOpt3").value = q.opt3 || "";
  document.getElementById("mbOpt4").value = q.opt4 || "";
  document.getElementById("mbQuizHint").value = q.hint || "";

  const ansVal = q.ans || "1";
  const targetRadio = document.querySelector(`input[name="mbQuizCorrectAns"][value="${ansVal}"]`);
  if (targetRadio) {
    targetRadio.checked = true;
  }
}

function saveCurrentMasterQuizInput() {
  const q = editingBookQuizzes[currentEditingQuizIdx];
  if (!q) return;

  const qInput = document.getElementById("mbQuizQuestion");
  if (qInput) q.question = qInput.value;

  const opt1 = document.getElementById("mbOpt1");
  if (opt1) q.opt1 = opt1.value;
  const opt2 = document.getElementById("mbOpt2");
  if (opt2) q.opt2 = opt2.value;
  const opt3 = document.getElementById("mbOpt3");
  if (opt3) q.opt3 = opt3.value;
  const opt4 = document.getElementById("mbOpt4");
  if (opt4) q.opt4 = opt4.value;

  const hint = document.getElementById("mbQuizHint");
  if (hint) q.hint = hint.value;

  const checkedRadio = document.querySelector(`input[name="mbQuizCorrectAns"]:checked`);
  if (checkedRadio) {
    q.ans = checkedRadio.value;
  }
}

function switchMasterQuizItem(idx) {
  saveCurrentMasterQuizInput();
  currentEditingQuizIdx = idx;
  renderMasterQuizTabs();
  loadMasterQuizForm();
}

function addMasterQuizItem() {
  saveCurrentMasterQuizInput();
  const nextNum = editingBookQuizzes.length + 1;
  editingBookQuizzes.push({
    question: `새 문제 ${nextNum}. 지문 및 질문 내용을 입력하세요.`,
    opt1: "1번 선택지",
    opt2: "2번 선택지",
    opt3: "3번 선택지",
    opt4: "4번 선택지",
    ans: "1",
    hint: ""
  });
  currentEditingQuizIdx = editingBookQuizzes.length - 1;
  renderMasterQuizTabs();
  loadMasterQuizForm();
  const qInput = document.getElementById("mbQuizQuestion");
  if (qInput) qInput.focus();
}

function deleteMasterQuizItem() {
  if (editingBookQuizzes.length <= 1) {
    showMasterToast("도서에는 최소 1개 이상의 북퀴즈 문항이 유지되어야 합니다.");
    return;
  }
  editingBookQuizzes.splice(currentEditingQuizIdx, 1);
  if (currentEditingQuizIdx >= editingBookQuizzes.length) {
    currentEditingQuizIdx = editingBookQuizzes.length - 1;
  }
  renderMasterQuizTabs();
  loadMasterQuizForm();
  showMasterToast("문항이 삭제되었습니다.");
}

function handleSaveMasterBook(e) {
  e.preventDefault();
  saveCurrentMasterQuizInput();

  const customId = document.getElementById("mbEditId").value.trim();
  const isbn = (document.getElementById("mbEditIsbn")?.value || "").trim();
  const title = document.getElementById("mbEditTitle").value.trim();
  const author = document.getElementById("mbEditAuthor").value.trim();
  const publisher = document.getElementById("mbEditPublisher").value.trim();
  const grade = document.getElementById("mbEditGrade").value;
  const category = document.getElementById("mbEditCategory").value;
  let cover = document.getElementById("mbEditCover").value.trim();
  const sheet = document.getElementById("mbEditSheet").checked;

  const academyId = document.getElementById("mbEditAcademy")?.value || "HQ";
  const academyMap = {
    "HQ": "본사 직속 (공용)",
    "ACAD-001": "나노 목동본원",
    "ACAD-002": "대치 에듀센터",
    "ACAD-003": "송도 센트럴랩",
    "ACAD-004": "판교 알파학원"
  };
  const academyName = academyMap[academyId] || "가맹 학원";
  const creatorType = academyId === "HQ" ? "HQ" : "ACADEMY";

  if (!cover) {
    cover = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&q=80";
  }

  if (originalEditingBookId) {
    // 기존 도서 수정
    const book = masterBooks.find(b => b.id === originalEditingBookId);
    if (book) {
      book.id = customId || book.id; // 사용자가 직접 변경한 코드 반영
      book.isbn = isbn;
      book.title = title;
      book.author = author;
      book.publisher = publisher;
      book.grade = grade;
      book.category = category;
      book.academyId = academyId;
      book.academyName = academyName;
      book.creatorType = creatorType;
      book.cover = cover;
      book.sheet = sheet;
      book.sheetFile = editingBookSheetFile;
      book.quizList = JSON.parse(JSON.stringify(editingBookQuizzes));
      book.quizzes = editingBookQuizzes.length;
    }
    showMasterToast(`[${title}] 도서 및 북퀴즈(${editingBookQuizzes.length}문항) 정보가 수정되었습니다.`);
  } else {
    // 신규 도서 등록 (사용자 직접 설정 ID 우선)
    const finalId = customId || `MB-00${masterBooks.length + 1}`;
    const today = new Date().toISOString().split("T")[0];
    const newBook = {
      id: finalId,
      isbn: isbn,
      title: title,
      author: author,
      publisher: publisher,
      grade: grade,
      category: category,
      academyId: academyId,
      academyName: academyName,
      creatorType: creatorType,
      quizzes: editingBookQuizzes.length,
      sheet: sheet,
      sheetFile: editingBookSheetFile,
      date: today,
      cover: cover,
      quizList: JSON.parse(JSON.stringify(editingBookQuizzes))
    };
    masterBooks.unshift(newBook);
    showMasterToast(`신규 도서 [${title}] (코드: ${finalId}, 등록처: ${academyName})이 등록되었습니다.`);
  }

  $('#masterBookEditModal').modal('hide');
  renderMasterContents();
}

function openExcelUploadModal() {
  showMasterToast("엑셀 일괄 업로드 템플릿(CI3 quiz-excel-pop 양식 호환) 모달이 열립니다.");
}

function deleteMasterBook(id) {
  const book = masterBooks.find(b => b.id === id);
  const name = book ? book.title : "도서";
  masterBooks = masterBooks.filter(b => b.id !== id);
  renderMasterContents();
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
