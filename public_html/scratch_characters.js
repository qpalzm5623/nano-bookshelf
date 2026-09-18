// Nano Friends 10 Characters Definition & SVG Illustration Generator
const NANO_CHARACTERS = [
  {
    id: "nano",
    name: "나노 (Nano)",
    tag: "호기심 탐정 여우 🦊",
    themeColor: "#f97316",
    bgGradient: "linear-gradient(135deg, #ffedd5, #fed7aa)",
    story: "궁금한 건 못 참아! 돋보기 안경을 쓰고 책 속의 비밀과 복선을 척척 풀어내는 영리한 아기 여우 탐정이에요. 추리소설과 과학 모험책을 가장 좋아해요.",
    favoriteGenre: "추리 / 과학 탐정",
    level: "Lv.5 명탐정"
  },
  {
    id: "booki",
    name: "부키 (Booki)",
    tag: "지혜의 독서 박사 부엉이 🦉",
    themeColor: "#0d9488",
    bgGradient: "linear-gradient(135deg, #ccfbf1, #99f6e4)",
    story: "머리 위에 항상 책을 얹고 다니는 숲속 도서관의 학장님! 책을 읽고 나면 친구들에게 재미있는 상식과 깊은 지혜를 이야기해 주는 따뜻한 멘토예요.",
    favoriteGenre: "인문 / 백과사전",
    level: "Lv.6 대학자"
  },
  {
    id: "toto",
    name: "토토 (Toto)",
    tag: "번개 스피드 다독왕 토끼 🐰",
    themeColor: "#ec4899",
    bgGradient: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
    story: "당근 모양 책갈피를 들고 바람처럼 책장을 펄럭이는 독서 스피드스타! 재미있는 책을 발견하면 밤새도록 멈추지 않고 완독하는 열정파 토끼랍니다.",
    favoriteGenre: "모험 판타지 / 동화",
    level: "Lv.4 완독 레이서"
  },
  {
    id: "lumi",
    name: "루미 (Lumi)",
    tag: "별빛 판타지 요정 🧚",
    themeColor: "#8b5cf6",
    bgGradient: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
    story: "별가루를 흩뿌리며 책 속 상상력의 세계로 날아가는 마법 요정! 아름다운 문장을 마주할 때마다 온몸에서 은은한 무지갯빛 오로라가 반짝여요.",
    favoriteGenre: "세계명작 / 시와 동화",
    level: "Lv.5 상상 마법사"
  },
  {
    id: "popo",
    name: "포포 (Popo)",
    tag: "끈기 만점 백과사전 곰 🐻",
    themeColor: "#b45309",
    bgGradient: "linear-gradient(135deg, #fef3c7, #fde68a)",
    story: "꿀단지보다 두꺼운 책이 더 좋은 포근한 아기 곰! 어려운 역사책도 우직하게 한 글자씩 끝까지 읽어내어 친구들에게 듬직한 길잡이가 되어줍니다.",
    favoriteGenre: "역사 / 문화 탐구",
    level: "Lv.5 끈기 대장"
  },
  {
    id: "pico",
    name: "피코 (Pico)",
    tag: "우주 모험 펭귄 🐧",
    themeColor: "#0284c7",
    bgGradient: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
    story: "반짝이는 우주복 헬멧을 쓰고 저 너머 은하계와 미래 세계를 꿈꾸는 탐험가 펭귄! AI, 로봇, 우주선이 나오는 SF 소설에 푹 빠져 살아요.",
    favoriteGenre: "SF 과학 / 미래 문명",
    level: "Lv.4 우주 비행사"
  },
  {
    id: "chichi",
    name: "치치 (Chichi)",
    tag: "북퀴즈 달인 다람쥐 🐿️",
    themeColor: "#ea580c",
    bgGradient: "linear-gradient(135deg, #ffedd5, #fdba74)",
    story: "도토리 돋보기로 책 구석구석 핵심 단어를 쏙쏙 찾아내는 다람쥐! 북퀴즈만 시작하면 만점을 놓치지 않는 눈썰미 천재예요.",
    favoriteGenre: "어휘력 / 퀴즈 퍼즐",
    level: "Lv.5 퀴즈 마스터"
  },
  {
    id: "mir",
    name: "미르 (Mir)",
    tag: "신화 속 아기 청룡 🐲",
    themeColor: "#059669",
    bgGradient: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
    story: "뭉게구름을 타고 다니며 한국사 설화와 영웅 전설을 속삭여 주는 푸른 아기 용! 큰 꿈과 용기를 주는 위인전을 가장 아껴요.",
    favoriteGenre: "한국사 / 신화 전설",
    level: "Lv.6 전설의 용"
  },
  {
    id: "choco",
    name: "초코 (Choco)",
    tag: "낭만 예술가 강아지 🐶",
    themeColor: "#854d0e",
    bgGradient: "linear-gradient(135deg, #fef9c3, #fef08a)",
    story: "예술가 빵모자를 비스듬히 쓰고 책에서 감동받은 장면을 스케치북에 그림으로 남기는 감성파 강아지! 나노시트(독서생각담기) 그리기 1등이에요.",
    favoriteGenre: "그림책 / 문학 예술",
    level: "Lv.4 아트 마스터"
  },
  {
    id: "jelly",
    name: "젤리 (Jelly)",
    tag: "마법 책장 젤리 요정 🫧",
    themeColor: "#06b6d4",
    bgGradient: "linear-gradient(135deg, #cffafe, #a5f3fc)",
    story: "책장을 스스로 넘겨주고 책먼지를 청소해 주는 귀여운 말랑 젤리! 지치고 졸릴 때 상쾌한 독서 에너지를 불어넣어 주는 비타민 요정이에요.",
    favoriteGenre: "유머 / 힐링 코믹스",
    level: "Lv.5 에너지 요정"
  }
];
