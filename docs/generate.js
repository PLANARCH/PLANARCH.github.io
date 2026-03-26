const fs = require('fs');

/
 * HTML 특수문자 이스케이프 함수 (XSS 방지)
 */
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/
 * 뉴스 또는 블로그 콘텐츠 생성
 * @param {string} title - 제목
 * @param {string} content - 본문 내용 (HTML 태그 허용)
 * @param {string} type - 'md' 또는 'html'
 */
function generateContent(title, content, type = 'html') {
    const date = new Date().toISOString().split('T')[0];
    
    if (type === 'md') {
        // Markdown 형식
        return `# ${title}

작성일: ${date}

---

${content}
`;
    } else if (type === 'html') {
        // HTML 형식
        const escapedTitle = escapeHtml(title);
        const safeContent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>${escapedTitle}</title>
    <style>
        body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: auto; }
        h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .date { color: #666; font-size: 0.9em; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>${escapedTitle}</h1>
    <div class="date">작성일: ${date}</div>
    <hr>
    <div style="line-height: 1.6;">${safeContent}</div>
</body>
</html>`;
    } else {
        throw new Error('지원하지 않는 형식입니다. (md 또는 html만 가능)');
    }
}

/
 * 생성된 콘텐츠를 파일로 저장
 * @param {string} filename - 저장할 파일명
 * @param {string} content - 콘텐츠 내용
 */
function saveToFile(filename, content) {
    try {
        fs.writeFileSync(filename, content, 'utf8');
        console.log(`✅ 파일이 성공적으로 저장되었습니다: ${filename}`);
    } catch (err) {
        console.error('❌ 파일 저장 실패:', err.message);
    }
}

// 모듈 외부에서 직접 실행 시 테스트 로직
if (require.main === module) {
    const testTitle = "2026 년 3 월 주요 기술 뉴스";
    const testBody = "<h2>AI 칩셋 출시</h2><p>최신 AI 프로세서가 시장에 등장했습니다.</p>";
    
    // HTML 파일 생성 예시
    saveToFile('test_news.html', generateContent(testTitle, testBody, 'html'));
}

module.exports = { generateContent, escapeHtml, saveToFile };