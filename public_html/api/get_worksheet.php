<?php
/**
 * 나노의 책장 - 도서 나노시트(PDF 활동지) 실제 DB 및 서버 파일 연동 API
 */
@ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$bookId = trim($_GET['book_id'] ?? $_POST['book_id'] ?? '');
$isbn   = preg_replace('/[^0-9]/', '', trim($_GET['isbn'] ?? $_POST['isbn'] ?? ''));
$title  = trim($_GET['title'] ?? $_POST['title'] ?? '');
$cover  = trim($_GET['cover'] ?? $_POST['cover'] ?? '');

$uploadDir = dirname(__DIR__) . '/upload/book/';
$webPrefix = 'upload/book/';

$matchedFile = null;
$sourceType  = 'none';

// 1. MySQL DB (tb_book) 연동 조회 시도
try {
    $dbConfigFile = dirname(__DIR__) . '/application/config/database.php';
    if (file_exists($dbConfigFile)) {
        // CodeIgniter DB 설정 읽기
        $content = file_get_contents($dbConfigFile);
        $dbHost = 'localhost';
        $dbUser = 'nanobook';
        $dbPass = 'skshqnr!!';
        $dbName = 'nanobook';
        
        if (preg_match("/'hostname'\s*=>\s*'([^']+)'/", $content, $m)) $dbHost = $m[1];
        if (preg_match("/'username'\s*=>\s*'([^']+)'/", $content, $m)) $dbUser = $m[1];
        if (preg_match("/'password'\s*=>\s*'([^']+)'/", $content, $m)) $dbPass = $m[1];
        if (preg_match("/'database'\s*=>\s*'([^']+)'/", $content, $m)) $dbName = $m[1];

        $mysqli = @new mysqli($dbHost, $dbUser, $dbPass, $dbName);
        if (!$mysqli->connect_error) {
            $mysqli->set_charset("utf8");
            
            // 1-A. book_no 로 검색
            if ($bookId) {
                $stmt = $mysqli->prepare("SELECT book_no, book_name, isbn, worksheet FROM tb_book WHERE book_no = ? LIMIT 1");
                if ($stmt) {
                    $stmt->bind_param("s", $bookId);
                    $stmt->execute();
                    $res = $stmt->get_result();
                    if ($row = $res->fetch_assoc()) {
                        if (!empty($row['worksheet']) && file_exists($uploadDir . $row['worksheet'])) {
                            $matchedFile = $row['worksheet'];
                            $sourceType = 'db_worksheet';
                        }
                        if (!$matchedFile && !empty($row['isbn'])) {
                            $cleanIsbn = preg_replace('/[^0-9]/', '', $row['isbn']);
                            if (file_exists($uploadDir . $cleanIsbn . '.pdf')) {
                                $matchedFile = $cleanIsbn . '.pdf';
                                $sourceType = 'db_isbn';
                            }
                        }
                    }
                    $stmt->close();
                }
            }

            // 1-B. isbn 으로 검색
            if (!$matchedFile && $isbn) {
                $stmt = $mysqli->prepare("SELECT book_no, book_name, isbn, worksheet FROM tb_book WHERE isbn = ? OR REPLACE(isbn, '-', '') = ? LIMIT 1");
                if ($stmt) {
                    $stmt->bind_param("ss", $isbn, $isbn);
                    $stmt->execute();
                    $res = $stmt->get_result();
                    if ($row = $res->fetch_assoc()) {
                        if (!empty($row['worksheet']) && file_exists($uploadDir . $row['worksheet'])) {
                            $matchedFile = $row['worksheet'];
                            $sourceType = 'db_worksheet_by_isbn';
                        }
                    }
                    $stmt->close();
                }
            }

            // 1-C. title 로 검색
            if (!$matchedFile && $title) {
                $cleanTitle = str_replace(' ', '', $title);
                $stmt = $mysqli->prepare("SELECT book_no, book_name, isbn, worksheet FROM tb_book WHERE book_name = ? OR REPLACE(book_name, ' ', '') = ? LIMIT 1");
                if ($stmt) {
                    $stmt->bind_param("ss", $title, $cleanTitle);
                    $stmt->execute();
                    $res = $stmt->get_result();
                    if ($row = $res->fetch_assoc()) {
                        if (!empty($row['worksheet']) && file_exists($uploadDir . $row['worksheet'])) {
                            $matchedFile = $row['worksheet'];
                            $sourceType = 'db_worksheet_by_title';
                        }
                        if (!$matchedFile && !empty($row['isbn'])) {
                            $cleanIsbn = preg_replace('/[^0-9]/', '', $row['isbn']);
                            if (file_exists($uploadDir . $cleanIsbn . '.pdf')) {
                                $matchedFile = $cleanIsbn . '.pdf';
                                $sourceType = 'db_isbn_by_title';
                            }
                        }
                    }
                    $stmt->close();
                }
            }

            $mysqli->close();
        }
    }
} catch (\Throwable $e) {
    // DB 조회 예외 시 파일시스템 매칭으로 fallback
}

