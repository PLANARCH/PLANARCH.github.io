const fs = require('fs');
const path = require('path');

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function generateContent(title, body, type = 'markdown') {
  const date = new Date().toISOString().split('T')[0];
  
  if (type === 'html') {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
.date { color: #666; font-size: 0.9em; margin-bottom: 20px; }
.content { line-height: 1.6; white-space: pre-wrap; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<div class="date">Published on ${date}</div>
<div class="content">${escapeHtml(body)}</div>
</body>
</html>`;
  } else {
    return `# ${title}

*Published: ${date}*

${body}`;
  }
}

function saveToFile(content, filename) {
  const filePath = path.join(__dirname, filename);
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully saved to ${filePath}`);
  } catch (err) {
    console.error('Error saving file:', err.message);
  }
}

module.exports = { escapeHtml, generateContent, saveToFile };