<?php
// ==============================================================
// 중앙 테마(주제별 도서) 동기화 API (마스터 관리자 - 학생 도서관 실시간 동기화)
// ==============================================================
@ini_set('memory_limit', '256M');
@ini_set('post_max_size', '64M');
@ini_set('upload_max_filesize', '64M');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
header('Expires: 0');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$themeFile = dirname(__DIR__) . '/upload/banner/themes.json';
$themeDir  = dirname(__DIR__) . '/upload/banner';

if (!is_dir($themeDir)) {
    @mkdir($themeDir, 0777, true);
}

// 기본 13개 표준 테마 정의
$defaultThemes = [
    [
        "id" => 1,
        "title" => "인간",
        "tag" => "#인간",
        "subTag" => "# 신체, 가족, 꿈, 직업, 인류, 외국인, 친구, 양자, 우정, 항쟁, 사랑",
        "desc" => "신체, 가족, 인류, 우정과 삶의 이야기를 담은 테마 도서",
        "image" => "upload/code/code_thumb_20240619114230_주제별아이콘_인간.jpg",
        "bookIds" => [],
        "active" => "Y",
        "createdAt" => "2026-09-01",
        "updatedAt" => 1789692000
    ],
    [
        "id" => 2,
        "title" => "생활",
        "tag" => "#생활",
        "subTag" => "# 집, 도시, 시골, 직업, 경제, 놀이, 게임",
        "desc" => "일상생활, 도시와 시골, 경제와 놀이 이야기 테마 도서",
        "image" => "upload/code/code_thumb_20240619114304_주제별아이콘_생활.jpg",
        "bookIds" => [],
        "active" => "Y",
        "createdAt" => "2026-09-01",
        "updatedAt" => 1789692000
    ],
    [
        "id" => 3,
        "title" => "자연",
        "tag" => "#자연",
        "subTag" => "# 산, 바다, 강, 호수, 하늘, 태양, 달, 별, 바람, 비, 무지개, 구름",
        "desc" => "아름다운 자연과 환경, 지구의 신비를 담은 테마 도서",
        "image" => "upload/code/code_thumb_20240618021550_주제별아이콘_자연.jpg",
        "bookIds" => ["MB-005"],
        "active" => "Y",
        "createdAt" => "2026-09-01",
        "updatedAt" => 1789692000
    ],
    [
        "id" => 4,
        "title" => "생물",
        "tag" => "#생물",
        "subTag" => "# 애완동물, 가축, 야생동물, 식물, 곤충, 물고기, 새, 미생물",
        "desc" => "동물, 식물, 곤충과 다양한 생명체들의 이야기 테마 도서",
        "image" => "upload/code/code_thumb_20240619114501_주제별아이콘_생물.jpg",
        "bookIds" => [],
        "active" => "Y",
        "createdAt" => "2026-09-01",
        "updatedAt" => 1789692000
    ],
    [
        "id" => 5,
        "title" => "기술",
        "tag" => "#기술",
        "subTag" => "# 탈것, 자동차, 비행기, 배, 자전거, 핸드폰, 컴퓨터",
        "desc" => "자동차, 비행기, 컴퓨터와 미래 기술을 탐구하는 테마 도서",
        "image" => "upload/code/code_thumb_20240619114512_주제별아이콘_기술.jpg",
        "bookIds" => [],
        "active" => "Y",
        "createdAt" => "2026-09-01",
        "updatedAt" => 1789692000
    ],
    [
        "id" => 6,
        "title" => "과학",
        "tag" => "#과학",
        "subTag" => "# 로봇, AI, 복제인간, 우주",
        "desc" => "로봇, 인공지능, 우주와 과학의 원리를 배우는 테마 도서",
        "image" => "upload/code/code_thumb_20240618021615_주제별아이콘_과학.jpg",
        "bookIds" => ["MB-005", "MB-008", "MB-012", "MB-016"],
        "active" => "Y",
        "createdAt" => "2026-09-01",
        "updatedAt" => 1789692000
    ],
    [
        "id" => 7,
        "title" => "역사",
        "tag" => "#역사",
        "subTag" => "# 과거, 시대, 인물, 사건, 유물, 전통, 문화유산",
        "desc" => "한국사와 세계사의 위대한 인물과 역사적 사건 테마 도서",
        "image" => "upload/code/code_thumb_20240619114326_주제별아이콘_역사.jpg",
        "bookIds" => ["MB-009", "MB-010"],
        "active" => "Y",
        "createdAt" => "2026-09-01",
        "updatedAt" => 1789692000
    ],
    [
        "id" => 8,
        "title" => "이야기",
        "tag" => "#이야기",
        "subTag" => "# 전래동화, 신화, 모험, 판타지, 상상, 우화",
        "desc" => "상상력을 키워주는 흥미진진한 모험과 명작 이야기 테마 도서",
        "image" => "upload/code/code_thumb_20240619114237_주제별아이콘_이야기.jpg",
        "bookIds" => ["MB-001", "MB-002", "MB-003", "MB-004"],
        "active" => "Y",
        "createdAt" => "2026-09-01",
        "updatedAt" => 1789692000
    ],
    [
        "id" => 9,
        "title" => "사회",
        "tag" => "#사회",
        "subTag" => "# 사회, 정치, 법, 공동체, 시민, 환경, 지구촌",
        "desc" => "더불어 살아가는 사회와 법, 공동체와 정의를 배우는 테마 도서",
        "image" => "upload/code/code_thumb_20240421062532_planet-earth.png",
        "bookIds" => ["MB-006"],
        "active" => "Y",
        "createdAt" => "2026-09-01",
        "updatedAt" => 1789692000
    ],
    [
        "id" => 10,
        "title" => "건강",
        "tag" => "#건강",
        "subTag" => "# 운동, 식습관, 마음건강, 안전, 보건, 신체발달",
        "desc" => "몸과 마음을 튼튼하게 가꾸는 건강과 안전 상식 테마 도서",
        "image" => "upload/code/code_thumb_20240619114246_주제별아이콘_건강-08.jpg",
        "bookIds" => [],
        "active" => "Y",
        "createdAt" => "2026-09-01",
        "updatedAt" => 1789692000
    ],
    [
        "id" => 11,
        "title" => "학습",
        "tag" => "#학습",
        "subTag" => "# 공부, 교과연계, 언어, 수학, 탐구, 호기심",
        "desc" => "교과와 연계된 기초 학력과 지적 호기심을 채우는 테마 도서",
        "image" => "upload/code/code_thumb_20240619114312_주제별아이콘_학습.jpg",
        "bookIds" => [],
        "active" => "Y",
        "createdAt" => "2026-09-01",
        "updatedAt" => 1789692000
    ],
    [
        "id" => 12,
        "title" => "요리",
        "tag" => "#요리",
        "subTag" => "# 음식, 요리, 영양, 식문화, 베이킹, 식재료",
        "desc" => "맛있는 음식과 영양, 세계의 식문화를 배우는 테마 도서",
        "image" => "upload/code/code_thumb_20240619114534_주제별아이콘_요리.jpg",
        "bookIds" => [],
        "active" => "Y",
        "createdAt" => "2026-09-01",
        "updatedAt" => 1789692000
    ],
    [
        "id" => 13,
        "title" => "기타",
        "tag" => "#기타",
        "subTag" => "# 예술, 취미, 특별활동, 상식, 자유주제",
        "desc" => "예술, 취미, 다양한 관심사를 탐색하는 특별 테마 도서",
        "image" => "upload/code/code_thumb_20240619114559_주제별아이콘_기타.jpg",
        "bookIds" => [],
        "active" => "Y",
        "createdAt" => "2026-09-01",
        "updatedAt" => 1789692000
    ]
];

