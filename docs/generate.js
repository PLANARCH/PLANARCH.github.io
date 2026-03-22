const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname);
const result = [];

/**
 * 마크다운에서 요약 추출
 */
function extractSummary(content) {
  const lines = content.split('\n');

  let summary = '';
  let foundTitle = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) continue;

    // 제목 (#) 만나면 그 다음 줄부터 요약 후보
    if (trimmed.startsWith('#')) {
      foundTitle = true;
      continue;
    }

    // 제목 이후 첫 문장 사용
    if (foundTitle) {
      summary = trimmed;
      break;
    }

    // 제목 없는 경우 대비
    if (!foundTitle && !summary) {
      summary = trimmed;
    }
  }

  // 마크다운 문법 제거
  summary = summary
    .replace(/!\[.*?\]\(.*?\)/g, '')   // 이미지 제거
    .replace(/\[.*?\]\(.*?\)/g, '')    // 링크 제거
    .replace(/[`*_>#-]/g, '')          // md 기호 제거
    .replace(/\s+/g, ' ')              // 공백 정리
    .trim();

  // 길이 제한
  return summary.slice(0, 120);
}

/**
 * 특정 디렉토리를 재귀적으로 탐색하여 .md 파일을 찾는 함수
 */
function walk(dir, relativePath = "") {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    // 숨김 파일 제외
    if (file.startsWith('.')) return;

    const fullPath = path.join(dir, file);
    const currentRelPath = relativePath ? path.join(relativePath, file) : file;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath, currentRelPath);
    } else if (file.endsWith('.md')) {
      const formattedPath = currentRelPath.replace(/\\/g, '/');
      const pathParts = formattedPath.split('/');

      // 🔥 여기 추가됨 (파일 읽기)
      let summary = '';
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        summary = extractSummary(content);
      } catch (e) {
        console.error(`❌ 파일 읽기 실패: ${formattedPath}`);
      }

      result.push({
        category: pathParts.length > 1 ? pathParts[0] : "Root",
        title: file.replace('.md', '').replace(/-/g, ' '),
        path: formattedPath,
        summary   // ⭐ 핵심 추가
      });
    }
  });
}

// 실행
walk(baseDir);

// JSON 저장
fs.writeFileSync(
  path.join(baseDir, 'data.json'),
  JSON.stringify(result, null, 2)
);

console.log(`✅ data.json 생성 완료: ${result.length}개의 파일 발견`);