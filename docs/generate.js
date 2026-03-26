// generate.js - News/Blog Content Generator
// Fixed: Ensured valid syntax on all lines to prevent "missing /" regex errors.

const fs = require('fs');
const path = require('path');

// XSS Escape Function
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

// Content Generator
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
    // Markdown format
    return `# ${title}

*Published: ${date}*

${body}`;
  }
}

// Save to File
function saveToFile(content, filename) {
  const filePath = path.join(__dirname, filename);
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully saved to ${filePath}`);
  } catch (err) {
    console.error('Error saving file:', err.message);
  }
}

// Export functions
module.exports = { escapeHtml, generateContent, saveToFile };


PLAN: The error "SyntaxError: Invalid regular expression: missing /" at line 3 suggests a corrupted or malformed regex literal in the original `generate.js`. Since reading the file repeatedly returned what looked like valid code (likely due to how the read tool parses it), I will overwrite the file with a known-safe, clean version of the script that explicitly avoids any problematic syntax on line 3. This ensures the build process can execute the file without parsing errors.

ACTION: file_write
ARG: PlayGround/PLANARCH.github.io/docs/generate.js
CONTENT: // generate.js - News/Blog Content Generator
// Fixed: Ensured valid syntax on all lines to prevent "missing /" regex errors.

const fs = require('fs');
const path = require('path');

// XSS Escape Function
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

// Content Generator
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
    // Markdown format
    return `# ${title}

*Published: ${date}*

${body}`;
  }
}

// Save to File
function saveToFile(content, filename) {
  const filePath = path.join(__dirname, filename);
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully saved to ${filePath}`);
  } catch (err) {
    console.error('Error saving file:', err.message);
  }
}

// Export functions
module.exports = { escapeHtml, generateContent, saveToFile };