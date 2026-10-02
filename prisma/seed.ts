// ==============================================================
// 나노의책장 - Supabase / Prisma DB 시드 스크립트
// ==============================================================
// 실행 방법: npx prisma db seed 또는 npm run prisma:seed
// ==============================================================

import { PrismaClient, PlanTier, AcademyStatus, Role, MemberStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 나노의책장 Supabase 초기 데이터 시딩 시작...');

  // 1. 기존 데이터 정리 (순서: 종속 관계 고려)
  await prisma.payment.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.readingReport.deleteMany();
  await prisma.member.deleteMany();
  await prisma.classGroup.deleteMany();
  await prisma.aligoDispatchLog.deleteMany();
  await prisma.academy.deleteMany();
  await prisma.mainBanner.deleteMany();
  await prisma.themeCategory.deleteMany();
  await prisma.bookQuiz.deleteMany();
  await prisma.book.deleteMany();
  await prisma.notice.deleteMany();

  console.log('🧹 기존 데이터 초기화 완료');

  // 2. 가맹 학원 14개소 생성
  const academiesData = [
    {
      code: 'ACAD-001',
      name: '울산 삼산 인재리딩플러스',
      bizNo: '610-85-44881',
      directorName: '김태호',
      phone: '010-7755-1144',
      email: 'director_samsan@nano.kr',
      address: '울산광역시 남구 삼산로 231 4층',
      plan: PlanTier.VIP,
      maxStudents: 100,
      monthlyFee: 990000,
      joinDate: new Date('2025-09-01'),
      startDate: new Date('2025-09-01'),
      endDate: new Date('2027-08-31'),
      status: AcademyStatus.ACTIVE,
      memo: '울산 지역 거점 학원. 슬롯 100명 계약.'
    },
    {
      code: 'ACAD-002',
      name: '일산 마두 지혜의샘',
      bizNo: '128-85-99002',
      directorName: '한승우',
      phone: '010-5577-8811',
      email: 'director_madu@nano.kr',
      address: '경기도 고양시 일산동구 중앙로 1123 3층',
      plan: PlanTier.BASIC,
      maxStudents: 30,
      monthlyFee: 350000,
      joinDate: new Date('2025-08-10'),
      startDate: new Date('2025-08-10'),
      endDate: new Date('2026-08-09'),
      status: AcademyStatus.ACTIVE,
      memo: '계약 만료 임박 안내 발송 완료.'
    },
    {
      code: 'ACAD-003',
      name: '대구 수성 미래리딩원',
      bizNo: '504-81-33211',
      directorName: '조은서',
      phone: '010-3399-4455',
      email: 'director_suseong@nano.kr',
      address: '대구광역시 수성구 달구벌대로 2450 5층',
      plan: PlanTier.VIP,
      maxStudents: 120,
      monthlyFee: 1100000,
      joinDate: new Date('2025-07-01'),
      startDate: new Date('2025-07-01'),
      endDate: new Date('2027-06-30'),
      status: AcademyStatus.ACTIVE,
      memo: '수성구 최우수 학원 선정.'
    },
    {
      code: 'ACAD-004',
      name: '송도 센트럴 리딩랩',
      bizNo: '131-87-54321',
      directorName: '최윤정',
      phone: '010-5541-0982',
      email: 'director_songdo@nano.kr',
      address: '인천광역시 연수구 컨벤시아대로 130 2층',
      plan: PlanTier.STANDARD,
      maxStudents: 50,
      monthlyFee: 550000,
      joinDate: new Date('2025-06-01'),
      startDate: new Date('2025-06-01'),
      endDate: new Date('2027-05-31'),
      status: AcademyStatus.ACTIVE,
      memo: '국제학교 및 초등 고학년 특화 운영.'
    },
    {
      code: 'ACAD-005',
      name: '광주 봉선 생각하는책상',
      bizNo: '408-81-77688',
      directorName: '임태원',
      phone: '010-9923-5581',
      email: 'director_bongseon@nano.kr',
      address: '광주광역시 남구 봉선중앙로 45 3층',
      plan: PlanTier.STANDARD,
      maxStudents: 50,
      monthlyFee: 550000,
      joinDate: new Date('2025-05-15'),
      startDate: new Date('2025-05-15'),
      endDate: new Date('2026-11-15'),
      status: AcademyStatus.ACTIVE,
      memo: '만료 44일 전 재계약 상담 예정.'
    },
    {
      code: 'ACAD-006',
      name: '수원 광교 스마트독서원',
      bizNo: '135-82-77885',
      directorName: '백지호',
      phone: '010-8811-9922',
      email: 'director_gwanggyo@nano.kr',
      address: '경기도 수원시 영통구 광교중앙로 170 6층',
      plan: PlanTier.ROYAL,
      maxStudents: 150,
      monthlyFee: 1400000,
      joinDate: new Date('2025-05-01'),
      startDate: new Date('2025-05-01'),
      endDate: new Date('2027-04-30'),
      status: AcademyStatus.ACTIVE,
      memo: '로열 플랜 학원. 태블릿 40대 운용.'
    },
    {
      code: 'ACAD-007',
      name: '판교 알파 독서학원',
      bizNo: '129-86-44321',
      directorName: '정성훈',
      phone: '010-4490-1123',
      email: 'director_pangyo@nano.kr',
      address: '경기도 성남시 분당구 판교역로 146 5층',
      plan: PlanTier.VIP,
      maxStudents: 80,
      monthlyFee: 850000,
      joinDate: new Date('2025-04-10'),
      startDate: new Date('2025-04-10'),
      endDate: new Date('2026-10-10'),
      status: AcademyStatus.ACTIVE,
      memo: '코딩 및 논술 융합 수업 운영.'
    },
    {
      code: 'ACAD-008',
      name: '부산 해운대 센텀독서논술',
      bizNo: '618-85-11223',
      directorName: '강동원',
      phone: '010-6677-8899',
      email: 'director_centum@nano.kr',
      address: '부산광역시 해운대구 센텀남대로 35 7층',
      plan: PlanTier.ROYAL,
      maxStudents: 200,
      monthlyFee: 1800000,
      joinDate: new Date('2025-04-01'),
      startDate: new Date('2025-04-01'),
      endDate: new Date('2027-03-31'),
      status: AcademyStatus.ACTIVE,
      memo: '부산 본점 플래그십 센터.'
    },
    {
      code: 'ACAD-009',
      name: '나노 독서아카데미 목동본원',
      bizNo: '117-81-66554',
      directorName: '김은영',
      phone: '010-3342-9981',
      email: 'director_mokdong@nano.kr',
      address: '서울특별시 양천구 목동서로 159-1 4층',
      plan: PlanTier.ROYAL,
      maxStudents: 200,
      monthlyFee: 1800000,
      joinDate: new Date('2025-03-01'),
      startDate: new Date('2025-03-01'),
      endDate: new Date('2027-02-28'),
      status: AcademyStatus.ACTIVE,
      memo: '나노의책장 직영 기준 센터.'
    },
    {
      code: 'ACAD-010',
      name: '분당 수내 생각의숲',
      bizNo: '129-85-77665',
      directorName: '오세훈',
      phone: '010-8899-0011',
      email: 'director_sunae@nano.kr',
      address: '경기도 성남시 분당구 수내로 46 3층',
      plan: PlanTier.STANDARD,
      maxStudents: 60,
      monthlyFee: 600000,
      joinDate: new Date('2025-02-15'),
      startDate: new Date('2025-02-15'),
      endDate: new Date('2027-02-14'),
      status: AcademyStatus.ACTIVE,
      memo: '내신 연계 독서 지도 집중.'
    },
    {
      code: 'ACAD-011',
      name: '세종 아름 리딩클래스',
      bizNo: '305-82-44112',
      directorName: '윤서진',
      phone: '010-2233-4455',
      email: 'director_areum@nano.kr',
      address: '세종특별자치시 아름동 달빛로 43 2층',
      plan: PlanTier.BASIC,
      maxStudents: 40,
      monthlyFee: 400000,
      joinDate: new Date('2025-02-01'),
      startDate: new Date('2025-02-01'),
      endDate: new Date('2026-08-01'),
      status: AcademyStatus.SUSPENDED,
      memo: '인테리어 확장 공사로 인한 임시 일시정지.'
    },
    {
      code: 'ACAD-012',
      name: '대치 에듀 독서논술센터',
      bizNo: '211-86-99887',
      directorName: '박진수',
      phone: '010-8871-2311',
      email: 'director_daechi@nano.kr',
      address: '서울특별시 강남구 대치동 도곡로 401 5층',
      plan: PlanTier.VIP,
      maxStudents: 100,
      monthlyFee: 990000,
      joinDate: new Date('2025-01-15'),
      startDate: new Date('2025-01-15'),
      endDate: new Date('2027-01-14'),
      status: AcademyStatus.ACTIVE,
      memo: '대치동 논술 심화반 풀가동.'
    },
    {
      code: 'ACAD-013',
      name: '전주 효자 지혜의나무',
      bizNo: '402-81-55443',
      directorName: '배수현',
      phone: '010-7711-2233',
      email: 'director_hyoja@nano.kr',
      address: '전북 전주시 완산구 효자동2가 1200 3층',
      plan: PlanTier.BASIC,
      maxStudents: 30,
      monthlyFee: 350000,
      joinDate: new Date('2025-01-10'),
      startDate: new Date('2025-01-10'),
      endDate: new Date('2026-07-10'),
      status: AcademyStatus.SUSPENDED,
      memo: '원장님 병가로 인한 2개월 운영 중단.'
    },
    {
      code: 'ACAD-014',
      name: '창원 상남 탑독서학원',
      bizNo: '609-85-33221',
      directorName: '황보경',
      phone: '010-9988-1100',
      email: 'director_changwon@nano.kr',
      address: '경남 창원시 성산구 마디미로 56 4층',
      plan: PlanTier.STANDARD,
      maxStudents: 50,
      monthlyFee: 550000,
      joinDate: new Date('2025-01-05'),
      startDate: new Date('2025-01-05'),
      endDate: new Date('2027-01-04'),
      status: AcademyStatus.ACTIVE,
      memo: '창원 지역 독서 토론 대회 입상 다수.'
    }
  ];

  const createdAcademies: Record<string, string> = {};

  for (const acad of academiesData) {
    const created = await prisma.academy.create({
      data: acad
    });
    createdAcademies[acad.code] = created.id;
  }
  console.log(`✅ 가맹 학원 14개소 생성 완료`);

  // 3. 목동본원 반 그룹 생성
  const mokdongId = createdAcademies['ACAD-009'];
  const groupA = await prisma.classGroup.create({
    data: { academyId: mokdongId, name: '소나무반', targetGrade: '초등 6학년' }
  });
  const groupB = await prisma.classGroup.create({
    data: { academyId: mokdongId, name: '매화반', targetGrade: '초등 5학년' }
  });
  const groupC = await prisma.classGroup.create({
    data: { academyId: mokdongId, name: '난초반', targetGrade: '초등 4학년' }
  });

  // 4. 회원 샘플 데이터 생성
  const membersData = [
    {
      academyId: mokdongId,
      role: Role.DIRECTOR,
      name: '김은영',
      username: 'director_mokdong',
      grade: '원장',
      phone: '010-3342-9981',
      status: MemberStatus.APPROVED
    },
    {
      academyId: mokdongId,
      role: Role.TEACHER,
      name: '송지민',
      username: 'teacher_song',
      grade: '교사',
      phone: '010-5512-8871',
      status: MemberStatus.APPROVED
    },
    {
      academyId: mokdongId,
      classGroupId: groupA.id,
      role: Role.STUDENT,
      name: '김태윤',
      username: 'taeyoon_k',
      gender: '남',
      school: '목동초등학교',
      grade: '초6',
      phone: '010-2211-9981',
      parentName: '김진희',
      parentPhone: '010-9988-1122',
      points: 4850,
      bookCount: 24,
      quizAvg: 95.4,
      teacherName: '송지민 교사',
      status: MemberStatus.APPROVED
    },
    {
      academyId: mokdongId,
      classGroupId: groupB.id,
      role: Role.STUDENT,
      name: '이민우',
      username: 'minwoo_lee',
      gender: '남',
      school: '신목초등학교',
      grade: '초5',
      phone: '010-3388-1122',
      parentName: '이동현',
      parentPhone: '010-8877-2233',
      points: 3920,
      bookCount: 19,
      quizAvg: 91.0,
      teacherName: '송지민 교사',
      status: MemberStatus.APPROVED
    },
    {
      academyId: mokdongId,
      classGroupId: groupC.id,
      role: Role.STUDENT,
      name: '박소율',
      username: 'soyul_p',
      gender: '여',
      school: '목운초등학교',
      grade: '초4',
      phone: '010-7788-9900',
      parentName: '박세영',
      parentPhone: '010-5544-3322',
      points: 3640,
      bookCount: 16,
      quizAvg: 93.5,
      teacherName: '송지민 교사',
      status: MemberStatus.APPROVED
    },
    {
      academyId: createdAcademies['ACAD-012'], // 대치
      role: Role.DIRECTOR,
      name: '박진수',
      username: 'director_daechi',
      grade: '원장',
      phone: '010-8871-2311',
      status: MemberStatus.APPROVED
    }
  ];

  for (const m of membersData) {
    await prisma.member.create({
      data: m
    });
  }
  console.log(`✅ 통합 회원 샘플 생성 완료`);

  // 5. 메인 배너 생성
  await prisma.mainBanner.createMany({
    data: [
      {
        title: '2026 나노 전국 어린이 독서 골든벨 대회',
        imageUrl: 'resources/images/common/banner_goldenbell.png',
        badgeText: '대회',
        orderNo: 1,
        isActive: true
      },
      {
        title: '신학기 대비 초등 필독서 100선 큐레이션 특별전',
        imageUrl: 'resources/images/common/banner_newsemester.png',
        badgeText: '신규',
        orderNo: 2,
        isActive: true
      }
    ]
  });
  console.log(`✅ 메인 배너 생성 완료`);

  console.log('🎉 나노의책장 Supabase 초기 시딩이 성공적으로 완료되었습니다!');
}

main()
  .catch((e) => {
    console.error('❌ 시딩 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
