$filePath = "d:\AntiGravity\Nano_BookShelf\public_html\admin_preview.html"
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# 1. Title & Branding
$content = $content.Replace("Nano's Enchanted BookShelf - Academy Director Backoffice", "Nano BookShelf - Academy Director Backoffice")
$content = $content.Replace("NANO'S ENCHANTED BOOKSHELF", "NANO BOOKSHELF ACADEMY")
$content = $content.Replace("한글 독서 마법의 숲 &middot; 원장님 관리자 포털", "독서 논술 교육 전문 플랫폼 &middot; 원장님 관리자 콘솔")

# 2. Sidebar Navigation
$content = $content.Replace("도서 보관소", "도서 목록 / 조회")
$content = $content.Replace("Book Sanctuary", "Book Archive")
$content = $content.Replace("ISBN Auto-Enchant", "ISBN Auto-Fill")
$content = $content.Replace("북퀴즈 출제 공방", "북퀴즈 출제 / 관리")
$content = $content.Replace("독서 마법학도 관리", "원생 관리")
$content = $content.Replace("Young Scholars (48명)", "Student Management (48명)")
$content = $content.Replace("명예의 전당 & 랭킹", "독서 포트폴리오")
$content = $content.Replace("Hall of Honor", "Reading Portfolio")
$content = $content.Replace("학원 마법 서고 현황", "학원 등록 도서 현황")

# 3. View Titles & Subtitles
$content = $content.Replace("도서 등록 및 보관소", "도서 목록 및 조회")
$content = $content.Replace("도서가 마법 보관소에 안전하게 등록되었습니다!", "도서가 데이터베이스에 성공적으로 등록되었습니다!")
$content = $content.Replace("SCROLL OF ANSWERS", "1PAGE ANSWER SHEET")
$content = $content.Replace("황금 양피지 비책", "교사용 1p 정답지")

[System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
Write-Output "Successfully updated wording without magic expressions!"
