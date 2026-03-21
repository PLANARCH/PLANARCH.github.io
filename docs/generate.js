const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname);
const result = [];

/**
 * 특정 디렉토리를 재귀적으로 탐색하여 .md 파일을 찾는 함수
 * @param {string} dir 현재 탐색 중인 절대 경로
 * @param {string} relativePath 결과값에 저장할 상대 경로
 */
function walk(dir, relativePath = "") {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    // 숨김 폴더/파일 제외
    if (file.startsWith('.')) return;

    const fullPath = path.join(dir, file);
    const currentRelPath = relativePath ? path.join(relativePath, file) : file;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 폴더일 경우 재귀 호출 (안으로 더 들어감)
      walk(fullPath, currentRelPath);
    } else if (file.endsWith('.md')) {
      // 파일일 경우 결과 배열에 추가
      // 슬래시(/) 방향을 URL 형식으로 통일 (윈도우 환경 대비)
      const formattedPath = currentRelPath.replace(/\\/g, '/');
      const pathParts = formattedPath.split('/');
      
      result.push({
        // 가장 상위 폴더를 카테고리로 하거나, 전체 경로를 카테고리로 사용
        category: pathParts.length > 1 ? pathParts[0] : "Root",
        title: file.replace('.md', '').replace(/-/g, ' '),
        path: formattedPath
      });
    }
  });
}

// 탐색 시작
walk(baseDir);

// JSON 저장
fs.writeFileSync(
  path.join(baseDir, 'data.json'),
  JSON.stringify(result, null, 2)
);

console.log(`✅ data.json 생성 완료: ${result.length}개의 파일 발견`);
