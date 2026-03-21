const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname); // ✅ 핵심 수정

let result = [];

// docs 안의 폴더 읽기
const categories = fs.readdirSync(baseDir);

categories.forEach(category => {
  const categoryPath = path.join(baseDir, category);

  // 폴더만 처리
  if (!fs.statSync(categoryPath).isDirectory()) return;

  // 숨김 폴더 제외
  if (category.startsWith('.')) return;

  const files = fs.readdirSync(categoryPath);

  files.forEach(file => {
    if (file.endsWith('.md')) {
      result.push({
        category,
        title: file.replace('.md', '').replace(/-/g, ' '),
        path: `${category}/${file}`
      });
    }
  });
});

// JSON 저장
fs.writeFileSync(
  path.join(baseDir, 'data.json'),
  JSON.stringify(result, null, 2)
);

console.log('✅ data.json 생성 완료:', result);