// 2. 파일시스템 직접 탐색 매칭 (upload/book/ 내 2,000여 개 실제 PDF)
if (!$matchedFile && $isbn && file_exists($uploadDir . $isbn . '.pdf')) {
    $matchedFile = $isbn . '.pdf';
    $sourceType = 'fs_isbn';
}

if (!$matchedFile && $cover) {
    // cover 이미지 경로(예: /upload/book/97889...jpg)에서 isbn 또는 파일명 추출
    $coverName = basename($cover);
    $coverBase = preg_replace('/\.[a-zA-Z0-9]+$/', '', $coverName);
    if (file_exists($uploadDir . $coverBase . '.pdf')) {
        $matchedFile = $coverBase . '.pdf';
        $sourceType = 'fs_cover';
    }
}

if (!$matchedFile && $bookId && file_exists($uploadDir . $bookId . '.pdf')) {
    $matchedFile = $bookId . '.pdf';
    $sourceType = 'fs_book_id';
}

// 3. 만약 위 매칭이 안 된 도서일 경우: 실제 서버에 저장된 유효한 대표 나노시트 PDF 제공 (더미 HTML 대신 실제 PDF 파일 화면 렌더링 보장)
$isFallback = false;
if (!$matchedFile) {
    // 실제 서버에 존재하는 대표 도서 PDF 목록
    $representativePdfs = [
        '9788952213778.pdf',
        '9788949110851.pdf',
        '9791185871639.pdf',
        '9788901044873.pdf',
        '9788900109726.pdf'
    ];
    foreach ($representativePdfs as $rp) {
        if (file_exists($uploadDir . $rp)) {
            $matchedFile = $rp;
            $sourceType = 'representative_worksheet';
            $isFallback = true;
            break;
        }
    }
    // 디렉토리 내 첫 번째 유효 PDF 검색
    if (!$matchedFile && is_dir($uploadDir)) {
        $files = glob($uploadDir . '*.pdf');
        if (!empty($files)) {
            $matchedFile = basename($files[0]);
            $sourceType = 'fs_first_available';
            $isFallback = true;
        }
    }
}

if ($matchedFile && file_exists($uploadDir . $matchedFile)) {
    $fullPath = $uploadDir . $matchedFile;
    $fileSize = filesize($fullPath);
    $sizeFormatted = $fileSize > 1048576 
        ? number_format($fileSize / 1048576, 2) . ' MB' 
        : number_format($fileSize / 1024, 1) . ' KB';

    echo json_encode([
        'ok' => true,
        'found' => true,
        'fileName' => $matchedFile,
        'fileSize' => $sizeFormatted,
        'fileSizeBytes' => $fileSize,
        'pdfUrl' => $webPrefix . $matchedFile,
        'source' => $sourceType,
        'isFallback' => $isFallback,
        'bookId' => $bookId,
        'title' => $title
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        'ok' => false,
        'found' => false,
        'error' => '서버에 저장된 PDF 파일을 찾지 못했습니다.',
        'bookId' => $bookId,
        'title' => $title
    ], JSON_UNESCAPED_UNICODE);
}
