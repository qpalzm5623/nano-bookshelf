<?php
// ==============================================================
// 중앙 배너 동기화 API (PC - 태블릿/모바일 기기간 실시간 동기화)
// ==============================================================
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

$bannerFile = dirname(__DIR__) . '/upload/banner/banners.json';
$bannerDir  = dirname(__DIR__) . '/upload/banner';

if (!is_dir($bannerDir)) {
    mkdir($bannerDir, 0777, true);
}

// 1. GET 요청: 최신 배너 목록 반환
if ($method === 'GET') {
    if (file_exists($bannerFile)) {
        $content = file_get_contents($bannerFile);
        if ($content !== false && !empty(trim($content))) {
            echo $content;
            exit;
        }
    }
    // 파일이 없거나 비어있는 경우 기본 배너 반환
    echo json_encode([
        [
            "id" => 1,
            "title" => "9월 나노 독서왕 챌린지 🏆",
            "sub" => "이번 달 3권 이상 완독하고 골드 뱃지를 획득하세요!",
            "imageUrl" => "upload/banner/banner_reading_king.jpg",
            "bgTheme" => "linear-gradient(135deg, #7a6348, #4a3b32)",
            "order" => 1,
            "active" => "Y",
            "clicks" => 1420,
            "createdAt" => "2026-09-01",
            "bookIds" => ["MB-001", "MB-003", "MB-007"]
        ],
        [
            "id" => 2,
            "title" => "상상력 쑥쑥! 나노 시트 개편 🌿",
            "sub" => "새로워진 독서 생각담기 양식으로 내 생각을 표현해보세요.",
            "imageUrl" => "upload/banner/banner_nanosheet.jpg",
            "bgTheme" => "linear-gradient(135deg, #4b6b55, #2f5436)",
            "order" => 2,
            "active" => "Y",
            "clicks" => 890,
            "createdAt" => "2026-09-03",
            "bookIds" => ["MB-004", "MB-011", "MB-014"]
        ],
        [
            "id" => 3,
            "title" => "전국 학생 랭킹 실시간 집계 오픈 🌟",
            "sub" => "내가 속한 학원의 친구들과 전국 친구들의 독서 포인트를 확인해요.",
            "imageUrl" => "upload/banner/banner_ranking.jpg",
            "bgTheme" => "linear-gradient(135deg, #8c6d48, #d4a373)",
            "order" => 3,
            "active" => "Y",
            "clicks" => 2150,
            "createdAt" => "2026-09-05",
            "bookIds" => ["MB-002", "MB-005", "MB-008", "MB-016"]
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// 2. POST 요청: 마스터 관리자에서 수정된 배너 목록 저장
if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Form data로 넘어온 경우 대비
    if (!$data && isset($_POST['banners'])) {
        $data = json_decode($_POST['banners'], true);
    }

    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "유효하지 않은 데이터 형식입니다."], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Base64 이미지가 포함된 경우 서버 이미지 파일로 자동 추출 및 저장 (용량/URL 최적화)
    foreach ($data as &$banner) {
        if (isset($banner['imageUrl']) && strpos($banner['imageUrl'], 'data:image') === 0) {
            $base64Data = $banner['imageUrl'];
            if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
                $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
                $type = strtolower($type[1]); // jpg, png, webp 등
                $decoded = base64_decode($base64Data);
                if ($decoded !== false) {
                    $fileName = 'banner_' . time() . '_' . rand(1000, 9999) . '.' . ($type === 'jpeg' ? 'jpg' : $type);
                    $filePath = $bannerDir . '/' . $fileName;
                    if (file_put_contents($filePath, $decoded) !== false) {
                        $banner['imageUrl'] = 'upload/banner/' . $fileName;
                    }
                }
            }
        }
        // 업데이트 타임스탬프 기록 (태블릿 브라우저 이미지 캐시 방지용)
        $banner['updatedAt'] = time();
    }
    unset($banner);

    $saved = file_put_contents($bannerFile, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    if ($saved !== false) {
        $bannerJsFile = dirname(__DIR__) . '/upload/banner/banners_data.js';
        $jsContent = "// 나노의 책장 - 중앙 배너 실시간 데이터\nwindow.NANO_SERVER_BANNERS = " . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . ";\n";
        @file_put_contents($bannerJsFile, $jsContent);
        echo json_encode(["status" => "success", "message" => "배너가 서버에 성공적으로 동기화되었습니다.", "banners" => $data], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "서버 파일 저장에 실패했습니다."], JSON_UNESCAPED_UNICODE);
    }
    exit;
}
