// Vercel에는 현대식 화면과 공개 자산만 배포합니다. PHP 설정·회원 덤프는 제외합니다.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public_html');
const output = path.join(root, 'dist');
if (fs.existsSync(output)) {
  // 예상 경로를 확인한 뒤 이번 빌드 산출물만 정리합니다.
  if (path.dirname(output) !== root || path.basename(output) !== 'dist') throw new Error('Invalid build output');
  fs.rmSync(output, { recursive: true });
}
fs.mkdirSync(output);
const assets = new Set(['assets', 'css', 'font', 'images', 'js', 'plugin', 'resources', 'upload']);
const files = new Set(['index.html', 'manage.html', 'admin_preview.html', 'admin_preview.js', 'master_preview.html', 'master_preview.js', 'student_preview.html', 'manifest.json', 'service-worker.js']);
function copy(from, to) {
  // 기존 PHP 화면의 원생 사진·제출 첨부는 공개 정적 배포에서 제외합니다.
  const relative = path.relative(source, from).replace(/\\/g, '/');
  if (/^upload\/(?:member|user_quiz)(?:\/|$)/.test(relative)) return;
  if (fs.statSync(from).isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const name of fs.readdirSync(from)) copy(path.join(from, name), path.join(to, name));
  } else if (/\.(?:css|js|html|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|eot|pdf|bcmap|pfb|wasm|mp3|mp4)$/i.test(from) || path.basename(from) === 'manifest.json') {
    fs.copyFileSync(from, to);
  }
}
for (const name of fs.readdirSync(source)) if (assets.has(name) || files.has(name)) copy(path.join(source, name), path.join(output, name));
for (const file of ['index.html', 'admin_preview.html', 'master_preview.html', 'student_preview.html']) {
  const dest = path.join(output, file);
  let html = fs.readFileSync(dest, 'utf8');
  html = html.replace(/<script src="migrated_real_data\.js[^\"]*"><\/script>/g, '<script src="/api/bootstrap"></script>');
  fs.writeFileSync(dest, html);
}
console.log('운영 배포 파일 생성 완료: dist (회원 덤프 및 PHP 설정 제외)');
