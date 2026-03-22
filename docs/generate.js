const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname);
const result = [];

/**
 * 날짜 포맷팅 (YYYY-MM-DD)
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * 마크다운에서 요약 추출
 */
function extractSummary(content) {
  const lines = content.split('\n');
  let summary = '';
  let foundTitle = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('---')) continue; // 프론트매터 제외

    if (trimmed.startsWith('#')) {
      foundTitle = true;
      continue;
    }

    if (foundTitle || (!foundTitle && !summary)) {
      summary = trimmed;
      if (summary) break;
    }
  }

  return summary
    .replace(/!\[.*?\]\(.*?\)/g, '')   
    .replace(/\[.*?\]\(.*?\)/g, '')    
    .replace(/[`*_>#-]/g, '')          
    .replace(/\s+/g, ' ')              
    .trim()
    .slice(0, 120);
}

/**
 * 디렉토리 재귀 탐색
 */
function walk(dir, relativePath = "") {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    if (file.startsWith('.') || file === 'node_modules') return;

    const fullPath = path.join(dir, file);
    const currentRelPath = relativePath ? path.join(relativePath, file) : file;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath, currentRelPath);
    } else if (file.endsWith('.md')) {
      const formattedPath = currentRelPath.replace(/\\/g, '/');
      const pathParts = formattedPath.split('/');

      let summary = '';
      let fileDate = ''; // ⭐ 날짜 변수 추가

      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        summary = extractSummary(content);
        
        // ⭐ 파일의 마지막 수정 시간을 가져와서 포맷팅
        fileDate = formatDate(stat.mtime); 
      } catch (e) {
        console.error(`❌ 파일 처리 실패: ${formattedPath}`);
      }

      result.push({
        category: pathParts.length > 1 ? pathParts[0] : "Root",
        title: file.replace('.md', '').replace(/-/g, ' '),
        path: formattedPath,
        summary,
        date: fileDate // ⭐ JSON에 날짜 포함
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

console.log(`✅ data.json 생성 완료: ${result.length}개의 파일 발견 (날짜 데이터 포함)`);