// 1. GET 요청: 최신 테마 목록 반환
if ($method === 'GET') {
    if (file_exists($themeFile)) {
        $content = file_get_contents($themeFile);
        if ($content !== false && !empty(trim($content))) {
            echo $content;
            exit;
        }
    }
    // 파일이 없거나 비어있는 경우 기본 13개 테마 반환 및 파일 자동 생성
    $json = json_encode($defaultThemes, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    @file_put_contents($themeFile, $json);
    $themeJsFile = dirname(__DIR__) . '/upload/banner/themes_data.js';
    @file_put_contents($themeJsFile, "// 나노의 책장 - 중앙 테마 실시간 데이터\nwindow.NANO_SERVER_THEMES = " . $json . ";\n");
    echo $json;
    exit;
}

// 2. POST 요청: 마스터 관리자에서 수정된 테마 목록 저장
if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data && isset($_POST['themes'])) {
        $data = json_decode($_POST['themes'], true);
    }

    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "유효하지 않은 데이터 형식입니다."], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Base64 이미지가 포함된 경우 서버 이미지 파일로 자동 추출 및 저장
    foreach ($data as &$theme) {
        if (isset($theme['image']) && strpos($theme['image'], 'data:image') === 0) {
            $base64Data = $theme['image'];
            if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
                $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
                $type = strtolower($type[1]);
                $decoded = base64_decode($base64Data);
                if ($decoded !== false) {
                    $fileName = 'theme_' . time() . '_' . rand(1000, 9999) . '.' . ($type === 'jpeg' ? 'jpg' : $type);
                    $filePath = $themeDir . '/' . $fileName;
                    if (file_put_contents($filePath, $decoded) !== false) {
                        $theme['image'] = 'upload/banner/' . $fileName;
                    }
                }
            }
        }
        $theme['updatedAt'] = time();
    }
    unset($theme);

    $saved = file_put_contents($themeFile, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    if ($saved !== false) {
        $themeJsFile = dirname(__DIR__) . '/upload/banner/themes_data.js';
        $jsContent = "// 나노의 책장 - 중앙 테마 실시간 데이터\nwindow.NANO_SERVER_THEMES = " . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . ";\n";
        @file_put_contents($themeJsFile, $jsContent);
        echo json_encode(["status" => "success", "message" => "테마가 서버에 성공적으로 동기화되었습니다.", "themes" => $data], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "서버 파일 저장에 실패했습니다."], JSON_UNESCAPED_UNICODE);
    }
    exit;
}
